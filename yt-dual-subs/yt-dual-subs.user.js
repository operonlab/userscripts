// ==UserScript==
// @name         YouTube Dual Subtitles
// @name:zh-TW   YouTube 雙語字幕
// @namespace    https://github.com/operonlab/userscripts
// @version      0.5.0
// @description  Dual YouTube captions: your language on top (larger), the original below (smaller); languages and style from a player button; auto-generated captions no longer jump. Uses YouTube's own caption tracks, no API.
// @description:zh-TW  雙語字幕：上方是你的語言（較大）、下方是原文（較小）；語言與樣式可在播放器按鈕調整；自動產生的字幕不再跳動。全部用 YouTube 自家字幕軌，不需任何 API。
// @author       operonlab
// @license      MIT
// @homepageURL  https://github.com/operonlab/userscripts/tree/main/yt-dual-subs
// @supportURL   https://github.com/operonlab/userscripts/issues
// @updateURL    https://raw.githubusercontent.com/operonlab/userscripts/main/yt-dual-subs/yt-dual-subs.user.js
// @downloadURL  https://raw.githubusercontent.com/operonlab/userscripts/main/yt-dual-subs/yt-dual-subs.user.js
// @match        https://www.youtube.com/*
// @run-at       document-start
// @grant        none
// @noframes
// ==/UserScript==

(() => {
  'use strict';

  // Settings: the panel edits these; sizes are % of the player height, gap is px
  const DEFAULTS = Object.freeze({
    enabled: true, top: 'zh-Hant', bottom: 'auto', bg: '#080808', bgOpacity: 0.75, gap: 0, topSize: 4.4, bottomSize: 3.2,
  });
  const LANG_RE = /^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$/;

  // Traditional and Simplified Chinese must stay distinct; other languages compare by primary subtag
  function norm(lang) {
    const l = String(lang || '').toLowerCase();
    if (/^zh-(hant|tw|hk|mo)/.test(l)) return 'zh-hant';
    if (l.startsWith('zh')) return 'zh-hans';
    return l.split('-')[0];
  }
  const isChinese = (lang) => norm(lang).startsWith('zh') || norm(lang) === 'yue';
  // for "is this video already in the top language": every Chinese counts as one language
  const sameLanguage = (a, b) => (isChinese(a) ? 'zh' : norm(a)) === (isChinese(b) ? 'zh' : norm(b));

  function defaultTop(browserLang) {
    const l = String(browserLang || 'en');
    if (/^zh/i.test(l)) return norm(l) === 'zh-hant' ? 'zh-Hant' : 'zh-Hans';
    return l.split('-')[0].toLowerCase();
  }

  // Settings live in youtube.com's localStorage, which every script on the site shares:
  // keep only well-formed values, clamp numbers, drop everything else.
  function sanitize(raw, defaults = DEFAULTS) {
    const s = { ...defaults };
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return s;
    const num = (v, lo, hi, fallback) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : fallback);
    if (typeof raw.enabled === 'boolean') s.enabled = raw.enabled;
    if (typeof raw.top === 'string' && LANG_RE.test(raw.top)) s.top = raw.top;
    if (raw.bottom === 'auto' || (typeof raw.bottom === 'string' && LANG_RE.test(raw.bottom))) s.bottom = raw.bottom;
    if (typeof raw.bg === 'string' && /^#[0-9a-f]{6}$/i.test(raw.bg)) s.bg = raw.bg.toLowerCase();
    s.bgOpacity = num(raw.bgOpacity, 0, 1, s.bgOpacity);
    s.gap = num(raw.gap, 0, 40, s.gap);
    s.topSize = num(raw.topSize, 2, 8, s.topSize);
    s.bottomSize = num(raw.bottomSize, 2, 8, s.bottomSize);
    return s;
  }

  // tracks: [{lang, kind}] from the player response; native: {lang, kind, tlang} of the player's own request.
  // The auto-generated (asr) track is in the spoken language, so it names the original language.
  function plan(tracks, native, alreadySwitched, settings = DEFAULTS) {
    if (!settings.enabled) return { action: 'none', why: 'off' };
    const top = settings.top;
    const asr = tracks.find((t) => t.kind === 'asr');
    const original = asr ? asr.lang : native.lang;
    if (sameLanguage(original, top)) return { action: 'none', why: `video already in ${top}` };
    const human = (match) => tracks.find((t) => t.kind !== 'asr' && match(norm(t.lang)));
    // the exact code first (en-GB is not en-US), then the language
    const humanFor = (code) =>
      tracks.find((t) => t.kind !== 'asr' && t.lang.toLowerCase() === code.toLowerCase()) || human((l) => l === norm(code));
    const source = humanFor(original) || asr || native;
    const sourceTrack = { lang: source.lang, kind: source.kind || '', tlang: '' };

    // what YouTube's own (bottom) line should show
    let want = sourceTrack;
    let exact = false; // a regional track asked for by name must be that one
    if (settings.bottom !== 'auto') {
      if (sameLanguage(settings.bottom, top)) return { action: 'none', why: 'top and bottom in one language' };
      const own = humanFor(settings.bottom);
      if (own) {
        want = { lang: own.lang, kind: '', tlang: '' };
        exact = own.lang.toLowerCase() === settings.bottom.toLowerCase();
      } else if (!sameLanguage(original, settings.bottom)) {
        want = { ...sourceTrack, tlang: settings.bottom };
      }
    }
    // the right language in either kind counts as shown: auto-generated captions picked by the viewer stay
    const sameLang = exact ? native.lang.toLowerCase() === want.lang.toLowerCase() : norm(native.lang) === norm(want.lang);
    const shown = want.tlang ? norm(native.tlang) === norm(want.tlang) : !native.tlang && sameLang;
    if (!shown) {
      // once per visit; a track picked by hand afterwards is the viewer's choice
      if (alreadySwitched) return { action: 'none', why: 'track picked by hand' };
      return { action: 'switch', to: want, why: `native → ${want.tlang || want.lang}` };
    }

    // the top line: a human track in that language, the other Chinese script converted, else
    // YouTube's translation of the native line's source track
    const own = humanFor(top);
    if (own) return { action: 'dual', top: { lang: own.lang, kind: '', tlang: '' }, why: 'human track' };
    const script = isChinese(top) && human((l) => l.startsWith('zh') && l !== norm(top));
    if (script) return { action: 'dual', top: { lang: script.lang, kind: '', tlang: top }, why: 'human track, converted' };
    return { action: 'dual', top: { lang: native.lang, kind: native.kind, tlang: top }, why: 'machine translation' };
  }

  // Every other param the player sent is kept: timedtext answers an empty body without the player's pot token.
  function trackUrl(playerUrl, { lang, kind, tlang }) {
    const u = new URL(playerUrl, 'https://www.youtube.com');
    const p = u.searchParams;
    p.set('lang', lang);
    if (kind) p.set('kind', kind);
    else p.delete('kind');
    if (tlang) p.set('tlang', tlang);
    else p.delete('tlang');
    p.set('fmt', 'json3'); // fmt is outside `sparams`, so the signature does not cover it
    return u.href;
  }

  function parseJson3(json) {
    const cues = [];
    for (const ev of json.events || []) {
      if (!ev.segs) continue;
      const text = ev.segs.map((s) => s.utf8 || '').join('').trim();
      if (!text) continue;
      const start = ev.tStartMs || 0;
      cues.push({ start, end: start + (ev.dDurationMs || 0), text });
    }
    return cues.sort((a, b) => a.start - b.start);
  }

  // ASR tracks overlap consecutive events, so every cue active at t is shown
  function textAt(cues, t) {
    const out = [];
    for (const c of cues) {
      if (c.start > t) break;
      if (t < c.end && !out.includes(c.text)) out.push(c.text);
    }
    return out.join('\n');
  }

  // A human Chinese track keeps its own segmentation and timing, so reading it by the clock pairs
  // a Chinese sentence with a different English one. Pair by the native cue instead: for the native
  // cue(s) on screen, show the Chinese cue that overlaps them most, plus any Chinese cue lying mostly
  // inside them (an English cue spanning two Chinese ones shows both).
  function pairedText(nativeCues, topCues, t, rolling = false) {
    let on = nativeCues.filter((c) => c.start <= t && t < c.end);
    if (!on.length) return '';
    // a rolling (auto-generated) native track keeps the previous event on screen; pair the newest
    if (rolling) on = [on.reduce((a, b) => (b.start > a.start ? b : a))];
    const start = Math.min(...on.map((c) => c.start));
    const end = Math.max(...on.map((c) => c.end));
    const overlap = (c) => Math.min(end, c.end) - Math.max(start, c.start);
    let best = null;
    for (const c of topCues) {
      if (c.start >= end) break;
      if (overlap(c) > 0 && (!best || overlap(c) > overlap(best))) best = c;
    }
    const picked = topCues.filter((c) => overlap(c) > 0 && (c === best || overlap(c) >= 0.5 * (c.end - c.start)));
    return [...new Set(picked.map((c) => c.text))].join('\n');
  }

  // Auto-generated tracks roll: each event stays on screen while the next one starts, so the union
  // textAt() shows would cycle A / A+B / B. Show the newest event alone.
  function latestAt(cues, t) {
    let latest = null;
    for (const c of cues) {
      if (c.start > t) break;
      if (t < c.end && (!latest || c.start >= latest.start)) latest = c;
    }
    return latest ? latest.text : '';
  }

  // Machine translation splits rolling events mid-sentence and leaves the fragment starting with punctuation
  const tidy = (text) => text.replace(/^[\s。，、！？；：.,!?;:]+/, '');

  // Where the Chinese line goes, relative to the player: centred on the lowest caption window on
  // screen (the dialogue line; positioned captions can add others), its bottom on that window's
  // text, kept inside the player. A roll-up window (auto-generated captions) grows 1↔2 lines as
  // words arrive; anchoring it as if it always held two keeps the line still.
  // wins: [{left, right, bottom, textTop, textBottom, lineHeight, rollup}] in viewport px.
  function place(pr, wins, lineWidth, lineHeight, gap = 0) {
    if (!wins.length) return null;
    const w = wins.reduce((a, b) => (b.bottom > a.bottom ? b : a));
    const half = Math.min(lineWidth, pr.width) / 2;
    const left = Math.min(Math.max((w.left + w.right) / 2 - pr.left, half), pr.width - half);
    const textTop = w.rollup ? Math.min(w.textTop, w.textBottom - 2 * w.lineHeight) : w.textTop;
    const bottom = Math.max(0, Math.min(pr.bottom - textTop + gap, pr.height - lineHeight));
    return { left: Math.round(left), bottom: Math.round(bottom) };
  }

  if (typeof window === 'undefined') {
    module.exports = { norm, isChinese, plan, trackUrl, parseJson3, textAt, pairedText, place, latestAt, tidy, sanitize, defaultTop, DEFAULTS };
    return;
  }

  const state = { status: 'idle', key: '', plan: '', cues: 0, topUrl: '', paired: false };
  window.__ytdsState = state;
  Object.defineProperty(state, 'replan', { value: () => replan() }); // for the console and tests; not serialised
  const ownUrls = new Set();
  const switched = new Set(); // video ids whose track this script already changed during this visit
  const requested = new Set(); // tracks this script asked the player for; their requests are not hand picks
  const trackKey = (videoId, t) => [videoId, norm(t.lang), t.kind || '', norm(t.tlang)].join('|');
  let cues = [];
  let nativeCues = []; // set only when the Chinese track has timing of its own (see pairedText)
  let rolling = { top: false, native: false }; // which side is an auto-generated (rolling) track
  let line = null;
  let raf = 0;
  let generation = 0; // bumped by every new load and by navigation; an older load stops at its next await
  let newer = null; // a later player URL for the track being loaded
  let lastPlayerUrl = ''; // the newest caption request for this video, re-planned when settings change

  const STORE = 'ytds-settings';
  const runtimeDefaults = { ...DEFAULTS, top: defaultTop(navigator.language) };
  let settings = loadSettings();

  function loadSettings() {
    try {
      return sanitize(JSON.parse(localStorage.getItem(STORE) || 'null'), runtimeDefaults);
    } catch {
      return sanitize(null, runtimeDefaults); // unreadable or malformed: defaults
    }
  }

  function saveSettings(next) {
    settings = sanitize(next, runtimeDefaults);
    try {
      localStorage.setItem(STORE, JSON.stringify(settings));
    } catch (err) {
      console.warn('[yt-dual-subs] settings not saved; they hold until the page reloads', err);
    }
  }

  // a language or on/off change re-plans the video on screen, and may switch its track again;
  // settings are re-read, so a change made in another tab applies too
  function replan() {
    settings = loadSettings();
    const videoId = new URLSearchParams(location.search).get('v');
    generation++;
    newer = null;
    switched.delete(videoId);
    Object.assign(state, { status: 'idle', key: '', plan: '', cues: 0, topUrl: '', paired: false });
    cues = [];
    nativeCues = [];
    if (lastPlayerUrl && new URL(lastPlayerUrl).searchParams.get('v') === videoId) load(lastPlayerUrl);
  }

  function playerResponse() {
    try {
      return document.getElementById('movie_player').getPlayerResponse();
    } catch {
      return null;
    }
  }

  // The first caption request can finish before the player exposes its response, so wait for it;
  // the page's own ytInitialPlayerResponse covers the first video. null = could not read the list.
  async function tracksOf(videoId) {
    for (let i = 0; i < 6; i++) {
      for (const pr of [playerResponse(), window.ytInitialPlayerResponse]) {
        const list = pr?.videoDetails?.videoId === videoId && pr.captions?.playerCaptionsTracklistRenderer?.captionTracks;
        if (list) return list.map((t) => ({ lang: t.languageCode, kind: t.kind || '' }));
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    return null;
  }

  // timedtext answers 200 with an empty body to URLs without a valid pot token, and sometimes
  // even to the player's own request; the player then retries, usually with a fresh pot.
  async function load(playerUrl) {
    const p = new URL(playerUrl, location.href).searchParams;
    const native = { lang: p.get('lang') || '', kind: p.get('kind') || '', tlang: p.get('tlang') || '' };
    if (!native.lang) return; // a track list, not a track
    const videoId = p.get('v') || '';
    // a request finishing after navigation belongs to the video left behind (or to a hover preview)
    if (videoId !== new URLSearchParams(location.search).get('v')) return;
    lastPlayerUrl = playerUrl;
    const key = [videoId, native.lang, native.kind, native.tlang].join('|');
    if (key === state.key) {
      if (state.status === 'loading') {
        newer = playerUrl;
        return;
      }
      if (state.status !== 'empty') return;
    }
    const gen = ++generation;
    Object.assign(state, { key, status: 'planning', plan: '', cues: 0, topUrl: '', paired: false });
    cues = [];
    nativeCues = [];
    newer = null;
    const tracks = await tracksOf(videoId);
    if (gen !== generation) return;
    // without the list, plan() can only take the player's own track as the original; say so
    // A request this script caused (even by a switch from before a settings change) is not the viewer's
    // pick. Each such request is recognised once: the same track picked later by hand is the viewer's.
    const handPicked = !requested.delete(trackKey(videoId, native)) && switched.has(videoId);
    let decision = plan(tracks || [], native, handPicked, settings);
    Object.assign(state, { status: decision.action, plan: tracks ? decision.why : `${decision.why} (no track list)` });
    if (!tracks) console.warn(`[yt-dual-subs] no caption track list for ${videoId}; treating ${native.lang} as the original`);
    if (decision.action === 'switch') {
      switched.add(videoId);
      requested.add(trackKey(videoId, decision.to));
      // A player that is still settling its own default track drops setOption, so ask until it holds.
      // Once it does, the player requests the new track and that request drives load() again.
      const want = decision.to; // {lang, kind, tlang}
      // A bare {languageCode, kind: 'asr'} selects the human track of that language (verified
      // 2026-10-14); the player only honours asr when handed its own track object, so without
      // that object an asr switch is not attempted at all. A translation is that object plus
      // translationLanguage (verified 2026-10-15: en + ja shows Japanese).
      const trackObject = (player) => {
        let t = null;
        try {
          const list = player.getOption('captions', 'tracklist', { includeAsr: true }) || [];
          t = list.find((x) => norm(x.languageCode) === norm(want.lang) && (x.kind || '') === want.kind) || null;
        } catch {}
        if (!t && want.kind) return null;
        t = t || { languageCode: want.lang };
        return want.tlang ? { ...t, translationLanguage: { languageCode: want.tlang } } : t;
      };
      let refused = 'after four requests';
      for (let attempt = 1; attempt <= 4; attempt++) {
        const player = document.getElementById('movie_player');
        const target = trackObject(player);
        if (!target) {
          refused = 'no asr track object to ask with';
          break;
        }
        try {
          player.setOption('captions', 'track', target);
        } catch (err) {
          console.warn(`[yt-dual-subs] setOption failed for ${key}, attempt ${attempt}`, err);
        }
        await new Promise((r) => setTimeout(r, 1500));
        if (gen !== generation) return;
        let now = {};
        try {
          now = player.getOption('captions', 'track') || {};
        } catch {}
        const nowLang = now.languageCode || '';
        const nowTlang = now.translationLanguage?.languageCode || '';
        if (nowLang && norm(nowLang) === norm(want.lang) && (now.kind || '') === want.kind && norm(nowTlang) === norm(want.tlang)) return;
        // neither the track we started from nor the one asked for: the viewer picked it, keep it
        if (nowLang && (norm(nowLang) !== norm(native.lang) || norm(nowTlang) !== norm(native.tlang))) {
          Object.assign(state, { status: 'none', plan: 'track picked by hand' });
          return;
        }
      }
      // the player kept refusing: translate what it shows rather than leave this visit without Chinese
      console.warn(`[yt-dual-subs] no switch from ${key} to ${want.tlang || want.lang}: ${refused}`);
      if (sameLanguage(native.tlang || native.lang, settings.top)) {
        Object.assign(state, { status: 'none', plan: 'switch failed; top language on screen' });
        return;
      }
      decision = { action: 'dual', top: { lang: native.lang, kind: native.kind, tlang: settings.top }, why: 'machine translation (switch failed)' };
      state.plan = decision.why;
    }
    if (decision.action !== 'dual') return;
    state.status = 'loading';
    let url = playerUrl;
    // three tries of the player's URL; a newer player URL always gets a try of its own
    for (let attempt = 1; ; attempt++) {
      const top = trackUrl(url, decision.top);
      ownUrls.add(top);
      let parsed = [];
      try {
        const res = await fetch(top, { credentials: 'include' });
        const body = await res.text();
        if (gen !== generation) return;
        parsed = body ? parseJson3(JSON.parse(body)) : [];
        if (!parsed.length) console.warn(`[yt-dual-subs] no cues (HTTP ${res.status}, ${body.length} bytes) for ${key}, attempt ${attempt}`);
      } catch (err) {
        if (gen !== generation) return;
        console.warn(`[yt-dual-subs] timedtext failed for ${key}, attempt ${attempt}`, err);
      }
      if (parsed.length) {
        let paired = [];
        if (decision.top.lang !== native.lang) {
          // a different track keeps its own timing: read the native track too, to pair by its cues
          try {
            const body = await (await fetch(trackUrl(url, native), { credentials: 'include' })).text();
            paired = body ? parseJson3(JSON.parse(body)) : [];
          } catch {}
          if (gen !== generation) return;
          if (!paired.length) console.warn(`[yt-dual-subs] native track unreadable for ${key}; the Chinese line follows its own timing`);
        }
        cues = parsed;
        nativeCues = paired;
        rolling = { top: decision.top.kind === 'asr', native: native.kind === 'asr' };
        Object.assign(state, { status: 'ready', cues: cues.length, topUrl: top, paired: paired.length > 0 });
        if (!raf) raf = requestAnimationFrame(tick);
        return;
      }
      if (!newer) {
        if (attempt >= 3) break;
        await new Promise((r) => setTimeout(r, 2000));
        if (gen !== generation) return;
      }
      if (newer) [url, newer] = [newer, null];
    }
    // the next player request for this track starts over
    state.status = 'empty';
    console.warn(`[yt-dual-subs] no Chinese line for ${key}: timedtext had no cues`);
  }

  // restyles (never hides) the native line only while the player carries .ytds-dual; YouTube
  // re-renders caption segments with inline styles, which only !important stylesheet rules outrank
  try {
    const sheet = new CSSStyleSheet();
    // auto-generated captions are left-aligned inside a wide window; centring them lines both rows up
    sheet.replaceSync(`
      #movie_player.ytds-dual .caption-window,
      #movie_player.ytds-dual .caption-visual-line { text-align: center !important; }
      #movie_player.ytds-dual .ytp-caption-segment {
        font-size: var(--ytds-bottom) !important; color: #fff !important;
        background: var(--ytds-bg) !important; text-shadow: none !important;
      }`);
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
  } catch (err) {
    console.warn('[yt-dual-subs] could not add the stylesheet; the original line keeps its own size', err);
  }

  function makeLine() {
    const el = document.createElement('div');
    el.id = 'ytds-line';
    el.style.cssText = [
      'position:absolute', 'left:50%', 'transform:translateX(-50%)', 'z-index:60', 'max-width:90%',
      'pointer-events:none', 'text-align:center', 'line-height:1.25',
      'color:#fff', 'padding:0 .3em', 'font-weight:500',
      'font-family:"PingFang TC","Noto Sans TC","YouTube Noto",Roboto,sans-serif', 'display:none',
    ].join(';');
    return el;
  }

  function tick() {
    const player = document.getElementById('movie_player');
    if (!cues.length) {
      if (line) line.style.display = 'none';
      if (player) player.classList.remove('ytds-dual');
      raf = 0;
      return;
    }
    raf = requestAnimationFrame(tick);
    const video = player && player.querySelector('video');
    const ccOn = player && player.querySelector('.ytp-subtitles-button[aria-pressed="true"]');
    // during an ad the <video> plays the ad, so its currentTime would pick the wrong cue
    const showing = location.pathname === '/watch' && video && ccOn && !player.classList.contains('ad-showing');
    // one line, as Chinese film subtitles are; translated tracks keep the source's line breaks, which strand a lone "♪"
    const ms = showing ? video.currentTime * 1000 : 0;
    let raw = '';
    if (showing) {
      if (nativeCues.length) raw = pairedText(nativeCues, cues, ms, rolling.native);
      else raw = rolling.top ? latestAt(cues, ms) : textAt(cues, ms);
    }
    const text = tidy(raw.replace(/\s*\n\s*/g, ' '));
    if (!line) line = makeLine();
    if (!text) {
      line.style.display = 'none';
      if (player) player.classList.remove('ytds-dual');
      return;
    }
    if (line.parentNode !== player) player.appendChild(line);
    if (line.textContent !== text) line.textContent = text;
    const h = player.getBoundingClientRect().height;
    const bg = `rgba(${[1, 3, 5].map((i) => parseInt(settings.bg.slice(i, i + 2), 16)).join(', ')}, ${settings.bgOpacity})`;
    line.style.fontSize = `${Math.max(14, Math.round((h * settings.topSize) / 100))}px`;
    line.style.background = bg;
    player.style.setProperty('--ytds-bottom', `${Math.max(11, Math.round((h * settings.bottomSize) / 100))}px`);
    player.style.setProperty('--ytds-bg', bg);
    player.classList.add('ytds-dual');
    line.style.display = 'block'; // before measuring, so the clamp in place() sees this text's size
    // Sit right on the native text (its window carries padding), centred on the native window, which
    // with the text centred inside it is the text's centre and does not drift as roll-up words arrive.
    // Between native cues keep the last position.
    const wins = [...player.querySelectorAll('.caption-window')].flatMap((w) => {
      const seg = [...w.querySelectorAll('.ytp-caption-segment')].find((s) => s.offsetHeight && s.textContent.trim());
      if (!seg) return [];
      const r = w.getBoundingClientRect();
      const lines = [...w.querySelectorAll('.caption-visual-line')].filter((l) => l.offsetHeight && l.textContent.trim());
      return [{
        left: r.left, right: r.right, bottom: r.bottom,
        textTop: seg.getBoundingClientRect().top,
        textBottom: (lines.at(-1) || seg).getBoundingClientRect().bottom,
        lineHeight: (lines[0] || seg).getBoundingClientRect().height,
        rollup: w.classList.contains('ytp-caption-window-rollup'),
      }];
    });
    const spot = place(player.getBoundingClientRect(), wins, line.offsetWidth, line.offsetHeight, settings.gap);
    if (spot) {
      line.style.left = `${spot.left}px`;
      line.style.bottom = `${spot.bottom}px`;
    } else if (!line.style.bottom) {
      line.style.bottom = '12%';
    }
  }

  // ---- settings menu: a button beside CC, a menu built like the player's own settings menu ----
  // Measured from YouTube's settings menu on 2026-10-15: rgba(0,0,0,.6) panel, 12px radius, 288px
  // wide, 8px padding, 48px rows, 24px line icons padded 0 24 0 8, 14px labels, values at 70% white
  // with a chevron, 40x24 toggles with a 20px knob, submenus headed by a back chevron and a rule.

  const I18N = {
    zh: {
      title: '雙語字幕', enabled: '雙語字幕', top: '上方語言', bottom: '下方語言', style: '字幕樣式', auto: '原文（自動）',
      bg: '背景顏色', custom: '自訂顏色', opacity: '背景不透明度', gap: '上下間距', topSize: '上方字級', bottomSize: '下方字級',
      reset: '恢復預設', back: '返回', search: '搜尋語言', common: '常用', all: '所有語言', none: '找不到符合的語言',
    },
    en: {
      title: 'Dual subtitles', enabled: 'Dual subtitles', top: 'Top language', bottom: 'Bottom language', style: 'Subtitle style',
      auto: 'Original (auto)', bg: 'Box colour', custom: 'Custom colour', opacity: 'Box opacity', gap: 'Gap', topSize: 'Top size',
      bottomSize: 'Bottom size', reset: 'Reset', back: 'Back', search: 'Search languages', common: 'Common', all: 'All languages',
      none: 'No matching language',
    },
  };
  const tr = (key) => I18N[/^zh/i.test(document.documentElement.lang) ? 'zh' : 'en'][key];
  // when the video does not list YouTube's translation languages
  const FALLBACK_LANGUAGES = [
    ['zh-Hant', '繁體中文'], ['zh-Hans', '简体中文'], ['en', 'English'], ['ja', '日本語'], ['ko', '한국어'],
    ['es', 'Español'], ['fr', 'Français'], ['de', 'Deutsch'], ['pt', 'Português'], ['ru', 'Русский'],
    ['vi', 'Tiếng Việt'], ['th', 'ไทย'], ['id', 'Bahasa Indonesia'],
  ];
  const COMMON = ['zh-Hant', 'zh-Hans', 'en', 'ja', 'ko'];
  const SWATCHES = ['#080808', '#3a3a3a', '#0d2a5c', '#4a1010', '#103a1e'];
  const OPACITIES = [0, 0.25, 0.5, 0.75, 1];

  function languages() {
    const list = playerResponse()?.captions?.playerCaptionsTracklistRenderer?.translationLanguages;
    if (!list?.length) return FALLBACK_LANGUAGES;
    return list.map((l) => [l.languageCode, l.languageName?.simpleText || l.languageCode]);
  }
  const languageName = (code) => (code === 'auto' ? tr('auto') : (languages().find(([c]) => c === code) || [code, code])[1]);

  // element helper: createElement + textContent only (YouTube enforces Trusted Types)
  function h(tag, props = {}, ...children) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else if (k === 'style') e.style.cssText = v; // through CSSOM: an inline style attribute could meet the page's CSP
      else if (k === 'className' || k === 'textContent' || k === 'value' || k === 'type' || k === 'checked') e[k] = v;
      else e.setAttribute(k, v);
    }
    e.append(...children.filter(Boolean));
    return e;
  }

  const SVG = 'http://www.w3.org/2000/svg';
  // 24px line icons in the player's own style; size 16 for chevrons
  function icon(paths, size = 24) {
    const svg = document.createElementNS(SVG, 'svg');
    for (const [k, v] of Object.entries({ viewBox: '0 0 24 24', width: size, height: size, fill: 'none', 'aria-hidden': 'true' })) svg.setAttribute(k, v);
    for (const d of paths) {
      const p = document.createElementNS(SVG, 'path');
      for (const [k, v] of Object.entries({ d, stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' })) p.setAttribute(k, v);
      svg.append(p);
    }
    return svg;
  }
  const ICONS = {
    dual: ['M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z', 'M6 10h12', 'M8.5 14h7'],
    top: ['M12 3a9 9 0 1 0 0 18 9 9 0 1 0 0-18z', 'M3.5 9h17', 'M3.5 15h17', 'M12 3c-2.4 2.5-3.6 5.5-3.6 9s1.2 6.5 3.6 9c2.4-2.5 3.6-5.5 3.6-9S14.4 5.5 12 3z'],
    bottom: ['M4 4h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-5 4V5a1 1 0 0 1 1-1z', 'M8 9h8', 'M8 12h5'],
    style: ['M12 3a9 9 0 0 0 0 18c1.1 0 1.7-.8 1.7-1.6 0-.9-.7-1.3-.7-2.1 0-.9.7-1.6 1.6-1.6H17a4 4 0 0 0 4-4c0-4.9-4-8.7-9-8.7z', 'M7.5 12h.01', 'M9.5 7.5h.01', 'M14.5 7.5h.01'],
    next: ['M9 6l6 6-6 6'],
    back: ['M15 18l-6-6 6-6'],
    check: ['M5 12.5l4.5 4.5L19 7'],
    search: ['M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 1 0 0-13z', 'M20 20l-4.6-4.6'],
  };

  const MENU_CSS = `
    .ytds-button { display: inline-flex !important; align-items: center; justify-content: center; }
    .ytds-button svg { width: 24px; height: 24px; }
    .ytds-button[aria-pressed="false"] svg { opacity: .55; }
    #ytds-menu {
      position: absolute; right: 12px; bottom: 61px; z-index: 71; width: 288px; max-height: calc(100% - 80px);
      display: flex; flex-direction: column; box-sizing: border-box; overflow: hidden;
      background: rgba(0, 0, 0, .6); border-radius: 12px; color: #eee; text-shadow: 0 0 2px rgba(0, 0, 0, .5);
      font: 400 14px/1.3 "YouTube Noto", Roboto, Arial, Helvetica, sans-serif;
      opacity: 0; transform: translateY(4px); transition: opacity .1s cubic-bezier(0, 0, .2, 1), transform .1s cubic-bezier(0, 0, .2, 1);
    }
    #ytds-menu.ytds-open { opacity: 1; transform: none; }
    #movie_player.ytp-big-mode #ytds-menu.ytds-open { transform: scale(1.3); transform-origin: 100% 100%; }
    #ytds-menu * { box-sizing: border-box; }
    #ytds-menu button { font: inherit; color: inherit; background: none; border: 0; margin: 0; padding: 0; cursor: pointer; text-shadow: inherit; }
    #ytds-menu .ytds-body { padding: 8px; overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,.3) transparent; }
    #ytds-menu .ytds-item { display: flex; align-items: center; width: 100%; height: 48px; border-radius: 8px; text-align: left; }
    #ytds-menu .ytds-item:hover, #ytds-menu .ytds-item:focus-visible { background: rgba(255, 255, 255, .1); outline: none; }
    #ytds-menu .ytds-icon { display: flex; padding: 0 24px 0 8px; }
    #ytds-menu .ytds-label { flex: 1; min-width: 0; padding-right: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    #ytds-menu .ytds-value { display: flex; align-items: center; gap: 2px; max-width: 132px; padding-right: 8px; color: rgba(255, 255, 255, .7); white-space: nowrap; }
    #ytds-menu .ytds-value span { overflow: hidden; text-overflow: ellipsis; }
    #ytds-menu .ytds-toggle { position: relative; width: 40px; height: 24px; margin-right: 8px; border-radius: 12px; background: rgba(255, 255, 255, .1); transition: background .1s; }
    #ytds-menu .ytds-toggle::after { content: ""; position: absolute; top: 2px; left: 2px; width: 20px; height: 20px; border-radius: 50%; background: rgba(255, 255, 255, .7); transition: transform .1s, background .1s; }
    #ytds-menu [aria-checked="true"] .ytds-toggle { background: rgba(255, 255, 255, .3); }
    #ytds-menu [aria-checked="true"] .ytds-toggle::after { transform: translateX(16px); background: #fff; }
    #ytds-menu .ytds-header { display: flex; align-items: center; gap: 4px; flex: none; height: 57px; padding: 8px 12px 8px 4px; border-bottom: 1px solid rgba(255, 255, 255, .2); font-size: 12px; font-weight: 500; }
    #ytds-menu .ytds-back { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; }
    #ytds-menu .ytds-back:hover, #ytds-menu .ytds-back:focus-visible { background: rgba(255, 255, 255, .1); outline: none; }
    #ytds-menu .ytds-search { display: flex; align-items: center; gap: 8px; flex: none; margin: 8px 16px 0; padding: 4px 0; border-bottom: 1px solid rgba(255, 255, 255, .3); color: rgba(255, 255, 255, .7); }
    #ytds-menu .ytds-search:focus-within { border-bottom-color: #fff; color: #fff; }
    #ytds-menu .ytds-search input { flex: 1; min-width: 0; height: 28px; border: 0; outline: none; background: none; color: #fff; font: inherit; }
    #ytds-menu .ytds-search input::placeholder { color: rgba(255, 255, 255, .5); }
    #ytds-menu .ytds-group { padding: 12px 8px 4px 48px; font-size: 12px; color: rgba(255, 255, 255, .6); }
    #ytds-menu .ytds-check { display: flex; width: 48px; padding-left: 12px; visibility: hidden; }
    #ytds-menu [aria-checked="true"] > .ytds-check { visibility: visible; }
    #ytds-menu .ytds-empty { padding: 16px 8px 16px 48px; color: rgba(255, 255, 255, .6); }
    #ytds-menu .ytds-field { padding: 10px 8px 12px; }
    #ytds-menu .ytds-field-head { display: flex; justify-content: space-between; margin-bottom: 10px; }
    #ytds-menu .ytds-field-head span:last-child { color: rgba(255, 255, 255, .7); }
    #ytds-menu .ytds-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    #ytds-menu .ytds-swatch { position: relative; width: 26px; height: 26px; border-radius: 50%; box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .35); }
    #ytds-menu .ytds-swatch[aria-checked="true"] { box-shadow: 0 0 0 2px rgba(0, 0, 0, .6), 0 0 0 4px #fff; }
    #ytds-menu .ytds-swatch:focus-visible { outline: 2px solid #fff; outline-offset: 3px; }
    #ytds-menu .ytds-custom { background: conic-gradient(#f44, #fd4, #4d4, #4df, #44f, #f4f, #f44); overflow: hidden; }
    #ytds-menu .ytds-custom input { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; border: 0; padding: 0; }
    #ytds-menu .ytds-chips { display: flex; gap: 6px; }
    #ytds-menu .ytds-chip { flex: 1; height: 32px; border-radius: 16px; background: rgba(255, 255, 255, .1); font-size: 13px; }
    #ytds-menu .ytds-chip:hover { background: rgba(255, 255, 255, .2); }
    #ytds-menu .ytds-chip[aria-checked="true"] { background: #fff; color: #0f0f0f; text-shadow: none; }
    #ytds-menu .ytds-chip:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
    #ytds-menu input[type="range"] { -webkit-appearance: none; appearance: none; width: 100%; height: 16px; margin: 0; background: none; cursor: pointer; }
    #ytds-menu input[type="range"]::-webkit-slider-runnable-track { height: 4px; border-radius: 2px; background: linear-gradient(to right, #fff var(--p), rgba(255, 255, 255, .3) var(--p)); }
    #ytds-menu input[type="range"]::-moz-range-track { height: 4px; border-radius: 2px; background: linear-gradient(to right, #fff var(--p), rgba(255, 255, 255, .3) var(--p)); }
    #ytds-menu input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; margin-top: -5px; border-radius: 50%; background: #fff; border: 0; }
    #ytds-menu input[type="range"]::-moz-range-thumb { width: 14px; height: 14px; border-radius: 50%; background: #fff; border: 0; }
    #ytds-menu input[type="range"]:focus-visible { outline: 2px solid #fff; outline-offset: 4px; border-radius: 2px; }
    #ytds-menu .ytds-footer { display: flex; justify-content: flex-end; padding: 4px 8px 4px; }
    #ytds-menu .ytds-pill { height: 36px; padding: 0 16px; border-radius: 18px; background: rgba(255, 255, 255, .1); font-weight: 500; }
    #ytds-menu .ytds-pill:hover, #ytds-menu .ytds-pill:focus-visible { background: rgba(255, 255, 255, .2); outline: none; }
  `;
  try {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(MENU_CSS);
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
  } catch (err) {
    console.warn('[yt-dual-subs] could not add the menu stylesheet', err);
  }

  let menu = null;
  let page = 'main';

  function update(patch, needsReplan) {
    saveSettings({ ...settings, ...patch });
    if (needsReplan) replan();
    syncButton();
  }

  // a menu row: icon, label, then either a value with a chevron (submenu) or a toggle
  function row({ iconName, label, value, go, toggle, onclick }) {
    return h(
      'button',
      {
        className: 'ytds-item', type: 'button', role: toggle === undefined ? 'menuitem' : 'menuitemcheckbox',
        ...(toggle === undefined ? { 'aria-haspopup': 'true' } : { 'aria-checked': String(toggle) }),
        ...(go ? { 'data-go': go } : {}),
        onclick,
      },
      h('span', { className: 'ytds-icon' }, icon(ICONS[iconName])),
      h('span', { className: 'ytds-label', textContent: label }),
      toggle === undefined
        ? h('span', { className: 'ytds-value' }, value ? h('span', { textContent: value }) : null, icon(ICONS.next, 16))
        : h('span', { className: 'ytds-toggle' }),
    );
  }

  function header(title) {
    return h(
      'div',
      { className: 'ytds-header' },
      h('button', { className: 'ytds-back', type: 'button', 'aria-label': tr('back'), onclick: () => show('main') }, icon(ICONS.back)),
      h('span', { textContent: title }),
    );
  }

  function mainPage() {
    return [h(
      'div',
      { className: 'ytds-body', role: 'menu', 'aria-label': tr('title') },
      row({ iconName: 'dual', label: tr('enabled'), toggle: settings.enabled, onclick: () => {
        update({ enabled: !settings.enabled }, true);
        show('main');
      } }),
      row({ iconName: 'top', label: tr('top'), value: languageName(settings.top), go: 'top', onclick: () => show('top') }),
      row({ iconName: 'bottom', label: tr('bottom'), value: languageName(settings.bottom), go: 'bottom', onclick: () => show('bottom') }),
      row({ iconName: 'style', label: tr('style'), go: 'style', onclick: () => show('style') }),
    )];
  }

  // a checked list of languages, with a filter: YouTube offers about 150
  function languagePage(key) {
    const current = settings[key];
    const all = languages();
    const option = ([code, name]) =>
      h(
        'button',
        {
          className: 'ytds-item', type: 'button', role: 'menuitemradio', 'aria-checked': String(code === current), 'data-lang': code,
          'data-search': `${name} ${code}`.toLowerCase(),
          onclick: () => {
            update({ [key]: code }, true);
            show('main');
          },
        },
        h('span', { className: 'ytds-check' }, icon(ICONS.check)),
        h('span', { className: 'ytds-label', textContent: name }),
      );
    const common = COMMON.map((code) => all.find(([c]) => c === code)).filter(Boolean);
    // the rest in the interface language's order, without repeating the common ones
    const collator = new Intl.Collator(document.documentElement.lang || undefined);
    const rest = all.filter(([c]) => !COMMON.includes(c)).sort((a, b) => collator.compare(a[1], b[1]));
    const list = h(
      'div',
      { className: 'ytds-body', role: 'menu', 'aria-label': tr(key) },
      key === 'bottom' ? option(['auto', tr('auto')]) : null,
      common.length ? h('div', { className: 'ytds-group', textContent: tr('common') }) : null,
      ...common.map(option),
      h('div', { className: 'ytds-group', textContent: tr('all') }),
      ...rest.map(option),
      h('div', { className: 'ytds-empty', textContent: tr('none'), hidden: '' }),
    );
    const filter = (q) => {
      const query = q.trim().toLowerCase();
      let shown = 0;
      for (const el of list.querySelectorAll('[data-lang]')) {
        const hit = !query || el.dataset.search.includes(query);
        el.hidden = !hit;
        shown += hit;
      }
      for (const g of list.querySelectorAll('.ytds-group')) g.hidden = Boolean(query);
      list.querySelector('.ytds-empty').hidden = shown > 0;
    };
    const search = h(
      'label',
      { className: 'ytds-search' },
      icon(ICONS.search, 20),
      h('input', { type: 'search', name: 'search', placeholder: tr('search'), 'aria-label': tr('search'), oninput: (e) => filter(e.target.value) }),
    );
    return [header(tr(key)), search, list];
  }

  function slider(name, min, max, step, unit, label) {
    const value = h('span', {});
    const input = h('input', { type: 'range', name, min, max, step, value: settings[name], 'aria-label': label });
    const paint = () => {
      value.textContent = `${Math.round(Number(input.value) * 10) / 10}${unit}`;
      input.style.setProperty('--p', `${((input.value - min) / (max - min)) * 100}%`);
    };
    input.addEventListener('input', () => {
      paint();
      update({ [name]: Number(input.value) }, false);
    });
    paint();
    return h('div', { className: 'ytds-field' }, h('div', { className: 'ytds-field-head' }, h('span', { textContent: label }), value), input);
  }

  function stylePage() {
    const swatch = (color) =>
      h('button', {
        className: 'ytds-swatch', type: 'button', role: 'radio', 'aria-checked': String(settings.bg === color), 'aria-label': color,
        style: `background:${color}`, onclick: () => {
          update({ bg: color }, false);
          show('style');
        },
      });
    const custom = h(
      'label',
      { className: 'ytds-swatch ytds-custom', 'aria-checked': String(!SWATCHES.includes(settings.bg)), title: tr('custom') },
      h('input', { type: 'color', name: 'bg', value: settings.bg, 'aria-label': tr('custom'), oninput: (e) => update({ bg: e.target.value }, false), onchange: () => show('style') }),
    );
    const chips = OPACITIES.map((o) =>
      h('button', {
        className: 'ytds-chip', type: 'button', role: 'radio', 'aria-checked': String(Math.abs(settings.bgOpacity - o) < 0.01),
        'data-opacity': o, textContent: `${o * 100}%`, onclick: () => {
          update({ bgOpacity: o }, false);
          show('style');
        },
      }),
    );
    return [
      header(tr('style')),
      h(
        'div',
        { className: 'ytds-body' },
        h('div', { className: 'ytds-field' },
          h('div', { className: 'ytds-field-head' }, h('span', { textContent: tr('bg') })),
          h('div', { className: 'ytds-row', role: 'radiogroup', 'aria-label': tr('bg') }, ...SWATCHES.map(swatch), custom)),
        h('div', { className: 'ytds-field' },
          h('div', { className: 'ytds-field-head' }, h('span', { textContent: tr('opacity') })),
          h('div', { className: 'ytds-chips', role: 'radiogroup', 'aria-label': tr('opacity') }, ...chips)),
        slider('gap', 0, 40, 1, 'px', tr('gap')),
        slider('topSize', 2, 8, 0.1, '%', tr('topSize')),
        slider('bottomSize', 2, 8, 0.1, '%', tr('bottomSize')),
        h('div', { className: 'ytds-footer' }, h('button', {
          className: 'ytds-pill', type: 'button', name: 'reset', textContent: tr('reset'), onclick: () => {
            update(runtimeDefaults, true);
            show('style');
          },
        })),
      ),
    ];
  }

  function show(next) {
    if (!menu) return;
    page = next;
    const content = next === 'main' ? mainPage() : next === 'style' ? stylePage() : languagePage(next);
    menu.replaceChildren(...content);
    menu.dataset.page = next;
    const first = next === 'top' || next === 'bottom'
      ? menu.querySelector('[aria-checked="true"][data-lang]') || menu.querySelector('input')
      : menu.querySelector('.ytds-item, .ytds-back');
    first?.focus({ preventScroll: next === 'main' });
    if (first?.dataset.lang) first.scrollIntoView({ block: 'center' });
  }

  function closeMenu(refocus) {
    if (!menu) return;
    menu.remove();
    menu = null;
    syncButton();
    if (refocus) document.querySelector('#movie_player .ytds-button')?.focus();
  }

  function openMenu() {
    closeMenu(false);
    const player = document.getElementById('movie_player');
    if (!player) return;
    menu = h('div', { id: 'ytds-menu', role: 'dialog', 'aria-label': tr('title') });
    // keep the player's hotkeys and click-to-pause out; arrows move between controls, Escape steps back
    for (const type of ['keydown', 'keyup', 'keypress', 'click', 'dblclick', 'mousedown', 'mouseup', 'pointerdown', 'pointerup', 'wheel']) {
      menu.addEventListener(type, (e) => {
        if (type === 'keydown') onMenuKey(e);
        e.stopPropagation();
      });
    }
    player.appendChild(menu);
    show('main');
    syncButton();
    requestAnimationFrame(() => menu?.classList.add('ytds-open'));
  }

  function onMenuKey(e) {
    // an input method choosing candidates (Zhuyin, Pinyin, kana) uses the arrows and Escape itself
    if (e.isComposing || e.keyCode === 229) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      if (page === 'main') closeMenu(true);
      else show('main');
      return;
    }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    if (e.target.type === 'range') return; // arrows adjust the slider
    const focusable = [...menu.querySelectorAll('button, input')].filter((el) => !el.hidden && el.offsetParent);
    const i = focusable.indexOf(document.activeElement);
    const next = focusable[(i + (e.key === 'ArrowDown' ? 1 : -1) + focusable.length) % focusable.length];
    if (next) {
      e.preventDefault();
      next.focus();
    }
  }

  function syncButton() {
    const button = document.querySelector('#movie_player .ytds-button');
    if (!button) return;
    button.setAttribute('aria-pressed', String(settings.enabled));
    button.setAttribute('aria-expanded', String(Boolean(menu)));
  }

  function makeButton() {
    return h('button', {
      className: 'ytp-button ytds-button', type: 'button', title: tr('title'), 'aria-label': tr('title'),
      'aria-haspopup': 'dialog', 'aria-pressed': String(settings.enabled), 'aria-expanded': 'false',
      onclick: (e) => {
        e.stopPropagation();
        // a menu that left the page with a rebuilt player is not open
        if (menu?.isConnected) closeMenu(false);
        else openMenu();
      },
    }, icon(ICONS.dual));
  }

  // beside the CC button, inside its control group; YouTube rebuilds its controls now and then
  setInterval(() => {
    if (location.pathname !== '/watch' || document.querySelector('#movie_player .ytds-button')) return;
    const cc = document.querySelector('#movie_player .ytp-subtitles-button');
    if (cc) cc.after(makeButton());
    else document.querySelector('#movie_player .ytp-right-controls')?.prepend(makeButton());
  }, 1000);

  document.addEventListener('mousedown', (e) => {
    if (menu && !menu.contains(e.target) && !e.target.closest?.('.ytds-button')) closeMenu(false);
  }, true);

  // Observing finished requests instead of patching XHR/fetch: works for either transport and leaves the page's own APIs untouched
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) {
      if (e.name.includes('/api/timedtext') && !ownUrls.has(e.name)) load(e.name);
    }
  }).observe({ type: 'resource', buffered: true });

  document.addEventListener('yt-navigate-start', () => {
    generation++;
    newer = null;
    lastPlayerUrl = ''; // its pot belongs to the player being left; wait for the next request
    requested.clear();
    switched.clear();
    Object.assign(state, { status: 'idle', key: '', plan: '', cues: 0, topUrl: '', paired: false });
    cues = [];
    nativeCues = [];
    closeMenu(false);
  });
})();
