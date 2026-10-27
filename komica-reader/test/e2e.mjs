// End-to-end check against the live board, in headless Chromium.
//
// The script is added as an init script (main world, every frame, before the site's own scripts),
// which tests the UI without Tampermonkey; frames outside the @match are skipped by the wrapper, as
// the manager would skip them. GM storage is absent here, so the script's localStorage fallback runs.
//
// Nothing is ever submitted: posting to a public board is not a test step. The checks stop at
// "the form floats, opens, holds the quote, carries resto and the Turnstile widget, and posts into the sink".
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
const MATCHES = ['https://gaia.komica1.org/00b/', 'https://komica1.org/'];
const out = process.argv[2] ? path.resolve(process.argv[2]) : null;
if (out) mkdirSync(out, { recursive: true });

const src = readFileSync(new URL('../komica-reader.user.js', import.meta.url), 'utf8');
const helpers = { module: { exports: {} }, URL };
vm.runInNewContext(src, helpers);
const { omittedCount } = helpers.module.exports;
const wrapped = `if (${JSON.stringify(MATCHES)}.some((prefix) => location.href.startsWith(prefix))) {\n${src}\n}`;

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok: !!ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`);
};
const shot = async (page, name) => out && page.screenshot({ path: path.join(out, name) });

// KR_CHROMIUM: a Chromium/Chrome executable, when the playwright package's own build is not downloaded
const browser = await chromium.launch({ headless: true, executablePath: process.env.KR_CHROMIUM || undefined });
let code = 0;
try {
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 }, locale: 'zh-TW', colorScheme: 'light' });
  await context.addInitScript(wrapped);
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e.message || e)));

  const resp = await page.goto(BOARD, { waitUntil: 'domcontentloaded', timeout: 45000 }).catch((e) => e);
  if (!resp || resp instanceof Error || !resp.ok()) {
    console.log(`UNVERIFIABLE  board did not load: ${resp instanceof Error ? resp.message : resp?.status()}`);
    process.exit(2);
  }
  if (!(await page.waitForSelector('.kr-toolbar', { timeout: 20000 }).catch(() => null))) {
    check('script initialised on the board', false, 'no .kr-toolbar');
    throw new Error('stop');
  }
  // the site binds its own handlers on document ready and inserts its scroll buttons later
  await page.waitForLoadState('load').catch(() => {});
  await page.waitForTimeout(1800);

  // --- toolbar replaces the site's header
  const bar = await page.evaluate(() => ({
    title: document.querySelector('.kr-toolbar-title')?.textContent,
    headerHidden: getComputedStyle(document.getElementById('header')).display === 'none',
    themeInMenu: !!document.querySelector('.kr-menu #theme-selector'),
    online: !!document.querySelector('.kr-toolbar #online-counter'),
    menuLinks: document.querySelectorAll('.kr-menu a').length,
  }));
  check('toolbar: board title on top, the site header folded into ⋯', bar.title === '綜合避難所' && bar.headerHidden && bar.themeInMenu && bar.online && bar.menuLinks >= 5, JSON.stringify(bar));
  await page.locator('.kr-toolbar .kr-btn[aria-haspopup="menu"]').click();
  const menuOpen = await page.evaluate(() => !document.querySelector('.kr-menu').hidden);
  // somewhere inert: a click on a row would open a thread
  await page.locator('.kr-toolbar-title').click();
  check('toolbar: ⋯ opens the menu and a click elsewhere shuts it', menuOpen && (await page.evaluate(() => document.querySelector('.kr-menu').hidden)));

  // --- floating form, 發新串 mode
  await page.evaluate(() => window.scrollTo(0, 4000));
  await page.waitForTimeout(300);
  const fab = await page.evaluate(() => {
    const f = document.getElementById('postform_main');
    const r = f.getBoundingClientRect();
    const resto = f.querySelector('input[name="resto"]');
    return {
      position: getComputedStyle(f).position,
      state: f.dataset.krState,
      inView: r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth,
      label: f.querySelector('.kr-composer-toggle')?.textContent,
      width: Math.round(r.width),
      scrollY: Math.round(scrollY),
      restoDisabled: !!resto?.disabled,
      target: f.target,
    };
  });
  check('board: form floats in view after scrolling, as a small 發新串 pill', fab.position === 'fixed' && fab.inView && fab.scrollY > 1000 && fab.width < 240 && fab.state === 'collapsed' && /發新串/.test(fab.label || ''), JSON.stringify(fab));
  check('board: 發新串 posts without resto, into the hidden result frame', fab.restoDisabled && fab.target === 'kr-sink' && (await page.locator('iframe[name="kr-sink"]').count()) === 1, JSON.stringify(fab));
  await page.locator('.kr-toolbar .kr-btn.kr-primary').click();
  const opened = await page.evaluate(() => {
    const f = document.getElementById('postform_main');
    const ta = document.getElementById('fcom');
    const r = ta.getBoundingClientRect();
    return { state: f.dataset.krState, fcomVisible: r.height > 60 && r.top >= 0 && r.bottom <= innerHeight, focused: document.activeElement === ta, turnstile: !!f.querySelector('.cf-turnstile') };
  });
  check('board: ✎ 發新串 opens the form, text box focused, Turnstile inside', opened.state === 'expanded' && opened.fcomVisible && opened.focused && opened.turnstile, JSON.stringify(opened));
  await shot(page, '2-board-compose-open.png');
  await page.keyboard.press('Escape');
  check('board: Esc folds it again', (await page.evaluate(() => document.getElementById('postform_main').dataset.krState)) === 'collapsed');
  await page.evaluate(() => window.scrollTo(0, 0));

  // --- master list
  const list = await page.evaluate(() =>
    [...document.querySelectorAll('#threads .thread')].map((card) => ({
      res: Number(card.dataset.no),
      replies: card.querySelectorAll('.post.reply').length,
      hidden: [...card.querySelectorAll('.post.reply')].every((r) => getComputedStyle(r).display === 'none'),
      label: card.querySelector('.kr-meta-count')?.textContent || '',
      meta: card.querySelectorAll('.kr-meta').length,
      omitted: card.querySelector('.warn_txt2')?.textContent || '',
      image: !!card.querySelector('.threadpost .md5-image'),
      quotes: card.querySelectorAll('.post.reply .quote a[href*="#r"]').length,
      untitledShown: [...card.querySelectorAll('.threadpost .title')].some((t) => t.textContent.trim() === '無題' && getComputedStyle(t).display !== 'none'),
      when: !!card.querySelector('.kr-when'),
    })),
  );
  check('list: replies start collapsed in every row', list.length > 0 && list.every((c) => c.hidden), `${list.length} rows`);
  check('list: one accurate reply count per row', list.every((c) => c.meta === 1 &&
    (c.replies + omittedCount(c.omitted) ? c.label.includes(`💬 ${c.replies + omittedCount(c.omitted)} 則回應`) : c.label.includes('還沒有回應'))));
  check('list: 無題 is not shown as a title; each row has its time in the corner', list.every((c) => !c.untitledShown && c.when));
  await shot(page, '1-board.png');

  const layout = () => page.evaluate(() => ({
    pane: getComputedStyle(document.querySelector('.kr-pane')).display,
    bodyRight: getComputedStyle(document.body).marginRight,
    paneWidth: Math.round(document.querySelector('.kr-pane').getBoundingClientRect().width),
  }));
  const before = await layout();
  check('pane: no thread open, no pane — the list has the whole width', before.pane === 'none' && before.bodyRight === '0px', JSON.stringify(before));

  // a thread with replies, an OP image and, if any, in-thread quotes
  const target = (list.find((c) => c.replies && c.image && c.quotes) || list.find((c) => c.replies && c.image) || list.find((c) => c.replies))?.res;
  if (!target) {
    console.log('UNVERIFIABLE  no thread on page 1 has replies');
    code = 2;
    throw new Error('stop');
  }
  const urlBefore = page.url();
  const t0 = Date.now();
  await page.locator(`#threads .thread[data-no="${target}"] .kr-meta-count`).click();
  await page.waitForSelector('.kr-pane .kr-post', { timeout: 5000 });
  const instantMs = Date.now() - t0;
  await page.waitForFunction(() => !document.querySelector('.kr-pane .kr-loading'), null, { timeout: 30000 }).catch(() => null);
  const fullMs = Date.now() - t0;
  // the truth, fetched independently of the script
  const truth = await page.evaluate(async (res) => {
    const html = await (await fetch(`pixmicat.php?res=${res}`)).text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const thread = doc.querySelector(`#threads .thread[data-no="${res}"]`);
    const posts = [...thread.querySelectorAll('.post[data-no]')];
    return { posts: posts.length, firstMedia: posts.map((p) => p.querySelector('.md5-image[data-image-original]')?.getAttribute('data-image-original')).find(Boolean) || null };
  }, target);
  const shown = await page.evaluate(() => ({
    posts: document.querySelectorAll('.kr-pane .kr-post').length,
    sub: document.querySelector('.kr-pane-sub').textContent,
    title: document.querySelector('.kr-pane-title').textContent,
    selected: document.querySelector('#threads .thread.kr-selected')?.dataset.no,
    media: [...document.querySelectorAll('.kr-pane .kr-post-media img, .kr-pane .kr-post-media video')].map((m) => ({ src: m.getAttribute('src'), w: Math.round(m.getBoundingClientRect().width), natural: m.naturalWidth || m.videoWidth || 0 })),
  }));
  check('pane: what the board already shows appears at once, before the fetch', instantMs < 500, `${instantMs} ms to first post, ${fullMs} ms to the whole thread`);
  check('pane: the whole thread is drawn — every post the thread page has', shown.posts === truth.posts && shown.sub.includes(`No.${target}`) && shown.sub.includes(`${truth.posts - 1} 則回應`), JSON.stringify({ shown: shown.posts, truth: truth.posts, sub: shown.sub }));
  check('pane: the row is marked and the board did not navigate', shown.selected === String(target) && page.url() === urlBefore);
  const during = await layout();
  check('pane: an open thread docks the pane on the right and the list makes room', during.pane === 'flex' && during.bodyRight === `${during.paneWidth}px` && during.paneWidth >= 380, JSON.stringify(during));
  const arrows = await page.evaluate(() => {
    const n = document.querySelector('.kr-site-scroll');
    return n ? { right: Math.round(n.getBoundingClientRect().right), paneLeft: Math.round(document.querySelector('.kr-pane').getBoundingClientRect().left) } : null;
  });
  check("list: the site's ▲▼ buttons sit at the list's edge, not under the pane", !!arrows && arrows.right <= arrows.paneLeft, JSON.stringify(arrows));
  await page.waitForTimeout(1500);
  const firstImg = await page.evaluate((src) => {
    const m = [...document.querySelectorAll('.kr-pane .kr-post-media img, .kr-pane .kr-post-media video')].find((n) => n.getAttribute('src') === src);
    if (!m) return null;
    const nw = m.naturalWidth || m.videoWidth || 0;
    const nh = m.naturalHeight || m.videoHeight || 0;
    // its own size, scaled down only to fit the post's width and 70% of the window height
    const room = m.closest('.kr-post').clientWidth;
    const scale = nw && nh ? Math.min(1, room / nw, (innerHeight * 0.7) / nh) : 0;
    return { tag: m.tagName, w: Math.round(m.getBoundingClientRect().width), natural: nw, expected: Math.round(nw * scale) };
  }, truth.firstMedia);
  check('pane: media are the originals, at their own size (fitted to the pane) without a click', !!truth.firstMedia && !!firstImg && firstImg.natural > 0 && Math.abs(firstImg.w - firstImg.expected) <= 3, JSON.stringify({ firstImg, src: truth.firstMedia?.slice(-40) }));
  const reply = await page.evaluate((res) => {
    const f = document.getElementById('postform_main');
    const resto = f.querySelector('input[name="resto"]');
    return { cls: f.classList.contains('kr-reply-pane'), resto: resto?.value, disabled: resto?.disabled, category: f.querySelector('input[name="category"]')?.value, label: f.querySelector('.kr-composer-toggle').textContent, want: String(res) };
  }, target);
  check('composer: switches to replying to the open thread (resto set, category cleared like the site)', reply.cls && reply.resto === reply.want && !reply.disabled && reply.category === '' && reply.label.includes(`No.${reply.want}`), JSON.stringify(reply));
  await shot(page, '3-thread.png');

  // in-thread quotes: hover preview and jump
  const q = await page.evaluate(() => document.querySelector('.kr-pane .kr-post-text .kr-q[data-no]')?.dataset.no || null);
  if (q) {
    // scroll first: the pane hides the preview on scroll, and hover() would scroll and move in one go
    await page.locator(`.kr-pane .kr-post-text .kr-q[data-no="${q}"]`).first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(150);
    await page.locator(`.kr-pane .kr-post-text .kr-q[data-no="${q}"]`).first().hover();
    const preview = await page.evaluate((no) => {
      const p = document.querySelector('.kr-preview');
      return !p.hidden && !!p.querySelector(`[data-no="${no}"]`);
    }, q);
    await page.locator(`.kr-pane .kr-post-text .kr-q[data-no="${q}"]`).first().click();
    const flashed = await page.evaluate((no) => document.getElementById(`kr-p${no}`)?.classList.contains('kr-flash'), q);
    check('pane: hovering >>No. previews that post', preview, `>>${q}`);
    check('pane: clicking >>No. jumps to that post', flashed, `>>${q}`);
  } else {
    console.log('NOTE  this thread has no in-thread >>No. quote; hover/jump not exercised');
  }
  const backlinks = await page.evaluate(() => document.querySelectorAll('.kr-pane .kr-backlinks a').length);
  check('pane: posts list who replied to them', !q || backlinks > 0, `${backlinks} backlinks`);

  // No. quotes into the reply form
  const replyNo = await page.evaluate(() => [...document.querySelectorAll('.kr-pane .kr-post:not(.kr-post-op) .kr-post-no')].at(-1)?.dataset.no);
  await page.locator(`.kr-pane .kr-post-no[data-no="${replyNo}"]`).click();
  const quoted = await page.evaluate(() => ({ value: document.getElementById('fcom').value, state: document.getElementById('postform_main').dataset.krState, turnstile: !!document.querySelector('#postform_main .cf-turnstile') }));
  check('pane: No. quotes into the reply form and opens it; Turnstile is in that form', quoted.value.includes(`>>${replyNo}\n`) && quoted.state === 'expanded' && quoted.turnstile, JSON.stringify(quoted));
  await shot(page, '4-reply.png');
  await page.keyboard.press('Escape');
  check('pane: Esc folds the form first, the thread stays', (await page.evaluate(() => document.getElementById('postform_main').dataset.krState)) === 'collapsed' && (await page.evaluate(() => document.documentElement.classList.contains('kr-pane-open'))));

  // the image opens full size
  const img = page.locator('.kr-pane .kr-post-media:not(.kr-spoiler) img').first();
  if (await img.count()) {
    await img.click();
    const box = await page.evaluate(() => !!document.querySelector('.kr-lightbox img'));
    await page.keyboard.press('Escape');
    check('pane: an image opens full screen and Esc shuts it', box && !(await page.evaluate(() => !!document.querySelector('.kr-lightbox'))));
  }

  await page.keyboard.press('Escape');
  const closed = await page.evaluate(() => ({
    open: document.documentElement.classList.contains('kr-pane-open'),
    pane: getComputedStyle(document.querySelector('.kr-pane')).display,
    bodyRight: getComputedStyle(document.body).marginRight,
    restoDisabled: document.querySelector('#postform_main input[name="resto"]').disabled,
    selected: !!document.querySelector('#threads .thread.kr-selected'),
  }));
  check('pane: Esc again closes the thread and the pane; the list takes the width back; the form is 發新串 again', !closed.open && closed.pane === 'none' && closed.bodyRight === '0px' && closed.restoDisabled && !closed.selected, JSON.stringify(closed));

  // thumbnail, [回應], j
  const thumb = page.locator(`#threads .thread[data-no="${target}"] .threadpost .file-thumb img`);
  if (await thumb.count()) {
    await thumb.first().click();
    await page.waitForSelector('.kr-pane .kr-post', { timeout: 5000 }).catch(() => null);
    const t = await page.evaluate((res) => ({ open: document.querySelector('.kr-pane-sub').textContent.includes(`No.${res}`), expanded: !!document.querySelector(`#threads .thread[data-no="${res}"] .threadpost .-expanded`) }), target);
    check('list: an OP thumbnail opens the thread rather than expanding the image in the row', t.open && !t.expanded, JSON.stringify(t));
    await page.keyboard.press('Escape');
  }
  const rlink = await page.evaluate(() => document.querySelector('#threads .rlink a')?.getAttribute('href'));
  if (rlink) {
    const res = rlink.match(/res=(\d+)/)[1];
    // [回應] is hidden in the list (the row opens the thread); a synthetic click still exercises the link interception
    await page.evaluate((h) => document.querySelector(`#threads .rlink a[href="${h}"]`).click(), rlink);
    const ok = await page.waitForFunction((r) => document.querySelector('.kr-pane-sub').textContent.includes(`No.${r}`), res, { timeout: 5000 }).then(() => true, () => false);
    check('list: a thread link opens the pane instead of leaving the board', ok && page.url() === urlBefore, `res=${res}`);
    await page.keyboard.press('Escape');
  }
  await page.locator('.kr-toolbar-title').click();
  await page.keyboard.press('j');
  const keyRes = await page.evaluate(() => document.querySelector('#threads .thread.kr-selected')?.dataset.no);
  const keyOpen = !!keyRes && (await page.waitForFunction((r) => document.querySelector('.kr-pane-sub').textContent.includes(`No.${r}`), keyRes, { timeout: 5000 }).then(() => true, () => false));
  check('list: j selects the next row and the pane follows', keyOpen, `res=${keyRes}`);
  await page.keyboard.press('Escape');

  // dark appearance follows the system while the site theme is 預設
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.waitForTimeout(200);
  const dark = await page.evaluate(() => ({ attr: document.documentElement.hasAttribute('data-kr-dark'), bg: getComputedStyle(document.body).backgroundColor }));
  await shot(page, '5-dark.png');
  await page.emulateMedia({ colorScheme: 'light' });
  check('theme: dark follows the system while the site theme is 預設', dark.attr && /rgb\((1\d|2\d|3\d), /.test(dark.bg), JSON.stringify(dark));

  // narrow window
  await page.setViewportSize({ width: 800, height: 900 });
  await page.waitForFunction(() => innerWidth === 800);
  await page.waitForTimeout(400);
  const narrow = await page.evaluate(() => ({ docked: document.documentElement.classList.contains('kr-docked'), pane: getComputedStyle(document.querySelector('.kr-pane')).visibility }));
  await page.locator(`#threads .thread[data-no="${target}"] .kr-meta-count`).click();
  await page.waitForTimeout(400);
  const narrowOpen = await page.evaluate(() => {
    const r = document.querySelector('.kr-pane').getBoundingClientRect();
    return { open: document.documentElement.classList.contains('kr-pane-open'), left: Math.round(r.left), width: Math.round(r.width), innerWidth };
  });
  await shot(page, '6-mobile-thread.png');
  await page.locator('.kr-pane-back').click();
  const narrowClosed = !(await page.evaluate(() => document.documentElement.classList.contains('kr-pane-open')));
  check('mobile: no docked pane; a row opens it full width and ‹ 列表 goes back', !narrow.docked && narrow.pane === 'hidden' && narrowOpen.open && narrowOpen.left === 0 && narrowOpen.width >= narrowOpen.innerWidth - 20 && narrowClosed, JSON.stringify({ narrow, narrowOpen, narrowClosed }));
  await shot(page, '7-mobile-list.png');
  const mobileSide = await page.evaluate(() => ({ hidden: getComputedStyle(document.querySelector('.kr-side')).display === 'none', width: document.documentElement.style.getPropertyValue('--kr-side') }));
  check('mobile: sidebar starts hidden without reserving list width', mobileSide.hidden && mobileSide.width === '0px', JSON.stringify(mobileSide));
  await page.locator('.kr-side-open').click();
  check('mobile: ☰ opens the sidebar over the list', await page.evaluate(() => getComputedStyle(document.querySelector('.kr-side')).display !== 'none' && document.documentElement.style.getPropertyValue('--kr-side') === '0px'));
  await page.keyboard.press('Escape');
  check('mobile: Esc closes the sidebar', await page.evaluate(() => getComputedStyle(document.querySelector('.kr-side')).display === 'none'));

  // sidebar
  await page.setViewportSize({ width: 1600, height: 1000 });
  // the resize event (and the layout switch it drives) fires after setViewportSize resolves
  await page.waitForFunction(() => innerWidth === 1600);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  const desktopSide = await page.evaluate(() => ({
    visible: getComputedStyle(document.querySelector('.kr-side')).display !== 'none',
    width: document.documentElement.style.getPropertyValue('--kr-side'),
    margin: getComputedStyle(document.body).marginLeft,
    current: !!document.querySelector('.kr-side-row a[aria-current="page"][href="https://gaia.komica1.org/00b/index.htm"]'),
  }));
  check('desktop: sidebar takes 248px and highlights 綜合', desktopSide.visible && desktopSide.width === '248px' && desktopSide.margin === '248px' && desktopSide.current, JSON.stringify(desktopSide));
  const adult = await page.evaluate(() => {
    const toggle = [...document.querySelectorAll('.kr-side-group-toggle')].find((b) => b.textContent.includes('18禁'));
    return toggle ? { expanded: toggle.getAttribute('aria-expanded'), rows: toggle.parentElement.querySelectorAll('.kr-side-row').length, text: toggle.textContent } : null;
  });
  check('sidebar: the 18禁 section starts locked behind the birth-year question', !!adult && adult.expanded === 'false' && adult.rows === 0 && adult.text.includes('🔒') && !adult.text.includes('[鎖定]'), JSON.stringify(adult));
  await page.locator('.kr-side-group-toggle', { hasText: '18禁' }).click();
  await page.locator('.kr-side-gate input').fill('2015');
  await page.locator('.kr-side-gate button[type="submit"]').click();
  const minor = await page.evaluate(() => ({ error: document.querySelector('.kr-side-gate-error')?.textContent, rows: document.querySelectorAll('.kr-side-row a[href="https://2cat.org/touhoux/"]').length }));
  await page.locator('.kr-side-gate input').fill('1994');
  await page.locator('.kr-side-gate button[type="submit"]').click();
  const unlocked = await page.evaluate(() => document.querySelectorAll('.kr-side-row a[href="https://2cat.org/touhoux/"]').length);
  check('sidebar: 1994 opens the 18禁 boards, an under-18 year does not', minor.rows === 0 && /未滿/.test(minor.error || '') && unlocked === 1, JSON.stringify({ minor, unlocked }));
  const inPlace = await page.evaluate(() => {
    const row = document.querySelector('.kr-side-row a[href="https://grea.komica1.org/50/index.htm"]')?.closest('.kr-side-row');
    const group = row?.closest('.kr-side-group')?.querySelector('.kr-side-group-toggle')?.textContent || '';
    const tagAfterName = row ? row.querySelector('a').compareDocumentPosition(row.querySelector('.kr-side-tag')) & Node.DOCUMENT_POSITION_FOLLOWING : 0;
    return { dimmed: !!row?.classList.contains('kr-side-down'), group, tagAfterName: !!tagAfterName, separate: [...document.querySelectorAll('.kr-side-group-toggle')].some((b) => b.textContent.includes('目前連不上')) };
  });
  check('sidebar: an unreachable board stays in its category, dimmed, tagged after its name', inPlace.dimmed && inPlace.group.includes('連線板') && inPlace.tagAfterName && !inPlace.separate, JSON.stringify(inPlace));
  await page.locator('.kr-side-search').fill('動畫');
  const searchResult = await page.evaluate(() => {
    const links = [...document.querySelectorAll('.kr-side-list .kr-side-row a')];
    return { animation: links.some((a) => a.href.includes('/00b/pixmicat2.php?c=') && a.textContent === '動畫'), unrelated: links.some((a) => a.textContent === '綜合') };
  });
  check('sidebar: search finds the 動畫 category view and hides 綜合', searchResult.animation && !searchResult.unrelated, JSON.stringify(searchResult));
  await page.locator('.kr-side-search').fill('');
  await page.locator('.kr-side-row:has(a[href="https://gaia.komica1.org/00b/index.htm"]) .kr-side-star').first().click();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.kr-side');
  check('sidebar: the 18禁 unlock survives reload', await page.evaluate(() => document.querySelectorAll('.kr-side-row a[href="https://2cat.org/touhoux/"]').length === 1));
  check('sidebar: starred board survives reload under ★ 書籤', await page.evaluate(() => {
    const first = document.querySelector('.kr-side-group');
    return first?.textContent.includes('★ 書籤') && !!first.querySelector('a[href="https://gaia.komica1.org/00b/index.htm"]');
  }));
  await page.locator('.kr-side-close').click();
  check('sidebar: collapse releases its 248px', await page.evaluate(() => document.documentElement.style.getPropertyValue('--kr-side') === '0px'));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.kr-side-open');
  check('sidebar: collapsed state survives reload', await page.evaluate(() => document.documentElement.style.getPropertyValue('--kr-side') === '0px' && getComputedStyle(document.querySelector('.kr-side')).display === 'none'));
  await page.locator('.kr-side-open').click();
  check('sidebar: ☰ restores the 248px column', await page.evaluate(() => document.documentElement.style.getPropertyValue('--kr-side') === '248px'));

  // portal
  const portalResp = await page.goto('https://komica1.org/', { waitUntil: 'domcontentloaded', timeout: 45000 }).catch((e) => e);
  if (!portalResp || portalResp instanceof Error || !portalResp.ok()) {
    check('portal: entry loads', false, portalResp instanceof Error ? portalResp.message : String(portalResp?.status()));
  } else {
    // the frameset can replace itself while loading, which detaches a menu frame taken too early: ask for the
    // current one on every try. A menu that never loads says nothing about the script ("could not check").
    let menu = null;
    let state = null;
    const deadline = Date.now() + 45000;
    while (Date.now() < deadline) {
      menu = page.frame({ name: 'menu' });
      state = menu && !menu.isDetached()
        ? await menu.evaluate(() => ({ ready: document.readyState, side: !!document.querySelector('.kr-side'), cls: document.documentElement.className })).catch((e) => ({ error: e.message }))
        : null;
      if (state?.side) break;
      await page.waitForTimeout(250);
    }
    if (!state || state.error || state.ready === 'loading') {
      console.log(`UNVERIFIABLE  the portal menu frame did not load within 45 s: ${JSON.stringify(state)}`);
      code = 2;
      throw new Error('stop');
    }
    const portal = { ...(await page.evaluate(() => ({ cols: document.querySelector('frameset')?.cols }))), menu: state };
    check('portal: menu frame has sidebar and frameset starts at 248px', portal.menu.side && portal.cols?.startsWith('248,'), JSON.stringify(portal));
    await menu.locator('.kr-side-row a[href="https://gaia.komica1.org/00b/index.htm"]').first().click();
    const cont = page.frame({ name: 'cont' });
    await cont.waitForURL(/gaia\.komica1\.org\/00b\//, { timeout: 30000 });
    await cont.waitForSelector('html.kr-md', { timeout: 20000 });
    check('portal: 綜合 opens in cont with list and pane, no second sidebar', await cont.evaluate(() => document.documentElement.classList.contains('kr-md') && !!document.querySelector('.kr-pane') && !document.querySelector('.kr-side')));
    await page.waitForTimeout(1500);
    await shot(page, '8-portal.png');
  }

  const ours = pageErrors.filter((m) => /kr[A-Z_-]|komica-reader|__krState/.test(m));
  check('no page errors from this script', ours.length === 0, ours.join(' | ') || `${pageErrors.length} from the site itself`);
} catch (e) {
  if (e.message !== 'stop') check('harness ran to the end', false, e.message);
} finally {
  await browser.close();
}

if (out) writeFileSync(path.join(out, 'result.json'), JSON.stringify({ when: new Date().toISOString(), results }, null, 2));
if (code === 2 && results.every((r) => r.ok)) process.exit(2);
process.exit(results.length && results.every((r) => r.ok) ? 0 : 1);
