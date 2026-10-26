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

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const BOARD = 'https://gaia.komica1.org/00b/index.htm';
const MATCH = 'https://gaia.komica1.org/00b/';
const out = process.argv[2] ? path.resolve(process.argv[2]) : null;
if (out) mkdirSync(out, { recursive: true });

const src = readFileSync(new URL('../komica-reader.user.js', import.meta.url), 'utf8');
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

  // --- drawer from "see all replies"
  const target = await page.evaluate(() => {
    const btn = document.querySelector('.kr-side-open');
    return btn ? Number(btn.dataset.res) : null;
  });
  if (!target) {
    console.log('UNVERIFIABLE  no thread on page 1 has hidden replies; nothing to open in the drawer');
    code = 2;
    throw new Error('stop');
  }
  const urlBefore = page.url();
  await page.click(`.kr-side-open[data-res="${target}"]`);
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
      active: document.querySelector('#threads .thread.kr-active')?.getAttribute('data-no'),
    };
  });
  check('drawer: opens on the right, board stays on the left', drawer.open && drawer.right === 1600 && drawer.width >= 380 && drawer.bodyMargin === `${drawer.width}px`, JSON.stringify(drawer));
  check('drawer: titled with the thread, marks it in the list', drawer.title.includes(`No.${target}`) && drawer.newtab === `pixmicat.php?res=${target}` && drawer.active === String(target), drawer.title);
  check('drawer: board page did not navigate', page.url() === urlBefore, page.url());
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
  await frame.press('body', 'Escape');
  await page.waitForTimeout(200);
  check('drawer: Esc again closes the drawer', !(await page.evaluate(() => document.documentElement.classList.contains('kr-drawer-open'))));

  // --- No. on the board opens that thread in the drawer with the quote ready
  const boardReply = await page.evaluate(() => {
    const p = document.querySelector('#threads .thread .post.reply');
    return p ? { no: Number(p.dataset.no), op: Number(p.closest('.thread').dataset.no) } : null;
  });
  if (boardReply) {
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
    await page.click(`#threads .rlink a[href="${rlink}"]`);
    frame = await (await page.waitForSelector('iframe[name="kr-drawer"]')).contentFrame();
    const ok = await frame.waitForURL(new RegExp(`res=${res}`), { timeout: 30000 }).then(() => true, () => false);
    check('board: [回應] opens the thread in the drawer instead of leaving the board', ok && page.url() === urlBefore, `res=${res}`);
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
