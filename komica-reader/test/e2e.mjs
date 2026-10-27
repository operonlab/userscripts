// End-to-end check against the live board, in headless Chromium.
//
// The script is added as an init script (main world, every frame, before the site's own scripts),
// which is where Tampermonkey puts a `@grant none` document-start script; frames outside the
// @match are skipped by the wrapper, as the manager would skip them.
//
// Nothing is ever submitted: posting to a public board is not a test step. The checks stop at
// "the form floats, opens, holds the quote, and still carries the Turnstile widget".
//
// Usage: node test/e2e.mjs [out-dir]     (PLAYWRIGHT_MODULE=<path to the playwright package> if it
//        is not resolvable from here, KR_CHROMIUM=<browser executable> if its browser is not
//        downloaded; screenshots and result.json go to out-dir when given)
// Exit:  0 pass · 1 a check failed · 2 unverifiable (board unreachable, no threads to test on)

import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

import vm from 'node:vm';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const BOARD = 'https://gaia.komica1.org/00b/index.htm';
const MATCH = 'https://gaia.komica1.org/00b/';
const out = process.argv[2] ? path.resolve(process.argv[2]) : null;
if (out) mkdirSync(out, { recursive: true });

const src = readFileSync(new URL('../komica-reader.user.js', import.meta.url), 'utf8');
const helpers = { module: { exports: {} }, URL };
vm.runInNewContext(src, helpers);
const { omittedCount } = helpers.module.exports;
const wrapped = `if (location.href.startsWith(${JSON.stringify(MATCH)})) {\n${src}\n}`;

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok: !!ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`);
};

// KR_CHROMIUM: a Chromium/Chrome executable, when the playwright package's own build is not downloaded
const browser = await chromium.launch({ headless: true, executablePath: process.env.KR_CHROMIUM || undefined });
let code = 0;
try {
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 }, locale: 'zh-TW' });
  await context.addInitScript(wrapped);
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e.message || e)));

  const resp = await page.goto(BOARD, { waitUntil: 'domcontentloaded', timeout: 45000 }).catch((e) => e);
  if (!resp || resp instanceof Error || !resp.ok()) {
    console.log(`UNVERIFIABLE  board did not load: ${resp instanceof Error ? resp.message : resp?.status()}`);
    process.exit(2);
  }
  const ready = await page.waitForSelector('#postform_main.kr-composer', { timeout: 20000 }).catch(() => null);
  if (!ready) {
    check('script initialised on the board', false, 'no #postform_main.kr-composer');
    throw new Error('stop');
  }
  // the site binds its own handlers on document ready; let them finish
  await page.waitForTimeout(1500);

  // --- floating composer on the board
  await page.evaluate(() => window.scrollTo(0, 4000));
  await page.waitForTimeout(300);
  const fab = await page.evaluate(() => {
    const f = document.getElementById('postform_main');
    const r = f.getBoundingClientRect();
    return {
      position: getComputedStyle(f).position,
      state: f.dataset.krState,
      inView: r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth,
      label: f.querySelector('.kr-composer-toggle')?.textContent,
      scrollY: Math.round(scrollY),
      width: Math.round(r.width),
    };
  });
  check('board: form floats in view after scrolling down', fab.position === 'fixed' && fab.inView && fab.scrollY > 1000, JSON.stringify(fab));
  check('board: folded it is a small pill, not a bar across the page', fab.width < 240, `${fab.width}px`);
  check('board: form starts collapsed as 發新串', fab.state === 'collapsed' && /發新串/.test(fab.label || ''), fab.label);
  if (out) await page.screenshot({ path: path.join(out, '1-board-scrolled.png') });

  await page.click('#postform_main .kr-composer-toggle');
  const opened = await page.evaluate(() => {
    const f = document.getElementById('postform_main');
    const ta = document.getElementById('fcom');
    const r = ta.getBoundingClientRect();
    return {
      state: f.dataset.krState,
      fcomVisible: r.height > 60 && r.top >= 0 && r.bottom <= innerHeight,
      focused: document.activeElement === ta,
      turnstile: !!f.querySelector('.cf-turnstile'),
    };
  });
  check('board: opening it shows the text box, focused, Turnstile still inside the form', opened.state === 'expanded' && opened.fcomVisible && opened.focused && opened.turnstile, JSON.stringify(opened));
  if (out) await page.screenshot({ path: path.join(out, '2-board-compose-open.png') });
  await page.keyboard.press('Escape');
  check('board: Esc folds it again', (await page.evaluate(() => document.getElementById('postform_main').dataset.krState)) === 'collapsed');

  // --- board master list and docked detail
  const list = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('#threads .thread')];
    return cards.map((card) => ({
      res: Number(card.dataset.no),
      replies: card.querySelectorAll('.post.reply').length,
      hidden: [...card.querySelectorAll('.post.reply')].every((reply) => getComputedStyle(reply).display === 'none'),
      peek: card.classList.contains('kr-peek'),
      meta: card.querySelectorAll('.kr-meta').length,
      label: card.querySelector('.kr-meta')?.textContent || '',
      omitted: card.querySelector('.warn_txt2')?.textContent || '',
    }));
  });
  check('board: replies start collapsed in every card', list.length > 0 && list.every((card) => !card.peek && card.hidden), `${list.length} cards`);
  check('board: every card has one accurate reply count', list.length > 0 && list.every((card) => card.meta === 1 &&
    (card.replies + omittedCount(card.omitted) ? card.label.includes(`💬 ${card.replies + omittedCount(card.omitted)} 則回應`) : card.label.includes('還沒有回應'))));
  const initial = await page.evaluate(() => ({
    md: document.documentElement.classList.contains('kr-md'),
    docked: document.documentElement.classList.contains('kr-docked'),
    visible: getComputedStyle(document.querySelector('.kr-drawer')).visibility,
    empty: document.querySelector('.kr-drawer-empty')?.textContent,
  }));
  check('detail: docked and empty before selection', initial.md && initial.docked && initial.visible === 'visible' && initial.empty.includes('點左邊任一串'), JSON.stringify(initial));
  const target = list.find((card) => card.replies)?.res;
  if (!target) {
    console.log('UNVERIFIABLE  no thread on page 1 has replies to inspect');
    code = 2;
    throw new Error('stop');
  }
  const urlBefore = page.url();
  // x past the floated 88px thumbnail, so the click lands on the text, not the image
  await page.locator(`#threads .thread[data-no="${target}"] .threadpost .quote`).click({ position: { x: 130, y: 5 } });
  const frameEl = await page.waitForSelector('iframe[name="kr-drawer"]');
  let frame = await frameEl.contentFrame();
  await frame.waitForURL(new RegExp(`res=${target}`), { timeout: 30000 });
  await frame.waitForSelector('#postform_main.kr-composer.kr-reply', { timeout: 20000 });
  await page.waitForTimeout(1200);
  const drawer = await page.evaluate(() => {
    const d = document.querySelector('.kr-drawer');
    const r = d.getBoundingClientRect();
    return {
      open: document.documentElement.classList.contains('kr-drawer-open'),
      width: Math.round(r.width),
      right: Math.round(r.right),
      bodyMargin: getComputedStyle(document.body).marginRight,
      title: d.querySelector('.kr-drawer-title').textContent,
      newtab: d.querySelector('.kr-drawer-newtab').getAttribute('href'),
      active: document.querySelector('#threads .thread.kr-selected')?.getAttribute('data-no'),
    };
  });
  check('drawer: opens on the right, board stays on the left', drawer.open && drawer.right === 1600 && drawer.width >= 380 && drawer.bodyMargin === `${drawer.width}px`, JSON.stringify(drawer));
  check('drawer: titled with the thread, marks it in the list', drawer.title.includes(`No.${target}`) && drawer.newtab === `pixmicat.php?res=${target}` && drawer.active === String(target), drawer.title);
  check('drawer: board page did not navigate', page.url() === urlBefore, page.url());
  check('board: OP quote text selects and loads its thread', drawer.active === String(target) && frame.url().includes(`res=${target}`));
  await page.locator(`#threads .thread[data-no="${target}"] .kr-meta button`).click();
  const peek = await page.evaluate((res) => {
    const card = document.querySelector(`#threads .thread[data-no="${res}"]`);
    return card.classList.contains('kr-peek') && [...card.querySelectorAll('.post.reply')].every((reply) => getComputedStyle(reply).display !== 'none');
  }, target);
  check('board: peek reveals only that card’s latest replies', peek);
  await page.locator(`#threads .thread[data-no="${target}"] .kr-meta button`).click();
  const inside = await frame.evaluate(() => ({
    embed: document.documentElement.classList.contains('kr-embed'),
    headerHidden: getComputedStyle(document.getElementById('header')).display === 'none',
    resto: document.querySelector('#postform_main input[name="resto"]')?.value,
    composerFixed: getComputedStyle(document.getElementById('postform_main')).position,
    backlinkHidden: (() => {
      const b = document.querySelector('#postform_main a[href^="index.htm"]');
      return !b || b.getClientRects().length === 0;
    })(),
    turnstile: !!document.querySelector('#postform_main .cf-turnstile'),
    posts: document.querySelectorAll('#threads .post').length,
  }));
  check('drawer: thread page inside, header gone, its own reply form docked with resto and Turnstile', inside.embed && inside.headerHidden && inside.resto === String(target) && inside.composerFixed === 'fixed' && inside.backlinkHidden && inside.turnstile && inside.posts > 1, JSON.stringify(inside));

  // --- No. inside the drawer quotes into the drawer's form
  const replyNo = await frame.evaluate(() => {
    const posts = [...document.querySelectorAll('#threads .post.reply')];
    return posts.length ? Number(posts[Math.min(2, posts.length - 1)].dataset.no) : null;
  });
  await frame.click(`#r${replyNo} .post-head .qlink`);
  await page.waitForTimeout(300);
  const quoted = await frame.evaluate(() => ({
    value: document.getElementById('fcom').value,
    state: document.getElementById('postform_main').dataset.krState,
    quickreply: (() => {
      const q = document.getElementById('quickreply');
      return q ? getComputedStyle(q).display : 'absent';
    })(),
  }));
  check('drawer: clicking No. quotes it into the docked form and opens it', quoted.value.includes(`>>${replyNo}\n`) && quoted.state === 'expanded', JSON.stringify(quoted));
  check("drawer: the site's quick-reply box does not pop up as well", quoted.quickreply === 'none' || quoted.quickreply === 'absent', quoted.quickreply);
  if (out) await page.screenshot({ path: path.join(out, '3-drawer-quote.png') });

  await frame.press('#fcom', 'Escape');
  check('drawer: Esc in the text box folds the form, drawer stays', (await frame.evaluate(() => document.getElementById('postform_main').dataset.krState)) === 'collapsed' && (await page.evaluate(() => document.documentElement.classList.contains('kr-drawer-open'))));
  // leave the thread inside the drawer, then ask for the same thread again: it must load again
  await frame.goto(BOARD, { waitUntil: 'domcontentloaded', timeout: 45000 });
  const left = await page
    .waitForFunction((t) => !document.querySelector('.kr-drawer-title').textContent.includes(`No.${t}`), target, { timeout: 20000 })
    .then(() => true, () => false);
  // reopen through the OP thumbnail when there is one: in the list it opens the thread instead of expanding the image
  // the <a class="file-thumb"> has a 0×0 inline box; what a reader hits is its <img>
  const thumbSel = `#threads .thread[data-no="${target}"] .threadpost .file-thumb img`;
  const viaThumb = (await page.locator(thumbSel).count()) > 0;
  await page.locator(viaThumb ? thumbSel : `#threads .thread[data-no="${target}"] .threadpost .quote`).first().click({ position: { x: viaThumb ? 20 : 130, y: viaThumb ? 20 : 5 } });
  const back = await frame.waitForURL(new RegExp(`res=${target}`), { timeout: 30000 }).then(() => true, () => false);
  const expandedInList = await page.evaluate((t) => !!document.querySelector(`#threads .thread[data-no="${t}"] .threadpost .-expanded`), target);
  check('drawer: after browsing off the thread inside it, opening that thread again reloads it', left && back, JSON.stringify({ left, back, url: frame.url() }));
  if (viaThumb) check('board: an OP thumbnail opens the thread rather than expanding the image in the row', back && !expandedInList, JSON.stringify({ back, expandedInList }));
  await frame.waitForSelector('#postform_main.kr-composer.kr-reply', { timeout: 20000 }).catch(() => null);

  await frame.press('body', 'Escape');
  await page.waitForTimeout(200);
  check('drawer: Esc clears selection and restores the empty dock', await page.evaluate(() => !document.documentElement.classList.contains('kr-drawer-open') && document.documentElement.classList.contains('kr-docked') && !document.querySelector('.kr-selected')));

  // --- No. on the board opens that thread in the drawer with the quote ready
  const boardReply = await page.evaluate(() => {
    const p = document.querySelector('#threads .thread .post.reply');
    return p ? { no: Number(p.dataset.no), op: Number(p.closest('.thread').dataset.no) } : null;
  });
  if (boardReply) {
    await page.locator(`#threads .thread[data-no="${boardReply.op}"] .kr-meta button`).click();
    await page.click(`#r${boardReply.no} .post-head .qlink`);
    frame = await (await page.waitForSelector('iframe[name="kr-drawer"]')).contentFrame();
    await frame.waitForURL(new RegExp(`res=${boardReply.op}`), { timeout: 30000 });
    await frame.waitForFunction((no) => document.getElementById('fcom')?.value.includes(`>>${no}`), boardReply.no, { timeout: 20000 }).catch(() => null);
    const v = await frame.evaluate(() => document.getElementById('fcom')?.value || '');
    const qr = await page.evaluate(() => {
      const q = document.getElementById('quickreply');
      return q ? getComputedStyle(q).display : 'absent';
    });
    check('board: clicking a reply No. opens its thread beside with the quote in the form', v.includes(`>>${boardReply.no}\n`), JSON.stringify({ ...boardReply, v }));
    check("board: the site's quick-reply box stays shut", qr === 'none' || qr === 'absent', qr);
    if (out) await page.screenshot({ path: path.join(out, '4-board-no-to-drawer.png') });
  } else {
    check('board: a reply to click No. on', false, 'no replies on page 1');
  }

  // --- [回應] opens the drawer too
  await page.evaluate(() => document.querySelector('.kr-drawer-close').click());
  const rlink = await page.evaluate(() => document.querySelector('#threads .rlink a')?.getAttribute('href'));
  if (rlink) {
    const res = rlink.match(/res=(\d+)/)[1];
    // the list hides [回應] (the whole card opens the thread); a synthetic click still exercises the link interception
    await page.evaluate((h) => document.querySelector(`#threads .rlink a[href="${h}"]`).click(), rlink);
    frame = await (await page.waitForSelector('iframe[name="kr-drawer"]')).contentFrame();
    const ok = await frame.waitForURL(new RegExp(`res=${res}`), { timeout: 30000 }).then(() => true, () => false);
    check('board: [回應] opens the thread in the drawer instead of leaving the board', ok && page.url() === urlBefore, `res=${res}`);
  }

  await page.locator('.kr-drawer-close').click();
  await page.keyboard.press('j');
  const keyboardRes = await page.evaluate(() => document.querySelector('#threads .thread.kr-selected')?.dataset.no);
  // the pane only starts loading 250 ms after the last j; the frame URL changes when that navigation commits
  const keyboardLoaded = !!keyboardRes && (await frame.waitForURL(new RegExp(`res=${keyboardRes}`), { timeout: 30000 }).then(() => true, () => false));
  check('board: j selects the next card and loads it after debounce', keyboardLoaded, `res=${keyboardRes} frame=${frame.url()}`);
  await page.locator('.kr-drawer-close').click();
  check('detail: × clears selection but leaves dock visible', await page.evaluate(() => !document.querySelector('.kr-selected') && document.documentElement.classList.contains('kr-docked') && getComputedStyle(document.querySelector('.kr-drawer')).visibility === 'visible'));

  await page.setViewportSize({ width: 800, height: 900 });
  // leaving the docked layout, the pane slides out over its .18 s transition
  await page.waitForTimeout(400);
  const mobileBefore = await page.evaluate(() => ({
    docked: document.documentElement.classList.contains('kr-docked'),
    visibility: getComputedStyle(document.querySelector('.kr-drawer')).visibility,
  }));
  await page.locator(`#threads .thread[data-no="${target}"] .threadpost .quote`).click({ position: { x: 3, y: 3 } });
  await page.waitForTimeout(300);
  const mobileOpen = await page.evaluate(() => {
    const r = document.querySelector('.kr-drawer').getBoundingClientRect();
    return { open: document.documentElement.classList.contains('kr-drawer-open'), width: Math.round(r.width), left: Math.round(r.left), innerWidth };
  });
  await page.locator('.kr-drawer-back').click();
  const mobileClosed = !(await page.evaluate(() => document.documentElement.classList.contains('kr-drawer-open')));
  check(
    'mobile: card opens full-width overlay and ‹ 列表 closes it',
    !mobileBefore.docked && mobileBefore.visibility === 'hidden' && mobileOpen.open && mobileOpen.left === 0 && mobileOpen.width >= mobileOpen.innerWidth - 20 && mobileClosed,
    JSON.stringify({ mobileBefore, mobileOpen, mobileClosed }),
  );
  if (out) {
    await page.locator(`#threads .thread[data-no="${target}"] .threadpost .quote`).click({ position: { x: 3, y: 3 } });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(out, '6-mobile-detail.png') });
    await page.locator('.kr-drawer-back').click();
    await page.screenshot({ path: path.join(out, '5-mobile-list.png') });
  }

  const ours = pageErrors.filter((m) => /kr[A-Z_-]|komica-reader|__krState/.test(m));
  check('no page errors from this script', ours.length === 0, ours.join(' | ') || `${pageErrors.length} from the site itself`);
} catch (e) {
  if (e.message !== 'stop') {
    check('harness ran to the end', false, e.message);
  }
} finally {
  await browser.close();
}

if (out) writeFileSync(path.join(out, 'result.json'), JSON.stringify({ when: new Date().toISOString(), results }, null, 2));
if (code === 2 && results.every((r) => r.ok)) process.exit(2);
process.exit(results.length && results.every((r) => r.ok) ? 0 : 1);
