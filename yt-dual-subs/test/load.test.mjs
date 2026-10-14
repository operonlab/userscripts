// The runtime half of the userscript (track loading) in a fake page: fetch answers only when a test says so.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const src = readFileSync(new URL('../yt-dual-subs.user.js', import.meta.url), 'utf8');

const PLAYER = (pot, lang = 'en', extra = '') =>
  `https://www.youtube.com/api/timedtext?v=VID&lang=${lang}&pot=${pot}&fmt=json3${extra}`;
const TRACK = (n) =>
  JSON.stringify({ events: Array.from({ length: n }, (_, i) => ({ tStartMs: i * 1000, dDurationMs: 900, segs: [{ utf8: `句${i}` }] })) });
const NO_CUES = JSON.stringify({ events: [{ tStartMs: 0, dDurationMs: 900000, wpWinPosId: 1 }] });

// tracks: [[languageCode, kind]] as the player response lists them; null means no player API at all
// readyAfter: how many getPlayerResponse() calls fail before the player has its response
// ignoreSwitch: the player drops every setOption and keeps its first track (ja)
// userPicks: the viewer picks this track by hand right after the first setOption
// holdAfter: the player keeps its first track (ja) until this many setOption calls
// noTrackList: getOption('captions', 'tracklist') comes back empty
// stored: localStorage contents at page load
function page({ tracks = null, readyAfter = 0, ignoreSwitch = false, userPicks = '', holdAfter = 1, noTrackList = false, stored = {} } = {}) {
  const loc = { href: 'https://www.youtube.com/watch?v=VID', pathname: '/watch', search: '?v=VID' };
  let asked = 0;
  const calls = [];
  const switches = [];
  const handlers = {};
  let observe;
  const player = tracks && {
    getPlayerResponse: () => {
      if (asked++ < readyAfter) throw new Error('player not ready');
      return {
        videoDetails: { videoId: 'VID' },
        captions: { playerCaptionsTracklistRenderer: { captionTracks: tracks.map(([languageCode, kind]) => ({ languageCode, kind })) } },
      };
    },
    setOption: (_module, _option, value) => switches.push(value),
    // like the real player: the list leaves asr tracks out unless asked, and setOption takes one of its objects
    getOption: (_module, option, opts) =>
      option === 'tracklist'
        ? noTrackList
          ? []
          : tracks
            .filter(([, kind]) => kind !== 'asr' || opts?.includeAsr)
            .map(([languageCode, kind]) => ({ languageCode, kind, vss_id: `${kind === 'asr' ? 'a' : ''}.${languageCode}` }))
        : userPicks && switches.length
          ? { languageCode: userPicks }
          : ignoreSwitch || switches.length < holdAfter
            ? { languageCode: 'ja' }
            : switches.at(-1),
  };
  const sandbox = {
    window: {},
    URL,
    URLSearchParams,
    navigator: { language: 'zh-TW' },
    localStorage: {
      store: new Map(Object.entries(stored)),
      getItem(k) {
        return this.store.has(k) ? this.store.get(k) : null;
      },
      setItem(k, v) {
        this.store.set(k, String(v));
      },
    },
    console: { warn() {} },
    location: loc,
    document: {
      addEventListener: (type, fn) => (handlers[type] = fn),
      getElementById: (id) => (id === 'movie_player' ? player : null),
    },
    PerformanceObserver: class {
      constructor(cb) {
        observe = cb;
      }
      observe() {}
    },
    requestAnimationFrame: () => 1,
    setTimeout: (fn) => Promise.resolve().then(fn),
    setInterval: () => 0, // the settings button's re-insert loop; the button itself is covered by e2e
    fetch: (url) =>
      new Promise((resolve) => calls.push({ url, respond: (body) => resolve({ status: 200, text: async () => body }) })),
  };
  vm.runInNewContext(src, sandbox);
  return {
    calls,
    switches,
    state: sandbox.window.__ytdsState,
    request: (url) => observe({ getEntries: () => [{ name: url }] }),
    navigate: () => handlers['yt-navigate-start'](),
    replan: () => sandbox.window.__ytdsState.replan(),
    store: (k, v) => sandbox.localStorage.setItem(k, v),
    goTo: (v) => Object.assign(loc, { href: `https://www.youtube.com/watch?v=${v}`, search: `?v=${v}` }),
  };
}

const settle = async () => {
  for (let i = 0; i < 10; i++) await new Promise((r) => setImmediate(r));
};
const pot = (call) => new URL(call.url).searchParams.get('pot');

test('loads the translated track from the player request', async () => {
  const p = page();
  p.request(PLAYER('P1'));
  await settle();
  assert.equal(p.calls.length, 1);
  assert.equal(new URL(p.calls[0].url).searchParams.get('tlang'), 'zh-Hant');
  p.calls[0].respond(TRACK(3));
  await settle();
  assert.equal(p.state.status, 'ready');
  assert.equal(p.state.cues, 3);
});

test('its own requests do not start another load', async () => {
  const p = page();
  p.request(PLAYER('P1'));
  await settle();
  p.request(p.calls[0].url);
  p.calls[0].respond(TRACK(3));
  await settle();
  p.request(p.calls[0].url);
  await settle();
  assert.equal(p.calls.length, 1);
});

test('a newer player URL that arrives during the last attempt is still fetched', async () => {
  const p = page();
  p.request(PLAYER('P1'));
  for (let i = 0; i < 3; i++) {
    await settle();
    if (i === 2) p.request(PLAYER('P2'));
    p.calls[i].respond('');
  }
  await settle();
  assert.equal(p.calls.length, 4);
  assert.equal(pot(p.calls[3]), 'P2');
  p.calls[3].respond(TRACK(2));
  await settle();
  assert.equal(p.state.status, 'ready');
});

test('a response from before a navigation cannot overwrite the same track loaded after it', async () => {
  const p = page();
  p.request(PLAYER('OLD'));
  await settle();
  p.navigate();
  p.request(PLAYER('NEW'));
  await settle();
  assert.deepEqual(p.calls.map(pot), ['OLD', 'NEW']);
  p.calls[1].respond(TRACK(2));
  await settle();
  p.calls[0].respond(TRACK(5));
  await settle();
  assert.equal(p.state.status, 'ready');
  assert.equal(p.state.cues, 2);
});

test('a response with no cues is retried, and the track recovers on the next player request', async () => {
  const p = page();
  p.request(PLAYER('P1'));
  for (let i = 0; i < 3; i++) {
    await settle();
    p.calls[i]?.respond(NO_CUES);
  }
  await settle();
  assert.equal(p.state.status, 'empty');
  const before = p.calls.length;
  p.request(PLAYER('P2'));
  await settle();
  assert.equal(p.calls.length, before + 1);
  p.calls[before].respond(TRACK(4));
  await settle();
  assert.equal(p.state.cues, 4);
});

const RICK = [['ja', ''], ['en', ''], ['en', 'asr']];
const plainSwitches = (p) => JSON.parse(JSON.stringify(p.switches));

test('a foreign video on a non-original track is switched once, then gets its Chinese line', async () => {
  const p = page({ tracks: RICK });
  p.request(PLAYER('P1', 'ja'));
  await settle();
  assert.deepEqual(plainSwitches(p), [{ languageCode: 'en', kind: '', vss_id: '.en' }]);
  assert.equal(p.calls.length, 0);
  p.request(PLAYER('P2', 'en'));
  await settle();
  assert.equal(new URL(p.calls[0].url).searchParams.get('tlang'), 'zh-Hant');
  p.calls[0].respond(TRACK(3));
  await settle();
  assert.equal(p.state.status, 'ready');
  // picking Japanese by hand afterwards is respected: no second switch, no Chinese line
  p.request(PLAYER('P3', 'ja'));
  await settle();
  assert.equal(p.switches.length, 1);
  assert.equal(p.state.status, 'none');
});

test('after navigation the same video may be switched again', async () => {
  const p = page({ tracks: RICK });
  p.request(PLAYER('P1', 'ja'));
  await settle();
  p.navigate();
  p.request(PLAYER('P2', 'ja'));
  await settle();
  assert.equal(p.switches.length, 2);
});

test('a switch the player keeps dropping falls back to translating the track on screen', async () => {
  const p = page({ tracks: RICK, ignoreSwitch: true });
  p.request(PLAYER('P1', 'ja'));
  await settle();
  assert.equal(p.switches.length, 4);
  const q = new URL(p.calls[0].url).searchParams;
  assert.deepEqual([q.get('lang'), q.get('tlang')], ['ja', 'zh-Hant']);
  p.calls[0].respond(TRACK(2));
  await settle();
  assert.equal(p.state.status, 'ready');
  assert.match(p.state.plan, /switch failed/);
});

test('a track picked by hand while a switch is being retried is kept', async () => {
  const p = page({ tracks: RICK, userPicks: 'de' });
  p.request(PLAYER('P1', 'ja'));
  await settle();
  assert.equal(p.switches.length, 1);
  assert.equal(p.state.status, 'none');
  assert.equal(p.calls.length, 0);
});

test('a late caption request for the video left behind is ignored', async () => {
  const p = page();
  p.navigate();
  p.goTo('NEW');
  p.request(PLAYER('P1')); // v=VID
  await settle();
  assert.equal(p.calls.length, 0);
  assert.equal(p.state.status, 'idle');
});

test("a late request for the video left behind does not cancel the new video's load", async () => {
  const p = page();
  p.navigate();
  p.goTo('NEW');
  p.request(PLAYER('P2').replace('v=VID', 'v=NEW'));
  await settle();
  p.request(PLAYER('P1'));
  await settle();
  assert.equal(p.calls.length, 1);
  p.calls[0].respond(TRACK(2));
  await settle();
  assert.equal(p.state.status, 'ready');
  assert.match(p.state.key, /^NEW\|/);
});

test('a switch that holds on a later attempt stops asking', async () => {
  const p = page({ tracks: RICK, holdAfter: 3 });
  p.request(PLAYER('P1', 'ja'));
  await settle();
  assert.equal(p.switches.length, 3);
  assert.equal(p.state.status, 'switch');
});

test('a Chinese video fetches nothing and switches nothing', async () => {
  const p = page({ tracks: [['en', ''], ['zh-TW', ''], ['zh', 'asr']] });
  p.request(PLAYER('P1', 'zh-TW'));
  p.request(PLAYER('P2', 'en'));
  await settle();
  assert.equal(p.calls.length, 0);
  assert.equal(p.switches.length, 0);
  assert.equal(p.state.status, 'none');
});

test('a human Traditional track is fetched as itself, not machine-translated', async () => {
  const p = page({ tracks: [['zh-TW', ''], ['en', ''], ['en', 'asr']] });
  p.request(PLAYER('P1', 'en'));
  await settle();
  const q = new URL(p.calls[0].url).searchParams;
  assert.deepEqual([q.get('lang'), q.get('tlang'), q.get('pot')], ['zh-TW', null, 'P1']);
});

test('a caption request that beats the player response still gets the switch', async () => {
  const p = page({ tracks: RICK, readyAfter: 3 });
  p.request(PLAYER('P1', 'ja'));
  await settle();
  assert.deepEqual(plainSwitches(p), [{ languageCode: 'en', kind: '', vss_id: '.en' }]);
});

test('no track list at all is reported in the plan, not silently assumed', async () => {
  const p = page();
  p.request(PLAYER('P1', 'ja'));
  await settle();
  assert.equal(p.state.plan, 'machine translation (no track list)');
});

test('a human Chinese track is paired with the native track, read as a second request', async () => {
  const p = page({ tracks: [['zh-TW', ''], ['en', ''], ['en', 'asr']] });
  p.request(PLAYER('P1', 'en'));
  await settle();
  p.calls[0].respond(TRACK(3));
  await settle();
  const q = new URL(p.calls[1].url).searchParams;
  assert.deepEqual([q.get('lang'), q.get('tlang'), q.get('pot')], ['en', null, 'P1']);
  p.calls[1].respond(TRACK(4));
  await settle();
  assert.equal(p.state.status, 'ready');
  assert.equal(p.state.paired, true);
});

test('an unreadable native track leaves the Chinese line on its own timing, and says so', async () => {
  const p = page({ tracks: [['zh-TW', ''], ['en', ''], ['en', 'asr']] });
  p.request(PLAYER('P1', 'en'));
  await settle();
  p.calls[0].respond(TRACK(3));
  await settle();
  p.calls[1].respond('');
  await settle();
  assert.equal(p.state.status, 'ready');
  assert.equal(p.state.paired, false);
});

test('machine translation of the native track needs no pairing request', async () => {
  const p = page({ tracks: RICK });
  p.request(PLAYER('P1', 'en'));
  await settle();
  p.calls[0].respond(TRACK(3));
  await settle();
  assert.equal(p.calls.length, 1);
  assert.equal(p.state.paired, false);
});

test('switching to an auto-generated track hands the player its own track object', async () => {
  const p = page({ tracks: [['ja', ''], ['fr', 'asr']] });
  p.request(PLAYER('P1', 'ja'));
  await settle();
  assert.equal(p.switches.length, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(p.switches[0])), { languageCode: 'fr', kind: 'asr', vss_id: 'a.fr' });
});

test("without the player's own asr track object, no bare asr request is sent; the track on screen is translated", async () => {
  const p = page({ tracks: [['ja', ''], ['fr', 'asr']], noTrackList: true });
  p.request(PLAYER('P1', 'ja'));
  await settle();
  assert.equal(p.switches.length, 0);
  const q = new URL(p.calls[0].url).searchParams;
  assert.deepEqual([q.get('lang'), q.get('tlang')], ['ja', 'zh-Hant']);
  assert.match(p.state.plan, /switch failed/);
});

const saved = (s) => ({ 'ytds-settings': JSON.stringify(s) });
const EN_ONLY = [['en', ''], ['en', 'asr']];

test('malformed stored settings fall back to defaults instead of breaking the page', async () => {
  const p = page({ tracks: EN_ONLY, stored: { 'ytds-settings': '{not json' } });
  p.request(PLAYER('P1', 'en'));
  await settle();
  assert.equal(new URL(p.calls[0].url).searchParams.get('tlang'), 'zh-Hant');
});

test('a stored top language drives the translation', async () => {
  const p = page({ tracks: EN_ONLY, stored: saved({ top: 'ja' }) });
  p.request(PLAYER('P1', 'en'));
  await settle();
  assert.equal(new URL(p.calls[0].url).searchParams.get('tlang'), 'ja');
});

test('a stored bottom language asks the player to translate the original into it', async () => {
  const p = page({ tracks: EN_ONLY, stored: saved({ bottom: 'ko' }) });
  p.request(PLAYER('P1', 'en'));
  await settle();
  assert.deepEqual(plainSwitches(p)[0], { languageCode: 'en', kind: '', vss_id: '.en', translationLanguage: { languageCode: 'ko' } });
});

test('switched off: nothing fetched, nothing switched, the ordinary captions stay', async () => {
  const p = page({ tracks: RICK, stored: saved({ enabled: false }) });
  p.request(PLAYER('P1', 'ja'));
  await settle();
  assert.equal(p.calls.length, 0);
  assert.equal(p.switches.length, 0);
  assert.equal(p.state.plan, 'off');
});

test("a settings change while a switch is in flight: that switch's own request is not a hand-picked track", async () => {
  const p = page({ tracks: EN_ONLY.concat([['ja', '']]) });
  p.request(PLAYER('P1', 'ja')); // the player opened on Japanese: switch to English
  await settle();
  assert.equal(p.switches.length, 1);
  // the viewer picks Korean for the bottom line before the player's English request lands
  p.store('ytds-settings', JSON.stringify({ bottom: 'ko' }));
  p.replan();
  await settle();
  p.request(PLAYER('P2', 'en')); // the first switch's own request
  await settle();
  assert.notEqual(p.state.plan, 'track picked by hand');
  assert.deepEqual(plainSwitches(p).at(-1).translationLanguage, { languageCode: 'ko' });
});

test('after leaving and coming back to the same video, a settings change waits for the new player request', async () => {
  const p = page({ tracks: EN_ONLY });
  p.request(PLAYER('P1', 'en'));
  await settle();
  const before = p.calls.length;
  p.navigate(); // away and back to v=VID; the old request carries the old player's pot
  p.replan();
  await settle();
  assert.equal(p.calls.length, before);
});

test('a track the script once switched to, picked later by hand, is the viewer\'s pick', async () => {
  const p = page({ tracks: EN_ONLY.concat([['ja', '']]) });
  p.request(PLAYER('P1', 'ja')); // the script switches to English
  await settle();
  p.request(PLAYER('P2', 'en')); // that switch lands
  await settle();
  p.store('ytds-settings', JSON.stringify({ bottom: 'ko' }));
  p.replan(); // the script switches to English translated to Korean
  await settle();
  p.request(PLAYER('P3', 'en', '&tlang=ko')); // that switch lands
  await settle();
  assert.equal(p.switches.length, 2);
  p.request(PLAYER('P4', 'en')); // the viewer picks plain English by hand
  await settle();
  assert.equal(p.switches.length, 2);
  assert.equal(p.state.plan, 'track picked by hand');
});
