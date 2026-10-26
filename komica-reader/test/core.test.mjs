import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const src = readFileSync(new URL('../komica-reader.user.js', import.meta.url), 'utf8');
const sandbox = { module: { exports: {} }, URL };
vm.runInNewContext(src, sandbox);
const { threadLink, insertQuote, clampWidth, opaqueColor, MIN_W, MAX_W, LIST_MIN } = sandbox.module.exports;
const plain = (x) => JSON.parse(JSON.stringify(x));

const BOARD = 'https://gaia.komica1.org/00b/index.htm';

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

test('the drawer takes the first solid background, skipping transparent ones', () => {
  assert.equal(opaqueColor(['rgba(0, 0, 0, 0)', 'rgb(255, 255, 238)'], '#fff'), 'rgb(255, 255, 238)');
  assert.equal(opaqueColor(['rgb(34 34 34 / 100%)'], '#fff'), 'rgb(34, 34, 34)');
  assert.equal(opaqueColor(['transparent', 'rgba(10, 10, 10, 0.2)'], '#fff'), '#fff');
});
