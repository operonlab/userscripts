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
const MATCHES = ['https://gaia.komica1.org/00b/', 'https://komica1.org/', 'https://2cat.org/', 'https://2cat.uk/', 'https://cat.2nyan.org/'];
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
    headerHidden: getComputedStyle(document.getElementById('toplink')).display === 'none' && getComputedStyle(document.querySelector('#header h1')).display === 'none',
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
    selected: !!document.querySelector('#threads .thread.kr-selected'),
  }));
  const kept = await page.evaluate(() => ({ disabled: document.querySelector('#postform_main input[name="resto"]').disabled, value: document.querySelector('#postform_main input[name="resto"]').value }));
  check('pane: Esc again closes the thread and the pane; the list takes the width back', !closed.open && closed.pane === 'none' && closed.bodyRight === '0px' && !closed.selected, JSON.stringify(closed));
  // the quote is an unsent draft: it stays a reply to the thread it was written in
  check('composer: an unsent draft keeps replying to its thread after the thread closes', !kept.disabled && kept.value === String(target), JSON.stringify(kept));

  // thumbnail, [回應], j
  const thumb = page.locator(`#threads .thread[data-no="${target}"] .threadpost .file-thumb img`);
  if (await thumb.count()) {
    await thumb.first().click();
    await page.waitForSelector('.kr-pane .kr-post', { timeout: 5000 }).catch(() => null);
    const t = await page.evaluate((res) => ({ open: document.querySelector('.kr-pane-sub').textContent.includes(`No.${res}`), expanded: !!document.querySelector(`#threads .thread[data-no="${res}"] .threadpost .-expanded`) }), target);
    check('list: an OP thumbnail opens the thread rather than expanding the image in the row', t.open && !t.expanded, JSON.stringify(t));
    await page.keyboard.press('Escape');
  }
  // another thread than the one the draft is for
  const rlink = await page.evaluate((t) => [...document.querySelectorAll('#threads .rlink a')].map((a) => a.getAttribute('href')).find((h) => !new RegExp(`res=${t}(?!\\d)`).test(h)), target);
  if (rlink) {
    const res = rlink.match(/res=(\d+)/)[1];
    // [回應] is hidden in the list (the row opens the thread); a synthetic click still exercises the link interception
    await page.evaluate((h) => document.querySelector(`#threads .rlink a[href="${h}"]`).click(), rlink);
    const ok = await page.waitForFunction((r) => document.querySelector('.kr-pane-sub').textContent.includes(`No.${r}`), res, { timeout: 5000 }).then(() => true, () => false);
    check('list: a thread link opens the pane instead of leaving the board', ok && page.url() === urlBefore, `res=${res}`);
    const still = await page.evaluate(() => document.querySelector('#postform_main input[name="resto"]').value);
    check('composer: opening another thread does not move an unsent draft', Number(res) !== target && still === String(target), JSON.stringify({ resto: still, open: res, draftFor: target }));
    await page.keyboard.press('Escape');
  }
  // an emptied box lets the form follow the open thread again
  await page.evaluate(() => (document.getElementById('fcom').value = ''));
  await page.locator('.kr-toolbar-title').click();
  await page.keyboard.press('j');
  const keyRes = await page.evaluate(() => document.querySelector('#threads .thread.kr-selected')?.dataset.no);
  const keyOpen = !!keyRes && (await page.waitForFunction((r) => document.querySelector('.kr-pane-sub').textContent.includes(`No.${r}`), keyRes, { timeout: 5000 }).then(() => true, () => false));
  check('list: j selects the next row and the pane follows', keyOpen, `res=${keyRes}`);
  // the row opens 200ms after j; when it is the thread already in the pane, the pane's title matched before that
  const followed = !!keyRes && (await page.waitForFunction((r) => document.querySelector('#postform_main input[name="resto"]').value === r, keyRes, { timeout: 5000 }).then(() => true, () => false));
  check('composer: with the box empty, the form replies to the thread that opens', followed, `res=${keyRes}`);
  await page.keyboard.press('Escape');
  check('composer: with the box empty, closing the thread makes the form 發新串 again', await page.evaluate(() => document.querySelector('#postform_main input[name="resto"]').disabled));

  // the post verdict, driven without posting anything: new FormData(form) fires formdata as a real submit does,
  // and the hidden result frame is handed a page of our own. The text may be cleared only when the post is found.
  await page.locator(`#threads .thread[data-no="${target}"] .kr-meta-count`).click();
  await page.waitForFunction(() => !document.querySelector('.kr-pane .kr-loading'), null, { timeout: 30000 }).catch(() => null);
  const newest = await page.evaluate(() => Math.max(...[...document.querySelectorAll('[data-no]')].map((n) => Number(n.dataset.no)).filter(Number.isFinite)));
  const threadPage = (posts) => `<div id="threads"><div class="thread" data-no="${target}"><div class="post threadpost" data-no="${target}"><div class="quote">OP</div></div>${posts.map(([no, text]) => `<div class="post reply" data-no="${no}"><div class="quote">${text}</div></div>`).join('')}</div></div>`;
  const verdict = (text, html, ms = 35000) => page.evaluate(async ({ text, html, ms }) => {
    const ta = document.getElementById('fcom');
    const status = () => document.querySelector('#postform_main .kr-composer-status').textContent;
    ta.value = text;
    new FormData(document.getElementById('postform_main'));
    const sending = status();
    document.querySelector('iframe[name="kr-sink"]').srcdoc = html;
    const end = Date.now() + ms;
    while (status() === '送出中⋯' && Date.now() < end) await new Promise((r) => setTimeout(r, 200));
    return { sending, status: status(), kept: ta.value === text };
  }, { text, html, ms });
  const stamp = `e2e ${Date.now()}`;
  const errorPage = await verdict(stamp, '<p>錯誤：驗證失敗，請重新整理。</p>');
  check('posting: an error page keeps the text and says it cannot tell', errorPage.sending === '送出中⋯' && errorPage.kept && errorPage.status.includes('看不出'), JSON.stringify(errorPage));
  const oldMatch = await verdict('推', threadPage([[newest, '推']]));
  check('posting: an older post with the same short text is not proof — the text stays', oldMatch.kept && oldMatch.status.includes('看不出'), JSON.stringify({ ...oldMatch, newest }));
  const reads = await verdict(stamp, '<script>var here = location.href;</script><p>錯誤</p>');
  check('posting: a result page that only reads its address is not taken for a redirect', reads.kept && reads.status.includes('看不出'), JSON.stringify(reads));
  const stuck = await verdict(stamp, '<meta http-equiv="refresh" content="999"><p>轉址中</p>', 45000);
  check('posting: a redirect that never arrives ends in "cannot tell", text kept', stuck.kept && stuck.status.includes('看不出'), JSON.stringify(stuck));
  // far above anything real, so a reply posted meanwhile by someone else cannot outrank it
  const mine = newest + 100000;
  const late = await page.evaluate(async (html) => {
    document.querySelector('iframe[name="kr-sink"]').srcdoc = html;
    const end = Date.now() + 35000;
    while (document.getElementById('fcom').value && Date.now() < end) await new Promise((r) => setTimeout(r, 200));
    return { status: document.querySelector('#postform_main .kr-composer-status').textContent, cleared: !document.getElementById('fcom').value };
  }, threadPage([[mine, stamp]]));
  check('posting: a result that turns up after the wait gave up is still read', late.cleared && late.status === '已送出', JSON.stringify(late));
  const imageOnly = await verdict('>>123\n', threadPage([[mine + 1, '']]));
  check('posting: an image or quote alone cannot be told from anyone else\'s post — the box stays', imageOnly.kept && imageOnly.status.includes('看不出'), JSON.stringify(imageOnly));
  const landed = await verdict(stamp, threadPage([[mine + 2, stamp]]));
  check('posting: the post found on the page it landed on, newer than anything known, clears the text', !landed.kept && landed.status === '已送出', JSON.stringify(landed));
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
  // text the browser puts back after a reload is not a draft written here: opening a thread still points the form at it
  await page.evaluate(() => (document.getElementById('fcom').value = '這是瀏覽器還原的舊字'));
  const restoredRes = await page.evaluate(() => document.querySelector('#threads .thread')?.dataset.no);
  await page.locator(`#threads .thread[data-no="${restoredRes}"] .kr-meta-count`).click();
  const restored = await page.evaluate(() => document.querySelector('#postform_main input[name="resto"]').value);
  check('composer: text restored by the browser does not hold the form on 發新串', restored === restoredRes, JSON.stringify({ restored, restoredRes }));
  await page.evaluate(() => (document.getElementById('fcom').value = ''));
  await page.keyboard.press('Escape');
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
    // the portal still links 2CAT to a dead host; the sidebar takes the board to where it lives now
    const movedRow = await menu.evaluate(() => {
      const a = [...document.querySelectorAll('.kr-side-row a')].find((n) => n.textContent === '2CAT');
      return a ? { href: a.getAttribute('href'), tag: a.closest('.kr-side-row').querySelector('.kr-side-tag')?.textContent || null } : null;
    });
    check('portal: a board that moved links to its new address, untagged', movedRow?.href === 'https://2cat.uk/' && movedRow.tag === null, JSON.stringify(movedRow));
    await menu.locator('.kr-side-row a[href="https://gaia.komica1.org/00b/index.htm"]').first().click();
    const cont = page.frame({ name: 'cont' });
    await cont.waitForURL(/gaia\.komica1\.org\/00b\//, { timeout: 30000 });
    await cont.waitForSelector('html.kr-md', { timeout: 20000 });
    check('portal: 綜合 opens in cont with list and pane, no second sidebar', await cont.evaluate(() => document.documentElement.classList.contains('kr-md') && !!document.querySelector('.kr-pane') && !document.querySelector('.kr-side')));
    await page.waitForTimeout(1500);
    await shot(page, '8-portal.png');
  }

  // the site's own thread page in dark mode: its posts must not stay beige under the reader's white text
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto(`https://gaia.komica1.org/00b/pixmicat.php?res=${target}`, { waitUntil: 'load', timeout: 45000 }).catch(() => null);
  await page.waitForTimeout(800);
  const threadDark = await page.evaluate(() => {
    const q = document.querySelector('#threads .reply .quote, #threads .threadpost .quote');
    if (!q) return null;
    const paint = (n) => { for (; n; n = n.parentElement) { const b = getComputedStyle(n).backgroundColor; if (!/rgba\(0, 0, 0, 0\)|transparent/.test(b)) return b; } return 'rgb(255, 255, 255)'; };
    const lum = (c) => { const [r, g, b] = c.match(/\d+(\.\d+)?/g).slice(0, 3).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
    const [a, b] = [lum(getComputedStyle(q).color), lum(paint(q))].sort((x, y) => y - x);
    return { fg: getComputedStyle(q).color, bg: paint(q), contrast: Math.round(((a + 0.05) / (b + 0.05)) * 10) / 10 };
  });
  await page.emulateMedia({ colorScheme: 'light' });
  check("thread page: in dark mode the site's posts are readable (contrast 4.5 or more)", !!threadDark && threadDark.contrast >= 4.5, JSON.stringify(threadDark));

  // --- 2cat: the classic template (career: replies inside the OP) and the newer one (cellphone: whole page in #scroller,
  // long threads paged). The truth is the site's own markup, fetched and counted here, every page of a paged thread.
  for (const [name, url, label] of [['career', 'https://2cat.org/career/', '職業'], ['cellphone', 'https://2cat.org/cellphone/', '手機遊戲']]) {
    const r2 = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 }).catch((e) => e);
    if (!r2 || r2 instanceof Error || !r2.ok() || !(await page.waitForSelector('.kr-toolbar', { timeout: 20000 }).catch(() => null))) {
      console.log(`UNVERIFIABLE  2cat ${name} did not load: ${r2 instanceof Error ? r2.message : r2?.status()}`);
      code = 2;
      continue;
    }
    await page.waitForLoadState('load').catch(() => {});
    await page.waitForTimeout(1500);
    const list = await page.evaluate(async () => {
      const doc = new DOMParser().parseFromString(await (await fetch(location.href)).text(), 'text/html');
      const rows = [...document.querySelectorAll('#threads .thread')];
      const box = (n) => n.getBoundingClientRect();
      return {
        rows: rows.length,
        ops: doc.querySelectorAll('#threads div.threadpost').length,
        metas: rows.every((row) => row.querySelectorAll('.kr-meta-count').length === 1),
        repliesShown: [...document.querySelectorAll('#threads .post.reply')].filter((n) => n.getClientRects().length && !n.closest('.kr-peek')).length,
        widths: [...new Set(rows.slice(0, 4).map((row) => Math.round(box(row).width)))],
        scroller: !!document.getElementById('scroller'),
        current: document.querySelector('.kr-side-row[aria-current="page"] a')?.textContent,
      };
    });
    check(`2cat ${name}: one row per thread, replies folded, one count each`, list.rows > 0 && list.rows === list.ops && list.metas && list.repliesShown === 0, JSON.stringify(list));
    check(`2cat ${name}: the rows are as wide as each other (nothing floats beside them)`, list.widths.length === 1, JSON.stringify(list.widths));
    check(`2cat ${name}: the sidebar marks ${label} as the current board`, list.current === label, String(list.current));
    // the thread with the most replies: on cellphone that is the paged one
    const res = await page.evaluate(() => {
      const count = (row) => Number(/(\d+) 則回應/.exec(row.querySelector('.kr-meta-count').textContent)?.[1] || 0);
      return Number([...document.querySelectorAll('#threads .thread')].sort((a, b) => count(b) - count(a))[0].dataset.no);
    });
    const metaCount = await page.evaluate((no) => Number(/(\d+) 則回應/.exec(document.querySelector(`#threads .thread[data-no="${no}"] .kr-meta-count`).textContent)?.[1] || 0), res);
    await page.locator(`#threads .thread[data-no="${res}"] .kr-meta-count`).click();
    await page.waitForSelector('.kr-pane .kr-post', { timeout: 5000 }).catch(() => null);
    await page.waitForFunction(() => !document.querySelector('.kr-pane .kr-loading'), null, { timeout: 30000 }).catch(() => null);
    const truth = await page.evaluate(async (href) => {
      const read = async (u) => new DOMParser().parseFromString(await (await fetch(u)).text(), 'text/html');
      const first = await read(href);
      const others = [...new Set([...first.querySelectorAll('#page_switch a[href*="page"]')].map((a) => a.getAttribute('href')).filter((h) => /[?&]page(?:_num)?=\d+$/.test(h)))];
      const ids = new Set();
      for (const doc of [first, ...(await Promise.all(others.map(read)))]) for (const n of doc.querySelectorAll('#threads div.threadpost[id^="r"], #threads div.reply[id^="r"]')) ids.add(n.id);
      return { posts: ids.size, pages: others.length + 1 };
    }, await page.evaluate(() => document.querySelector('.kr-pane a.kr-btn[target="_blank"]')?.href));
    const firstView = await page.evaluate(() => ({ posts: document.querySelectorAll('.kr-pane .kr-post').length, more: !!document.querySelector('.kr-pane .kr-more') }));
    if (truth.pages > 1) {
      check(`2cat ${name}: a paged thread opens on its last page and offers the rest`, firstView.more && firstView.posts < truth.posts, JSON.stringify({ firstView, truth }));
      await page.locator('.kr-pane .kr-more').click();
      await page.waitForFunction(() => !document.querySelector('.kr-pane .kr-loading, .kr-pane .kr-more'), null, { timeout: 90000 }).catch(() => null);
    } else {
      console.log(`NOTE  2cat ${name}: the longest thread on the page is not paged; paging not exercised`);
    }
    const whole = await page.evaluate(() => ({ posts: document.querySelectorAll('.kr-pane .kr-post').length, sub: document.querySelector('.kr-pane-sub').textContent, resto: document.querySelector('#postform_main input[name="resto"]')?.value }));
    check(`2cat ${name}: the whole thread is drawn — every post on every page — and the row's count agrees`, whole.posts === truth.posts && whole.sub.includes(`${truth.posts - 1} 則回應`) && metaCount === truth.posts - 1, JSON.stringify({ whole, truth, metaCount }));
    await page.waitForTimeout(1500);
    const media = await page.evaluate(() => {
      const m = document.querySelector('.kr-pane .kr-post-media img');
      return m ? { src: m.getAttribute('src').slice(-48), natural: m.naturalWidth } : null;
    });
    check(`2cat ${name}: images in the thread are the originals`, !media || (/\/src\//.test(media.src) && media.natural > 0), JSON.stringify(media));
    const no = await page.evaluate(() => [...document.querySelectorAll('.kr-pane .kr-post:not(.kr-post-op) .kr-post-no')].at(-1)?.dataset.no);
    await page.locator(`.kr-pane .kr-post-no[data-no="${no}"]`).click();
    const quoted2 = await page.evaluate(() => ({ value: document.getElementById('fcom')?.value, resto: document.querySelector('#postform_main input[name="resto"]')?.value, state: document.getElementById('postform_main').dataset.krState, boxHeight: Math.round(document.getElementById('fcom')?.getBoundingClientRect().height || 0) }));
    // the text box has to be there to be seen, not only to hold the quote (2cat hides its fields in #postform.hide)
    check(`2cat ${name}: No. quotes into the board's form, which replies to this thread, and the box shows`, quoted2.value?.includes(`>>${no}\n`) && quoted2.resto === String(res) && quoted2.state === 'expanded' && quoted2.boxHeight > 40, JSON.stringify({ ...quoted2, res, no }));
    await page.keyboard.press('Escape');
    const fit = await page.evaluate(() => ({ rowsRight: Math.max(...[...document.querySelectorAll('#threads .thread')].map((n) => Math.round(n.getBoundingClientRect().right))), paneLeft: Math.round(document.querySelector('.kr-pane').getBoundingClientRect().left) }));
    check(`2cat ${name}: the list stays left of the open pane`, fit.rowsRight <= fit.paneLeft, JSON.stringify(fit));
    await shot(page, `9-2cat-${name}.png`);
  }

  // 2cat's 18禁 boards answer a file link with their own player page; the pane offers that page when a <video> cannot
  // play the answer. Shown here without an 18禁 board: a SFW board's video answered with HTML, as theirs are.
  // A fresh context: the page before this one has hundreds of media elements loaded, and intercepting media under it stalled the run.
  const video = /\/src\/\d+\.(?:webm|mp4)$/;
  const fresh = await browser.newContext({ viewport: { width: 1600, height: 1000 }, locale: 'zh-TW', colorScheme: 'light' });
  await fresh.addInitScript(wrapped);
  const vpage = await fresh.newPage();
  await vpage.route(video, (route) => route.fulfill({ status: 200, contentType: 'text/html; charset=UTF-8', body: '<html><body><video id="p" controls></video></body></html>' }));
  await vpage.goto('https://2cat.org/cellphone/', { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => null);
  const videoRes = (await vpage.waitForSelector('.kr-toolbar', { timeout: 20000 }).catch(() => null)) && (await vpage.evaluate(() => [...document.querySelectorAll('#threads .thread')].find((t) => t.querySelector('a.imglink[title$=".webm" i], a.imglink[title$=".mp4" i]'))?.dataset.no));
  if (videoRes) {
    await vpage.locator(`#threads .thread[data-no="${videoRes}"] .kr-meta-count`).click({ timeout: 15000 }).catch(() => null);
    const offered = await vpage.waitForSelector('.kr-pane .kr-player-start', { timeout: 15000 }).then(() => true, () => false);
    await vpage.locator('.kr-pane .kr-player-start').first().click({ timeout: 10000 }).catch(() => null);
    const framed = await vpage.evaluate(() => document.querySelector('.kr-pane iframe.kr-player')?.getAttribute('src') || null);
    check('2cat: a video the board answers with its own player page is offered in that player', offered && video.test(framed || ''), JSON.stringify({ offered, framed }));
  } else {
    console.log('NOTE  2cat cellphone: no video thread on the first page; the player fallback was not exercised');
  }
  await fresh.close();

  // ▲▼, the low-rating fold and the reader's own hidden IDs, in the pane. No vote reaches the site: every request to
  // post_vote.php is answered or aborted here, and vote_status says voting is open so the site's handler sends at all.
  const vctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, locale: 'zh-TW', colorScheme: 'light' });
  await vctx.addInitScript(wrapped);
  const sent = [];
  await vctx.route(/vote_status\.json/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"paused":false}' }));
  await vctx.route(/post_vote\.php/, (r) => {
    if (r.request().method() !== 'POST') return r.abort();
    sent.push(r.request().postData() || '');
    return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, state: 'collapsed', up_count: 2, down_count: 9, own_vote: -1, vote_changed: true }) });
  });
  const vp = await vctx.newPage();
  await vp.goto(BOARD, { waitUntil: 'load', timeout: 45000 }).catch(() => null);
  if (await vp.waitForSelector('.kr-toolbar', { timeout: 20000 }).catch(() => null)) {
    await vp.waitForTimeout(1500);
    const row = await vp.evaluate(() => {
      const t = [...document.querySelectorAll('#threads .thread')].find((n) => n.querySelector('.threadpost .postvote-slot'));
      const r = t?.querySelector('.threadpost .postvote-slot')?.getBoundingClientRect();
      const tr = t?.getBoundingClientRect();
      return { found: !!r, inside: !!r && r.height > 0 && r.right <= tr.right && r.top >= tr.top && r.bottom <= tr.bottom };
    });
    check('rows: the site\'s ▲▼ show on the row', row.found && row.inside, JSON.stringify(row));
    const cats = await vp.evaluate(() => {
      const cat = [...document.querySelectorAll('#threads .threadpost .category')].find((c) => c.querySelector('a[href*="mode=category"]'));
      const chips = [...(cat?.querySelectorAll('a[href*="mode=category"]') || [])];
      const tr = cat?.closest('.thread').getBoundingClientRect();
      return { res: cat?.closest('.thread').dataset.no, names: chips.map((a) => a.textContent.trim()), shown: chips.length > 0 && chips.every((a) => { const r = a.getBoundingClientRect(); return r.height > 0 && r.bottom <= tr.bottom; }) };
    });
    check('rows: the site\'s 類別 show on the row', cats.shown, JSON.stringify(cats));
    if (cats.res) {
      await vp.locator(`#threads .thread[data-no="${cats.res}"] .kr-meta-count`).click();
      await vp.waitForSelector('.kr-pane .kr-post-op', { timeout: 10000 }).catch(() => null);
      const got = await vp.evaluate(() => [...document.querySelectorAll('.kr-pane .kr-post-op .kr-tags .kr-tag')].map((a) => ({ name: a.textContent.trim(), mode: new URL(a.href).searchParams.get('mode'), same: new URL(a.href).origin === location.origin })));
      check('pane: the OP carries the same 類別, linking to the site\'s category pages', got.length === cats.names.length && got.every((t, i) => t.name === cats.names[i] && t.mode === 'category' && t.same), JSON.stringify(got));
    }
    // an untitled thread is named by its first words; the ▲▼ the site keeps inside the text box are not words
    const titles = [];
    for (const res of await vp.evaluate(() => [...document.querySelectorAll('#threads .thread')].filter((t) => /^(無題|無標題)?$/.test(t.querySelector('.threadpost .title')?.textContent.trim() || '')).slice(0, 3).map((t) => t.dataset.no))) {
      await vp.locator(`#threads .thread[data-no="${res}"] .kr-meta-count`).click();
      await vp.waitForTimeout(400);
      titles.push(await vp.evaluate(() => document.querySelector('.kr-pane-title').textContent));
    }
    check('pane: an untitled thread\'s title has no ▲▼ in it', titles.length > 0 && titles.every((t) => !/[▲▼]/.test(t)), JSON.stringify(titles));
    await vp.locator('.kr-pane-close').click();
    // the form keeps the site's notices (folded behind one line) and its 發文說明與注意事項
    await vp.locator('.kr-composer-toggle').click();
    await vp.waitForTimeout(300);
    const shown = (sel) => vp.evaluate((s) => (document.querySelector(s)?.getBoundingClientRect().height || 0) > 0, sel);
    const form = { toggle: await shown('.kr-composer .kr-notices-toggle'), notices: await shown('.kr-composer #postinfo .post-notices'), rules: await shown('.kr-composer #postinfo .post-instructions') };
    if (form.toggle) await vp.locator('.kr-notices-toggle').click();
    const opened = await shown('.kr-composer #postinfo .post-notices');
    check('form: the site\'s notices fold behind one line and open on it; its 發文說明與注意事項 shows', form.toggle && !form.notices && form.rules && opened, JSON.stringify({ ...form, opened }));
    await vp.locator('.kr-composer-close').click();
    const vres = await vp.evaluate(() => [...document.querySelectorAll('#threads .thread')].find((t) => t.querySelectorAll('.post.reply').length >= 3)?.dataset.no);
    // the reader's own settings, stored the way the site's settings page stores them: the first reply's ID, a word from
    // the second reply, and the last reply on the 隱藏貼文清單
    const hide = await vp.evaluate((res) => {
      const replies = [...document.querySelectorAll(`#threads .thread[data-no="${res}"] .post.reply`)];
      const head = replies[0]?.querySelector('.post-head');
      const id = head?.querySelector('.id[data-id]')?.getAttribute('data-id') || /ID:([A-Za-z0-9./]{8})/.exec(head?.textContent || '')?.[1] || '';
      if (id) localStorage.setItem('komica_hidden_ids_v1', JSON.stringify({ enabled: true, entries: [{ id, addedAt: Date.now() }] }));
      const word = (replies[1]?.querySelector('.quote')?.textContent || '').replace(/\s|>>\d+/g, '').slice(0, 4);
      if (word.length === 4) localStorage.setItem('komica_keyword_filter', JSON.stringify({ enabled: true, keywords: word, entries: [{ keyword: word, addedAt: Date.now() }] }));
      const last = replies.at(-1)?.getAttribute('data-no') || '';
      if (last) {
        localStorage.setItem('komica_hidden_posts_v1', JSON.stringify({ [last]: { hidden: true, time: Date.now() } }));
        localStorage.setItem('hideFutureDownvotesState', 'true');
      }
      return { id, word: word.length === 4 ? word : '', wordNo: replies[1]?.getAttribute('data-no'), last };
    }, vres);
    await vp.locator(`#threads .thread[data-no="${vres}"] .kr-meta-count`).click();
    await vp.waitForSelector('.kr-pane .kr-post', { timeout: 10000 });
    await vp.waitForFunction(() => !document.querySelector('.kr-pane .kr-loading'), null, { timeout: 30000 }).catch(() => {});
    const vpane = await vp.evaluate((h) => {
      const posts = [...document.querySelectorAll('.kr-pane .kr-post')];
      const hidden = posts.filter((p) => p.classList.contains('kr-hidden'));
      const why = (no) => document.querySelector(`.kr-pane .kr-post[data-no="${no}"]`)?.dataset.why || '';
      return {
        posts: posts.length,
        withVote: posts.filter((p) => p.querySelector('.kr-vote .postvote-slot[data-no]')).length,
        stray: !!document.querySelector('.kr-pane .kr-post-text :is(.postvote-notice, .postvote-toggle, .postvote-slot)'),
        hidden: hidden.length,
        // every hidden reply has a reason that is really true of it, and is out of sight
        justified: hidden.every((p) => p.getBoundingClientRect().height === 0 && (p.dataset.id === h.id || (h.word && p.textContent.includes(h.word)) || p.dataset.no === h.last)),
        byId: !h.id || posts.filter((p) => p.dataset.id === h.id && !p.classList.contains('kr-post-op')).every((p) => p.classList.contains('kr-hidden')),
        byWord: !h.word || why(h.wordNo).includes(`關鍵字：${h.word}`),
        byList: !h.last || why(h.last).includes('隱藏貼文清單'),
        bar: document.querySelector('.kr-pane .kr-filtered')?.textContent || '',
      };
    }, hide);
    check('pane: every post has the site\'s ▲▼, none of its fold markup copied into the text', vpane.posts > 0 && vpane.withVote === vpane.posts && !vpane.stray, JSON.stringify(vpane));
    if (hide.id && hide.word && hide.last) {
      check('pane: replies the reader hid on the site (ID, keyword, 隱藏貼文清單) are hidden, with a note to show them', vpane.hidden >= 3 && vpane.justified && vpane.byId && vpane.byWord && vpane.byList && /藏起了 \d+ 則回覆/.test(vpane.bar), JSON.stringify({ hide, ...vpane }));
    } else console.log(`NOTE  the hidden-reply check was not exercised (read ${JSON.stringify(hide)})`);
    const victim = await vp.evaluate(() => [...document.querySelectorAll('.kr-pane .kr-post:not(.kr-post-op)')].filter((p) => p.getBoundingClientRect().height > 0).pop()?.dataset.no);
    await vp.locator(`.kr-pane .kr-post[data-no="${victim}"] .postvote-down`).click();
    await vp.waitForTimeout(600);
    const folded = await vp.evaluate((no) => {
      const art = document.querySelector(`.kr-pane .kr-post[data-no="${no}"]`);
      return { vote: art.dataset.vote, down: art.querySelector('.postvote-dislike-count')?.textContent, textHeight: art.querySelector('.kr-post-text')?.getBoundingClientRect().height ?? 0 };
    }, victim);
    check('pane: ▼ goes out through the site\'s own handler, and its answer folds the post', sent.length === 1 && sent[0].startsWith(`no=${victim}&vote=down`) && folded.vote === 'collapsed' && folded.down === '9' && folded.textHeight === 0, JSON.stringify({ sent, ...folded }));
    await vp.locator(`.kr-pane .kr-post[data-no="${victim}"] .kr-fold-toggle`).click();
    check('pane: 展開 opens a folded post', await vp.evaluate((no) => document.querySelector(`.kr-pane .kr-post[data-no="${no}"] .kr-post-text`)?.getBoundingClientRect().height > 0, victim));
    await vp.locator('.kr-pane-close').click();
    // a post held for review: on the live page the site has swapped its text, slot and all, for its notice (postvote.js
    // applyState). The pane's first draw, from that row, shows the notice; the thread page is held back meanwhile.
    const held = await vp.evaluate((skip) => {
      const t = [...document.querySelectorAll('#threads .thread')].find((n) => n.dataset.no !== skip && n.querySelector('.threadpost .quote'));
      const post = t.querySelector('.threadpost');
      post.classList.add('postvote-review');
      post.querySelector('.quote').innerHTML = '<span class="postvote-notice">此留言已因評價異常隱藏，並送交管理員審核。</span>';
      return t.dataset.no;
    }, vres);
    const hold = new RegExp(`pixmicat\\.php\\?res=${held}(?!\\d)`);
    await vp.route(hold, async (r) => {
      await new Promise((ok) => setTimeout(ok, 5000));
      await r.continue().catch(() => {});
    });
    await vp.locator(`#threads .thread[data-no="${held}"] .kr-meta-count`).click();
    await vp.waitForSelector('.kr-pane .kr-post-op', { timeout: 3000 }).catch(() => null);
    const review = await vp.evaluate(() => {
      const op = document.querySelector('.kr-pane .kr-post-op');
      return { vote: op?.dataset.vote, fold: op?.querySelector('.kr-fold')?.textContent || '', foldShown: (op?.querySelector('.kr-fold')?.getBoundingClientRect().height || 0) > 0, text: op?.querySelector('.kr-post-text')?.getBoundingClientRect().height ?? -1 };
    });
    check('pane: a post held for review shows the site\'s notice, not a blank', review.vote === 'review' && review.foldShown && review.fold.includes('送交管理員審核') && review.text === 0, JSON.stringify(review));
    await vp.unroute(hold);
    await vp.locator('.kr-pane-close').click();
    // the pager and the footer are restyled, nothing in them removed
    const foot = await vp.evaluate(() => {
      const visible = (n) => !!n && getComputedStyle(n).display !== 'none' && n.getBoundingClientRect().height > 0;
      const links = [...document.querySelectorAll('#page_switch a, #page_switch b')];
      return {
        pills: links.length > 0 && links.every((a) => parseFloat(getComputedStyle(a).borderRadius) > 10),
        bottom: [...document.querySelectorAll('#bottomlink a')].filter(visible).length,
        credits: visible(document.querySelector('#footer small')),
        notice: document.body.innerText.includes('All trademarks and copyrights on this page are owned by their respective owners.'),
        flag: visible(document.querySelector('img[src*="flagcounter"]')),
      };
    });
    check('board: pager links are pills; the footer links, credits, notice and counter are all still there', foot.pills && foot.bottom === 4 && foot.credits && foot.notice && foot.flag, JSON.stringify(foot));
  } else {
    check('votes: the board loaded in a fresh context', false);
  }
  await vctx.close();

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
