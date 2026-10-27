import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const src = readFileSync(new URL('../komica-reader.user.js', import.meta.url), 'utf8');
const sandbox = { module: { exports: {} }, URL };
vm.runInNewContext(src, sandbox);
const { threadLink, insertQuote, clampWidth, omittedCount, shortTime, stepIndex, normalizeBoardUrl, knownBoard, matchBoard, filterBoards, ageVerdict, mediaKind, fileDims, postOutcome, postedProbe, assignsLocation, confirmPosted, webUrl, MIN_W, MAX_W, LIST_MIN } = sandbox.module.exports;
const plain = (x) => JSON.parse(JSON.stringify(x));

const BOARD = 'https://gaia.komica1.org/00b/index.htm';
const boards = [
  { c: '連線板', l: '綜合', u: BOARD, s: 'ok' },
  { c: '連線板', l: '動畫', u: 'https://gaia.komica1.org/00b/pixmicat2.php?c=%E5%8B%95%E7%95%AB', s: 'ok' },
  { c: '遊戲', l: 'Model', u: 'https://example.org/model/', s: 'down' },
];

test('board URLs retain category queries and normalize index pages', () => {
  assert.equal(normalizeBoardUrl('https://GAIA.KOMICA1.ORG/00b/index.htm#top'), 'https://gaia.komica1.org/00b/');
  assert.equal(normalizeBoardUrl('https://example.org/a/index.php?c=x#top'), 'https://example.org/a/?c=x');
  assert.equal(normalizeBoardUrl('https://example.org/a'), 'https://example.org/a/');
  assert.equal(normalizeBoardUrl('javascript:alert(1)'), null);
  assert.equal(normalizeBoardUrl('broken'), null);
});

test('board matching distinguishes category views from the 00b index and threads', () => {
  assert.equal(matchBoard('https://gaia.komica1.org/00b/pixmicat2.php?c=%E5%8B%95%E7%95%AB', boards), boards[1]);
  for (const href of ['https://gaia.komica1.org/00b/1.htm', 'https://gaia.komica1.org/00b/index.htm?page=2', 'https://gaia.komica1.org/00b/pixmicat.php?res=123']) {
    assert.equal(matchBoard(href, boards), boards[0]);
  }
  assert.equal(matchBoard('https://gaia.komica1.org/00b/pixmicat.php?mode=category', boards), null);
  assert.equal(matchBoard('https://other.org/00b/1.htm', boards), null);
});

test('a board that redirects is found from the address it lands on', () => {
  const moved = [...boards, { c: '連線二板', l: '職業', u: 'https://2cat.org/~career/', s: 'ok', f: 'https://2cat.org/career/' }];
  for (const href of ['https://2cat.org/career/', 'https://2cat.org/career/index.php', 'https://2cat.org/~career/']) assert.equal(matchBoard(href, moved), moved[3]);
  assert.equal(matchBoard('https://2cat.org/careers/', moved), null);
});

test("a board that moved is found from the portal's old link and links to its new address", () => {
  const moved = [...boards, { c: '18禁', l: '動畫裡', u: 'https://cat.2nyan.org/hanime/', s: 'ok', p: 'https://2cat.org/~hanime/' }];
  assert.equal(knownBoard('https://2cat.org/~hanime/', moved)?.u, 'https://cat.2nyan.org/hanime/');
  assert.equal(knownBoard('https://cat.2nyan.org/hanime/index.htm', moved), moved[3]);
  assert.equal(knownBoard('https://2cat.org/~toy/', moved), null);
});

test('board filtering matches label or category without case or surrounding spaces', () => {
  assert.deepEqual(plain(filterBoards(boards, '  動畫  ')), plain([boards[1]]));
  assert.deepEqual(plain(filterBoards(boards, '遊戲')), plain([boards[2]]));
  assert.deepEqual(plain(filterBoards(boards, 'mOdEl')), plain([boards[2]]));
  assert.equal(filterBoards(boards, '').length, boards.length);
});

test('the [回應] link of a thread opens that thread', () => {
  assert.deepEqual(plain(threadLink('pixmicat.php?res=30971699', BOARD)), { res: 30971699, post: null });
});

test('a quote into another thread opens it at the quoted post', () => {
  assert.deepEqual(plain(threadLink('pixmicat.php?res=30976547#r30977692', BOARD)), { res: 30976547, post: 30977692 });
  assert.deepEqual(plain(threadLink('https://gaia.komica1.org/00b/pixmicat.php?res=1&page_num=all#r2', BOARD)), {
    res: 1,
    post: 2,
  });
});

test('everything that is not a thread on this board is left to the browser', () => {
  for (const href of [
    '#r30977692', // same-page anchor
    'pixmicat.php?mode=category&c=%E7%B6%9C%E5%90%88',
    'pixmicat.php?res=',
    'pixmicat.php?res=0',
    'pixmicat.php?res=12abc',
    'thumb_click.php?img=1.png&res=5',
    'https://gita.komica1.org/00b/pixmicat.php?res=5', // other host
    'https://gaia.komica1.org/78/pixmicat.php?res=5', // other board
    'javascript:alert(1)',
    'http://[bad',
  ]) {
    assert.equal(threadLink(href, BOARD), null, href);
  }
});

test('a post anchor that is not a number is ignored, the thread still opens', () => {
  assert.deepEqual(plain(threadLink('pixmicat.php?res=7#top', BOARD)), { res: 7, post: null });
});

test('quoting puts >>N on its own line at the caret', () => {
  assert.deepEqual(plain(insertQuote('', 0, 0, 5)), { value: '>>5\n', caret: 4 });
  assert.deepEqual(plain(insertQuote('abc', 3, 3, 5)), { value: 'abc\n>>5\n', caret: 8 });
  assert.deepEqual(plain(insertQuote('abc\n', 4, 4, 5)), { value: 'abc\n>>5\n', caret: 8 });
});

test('quoting replaces a selection and keeps the text after it', () => {
  const r = insertQuote('hello world', 6, 11, 42);
  assert.equal(r.value, 'hello \n>>42\n');
  const mid = insertQuote('a\nb', 2, 2, 9);
  assert.equal(mid.value, 'a\n>>9\nb');
  assert.equal(mid.value.slice(0, mid.caret), 'a\n>>9\n');
});

test('drawer width stays between its bounds and leaves the board room', () => {
  assert.equal(clampWidth(100, 1600), MIN_W);
  assert.equal(clampWidth(5000, 3000), MAX_W);
  assert.equal(clampWidth(1000, 1200), 1200 - LIST_MIN);
  assert.equal(clampWidth(600, 1600), 600);
});

test('no saved width means 45% of the window', () => {
  assert.equal(clampWidth(null, 1676), Math.round(1676 * 0.45));
  assert.equal(clampWidth(NaN, 1676), Math.round(1676 * 0.45));
});

test('a narrow window never gets a drawer below its minimum', () => {
  assert.equal(clampWidth(600, 500), MIN_W);
});




test('omitted reply count survives the site replacing its tail', () => {
  assert.equal(omittedCount('有回應 25 篇被省略。要閱讀所有回應請按下回應連結。'), 25);
  assert.equal(omittedCount('有回應 25 篇被省略。[展開]'), 25);
  assert.equal(omittedCount('沒有省略回應'), 0);
});

test('reply time is short on the local day and dated otherwise', () => {
  const today = new Date(2026, 9, 26, 14);
  assert.equal(shortTime('2026/10/26(一) 13:16:28.456 ID:Nd4bZo6w', today), '13:16');
  assert.equal(shortTime('2026/10/25(日) 09:08:00.000 ID:x', today), '10/25 09:08');
  assert.equal(shortTime('2026/02/30(一) 13:16:28.456', today), null);
  assert.equal(shortTime('not a timestamp', today), null);
});

test('thread navigation clamps and handles no selection or no cards', () => {
  assert.equal(stepIndex(-1, 1, 3), 0);
  assert.equal(stepIndex(0, -1, 3), 0);
  assert.equal(stepIndex(2, 1, 3), 2);
  assert.equal(stepIndex(1, -1, 3), 0);
  assert.equal(stepIndex(-1, 1, 0), -1);
});

test('the 18禁 gate follows the portal: a four-digit year from 1900, at least 18 years back', () => {
  assert.equal(ageVerdict('1994', 2026), 'adult');
  assert.equal(ageVerdict(' 2008 ', 2026), 'adult'); // exactly 18
  assert.equal(ageVerdict('2009', 2026), 'minor');
  assert.equal(ageVerdict('2027', 2026), 'invalid'); // the future
  assert.equal(ageVerdict('1899', 2026), 'invalid');
  for (const bad of ['', '94', '19944', 'abcd', '1994.5', null]) assert.equal(ageVerdict(bad, 2026), 'invalid', String(bad));
});

test('a file name tells a video from an image', () => {
  assert.equal(mediaKind('https://gita-pix.komica1.org/src/1793056027936.mp4'), 'video');
  assert.equal(mediaKind('https://x/src/a.WEBM?x=1'), 'video');
  assert.equal(mediaKind('https://gita-pix.komica1.org/src/1793026143967.png'), 'image');
  assert.equal(mediaKind('https://x/src/mp4.jpg'), 'image');
});

test('image size comes from the file line, so the pane reserves its box before the image loads', () => {
  assert.deepEqual(plain(fileDims('1792991788404.png-(1879 KB, 1054x1536)')), { w: 1054, h: 1536 });
  assert.deepEqual(plain(fileDims('a.mp4-(5998 KB, 632x358) ▾')), { w: 632, h: 358 });
  assert.equal(fileDims('a.png-(12 KB)'), null);
  assert.equal(fileDims(''), null);
});

test('only the board itself confirms a post; a redirect is waited out; anything else is not a verdict', () => {
  assert.equal(postOutcome({ readable: true, threads: true, redirect: false, text: '' }).kind, 'ok');
  assert.equal(postOutcome({ readable: true, threads: false, redirect: true, text: '' }).kind, 'wait');
  const err = postOutcome({ readable: true, threads: false, redirect: false, text: '  在沒有附加圖檔的情況下，\n 請寫入內文 ' });
  assert.equal(err.kind, 'unknown');
  assert.ok(err.message.includes('在沒有附加圖檔的情況下， 請寫入內文'), err.message);
  assert.equal(postOutcome({ readable: false, threads: false, redirect: false, text: '' }).kind, 'unknown');
  assert.equal(postOutcome({ readable: true, threads: false, redirect: false, text: '   ' }).message, '回應頁是空的');
});

test('the reply is found again by its first line that is not a quote', () => {
  assert.equal(postedProbe('>>30978579\n幹得下去嗎？？？'), '幹得下去嗎？？？');
  assert.equal(postedProbe('>>1\n>>2\n\n  第二段  \n第三段'), '第二段');
  assert.equal(postedProbe('>>1\n>>2\n'), '');
  assert.equal(postedProbe('x'.repeat(50)).length, 30);
});

test('2cat and classic boards: their thread links, anchors and wordings are understood too', () => {
  const touhoux = 'https://2cat.org/touhoux/';
  assert.deepEqual(plain(threadLink('/touhoux/?res=3939&no=3939', touhoux)), { res: 3939, post: null });
  assert.deepEqual(plain(threadLink('?res=79556#s79556', 'https://2cat.org/career/')), { res: 79556, post: 79556 });
  assert.deepEqual(plain(threadLink('pixmicat.php?res=4921#q4922', 'https://2cat.org/hiso/')), { res: 4921, post: 4922 });
  assert.equal(threadLink('/touhou/?res=3', touhoux), null); // another board on the same host
  assert.equal(threadLink('pixmicat.php?mode=module&res=5', 'https://2cat.org/hiso/').res, 5); // a res link is a res link
  assert.equal(threadLink('report.php?res=5', 'https://2cat.org/hiso/'), null);
  assert.equal(omittedCount(' 有1541篇回應被省略；展開所有回應或圖片。'), 1541);
  assert.equal(omittedCount('有回應 1 篇被省略。要閱讀所有回應請按下回應連結。'), 1);
});

test('classic time stamps: two-digit year, no seconds', () => {
  const today = new Date(2026, 9, 27, 12);
  assert.equal(shortTime('26/10/27(二)08:04 ID:7KtlMyq2]', today), '08:04');
  assert.equal(shortTime('26/08/23(日)8:04', today), '08/23 08:04');
  assert.equal(shortTime('26/13/01(一)08:04', today), null);
});

test('2cat image lines give their size too', () => {
  assert.deepEqual(plain(fileDims('JPG - 170 KB - 960x1280')), { w: 960, h: 1280 });
  assert.deepEqual(plain(fileDims('1787443496798.jpg-(806 KB, 4032x3024)')), { w: 4032, h: 3024 });
  assert.equal(fileDims('1793029484099.jpg'), null);
});

test('a result page that only reads its address is not a redirect', () => {
  for (const sends of ["location.href = '/00b/'", 'window.location="index.htm"', "document.location.href='x'", "location.replace('x')", 'location.assign(u)', 'top.location = u']) {
    assert.equal(assignsLocation(sends), true, sends);
  }
  for (const reads of ['var u = location.href;', "if (location.href == 'x') {}", 'ga("send", location.href)', "location.hash = 'top'", 'x.location.search']) {
    assert.equal(assignsLocation(reads), false, reads);
  }
});

test('a post is confirmed only by a newer post holding what was sent', () => {
  const posts = [{ no: 100, text: '推' }, { no: 101, text: '>>100 同意' }, { no: 105, text: '新的 一則\n回覆' }];
  assert.equal(confirmPosted(posts, { after: 101, probe: '新的一則' }), true);
  assert.equal(confirmPosted(posts, { after: 101, probe: '推' }), false); // an older 推 proves nothing
  assert.equal(confirmPosted(posts, { after: 105, probe: '新的一則' }), false); // nothing newer than what was known
  assert.equal(confirmPosted(posts, { after: 0, probe: '推' }), false); // nothing known when sent: no verdict
  assert.equal(confirmPosted(posts, { after: 101, probe: '' }), false); // an image alone: someone else's post would pass
});

test('post links and images may go to the web only, as the browser parses them', () => {
  const base = 'https://gaia.komica1.org/00b/index.htm';
  for (const ok of ['https://example.org/', 'http://x.y/z', '#r123', 'pixmicat.php?res=1', '//cdn.example.org/a.png']) assert.equal(webUrl(ok, base), true, ok);
  for (const bad of ['javascript:alert(1)', 'java\tscript:alert(1)', '\x01javascript:alert(1)', ' JaVaScRiPt:alert(1)', 'data:text/html,x', 'vbscript:x', 'mailto:a@b.c', 'http://[']) {
    assert.equal(webUrl(bad, base), false, JSON.stringify(bad));
  }
});

test("another board's later pages and threads count as that board", () => {
  const more = [...boards, { c: '連線二板', l: '職業', u: 'https://2cat.org/~career/', s: 'ok', f: 'https://2cat.org/career/' }, { c: '桌布', l: '二次壁', u: 'https://2cat.org/~wallpaper/', s: 'ok', f: 'https://2cat.org/wallpaper/?repair' }, { c: '連線板', l: '2CAT', u: 'https://2cat.uk/', s: 'ok' }];
  for (const href of ['https://2cat.org/career/1.htm', 'https://2cat.org/career/?res=79194&page_num=2', 'https://2cat.org/career/pixmicat.php?page_num=3']) assert.equal(matchBoard(href, more), more[3], href);
  assert.equal(matchBoard('https://2cat.org/wallpaper/', more), more[4]);
  assert.equal(matchBoard('https://2cat.org/careers/1.htm', more), null);
  assert.equal(matchBoard('https://2cat.uk/cellphone/', more), null); // a board below another board's directory is not it
  assert.equal(matchBoard('https://example.org/model/2.htm', more), more[2]);
});
