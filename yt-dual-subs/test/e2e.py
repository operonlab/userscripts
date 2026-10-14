"""End-to-end check against live YouTube watch pages.

Injects yt-dual-subs.user.js as the first <script> of the watch page's HTML, carrying the
page's own CSP nonce: main world, before any YouTube script, under YouTube's real CSP —
where Tampermonkey puts a `@grant none` document-start script. (Camoufox's
add_init_script runs in an isolated world, so it cannot stand in for that.) Then samples
the native caption and the Chinese line together in headless Camoufox.

The harness never picks a caption track: turning CC on and leaving the player's default is
what a viewer does, and putting the original language there is the script's job.

Native and line are always read in the same evaluate: the player restarts playback,
retries pot-less requests and shows ads on its own schedule, so comparing a native sample
with a line sample taken seconds later measures the player, not the script.

YTDS_ENGINE=chrome-ext (with YTDS_CHROME=<Chrome or Chromium executable>) runs the same checks
on the store extension instead: scripts/build-extension.sh builds it into a temp folder and
headless Chromium loads it unpacked, so the bytes measured are the bytes the zip holds. Chromium
must not announce automation (--enable-automation sets navigator.webdriver, and YouTube then
answers every caption request with an empty body). The transport check stays Camoufox-only:
there the harness can wrap the script itself, here YouTube's own wrappers load in between.

Exit: 0 pass
      1 fail — native captions were on screen and the Chinese line was wrong or missing
      2 unverifiable — native captions never showed (bot check, ad, network) or the
        harness could not reach the page's main world; the script was not measured
"""

import json
import os
import re
import statistics
import subprocess
import sys
import tempfile
import time
from pathlib import Path
from typing import NoReturn
from urllib.parse import parse_qs, urlparse

from camoufox.sync_api import Camoufox
from playwright.sync_api import sync_playwright

SCRIPT = Path(__file__).resolve().parent.parent / "yt-dual-subs.user.js"
BUILD = SCRIPT.parent.parent / "scripts" / "build-extension.sh"
ENGINE = os.environ.get("YTDS_ENGINE", "camoufox")
# (video, plan the script must choose, Chinese source it must fetch as (lang, tlang))
VIDEOS = [
    # English, no Chinese track; in a zh-TW session the player often defaults to Japanese
    ("dQw4w9WgXcQ", "machine translation", ("en", "zh-Hant")),
    # TED talk, English with a human Traditional Chinese track
    ("iG9CE55wbtY", "human track", ("zh-TW", None)),
]
# the same English video with its auto-generated track on screen: roll-up captions, left-aligned
# inside a wide window, the case where an off-centre Chinese line was first reported
ASR_VIDEO = ("dQw4w9WgXcQ", "machine translation", ("en", "zh-Hant"))
CJK = re.compile(r"[一-鿿]")
# a track switch flashes a hint (「英文 按一下 進入設定」) in the caption segment itself; it is not a caption
SETTINGS_HINT = re.compile(r"設定|settings", re.I)
WINDOW_S = 60
MIN_TELLING = 3  # moments where pairing and the clock pick different Chinese text
MIN_NATIVE_SAMPLES = 8  # 2s of native captions with no line is a fail; less is too little to judge
SIZE_RATIO = 1.2  # the Chinese line must be at least this much larger than the original line
TIGHT = 0.35  # largest gap between the lines, as a fraction of the Chinese font size
CENTER_TOLERANCE = 0.15  # largest distance between the two lines' centres, same unit
ROLLUP_LINE = 1.6  # one native line, as a multiple of its font size (line height plus box padding)
SHOTS = Path(os.environ.get("YTDS_SHOTS") or Path(__file__).resolve().parent / "shots")
if ENGINE != "camoufox":
    SHOTS = SHOTS / ENGINE
SHOTS.mkdir(parents=True, exist_ok=True)

LINE = """mw:(() => { const el = document.getElementById('ytds-line');
  return el && getComputedStyle(el).display !== 'none' ? el.textContent : ''; })()"""
SAMPLE = """mw:(() => {
  const el = document.getElementById('ytds-line');
  const shown = el && getComputedStyle(el).display !== 'none';
  const seg = [...document.querySelectorAll('#movie_player .ytp-caption-segment')].find(s => s.offsetHeight && s.textContent.trim());
  const segStyle = seg && getComputedStyle(seg);
  return {
    t: document.querySelector('#movie_player video').currentTime,
    cc: document.querySelector('#movie_player .ytp-subtitles-button')?.getAttribute('aria-pressed'),
    ad: !!document.querySelector('#movie_player.ad-showing'),
    native: [...document.querySelectorAll('.ytp-caption-segment')].map(e => e.textContent).join(' ').trim(),
    line: shown ? el.textContent : '',
    bottom: shown ? el.style.bottom : null,
    gap: shown && seg ? Math.round(seg.getBoundingClientRect().top - el.getBoundingClientRect().bottom) : null,
    lineSize: shown ? parseFloat(getComputedStyle(el).fontSize) : null,
    nativeSize: seg ? parseFloat(segStyle.fontSize) : null,
    // both lines boxed; centres compared on the visible native text, not on its window
    boxes: shown && seg ? [getComputedStyle(el).backgroundColor, segStyle.backgroundColor] : null,
    centers: shown && seg ? (() => {
      const r = [...document.querySelectorAll('#movie_player .ytp-caption-segment')].filter(x => x.offsetHeight && x.textContent.trim()).map(x => x.getBoundingClientRect());
      const l = el.getBoundingClientRect();
      return [(l.left + l.right) / 2, (Math.min(...r.map(x => x.left)) + Math.max(...r.map(x => x.right))) / 2];
    })() : null,
  };
})()"""
NATIVE_TEXT = "mw:[...document.querySelectorAll('.ytp-caption-segment')].map(e => e.textContent).join(' ').trim()"
CC_PRESSED = (
    "mw:document.querySelector('#movie_player .ytp-subtitles-button')?.getAttribute('aria-pressed')"
)
TRACK = (
    "mw:(document.querySelector('#movie_player').getOption('captions', 'track') || {}).languageCode || ''"
)
STATE = """mw:JSON.stringify({ state: window.__ytdsState, seen: window.__ytdsSeen,
  cc: document.querySelector('#movie_player .ytp-subtitles-button')?.getAttribute('aria-pressed'),
  t: document.querySelector('video')?.currentTime,
  native: [...document.querySelectorAll('.ytp-caption-segment')].map(e => e.textContent).join(' ') })"""


class Verdict(Exception):  # noqa: N818 — a verdict, not an error
    def __init__(self, code, msg):
        super().__init__(msg)
        self.code, self.msg = code, msg


def done(code, msg) -> NoReturn:
    raise Verdict(code, msg)


def until(page, expr, pred, timeout):
    end = time.time() + timeout
    while True:
        value = page.evaluate(expr)
        if pred(value):
            return value
        if time.time() > end:
            return None
        time.sleep(0.25)


def wait_out_ads(page, vid):
    for _ in range(90):
        if not page.evaluate("mw:!!document.querySelector('#movie_player.ad-showing')"):
            return
        if page.evaluate(LINE):
            done(1, f"{vid}: line visible during an ad: {page.evaluate(LINE)!r}")
        page.evaluate(
            "mw:document.querySelector('.ytp-skip-ad-button, .ytp-ad-skip-button-modern')?.click()"
        )
        time.sleep(1)
    done(2, f"{vid}: ad still playing after 90s")


def captions_on(page, vid):
    """Turn CC on the way a viewer does and wait for the script to put the original (English) there."""
    page.evaluate(
        "mw:(p => { p.mute(); p.playVideo(); p.loadModule('captions'); })(document.querySelector('#movie_player'))"
    )
    if until(page, CC_PRESSED, lambda v: v == "true", 3) is None:
        page.evaluate("mw:document.querySelector('#movie_player .ytp-subtitles-button').click()")
        if until(page, CC_PRESSED, lambda v: v == "true", 4) is None:
            done(2, f"{vid}: captions would not turn on; state={page.evaluate(STATE)}")
    first = until(page, TRACK, bool, 10) or "(none)"
    if until(page, TRACK, lambda v: v == "en", 20) is None:
        done(1, f"{vid}: native track stayed {page.evaluate(TRACK)!r}, not the original English; "
                f"state={page.evaluate(STATE)}")
    print(f"  {vid}: player's first track {first!r}, now 'en'")


def reference_cues(responses, match):
    """A track as the network delivered it, parsed here rather than by the script under test."""
    for resp in reversed(responses):
        if match(resp.url):
            body = resp.text()
            if body:
                cues = []
                for ev in json.loads(body).get("events", []):
                    text = "".join(s.get("utf8", "") for s in ev.get("segs", [])).strip()
                    if text:
                        start = ev.get("tStartMs", 0)
                        cues.append((start, start + ev.get("dDurationMs", 0), text))
                return cues
    return None


def at_time(cues, ms):
    return list(dict.fromkeys(c[2] for c in cues if c[0] <= ms < c[1]))


def latest_at(cues, ms):
    """A rolling (auto-generated) track: only the newest cue on screen."""
    latest = None
    for c in cues:
        if c[0] <= ms < c[1] and (latest is None or c[0] >= latest[0]):
            latest = c
    return [latest[2]] if latest else []


LEADING_PUNCT = re.compile(r"^[\s。，、！？；：.,!?;:]+")


def norm_line(text):
    """Whitespace-normalised, leading punctuation dropped: what the script puts on one line."""
    return LEADING_PUNCT.sub("", " ".join(text.split()))


def paired(native, top, ms):
    """The Chinese cue(s) belonging to the native cue on screen: most overlap, plus any lying mostly inside it."""
    on = [c for c in native if c[0] <= ms < c[1]]
    if not on:
        return []
    s, e = min(c[0] for c in on), max(c[1] for c in on)

    def ov(c):
        return min(e, c[1]) - max(s, c[0])

    best = max((c for c in top if ov(c) > 0), key=ov, default=None)
    return list(dict.fromkeys(c[2] for c in top if ov(c) > 0 and (c is best or ov(c) >= 0.5 * (c[1] - c[0]))))


def expected_near(top, t, native=None, rolling=False):
    """Every text the line may legitimately show within half a second of t (seconds)."""
    out = set()
    for d in range(-5, 6):
        ms = (t + d / 10) * 1000
        if native:
            texts = paired(native, top, ms)
        else:
            texts = latest_at(top, ms) if rolling else at_time(top, ms)
        out.add(norm_line("\n".join(texts)))
    return out


def sample_pairs(page, vid, enough):
    """Sample native + line together until enough(pairs) holds or the window closes."""
    native_seen, pairs, end = 0, [], time.time() + WINDOW_S
    while time.time() < end:
        s = page.evaluate(SAMPLE)
        if s["ad"]:
            if s["line"]:
                done(1, f"{vid}: line visible during an ad: {s['line']!r}")
        elif s["native"] and not SETTINGS_HINT.search(s["native"]):
            native_seen += 1
            if CJK.search(s["line"]):
                pairs.append(s)
                if enough(pairs):
                    break
        time.sleep(0.25)
    return native_seen, pairs


# Failure output lists every timedtext request; YouTube clears the resource-timing buffer, an observer is not cleared.
SEEN = (
    "window.__ytdsSeen = [];"
    "new PerformanceObserver(l => { for (const e of l.getEntries()) if (e.name.includes('/api/timedtext')) {"
    " const p = new URL(e.name).searchParams;"
    " window.__ytdsSeen.push([p.get('lang'), p.get('tlang'), p.has('pot') ? 'pot' : 'no-pot', e.decodedBodySize]); }"
    "}).observe({ type: 'resource' });"
)


class MainWorld:
    """A Chromium page whose evaluate takes the Camoufox-style mw: snippets.

    Playwright's Chromium already evaluates in the page's main world; only the prefix differs.
    """

    def __init__(self, page):
        self._page = page

    def evaluate(self, expression, *args, **kwargs):
        return self._page.evaluate(expression.removeprefix("mw:"), *args, **kwargs)

    def __getattr__(self, name):
        return getattr(self._page, name)


def inject(route):
    resp = route.fetch()
    html = resp.text()
    nonce = re.search(r'<script nonce="([^"]+)"', html)
    head = re.search(r"<head[^>]*>", html)
    if not (nonce and head):
        route.fulfill(response=resp)
        return
    # YouTube wraps fetch/XHR itself, so "is it native" says nothing; compare identity across our script instead.
    before = "window.__ytdsBefore = [XMLHttpRequest.prototype.open, window.fetch];" + SEEN
    after = (
        "window.__ytdsTransportUntouched = XMLHttpRequest.prototype.open === window.__ytdsBefore[0]"
        " && window.fetch === window.__ytdsBefore[1];"
    )
    tag = "".join(
        f'<script nonce="{nonce.group(1)}">{body}</script>'
        for body in (before, SCRIPT.read_text(), after)
    )
    route.fulfill(response=resp, body=html[: head.end()] + tag + html[head.end() :])


KANA = re.compile(r"[぀-ヿ]")
STORED = "mw:JSON.parse(localStorage.getItem('ytds-settings') || 'null')"
# the open language page: no language twice, and the "all" group in the interface language's order
LANGUAGE_LIST = """mw:(() => {
  const menu = document.getElementById('ytds-menu');
  const codes = [...menu.querySelectorAll('[data-lang]')].map((e) => e.dataset.lang);
  const groups = menu.querySelectorAll('.ytds-group');
  const names = [];
  for (let e = groups[groups.length - 1].nextElementSibling; e && e.dataset.lang; e = e.nextElementSibling)
    names.push(e.textContent);
  const collator = new Intl.Collator(document.documentElement.lang || undefined);
  return { dupes: codes.filter((c, i) => codes.indexOf(c) !== i), rest: names.length,
           sorted: names.every((n, i) => i === 0 || collator.compare(names[i - 1], n) <= 0) };
})()"""
# ArrowDown in the search box: an input method's candidate pick stays in the box, a plain one moves into the list
SEARCH_KEYS = """mw:(() => {
  const box = document.querySelector('#ytds-menu input[name=search]');
  const where = () => document.activeElement === box ? 'search'
    : document.activeElement?.dataset?.lang ? 'lang' : String(document.activeElement?.tagName);
  const press = (init) => {
    box.focus();
    box.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true, ...init }));
    return where();
  };
  return { composing: press({ isComposing: true }), plain: press({}) };
})()"""


def set_field(page, name, value, event="input"):
    """Change a panel field the way its own listeners expect, in the page's main world."""
    page.evaluate(
        f"mw:(e => {{ e.value = {json.dumps(str(value))}; e.dispatchEvent(new Event('{event}', {{ bubbles: true }})); }})"
        f"(document.querySelector('#ytds-menu [name={name}]'))"
    )


def open_panel(page, vid):
    btn = "#movie_player .ytds-button"
    if until(page, f"mw:!!document.querySelector('{btn}')", bool, 5) is None:
        done(1, f"{vid}: no settings button in the player's controls")
    if page.evaluate("mw:!!document.getElementById('ytds-menu')"):
        return
    # the controls auto-hide; a viewer's pointer over the player brings them back before the click
    page.hover("#movie_player")
    page.locator(btn).click(timeout=5000)
    if until(page, "mw:!!document.querySelector('#ytds-menu.ytds-open')", bool, 3) is None:
        done(1, f"{vid}: the settings button did not open the menu")


def check_panel(page, vid):
    """Drive the settings panel as a viewer would: box colour, gap, top language, reload, reset."""
    page.evaluate("mw:document.querySelector('#movie_player .ytp-subtitles-button').click()")  # CC back on
    if until(page, CC_PRESSED, lambda v: v == "true", 4) is None:
        done(2, f"{vid}: captions would not turn back on for the panel check")
    open_panel(page, vid)
    page.wait_for_timeout(300)  # the menu fades in
    page.locator("#movie_player").screenshot(path=str(SHOTS / "menu-main.png"))
    page.locator("#ytds-menu [data-go=style]").click(timeout=5000)
    page.locator("#movie_player").screenshot(path=str(SHOTS / "menu-style.png"))

    set_field(page, "bg", "#003399")
    set_field(page, "gap", 12)
    want_bg = "rgba(0, 51, 153, 0.75)"
    styled = until(page, SAMPLE, lambda s: bool(s["line"] and s["boxes"] and s["gap"] is not None
                                                   and s["boxes"] == [want_bg, want_bg] and 10 <= s["gap"] <= 14), 20)
    if styled is None:
        done(1, f"{vid}: box colour / gap from the panel not on screen; last sample {page.evaluate(SAMPLE)}")

    page.locator("#ytds-menu .ytds-back").click(timeout=5000)
    page.locator("#ytds-menu [data-go=top]").click(timeout=5000)
    page.locator("#movie_player").screenshot(path=str(SHOTS / "menu-top.png"))
    listing = page.evaluate(LANGUAGE_LIST)
    if listing["dupes"] or listing["rest"] < 20 or not listing["sorted"]:
        done(1, f"{vid}: language page lists a language twice or out of order: {listing}")
    keys = page.evaluate(SEARCH_KEYS)
    if keys != {"composing": "search", "plain": "lang"}:
        done(1, f"{vid}: ArrowDown in the search box (input method composing, then plain) went to {keys}")
    page.locator('#ytds-menu [data-lang="ja"]').first.click(timeout=5000)
    if until(page, LINE, lambda t: bool(t and KANA.search(t)), 25) is None:
        done(1, f"{vid}: top language set to Japanese, line shows {page.evaluate(LINE)!r}; state={page.evaluate(STATE)}")
    # changing the top language must leave the bottom line on the original
    if page.evaluate(TRACK) != "en":
        done(1, f"{vid}: with Japanese on top the bottom line moved off English to {page.evaluate(TRACK)!r}")
    stored = page.evaluate(STORED)
    if not stored or stored.get("top") != "ja" or stored.get("bg") != "#003399" or stored.get("gap") != 12:
        done(1, f"{vid}: settings not stored as set: {stored}")

    # A later page load reads exactly this record (load.test.mjs: stored settings drive the plan).
    # Opening a second tab here is not possible: YouTube's service worker serves the next page load
    # past page.route, so it arrives without the script.

    # reset puts the defaults back, for the viewer and for the videos checked after this one
    open_panel(page, vid)
    page.locator("#ytds-menu [data-go=style]").click(timeout=5000)
    page.locator("#ytds-menu button[name=reset]").click(timeout=5000)
    stored = page.evaluate(STORED)
    if not stored or stored.get("top") != "zh-Hant" or stored.get("bg") != "#080808" or stored.get("gap") != 0:
        done(1, f"{vid}: reset did not restore the defaults: {stored}")
    if until(page, "mw:window.__ytdsState.topUrl", lambda u: "tlang=zh-Hant" in (u or ""), 25) is None:
        done(1, f"{vid}: after reset the top line is not Chinese again; state={page.evaluate(STATE)}")
    page.keyboard.press("Escape")
    print(f"  {vid} panel: colour and gap on screen, Japanese on top, stored, reset to defaults")


def check_video(browser, vid, want_plan, want_source, check_cc_off, asr=False):
    page = browser.new_page()
    if ENGINE == "camoufox":
        page.route(re.compile(r"^https://www\.youtube\.com/watch\?"), inject)
    else:
        page = MainWorld(page)  # the extension puts the script in; the harness adds nothing
    timedtext = []  # bodies are read after sampling; reading inside the event handler can block the sync API
    page.on("response", lambda r: "/api/timedtext" in r.url and timedtext.append(r))
    navs = [time.time()]
    page.on("framenavigated", lambda f: f == page.main_frame and navs.append(time.time()))
    page.goto(f"https://www.youtube.com/watch?v={vid}", wait_until="domcontentloaded")
    # YouTube may reload the page once (&themeRefresh=1) a few seconds in, destroying every
    # evaluate context; start only after navigation has been quiet for 5s
    settle_by = time.time() + 25
    while time.time() < settle_by and time.time() - navs[-1] < 5:
        time.sleep(0.25)
    page.wait_for_selector("#movie_player video", timeout=30000)

    if page.evaluate("mw:typeof window.__ytdsState") != "object":
        if ENGINE == "camoufox":
            done(2, f"{vid}: script not in the page (HTML had no nonce'd <script> to inject next to?)")
        done(1, f"{vid}: the extension is loaded but its content script did not run on the watch page")
    if ENGINE == "camoufox" and page.evaluate("mw:window.__ytdsTransportUntouched") is not True:
        done(1, f"{vid}: the script replaced XMLHttpRequest.prototype.open or fetch")

    wait_out_ads(page, vid)
    captions_on(page, vid)
    if asr:
        # what a viewer does from the CC menu: pick the auto-generated track by hand
        for _ in range(3):
            # the player only takes asr as its own track object; a bare {kind: 'asr'} lands on the human track
            page.evaluate(
                "mw:(p => p.setOption('captions', 'track', p.getOption('captions', 'tracklist', { includeAsr: true })"
                ".find(t => t.kind === 'asr')))(document.querySelector('#movie_player'))"
            )
            if until(page, "mw:window.__ytdsState.key", lambda k: k.endswith("|en|asr|"), 5):
                break
        else:
            done(2, f"{vid}: the auto-generated track could not be selected; state={page.evaluate(STATE)}")
    if until(page, "mw:window.__ytdsState.status", lambda v: v == "ready", 20) is None:
        st = page.evaluate(STATE)
        if not page.evaluate(NATIVE_TEXT):
            done(2, f"{vid}: native captions never showed; state={st}")
        done(1, f"{vid}: native captions showed but the Chinese track never loaded; state={st}")
    st = json.loads(page.evaluate("mw:JSON.stringify(window.__ytdsState)"))
    if st["plan"] != want_plan:
        done(1, f"{vid}: plan {st['plan']!r}, expected {want_plan!r}")
    q = parse_qs(urlparse(st["topUrl"]).query)
    got_source = (q.get("lang", [None])[0], q.get("tlang", [None])[0])
    if got_source != want_source:
        done(1, f"{vid}: Chinese line fetched as {got_source}, expected {want_source}")

    # the line must be the cue for the moment it is shown, not merely some Chinese that changes
    ref = reference_cues(timedtext, lambda u: u == st["topUrl"])
    if not ref:
        done(2, f"{vid}: the Chinese track's response was not captured to check timing against")
    # a human Chinese track has timing of its own and must be paired by the English cue on screen
    nat = None
    if want_source[0] != "en":
        if not st["paired"]:
            done(1, f"{vid}: Chinese from a separate track is not paired with the English cues")

        def is_native(u):
            q = parse_qs(urlparse(u).query)
            return q.get("lang") == ["en"] and "tlang" not in q and "kind" not in q

        nat = reference_cues(timedtext, is_native)
        if not nat:
            done(2, f"{vid}: the English track's response was not captured to pair against")

    # Pairing only shows where the clock and the English cue pick different Chinese text; most moments
    # agree, so a paired video samples until it has seen enough of the moments that tell them apart.
    def telling(p):
        return nat is not None and not (expected_near(ref, p["t"], nat) & expected_near(ref, p["t"]))

    def enough(ps):
        # a rolling track is judged on its transitions, so it needs several lines, not two
        return len({p["line"] for p in ps}) >= (4 if asr else 2) and (nat is None or sum(map(telling, ps)) >= MIN_TELLING)

    native_seen, pairs = sample_pairs(page, vid, enough)
    state = page.evaluate(STATE)
    if not native_seen:
        done(2, f"{vid}: native captions never showed in {WINDOW_S}s; state={state}")
    if not pairs:
        if native_seen < MIN_NATIVE_SAMPLES:
            done(2, f"{vid}: native captions showed only {native_seen} samples, too few to judge; state={state}")
        done(1, f"{vid}: native captions showed ({native_seen} samples) but never a Chinese line; state={state}")
    lines = list(dict.fromkeys(p["line"] for p in pairs))
    if len(lines) < 2:
        done(1, f"{vid}: line stuck on {lines[0]!r} while native captions kept changing; state={state}")
    for p in pairs[:2] + pairs[-1:]:
        print(f"  {vid} top: {p['line']!r} / bottom: {p['native']!r}")
    if nat is not None:
        tell = [p for p in pairs if telling(p)]
        if len(tell) < MIN_TELLING:
            done(2, f"{vid}: only {len(tell)} moments in {WINDOW_S}s where pairing and the clock disagree")
        wrong = [p for p in tell if norm_line(p["line"]) not in expected_near(ref, p["t"], nat)]
        if len(wrong) * 5 > len(tell):
            ex = [(round(p["t"], 2), p["line"], p["native"]) for p in wrong[:2]]
            done(1, f"{vid}: {len(wrong)}/{len(tell)} telling moments follow the clock, not the English cue: {ex}")
        print(f"  {vid}: paired on {len(tell) - len(wrong)}/{len(tell)} moments where the clock would differ")
    off = [p for p in pairs if norm_line(p["line"]) not in expected_near(ref, p["t"], nat, rolling=asr)]
    if asr:
        # Auto-generated tracks roll; the owner saw the line cycle A / A+B / B and jump with the
        # English as it grew 1↔2 lines. One sentence at a time, never back, never moving.
        seq = [p["line"] for i, p in enumerate(pairs) if i == 0 or p["line"] != pairs[i - 1]["line"]]
        joined = [(a, b) for a in set(seq) for b in set(seq) if a != b and a in b]
        if joined:
            done(1, f"{vid}: a line joins two cues: {joined[0][0]!r} inside {joined[0][1]!r}")
        back = [x for i, x in enumerate(seq) if x in seq[:i]]
        if back:
            done(1, f"{vid}: the line went back to an earlier cue: {back[0]!r}")
        punct = [x for x in seq if LEADING_PUNCT.match(x)]
        if punct:
            done(1, f"{vid}: a line starts with punctuation: {punct[0]!r}")
        moves = sum(1 for a, b in zip(pairs, pairs[1:]) if a["bottom"] != b["bottom"])
        if moves > 2:
            done(1, f"{vid}: the line moved up or down {moves} times in {len(pairs)} samples")
        print(f"  {vid} asr: {len(seq)} lines in order, none joined or repeated, {moves} vertical moves")
    if len(off) > len(pairs) // 5:
        sample = [(round(p["t"], 2), p["line"], sorted(expected_near(ref, p["t"], nat, rolling=asr))) for p in off[:3]]
        done(1, f"{vid}: {len(off)}/{len(pairs)} samples show a cue from another time: {sample}")

    # Chinese on top and larger, the original right below it and smaller, both boxed, centred together
    sized = [(p["lineSize"], p["nativeSize"]) for p in pairs if p["lineSize"] and p["nativeSize"]]
    if not sized:
        done(2, f"{vid}: no sample with both font sizes")
    top, bottom = statistics.median(s[0] for s in sized), statistics.median(s[1] for s in sized)
    if top < bottom * SIZE_RATIO:
        done(1, f"{vid}: Chinese line {top}px is not clearly larger than the original {bottom}px")
    gaps = [p["gap"] for p in pairs if p["gap"] is not None]
    gap = statistics.median(gaps) if gaps else None
    if gap is None:
        done(2, f"{vid}: no sample with both lines on screen to measure the gap")
    # A roll-up window is held at two lines so the line does not move as the English grows 1↔2
    # lines; while it shows one line, one line of space opens up. That is the price of stillness.
    allowed = top * TIGHT + (ROLLUP_LINE * bottom if asr else 0)
    if not -1 <= gap <= allowed:
        done(1, f"{vid}: gap between the lines is {gap}px; allowed 0..{allowed:.0f}px")
    bare = [p["boxes"] for p in pairs if p["boxes"] and {"rgba(0, 0, 0, 0)", "transparent"} & set(p["boxes"])]
    if bare:
        done(1, f"{vid}: a line has no background box: {bare[0]}")
    offs = [abs(p["centers"][0] - p["centers"][1]) for p in pairs if p["centers"]]
    if not offs:
        done(2, f"{vid}: no sample with both lines on screen to compare centres")
    # every sample counts, not the median: a line off-centre a third of the time is still visibly wrong.
    # One in ten may be a frame caught mid-move as a window repositions.
    tolerance = max(4, top * CENTER_TOLERANCE)
    off_center = statistics.median(offs)
    bad = sorted(o for o in offs if o > tolerance)
    if len(bad) * 10 > len(offs):
        done(1, f"{vid}: {len(bad)}/{len(offs)} samples have the lines off-centre (up to {bad[-1]:.0f}px, allowed {tolerance:.0f}px)")
    shot = SHOTS / f"{vid}{'-asr' if asr else ''}.png"
    page.locator("#movie_player").screenshot(path=str(shot))
    print(f"  {vid}: {len(pairs) - len(off)}/{len(pairs)} on the right cue; top {top}px, bottom {bottom}px, "
          f"gap {gap}px, centres {off_center:.1f}px apart; screenshot {shot}")
    if page.evaluate(
        "mw:getComputedStyle(document.getElementById('ytp-caption-window-container')).display === 'none'"
    ):
        done(1, f"{vid}: native caption container is hidden")

    if check_cc_off:
        # an ad also hides the line, which would pass the next check for the wrong reason
        wait_out_ads(page, vid)
        page.evaluate("mw:document.querySelector('#movie_player .ytp-subtitles-button').click()")
        if until(page, CC_PRESSED, lambda v: v == "false", 3) is None:
            done(2, f"{vid}: CC button did not turn off")
        # The line follows CC on the next animation frame, and headless Firefox may run those slowly:
        # give it a grace period, then judge only moments that have a cue (an empty line in a caption
        # gap proves nothing) and whose same-instant CC state is off (the player can turn CC back on).
        time.sleep(1.5)
        judged, visible, end = 0, [], time.time() + 10
        while time.time() < end and judged < 8:
            s = page.evaluate(SAMPLE)
            if not s["ad"] and s["cc"] == "false" and any(expected_near(ref, s["t"]) - {""}):
                judged += 1
                if s["line"]:
                    visible.append((round(s["t"], 2), s["line"]))
            time.sleep(0.25)
        if not judged:
            done(2, f"{vid}: no cue moment with CC off within 10s of turning it off")
        if len(visible) * 2 > judged:
            done(1, f"{vid}: line visible in {len(visible)}/{judged} CC-off samples {visible[:2]}")
        check_panel(page, vid)
    page.close()


def check_all(browser):
    for i, (vid, want_plan, want_source) in enumerate(VIDEOS):
        check_video(browser, vid, want_plan, want_source, check_cc_off=i == 0)
    check_video(browser, *ASR_VIDEO, check_cc_off=False, asr=True)


def run_chrome_extension():
    chrome = os.environ.get("YTDS_CHROME")
    if not chrome or not Path(chrome).is_file():
        done(2, f"YTDS_CHROME must name a Chrome or Chromium executable, is {chrome!r}")
    version = re.search(r"(\d+)\.\d", subprocess.run([chrome, "--version"], capture_output=True, text=True).stdout)
    if not version:
        done(2, f"could not read the version of {chrome}")
    # the user agent of an ordinary Chrome of the same major version, without "HeadlessChrome"
    ua = (f"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) "
          f"Chrome/{version.group(1)}.0.0.0 Safari/537.36")
    with tempfile.TemporaryDirectory() as tmp:
        build = subprocess.run(["bash", str(BUILD), SCRIPT.parent.name, f"{tmp}/dist"], capture_output=True, text=True)
        if build.returncode == 1:
            done(1, f"the extension template disagrees with the userscript: {build.stdout.strip()}")
        if build.returncode != 0:
            done(2, f"the extension did not build: {build.stdout.strip()} {build.stderr.strip()}")
        ext = f"{tmp}/dist/{SCRIPT.parent.name}"
        with sync_playwright() as p:
            ctx = p.chromium.launch_persistent_context(
                f"{tmp}/profile",
                executable_path=chrome,
                headless=True,
                locale="zh-TW",
                user_agent=ua,
                ignore_default_args=["--enable-automation"],
                args=["--disable-blink-features=AutomationControlled", f"--disable-extensions-except={ext}",
                      f"--load-extension={ext}", "--autoplay-policy=no-user-gesture-required", "--mute-audio"],
            )
            try:
                ctx.add_init_script(SEEN)
                check_all(ctx)
            finally:
                ctx.close()


def main():
    if ENGINE == "chrome-ext":
        run_chrome_extension()
    elif ENGINE == "camoufox":
        # os="macos": a spoofed non-mac fingerprint hides PingFang, and the screenshots show tofu
        with Camoufox(headless=True, main_world_eval=True, locale="zh-TW", os="macos") as browser:
            check_all(browser)
    else:
        done(2, f"YTDS_ENGINE {ENGINE!r} is neither camoufox nor chrome-ext")
    done(0, f"[{ENGINE}] Chinese on top and larger, original below, on the right cue, for both Chinese sources")


if __name__ == "__main__":
    # an unverifiable run measured nothing (headless sessions are sometimes refused a pot token),
    # so it earns one fresh session; a FAIL is never retried
    result = Verdict(2, "did not run")
    for attempt in (1, 2):
        try:
            main()
        except Verdict as v:
            result = v
        except Exception as err:  # the run did not finish, so it measured nothing
            result = Verdict(2, f"harness error: {type(err).__name__}: {err}")
        print(f"[attempt {attempt}]", ("PASS", "FAIL", "UNVERIFIABLE")[result.code], "-", result.msg)
        if result.code != 2:
            break
    sys.exit(result.code)
