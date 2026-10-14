import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const src = readFileSync(new URL('../yt-dual-subs.user.js', import.meta.url), 'utf8');
const sandbox = { module: { exports: {} }, URL };
vm.runInNewContext(src, sandbox);
const { plan, trackUrl, parseJson3, textAt, pairedText, place, latestAt, tidy, sanitize, defaultTop, DEFAULTS } =
  sandbox.module.exports;
const plain = (x) => JSON.parse(JSON.stringify(x));

const PLAYER =
  'https://www.youtube.com/api/timedtext?v=dQw4w9WgXcQ&ei=E&expire=1&sparams=ip%2Cv&signature=SIG&lang=en&potc=1&pot=TOKEN&fmt=json3&c=WEB';
const params = (u) => new URL(u).searchParams;
const native = (lang, extra = {}) => ({ lang, kind: '', tlang: '', ...extra });
const track = (lang, kind = '') => ({ lang, kind });
// Rick Astley as YouTube lists it: English spoken (asr en), no Chinese track
const RICK = [track('ja'), track('es-419'), track('en'), track('en', 'asr'), track('pt-BR')];
// a TED talk: English spoken, human Traditional and Simplified tracks
const TED = [track('tr'), track('zh-TW'), track('zh-CN'), track('en'), track('en', 'asr'), track('ja')];

test('foreign video showing its original: Chinese machine translation on top', () => {
  assert.deepEqual(plain(plan(RICK, native('en'), false)), {
    action: 'dual',
    top: { lang: 'en', kind: '', tlang: 'zh-Hant' },
    why: 'machine translation',
  });
});

test('a human Traditional Chinese track beats machine translation', () => {
  const p = plan(TED, native('en'), false);
  assert.equal(p.action, 'dual');
  assert.deepEqual(plain(p.top), { lang: 'zh-TW', kind: '', tlang: '' });
});

test('a human Simplified track is converted to Traditional rather than machine-translated from English', () => {
  const p = plan([track('zh-CN'), track('en'), track('en', 'asr')], native('en'), false);
  assert.deepEqual(plain(p.top), { lang: 'zh-CN', kind: '', tlang: 'zh-Hant' });
});

test('only an auto-generated original: translate that track, keep kind=asr', () => {
  const p = plan([track('en', 'asr')], native('en', { kind: 'asr' }), false);
  assert.deepEqual(plain(p.top), { lang: 'en', kind: 'asr', tlang: 'zh-Hant' });
});

test('native shows another language: switch it to the human original-language track', () => {
  assert.deepEqual(plain(plan(RICK, native('ja'), false)), { action: 'switch', to: { lang: 'en', kind: '', tlang: '' }, why: 'native → en' });
});

test('native shows YouTube auto-translate to Chinese: switch back to the original', () => {
  const p = plan(TED, native('en', { tlang: 'zh-Hant' }), false);
  assert.equal(p.action, 'switch');
  assert.deepEqual(plain(p.to), { lang: 'en', kind: '', tlang: '' });
});

test('native shows a human Chinese track on a foreign video: switch to the original', () => {
  assert.equal(plan(TED, native('zh-TW'), false).action, 'switch');
});

test('no human original-language track: switch to the auto-generated one', () => {
  const p = plan([track('ja'), track('fr', 'asr')], native('ja'), false);
  assert.deepEqual(plain(p.to), { lang: 'fr', kind: 'asr', tlang: '' });
});

test('after one switch on this visit, a hand-picked track is left alone', () => {
  assert.equal(plan(TED, native('zh-TW'), true).action, 'none');
  assert.equal(plan(RICK, native('ja'), true).action, 'none');
  // ...but a switch that landed on the original still gets its Chinese line
  assert.equal(plan(RICK, native('en'), true).action, 'dual');
});

test('Chinese videos get no second line, whatever the native track shows', () => {
  for (const [tracks, n] of [
    [[track('zh-TW'), track('zh', 'asr')], native('zh-TW')],
    [[track('zh-Hans', 'asr')], native('zh-Hans', { kind: 'asr' })],
    [[track('en'), track('zh', 'asr')], native('en')],
    [[track('yue', 'asr')], native('yue', { kind: 'asr' })],
    [[], native('zh-TW')],
  ]) {
    assert.equal(plan(tracks, n, false).action, 'none', JSON.stringify(n));
  }
});

test('without the player response, the native track counts as the original', () => {
  assert.equal(plan([], native('ja'), false).action, 'dual');
  assert.equal(plan([], native('en', { tlang: 'zh-Hant' }), false).action, 'switch');
});

test('trackUrl swaps lang/kind/tlang and keeps every token the player sent', () => {
  const asr = new URL(PLAYER);
  asr.searchParams.set('kind', 'asr');
  asr.searchParams.set('tlang', 'ja');
  const p = params(trackUrl(asr.href, { lang: 'zh-TW', kind: '', tlang: '' }));
  assert.equal(p.get('lang'), 'zh-TW');
  assert.equal(p.get('kind'), null);
  assert.equal(p.get('tlang'), null);
  assert.equal(p.get('fmt'), 'json3');
  for (const [k, v] of [['pot', 'TOKEN'], ['potc', '1'], ['signature', 'SIG'], ['ei', 'E'], ['expire', '1'], ['c', 'WEB']]) {
    assert.equal(p.get(k), v, k);
  }
  const q = params(trackUrl(PLAYER, { lang: 'en', kind: 'asr', tlang: 'zh-Hant' }));
  assert.deepEqual([q.get('lang'), q.get('kind'), q.get('tlang')], ['en', 'asr', 'zh-Hant']);
});

test('parseJson3 keeps captioned events only, trims, sorts, computes end', () => {
  const cues = parseJson3({
    events: [
      { tStartMs: 5000, dDurationMs: 1000, segs: [{ utf8: '第二句 ' }] },
      { tStartMs: 0, dDurationMs: 900000, wpWinPosId: 1 },
      { tStartMs: 1000, dDurationMs: 2000, segs: [{ utf8: 'Never ' }, { utf8: 'gonna' }] },
      { tStartMs: 2500, dDurationMs: 10, aAppend: 1, segs: [{ utf8: '\n' }] },
      { tStartMs: 3000, dDurationMs: 500, segs: [{}] },
    ],
  });
  assert.deepEqual(plain(cues), [
    { start: 1000, end: 3000, text: 'Never gonna' },
    { start: 5000, end: 6000, text: '第二句' },
  ]);
  assert.deepEqual(plain(parseJson3({})), []);
});

test('textAt boundaries: start inclusive, end exclusive, gaps empty', () => {
  const cues = [
    { start: 1000, end: 3000, text: 'A' },
    { start: 5000, end: 6000, text: 'B' },
  ];
  assert.equal(textAt(cues, 999), '');
  assert.equal(textAt(cues, 1000), 'A');
  assert.equal(textAt(cues, 2999), 'A');
  assert.equal(textAt(cues, 3000), '');
  assert.equal(textAt(cues, 4000), '');
  assert.equal(textAt(cues, 5500), 'B');
  assert.equal(textAt(cues, 6000), '');
  assert.equal(textAt([], 1000), '');
});

test('textAt shows overlapping ASR cues together and drops duplicates', () => {
  const cues = [
    { start: 0, end: 4000, text: 'we are no' },
    { start: 2000, end: 6000, text: 'strangers to love' },
    { start: 2500, end: 3000, text: 'strangers to love' },
  ];
  assert.equal(textAt(cues, 1000), 'we are no');
  assert.equal(textAt(cues, 2600), 'we are no\nstrangers to love');
  assert.equal(textAt(cues, 4500), 'strangers to love');
});

const cue = (start, end, text) => ({ start, end, text });

test('pairedText: a Chinese cue spanning two English cues shows under both', () => {
  const en = [cue(0, 2000, 'Good morning.'), cue(2000, 4000, "It's been great.")];
  const zh = [cue(0, 3500, '早安，很精彩吧？'), cue(3500, 6000, '這一切都讓我太震驚。')];
  assert.equal(pairedText(en, zh, 500), '早安，很精彩吧？');
  // by the clock this moment is the next Chinese sentence; paired, it stays with its English cue
  assert.equal(pairedText(en, zh, 3800), '早安，很精彩吧？');
});

test('pairedText: an English cue spanning two Chinese cues shows both, in order', () => {
  const en = [cue(0, 4000, 'One long English sentence, two Chinese ones.')];
  const zh = [cue(0, 1900, '第一句。'), cue(2000, 4000, '第二句。'), cue(4000, 5000, '下一段。')];
  assert.equal(pairedText(en, zh, 100), '第一句。\n第二句。');
});

test('pairedText: nothing when no English cue is on screen; identical timing equals textAt', () => {
  const en = [cue(1000, 2000, 'A'), cue(3000, 4000, 'B')];
  const zh = [cue(1000, 2000, '甲'), cue(3000, 4000, '乙')];
  assert.equal(pairedText(en, zh, 2500), '');
  for (const t of [999, 1000, 1999, 2000, 3500, 4000]) assert.equal(pairedText(en, zh, t), textAt(zh, t), String(t));
});

test('pairedText: a Chinese cue that barely touches the English one is not pulled in', () => {
  const en = [cue(1000, 3000, 'Middle.')];
  const zh = [cue(0, 1100, '前一句。'), cue(1100, 3000, '這一句。'), cue(2900, 5000, '後一句。')];
  assert.equal(pairedText(en, zh, 2000), '這一句。');
});

// player 1000x600 at (100, 50); line 400x40
const PLAYER_RECT = { left: 100, top: 50, right: 1100, bottom: 650, width: 1000, height: 600 };
const win = (left, right, top, bottom) => ({ left, right, top, bottom, textTop: top + 2 });

test('place: sits on the native text, centred on its window', () => {
  assert.deepEqual(plain(place(PLAYER_RECT, [win(400, 800, 580, 620)], 400, 40)), { left: 500, bottom: 68 });
});

test('place: with several windows on screen, follows the lowest (the dialogue line)', () => {
  const p = place(PLAYER_RECT, [win(150, 450, 80, 120), win(500, 900, 560, 600)], 400, 40);
  assert.equal(p.left, 600);
  assert.equal(p.bottom, 650 - 562);
});

test('place: never leaves the player at a side', () => {
  assert.equal(place(PLAYER_RECT, [win(100, 200, 580, 620)], 400, 40).left, 200);
  assert.equal(place(PLAYER_RECT, [win(1000, 1100, 580, 620)], 400, 40).left, 800);
});

test('place: a window at the top of the frame does not push the line off the top', () => {
  assert.equal(place(PLAYER_RECT, [win(400, 800, 52, 90)], 400, 40).bottom, 560);
});

test('place: no window on screen means no new position', () => {
  assert.equal(place(PLAYER_RECT, [], 400, 40), null);
});

// Auto-generated tracks roll: each event stays on screen while the next one starts (83 of 100
// cues overlapped the next in the Rick Astley asr translation, 2026-10-15). Joining the overlap
// made the line cycle A / A+B / B.
const ROLLING = [
  { start: 19000, end: 26000, text: '我們對愛情並不陌生' },
  { start: 22000, end: 30000, text: '。你我都清楚規則。' },
  { start: 26000, end: 33000, text: '我的想法讓我感到責任重大' },
];

test('latestAt: of the rolling cues on screen, only the newest', () => {
  assert.equal(latestAt(ROLLING, 20000), '我們對愛情並不陌生');
  assert.equal(latestAt(ROLLING, 23000), '。你我都清楚規則。');
  assert.equal(latestAt(ROLLING, 27000), '我的想法讓我感到責任重大');
  assert.equal(latestAt(ROLLING, 18000), '');
  assert.equal(latestAt(ROLLING, 33000), '');
});

test('tidy: drops the punctuation a translated fragment starts with, keeps the rest', () => {
  assert.equal(tidy('。你我都清楚規則。'), '你我都清楚規則。');
  assert.equal(tidy(' ，、！？；：. , 好'), '好');
  assert.equal(tidy('我想，你懂'), '我想，你懂');
  assert.equal(tidy('♪ 你懂規則 ♪'), '♪ 你懂規則 ♪');
  assert.equal(tidy(''), '');
});

test('pairedText with a rolling native track pairs with the newest native cue only', () => {
  const en = [cue(0, 6000, 'first line rolling'), cue(3000, 9000, 'second line rolling')];
  const zh = [cue(0, 3000, '第一句'), cue(3000, 9000, '第二句')];
  // the union of both native cues would pick both Chinese cues; the newest native cue picks one
  assert.equal(pairedText(en, zh, 4000, true), '第二句');
  assert.equal(pairedText(en, zh, 4000), '第一句\n第二句');
});

test('place: a roll-up window is anchored as if it held two lines, so 1↔2 lines does not move the line', () => {
  const one = { left: 400, right: 800, bottom: 620, textTop: 580, textBottom: 612, lineHeight: 32, rollup: true };
  const two = { ...one, textTop: 548 };
  assert.equal(place(PLAYER_RECT, [one], 400, 40).bottom, place(PLAYER_RECT, [two], 400, 40).bottom);
  assert.equal(place(PLAYER_RECT, [one], 400, 40).bottom, 650 - (612 - 64));
  // a third line (the track-switch hint) still pushes it up rather than being covered
  assert.equal(place(PLAYER_RECT, [{ ...one, textTop: 516 }], 400, 40).bottom, 650 - 516);
});

const S = (over = {}) => ({ ...plain(DEFAULTS), top: 'zh-Hant', ...over });

test('sanitize: anything that is not a well-formed setting falls back to its default', () => {
  const d = plain(sanitize(null));
  for (const junk of [undefined, 'x', 42, [], { top: '<img src=x>', bottom: 'zh-Hant; drop', bg: 'red', gap: '5' }]) {
    assert.deepEqual(plain(sanitize(junk)), d, JSON.stringify(junk));
  }
  const s = sanitize({ enabled: 'yes', bgOpacity: NaN, gap: Infinity, topSize: -3, bottomSize: 99, extra: 1 });
  assert.equal(s.enabled, d.enabled);
  assert.equal(s.bgOpacity, d.bgOpacity);
  assert.equal(s.gap, d.gap);
  assert.equal(s.topSize, 2);
  assert.equal(s.bottomSize, 8);
  assert.equal('extra' in s, false);
  assert.equal(Object.getPrototypeOf(sanitize(JSON.parse('{"__proto__": {"polluted": 1}}'))).polluted, undefined);
});

test('sanitize: well-formed settings pass through, colours lower-cased', () => {
  const ok = { enabled: false, top: 'ja', bottom: 'en', bg: '#1A2B3C', bgOpacity: 0.4, gap: 6, topSize: 5, bottomSize: 3 };
  assert.deepEqual(plain(sanitize(ok)), { ...ok, bg: '#1a2b3c' });
  assert.equal(sanitize({ bottom: 'auto' }).bottom, 'auto');
});

test('defaultTop follows the browser language, Chinese by script', () => {
  assert.equal(defaultTop('zh-TW'), 'zh-Hant');
  assert.equal(defaultTop('zh-HK'), 'zh-Hant');
  assert.equal(defaultTop('zh-CN'), 'zh-Hans');
  assert.equal(defaultTop('zh'), 'zh-Hans');
  assert.equal(defaultTop('ja-JP'), 'ja');
  assert.equal(defaultTop('en-US'), 'en');
  assert.equal(defaultTop(undefined), 'en');
});

test('top language is a setting: Japanese on top of an English video', () => {
  const p = plan([track('en'), track('en', 'asr')], native('en'), false, S({ top: 'ja' }));
  assert.equal(p.action, 'dual');
  assert.deepEqual(plain(p.top), { lang: 'en', kind: '', tlang: 'ja' });
  // a human track in the top language is still preferred (Rick Astley has one in Japanese)
  assert.deepEqual(plain(plan(RICK, native('en'), false, S({ top: 'ja' })).top), { lang: 'ja', kind: '', tlang: '' });
});

test('a video already in the top language keeps its ordinary single line', () => {
  assert.equal(plan(RICK, native('en'), false, S({ top: 'en' })).action, 'none');
  assert.equal(plan([track('ja'), track('ja', 'asr')], native('ja'), false, S({ top: 'ja' })).action, 'none');
});

test('bottom language is a setting: a human track if there is one, else YouTube translates the original', () => {
  // TED has a human Japanese track
  const human = plan(TED, native('en'), false, S({ bottom: 'ja' }));
  assert.deepEqual(plain(human), { action: 'switch', to: { lang: 'ja', kind: '', tlang: '' }, why: 'native → ja' });
  // Rick has none in Korean: the original, translated by the player
  const tr = plan(RICK, native('en'), false, S({ bottom: 'ko' }));
  assert.deepEqual(plain(tr.to), { lang: 'en', kind: '', tlang: 'ko' });
  // once the native shows English translated to Korean, the top line is translated from the same source
  const dual = plan(RICK, native('en', { tlang: 'ko' }), false, S({ bottom: 'ko' }));
  assert.equal(dual.action, 'dual');
  assert.deepEqual(plain(dual.top), { lang: 'en', kind: '', tlang: 'zh-Hant' });
});

test('bottom and top in the same language, or switched off: single line, no switching', () => {
  assert.equal(plan(RICK, native('ja'), false, S({ bottom: 'zh-Hans' })).action, 'none');
  assert.equal(plan(RICK, native('ja'), false, S({ enabled: false })).action, 'none');
});

test('place: the gap setting opens space between the lines', () => {
  const w = [win(400, 800, 580, 620)];
  assert.equal(place(PLAYER_RECT, w, 400, 40, 10).bottom, place(PLAYER_RECT, w, 400, 40).bottom + 10);
});

test('a regional track asked for by its full code is the one used, not its sibling', () => {
  const tracks = [track('en-US'), track('en-GB'), track('en', 'asr')];
  assert.deepEqual(plain(plan(tracks, native('en-US'), false, S({ bottom: 'en-GB' })).to), { lang: 'en-GB', kind: '', tlang: '' });
  const ja = [track('ja-JP'), track('ja'), track('en'), track('en', 'asr')];
  assert.deepEqual(plain(plan(ja, native('en'), false, S({ top: 'ja' })).top), { lang: 'ja', kind: '', tlang: '' });
});

