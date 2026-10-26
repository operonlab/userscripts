// ==UserScript==
// @name         Komica Reader
// @name:zh-TW   K島閱讀改善
// @namespace    https://github.com/operonlab/userscripts
// @version      0.1.0
// @description  Komica (gaia /00b/): a thread's replies open in a drawer beside the board, and the post form floats where you are instead of sitting at the top of the page. Uses the site's own pages and form.
// @description:zh-TW  K島綜合版：討論串的回應在右側抽屜展開、版面留在左邊；發文／回文表單浮在畫面上跟著你捲動，不用再捲回最上面。沿用站方自己的頁面與表單。
// @author       operonlab
// @license      MIT
// @homepageURL  https://github.com/operonlab/userscripts/tree/main/komica-reader
// @supportURL   https://github.com/operonlab/userscripts/issues
// @updateURL    https://raw.githubusercontent.com/operonlab/userscripts/main/komica-reader/komica-reader.user.js
// @downloadURL  https://raw.githubusercontent.com/operonlab/userscripts/main/komica-reader/komica-reader.user.js
// @match        https://gaia.komica1.org/00b/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(() => {
  'use strict';

  const FRAME_NAME = 'kr-drawer';
  const WIDTH_KEY = 'kr.drawerWidth';
  const MIN_W = 380;
  const MAX_W = 1000;
  // the board list keeps at least this much room beside the drawer
  const LIST_MIN = 360;

  // `pixmicat.php?res=N[#rM]` on the same board → { res, post }; anything else → null
  function threadLink(href, base) {
    let u, b;
    try {
      u = new URL(href, base);
      b = new URL(base);
    } catch {
      return null;
    }
    if (u.origin !== b.origin) return null;
    const dir = (p) => p.replace(/[^/]*$/, '');
    if (dir(u.pathname) !== dir(b.pathname) || !/\/pixmicat\.php$/.test(u.pathname)) return null;
    const res = u.searchParams.get('res') || '';
    if (!/^[1-9]\d{0,11}$/.test(res)) return null;
    const m = /^#r([1-9]\d{0,11})$/.exec(u.hash);
    return { res: Number(res), post: m ? Number(m[1]) : null };
  }

  // `>>N` on its own line at the caret, the way the site's quick reply quotes
  function insertQuote(value, start, end, no) {
    const text = `>>${no}\n`;
    const before = value.slice(0, start);
    const lead = before && !before.endsWith('\n') ? '\n' : '';
    return { value: before + lead + text + value.slice(end), caret: before.length + lead.length + text.length };
  }

  function clampWidth(width, viewport) {
    const max = Math.max(MIN_W, Math.min(MAX_W, viewport - LIST_MIN));
    const w = Number(width) > 0 ? Number(width) : viewport * 0.45;
    return Math.round(Math.min(Math.max(w, MIN_W), max));
  }

  // while the drawer waits for thread `loading`, a `ready` from any other page is the previous one,
  // late; with nothing pending, any page the reader navigated to inside the drawer is accepted
  function readyAccepted(loading, res) {
    return loading === null || res === loading;
  }

  // first non-transparent `rgb()/rgba()` among computed backgrounds, so the drawer matches the site theme
  function opaqueColor(colors, fallback) {
    for (const c of colors) {
      const m = /^rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/.exec(String(c).trim());
      if (!m) continue;
      const a = m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
      if (a > 0.5) return `rgb(${m[1]}, ${m[2]}, ${m[3]})`;
    }
    return fallback;
  }

  if (typeof window === 'undefined') {
    module.exports = { threadLink, insertQuote, clampWidth, opaqueColor, readyAccepted, MIN_W, MAX_W, LIST_MIN };
    return;
  }

  if (window.__krState) return;
  const state = (window.__krState = { drawer: null });

  let embedded = false;
  try {
    embedded = window.name === FRAME_NAME && window.parent !== window && !!window.parent.__krState;
  } catch {
    embedded = false;
  }

  // set in start(): at document-start the <html> element may not exist yet
  let root = null;

  const CSS = `
html.kr { --kr-bg: #fff; --kr-line: color-mix(in srgb, currentColor 16%, transparent); --kr-drawer-w: 560px; }
html.kr body { font-family: system-ui, -apple-system, "PingFang TC", "Noto Sans TC", "Microsoft JhengHei", sans-serif; }
html.kr #threads .quote { font-size: 15px; line-height: 1.75; }
html.kr #threads .thread { max-width: 1100px; margin: 0 auto 18px; padding: 12px 16px 14px; border: 1px solid var(--kr-line);
  border-radius: 14px; background: color-mix(in srgb, currentColor 3%, transparent); }
html.kr #threads .thread > hr { display: none; }
html.kr #threads .thread.kr-active { outline: 2px solid color-mix(in srgb, currentColor 45%, transparent); outline-offset: 2px; }
html.kr #threads .post.reply { border-radius: 10px; padding: 6px 12px; max-width: calc(100% - 24px); box-sizing: border-box; }
html.kr #threads .post-head { line-height: 1.6; }
html.kr .kr-side-open { margin-left: 8px; padding: 2px 10px; border: 1px solid var(--kr-line); border-radius: 999px;
  background: transparent; color: inherit; font: inherit; font-size: 13px; cursor: pointer; }
html.kr .kr-side-open:hover { background: color-mix(in srgb, currentColor 8%, transparent); }

/* the site's form, floating; collapsed it is a pill (board) or a bar (thread) */
html.kr .kr-composer { position: fixed; z-index: 9001; right: 16px; bottom: 16px; width: min(480px, calc(100vw - 32px));
  max-height: calc(100vh - 32px); overflow: auto; box-sizing: border-box; margin: 0; background: var(--kr-bg); color: inherit;
  border: 1px solid var(--kr-line); border-radius: 16px; box-shadow: 0 10px 32px rgba(0, 0, 0, .2); }
html.kr .kr-composer #postform { padding: 4px 12px 12px; }
/* folded: clipped, not display:none, so the Turnstile frame keeps running; absolute so the hidden
   table does not widen the pill */
html.kr .kr-composer[data-kr-state="collapsed"] #postform { position: absolute; left: 0; width: 440px; max-height: 0; padding: 0; overflow: hidden; }
html.kr .kr-composer #postinfo .post-notices, html.kr .kr-composer #postinfo .post-instructions,
html.kr .kr-composer .bar_reply, html.kr-embed .kr-composer .kr-backlink { display: none; }
html.kr .kr-composer #postform_tbl { width: 100%; margin: 0 !important; }
html.kr .kr-composer #postform_tbl td.Form_bg { width: 5em; white-space: nowrap; }
html.kr .kr-composer #fcom { width: 100% !important; height: 9em !important; box-sizing: border-box; resize: vertical; font: inherit; }
html.kr .kr-composer #fname, html.kr .kr-composer #fsub, html.kr .kr-composer input[name="category"] { width: 70%; box-sizing: border-box; }
html.kr .kr-composer-bar { position: sticky; top: 0; z-index: 1; display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: var(--kr-bg); }
html.kr .kr-composer-toggle { flex: 1; min-height: 28px; padding: 0; border: 0; background: none; color: inherit; font: inherit;
  font-size: 15px; font-weight: 600; text-align: left; cursor: pointer; }
html.kr .kr-composer-close { display: none; width: 32px; height: 32px; border: 0; border-radius: 8px; background: none; color: inherit;
  font-size: 20px; line-height: 1; cursor: pointer; }
html.kr .kr-composer[data-kr-state="expanded"] .kr-composer-close { display: block; }
html.kr .kr-composer-close:hover { background: color-mix(in srgb, currentColor 10%, transparent); }
html.kr-top .kr-composer.kr-new[data-kr-state="collapsed"] { width: auto; border-radius: 999px; }
html.kr .kr-composer.kr-reply { left: 12px; right: 12px; bottom: 12px; width: auto; max-width: 820px; margin: 0 auto; }
html.kr .kr-composer.kr-reply[data-kr-state="expanded"] { max-height: 75vh; }
html.kr .kr-composer.kr-reply[data-kr-state="collapsed"] .kr-composer-toggle { font-weight: 400; opacity: .75; }
html.kr body.kr-has-reply { padding-bottom: 88px; }

/* drawer: the thread page in a same-origin frame, beside the board */
html.kr .kr-drawer { position: fixed; z-index: 9000; top: 0; right: 0; bottom: 0; width: var(--kr-drawer-w); display: flex;
  flex-direction: column; box-sizing: border-box; background: var(--kr-bg); color: inherit; border-left: 1px solid var(--kr-line);
  box-shadow: -10px 0 30px rgba(0, 0, 0, .14); transform: translateX(100%); visibility: hidden; transition: transform .18s ease, visibility .18s; }
html.kr.kr-drawer-open .kr-drawer { transform: none; visibility: visible; }
html.kr.kr-drawer-open body { margin-right: var(--kr-drawer-w); }
html.kr.kr-drawer-open .kr-composer.kr-new { right: calc(var(--kr-drawer-w) + 16px); }
html.kr .kr-drawer-head { display: flex; align-items: center; gap: 6px; padding: 8px 10px 8px 14px; border-bottom: 1px solid var(--kr-line); font-size: 14px; }
html.kr .kr-drawer-title { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 600; font-size: 15px; }
html.kr .kr-drawer-head a, html.kr .kr-drawer-head button { flex: none; padding: 4px 10px; border: 1px solid var(--kr-line); border-radius: 8px;
  background: none; color: inherit; font: inherit; text-decoration: none; cursor: pointer; }
html.kr .kr-drawer-head .kr-drawer-close { width: 34px; padding: 4px 0; border: 0; font-size: 20px; line-height: 1; }
html.kr .kr-drawer-head a:hover, html.kr .kr-drawer-head button:hover { background: color-mix(in srgb, currentColor 8%, transparent); }
html.kr .kr-drawer-frame { flex: 1; width: 100%; border: 0; background: var(--kr-bg); }
html.kr .kr-drawer-resize { position: absolute; top: 0; bottom: 0; left: -5px; width: 10px; cursor: col-resize; }
html.kr.kr-resizing, html.kr.kr-resizing * { cursor: col-resize !important; user-select: none !important; }
html.kr.kr-resizing .kr-drawer-frame { pointer-events: none; }
@media (max-width: 899px) {
  html.kr .kr-drawer { width: 100vw; }
  html.kr.kr-drawer-open body { margin-right: 0; overflow: hidden; }
  html.kr .kr-drawer-resize { display: none; }
}

/* inside the drawer only the thread and the reply form are left */
html.kr-embed #header, html.kr-embed #board-post-divider-start, html.kr-embed #board-post-transition, html.kr-embed #board-post-divider-end,
html.kr-embed #footer, html.kr-embed #page_switch, html.kr-embed #mobile-ad, html.kr-embed #web-ad { display: none !important; }
html.kr-embed body { margin: 0; padding: 12px 12px 96px; }
html.kr-embed #threads .thread { border: 0; padding: 0; background: none; }
html.kr .kr-flash { animation: kr-flash 1.6s ease-out; }
@keyframes kr-flash { from { box-shadow: 0 0 0 3px color-mix(in srgb, currentColor 50%, transparent); } to { box-shadow: 0 0 0 3px transparent; } }
`;

  const el = (tag, attrs = {}, text) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    if (text !== undefined) n.textContent = text;
    return n;
  };

  function syncTheme() {
    const colors = [document.body, root].filter(Boolean).map((n) => getComputedStyle(n).backgroundColor);
    root.style.setProperty('--kr-bg', opaqueColor(colors, '#fff'));
  }

  function watchTheme() {
    syncTheme();
    window.addEventListener('load', syncTheme, { once: true });
    document.getElementById('theme-selector')?.addEventListener('change', () => setTimeout(syncTheme, 150));
    const link = document.querySelector('link.second-style');
    if (link) {
      new MutationObserver(() => setTimeout(syncTheme, 150)).observe(link, { attributes: true, attributeFilter: ['href'] });
      link.addEventListener('load', syncTheme);
    }
  }

  // ---- composer: the site's own #postform_main, made to float. It is never moved or cloned:
  // moving the node would reload the Turnstile frame and drop its token.
  const composer = { form: null, resto: null };

  function setupComposer() {
    const form = document.getElementById('postform_main');
    if (!form) return;
    const resto = form.querySelector('input[name="resto"]')?.value || null;
    composer.form = form;
    composer.resto = resto;
    form.classList.add('kr-composer', resto ? 'kr-reply' : 'kr-new');
    if (resto) document.body.classList.add('kr-has-reply');

    const bar = el('div', { class: 'kr-composer-bar' });
    const toggle = el('button', { type: 'button', class: 'kr-composer-toggle', 'aria-expanded': 'false' });
    const close = el('button', { type: 'button', class: 'kr-composer-close', 'aria-label': '收起', title: '收起（Esc）' }, '×');
    bar.append(toggle, close);
    form.insertBefore(bar, form.firstChild);

    // "[回到版面]" would turn the drawer into the board; wrap it, brackets included, so CSS can drop it there
    const back = form.querySelector('#postform > a[href^="index.htm"]');
    if (back) {
      const wrap = el('span', { class: 'kr-backlink' });
      const prev = back.previousSibling;
      const next = back.nextSibling;
      back.before(wrap);
      if (prev?.nodeType === 3 && prev.data.endsWith('[')) {
        prev.data = prev.data.slice(0, -1);
        wrap.append('[');
      }
      wrap.append(back);
      if (next?.nodeType === 3 && next.data.startsWith(']')) {
        next.data = next.data.slice(1);
        wrap.append(']');
      }
    }

    toggle.addEventListener('click', () => (form.dataset.krState === 'expanded' && !resto ? collapse() : expand(true)));
    close.addEventListener('click', collapse);
    form.addEventListener('focusin', (e) => {
      if (!bar.contains(e.target)) expand(false);
    });
    collapse();
  }

  function setLabel() {
    const { form, resto } = composer;
    const toggle = form.querySelector('.kr-composer-toggle');
    const open = form.dataset.krState === 'expanded';
    toggle.textContent = resto ? (open ? `回覆 No.${resto}` : `✎ 回覆 No.${resto}⋯（點任一則的 No. 可引用）`) : '✎ 發新串';
    toggle.setAttribute('aria-expanded', String(open));
  }

  function expand(focus) {
    const { form } = composer;
    if (!form) return;
    form.dataset.krState = 'expanded';
    setLabel();
    if (focus) document.getElementById('fcom')?.focus({ preventScroll: true });
  }

  function collapse() {
    const { form } = composer;
    if (!form) return;
    form.dataset.krState = 'collapsed';
    setLabel();
    if (form.contains(document.activeElement)) document.activeElement.blur();
  }

  function quoteIntoComposer(no) {
    const ta = document.getElementById('fcom');
    if (!ta) return false;
    expand(false);
    const r = insertQuote(ta.value, ta.selectionStart ?? ta.value.length, ta.selectionEnd ?? ta.value.length, no);
    ta.value = r.value;
    ta.focus({ preventScroll: true });
    ta.setSelectionRange(r.caret, r.caret);
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  }

  function flashPost(no) {
    const post = document.getElementById(`r${no}`);
    if (!post) return;
    post.scrollIntoView({ block: 'center' });
    post.classList.remove('kr-flash');
    void post.offsetWidth;
    post.classList.add('kr-flash');
  }

  // No. in a post head: the site opens its own quick-reply box there. Quote into the floating form instead.
  function onHeadNumber(e, handle) {
    const q = e.target.closest?.('.post-head .qlink');
    if (!q || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const post = q.closest('.post');
    const no = Number(post?.getAttribute('data-no'));
    if (!no) return;
    const op = Number(q.closest('.thread')?.getAttribute('data-no')) || no;
    e.preventDefault();
    e.stopPropagation();
    handle(no, op);
  }

  // ---- drawer (top-level board page)
  function setupDrawer() {
    const drawer = el('aside', { class: 'kr-drawer', 'aria-label': '討論串' });
    const resize = el('div', { class: 'kr-drawer-resize', title: '拖曳調整寬度' });
    const head = el('header', { class: 'kr-drawer-head' });
    const title = el('span', { class: 'kr-drawer-title' });
    const newtab = el('a', { class: 'kr-drawer-newtab', target: '_blank', rel: 'noopener' }, '新分頁');
    const reload = el('button', { type: 'button', class: 'kr-drawer-reload', title: '重新載入這串' }, '重新整理');
    const close = el('button', { type: 'button', class: 'kr-drawer-close', 'aria-label': '關閉', title: '關閉（Esc）' }, '×');
    const frame = el('iframe', { class: 'kr-drawer-frame', name: FRAME_NAME, title: '討論串內容' });
    head.append(title, newtab, reload, close);
    drawer.append(resize, head, frame);
    document.body.appendChild(drawer);

    const d = (state.drawer = { el: drawer, frame, title, newtab, res: null, loading: null, ready: false, pending: [] });

    let width = null;
    try {
      width = Number(localStorage.getItem(WIDTH_KEY)) || null;
    } catch {
      width = null;
    }
    const applyWidth = () => root.style.setProperty('--kr-drawer-w', `${clampWidth(width, window.innerWidth)}px`);
    applyWidth();
    window.addEventListener('resize', applyWidth);

    resize.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      resize.setPointerCapture(e.pointerId);
      root.classList.add('kr-resizing');
      const move = (ev) => {
        width = window.innerWidth - ev.clientX;
        applyWidth();
      };
      // lostpointercapture follows pointerup and pointercancel alike
      const up = () => {
        root.classList.remove('kr-resizing');
        resize.removeEventListener('pointermove', move);
        width = clampWidth(width, window.innerWidth);
        try {
          localStorage.setItem(WIDTH_KEY, String(width));
        } catch {
          /* private mode: the width just is not remembered */
        }
      };
      resize.addEventListener('pointermove', move);
      resize.addEventListener('lostpointercapture', up, { once: true });
    });

    close.addEventListener('click', closeDrawer);
    reload.addEventListener('click', () => {
      d.ready = false;
      try {
        frame.contentWindow.location.reload();
      } catch {
        frame.src = frame.src;
      }
    });

    const markReady = () => {
      d.loading = null;
      d.ready = true;
      for (const msg of d.pending.splice(0)) frame.contentWindow.postMessage(msg, location.origin);
    };

    window.addEventListener('message', (e) => {
      if (e.origin !== location.origin || e.source !== frame.contentWindow || !e.data || typeof e.data.kr !== 'string') return;
      if (e.data.kr === 'ready') {
        const res = /^\d+$/.test(String(e.data.res || '')) ? Number(e.data.res) : null;
        if (!readyAccepted(d.loading, res)) return;
        if (res) setThread(res, e.data.title);
        else leaveThread(e.data.title, e.data.href);
        markReady();
      } else if (e.data.kr === 'close') {
        closeDrawer();
      }
    });

    // the requested page loaded but never said ready (an error page, say): stop waiting for it
    frame.addEventListener('load', () => {
      if (d.loading === null) return;
      let href = '';
      try {
        href = frame.contentWindow.location.href;
      } catch {
        return;
      }
      if (threadLink(href, location.href)?.res === d.loading) markReady();
    });
  }

  // the drawer moved off a thread (to the board, a module page): forget the thread so opening it reloads
  function leaveThread(titleText, href) {
    const d = state.drawer;
    d.res = null;
    d.title.textContent = String(titleText || '').trim() || '討論串以外的頁面';
    let same = null;
    try {
      same = new URL(String(href || ''), location.href);
    } catch {
      same = null;
    }
    if (same && same.origin === location.origin) d.newtab.href = same.href;
    else d.newtab.removeAttribute('href');
    for (const n of document.querySelectorAll('#threads .thread.kr-active')) n.classList.remove('kr-active');
  }

  function setThread(res, titleText) {
    const d = state.drawer;
    d.res = res;
    const listTitle = document.querySelector(`#threads .thread[data-no="${res}"] .threadpost .title`)?.textContent?.trim();
    const t = (titleText || listTitle || '').trim();
    d.title.textContent = t && t !== '無題' ? `${t}　No.${res}` : `No.${res}`;
    d.newtab.href = `pixmicat.php?res=${res}`;
    for (const n of document.querySelectorAll('#threads .thread.kr-active')) n.classList.remove('kr-active');
    document.querySelector(`#threads .thread[data-no="${res}"]`)?.classList.add('kr-active');
  }

  function sendToFrame(msg) {
    const d = state.drawer;
    if (d.ready) d.frame.contentWindow.postMessage(msg, location.origin);
    else d.pending.push(msg);
  }

  function openDrawer(res, { post = null, quote = null } = {}) {
    const d = state.drawer;
    if (!d) return;
    if (d.res !== res) {
      d.loading = res;
      d.ready = false;
      d.pending = [];
      d.frame.src = `pixmicat.php?res=${res}`;
    }
    setThread(res);
    root.classList.add('kr-drawer-open');
    if (post && post !== res) sendToFrame({ kr: 'scroll', post });
    if (quote) sendToFrame({ kr: 'quote', no: quote });
  }

  function closeDrawer() {
    const d = state.drawer;
    if (!d || !root.classList.contains('kr-drawer-open')) return;
    root.classList.remove('kr-drawer-open');
    for (const n of document.querySelectorAll('#threads .thread.kr-active')) n.classList.remove('kr-active');
    // blank the frame so a playing video in it stops
    d.frame.src = 'about:blank';
    d.res = null;
    d.loading = null;
    d.ready = false;
    d.pending = [];
  }

  // an "open beside" button under every thread whose replies are cut short on the board page
  function decorateThreads(scope) {
    for (const warn of scope.querySelectorAll('#threads .threadpost .warn_txt2')) {
      if (warn.dataset.krDone) continue;
      warn.dataset.krDone = '1';
      const res = Number(warn.closest('.thread')?.getAttribute('data-no'));
      if (!res) continue;
      const btn = el('button', { type: 'button', class: 'kr-side-open', 'data-res': String(res) }, '在側邊看全部回應 ▸');
      warn.after(btn);
    }
  }

  function initTop() {
    setupDrawer();
    decorateThreads(document);
    const threads = document.getElementById('threads');
    if (threads) new MutationObserver(() => decorateThreads(document)).observe(threads, { childList: true });

    window.addEventListener(
      'click',
      (e) => {
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        const btn = e.target.closest?.('.kr-side-open');
        if (btn) {
          e.preventDefault();
          openDrawer(Number(btn.dataset.res));
          return;
        }
        if (!e.target.closest?.('#threads')) return;
        // on a thread page the No. quotes into this page's own form (see init)
        if (!composer.resto) onHeadNumber(e, (no, op) => openDrawer(op, { quote: no }));
        if (e.defaultPrevented) return;
        const a = e.target.closest('a[href]');
        if (!a || (a.target && a.target !== '_self')) return;
        const link = threadLink(a.getAttribute('href'), location.href);
        if (!link || String(link.res) === composer.resto) return;
        e.preventDefault();
        e.stopPropagation();
        openDrawer(link.res, { post: link.post });
      },
      true,
    );
  }

  function initEmbed() {
    // a board or module page opened inside the drawer has no resto
    const res = composer.resto;
    const title = res ? document.querySelector('#threads .threadpost .title')?.textContent || '' : document.title;
    window.addEventListener('message', (e) => {
      if (e.origin !== location.origin || e.source !== window.parent || !e.data) return;
      if (e.data.kr === 'quote' && /^\d+$/.test(String(e.data.no))) {
        flashPost(Number(e.data.no));
        quoteIntoComposer(Number(e.data.no));
      } else if (e.data.kr === 'scroll' && /^\d+$/.test(String(e.data.post))) {
        flashPost(Number(e.data.post));
      }
    });
    window.parent.postMessage({ kr: 'ready', res, title, href: location.href }, location.origin);
  }

  function onKey(e) {
    if (e.key !== 'Escape' || e.isComposing) return;
    const { form } = composer;
    if (form && form.dataset.krState === 'expanded' && form.contains(document.activeElement)) {
      collapse();
      return;
    }
    if (embedded) window.parent.postMessage({ kr: 'close' }, location.origin);
    else closeDrawer();
  }

  function init() {
    watchTheme();
    setupComposer();
    if (composer.resto) window.addEventListener('click', (e) => onHeadNumber(e, (no) => quoteIntoComposer(no)), true);
    document.addEventListener('keydown', onKey);
    if (embedded) initEmbed();
    else initTop();
  }

  function start() {
    root = document.documentElement;
    root.classList.add('kr', embedded ? 'kr-embed' : 'kr-top');
    const style = document.createElement('style');
    style.id = 'kr-style';
    style.textContent = CSS;
    (document.head || root).appendChild(style);
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
    else init();
  }

  if (document.documentElement) start();
  else {
    new MutationObserver((_, mo) => {
      if (!document.documentElement) return;
      mo.disconnect();
      start();
    }).observe(document, { childList: true });
  }
})();
