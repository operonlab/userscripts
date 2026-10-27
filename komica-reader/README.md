<!-- doctype: contract -->
# Komica Reader

A userscript that turns Komica's 綜合 board (`gaia.komica1.org/00b/`, including its category views such as 動畫 or 新聞) and the desktop portal at `komica1.org` into a three-column reader in the style of a macOS mail app: boards on the left, threads in the middle, the thread you are reading on the right.

- **Threads are a list.** Each row shows a thumbnail, the title (an untitled thread just shows its text), three lines, the time in the corner, and the reply count. Replies stay folded; **展開最新 N 則** peeks at the latest ones in the row. Click a row, its thumbnail, or a `>>No.` link into another thread to read it. **j** and **k** move through the list.
- **The thread opens at once.** The OP and the replies the board already shows appear immediately. The rest of the thread is fetched in the background and filled in. A row the pointer rests on, and the row after the one you open, are fetched ahead. Images and videos are shown at full size, up to 70% of the window height; click an image to see it full screen. Media the poster marked `[hidepix]` stays blurred until clicked. Hover `>>No.` to preview that post; click it to jump there. Each post lists who replied to it. At 900px and wider the pane opens on the right when you choose a thread; drag its left edge to resize it, and × or Esc closes it so the list takes the whole width again. Narrower, it covers the list and **‹ 列表** goes back.
- **The form comes to you.** The site's own post form floats instead of sitting at the top of the page. With a thread open, it is a reply bar at the bottom of the pane; **No.** on any post quotes it there. **✎ 發新串** in the toolbar switches it to a new thread. Esc folds it; Esc again closes the thread.
- **One board sidebar, on the boards and in the portal.** Search (press **/**), **★ 書籤**, the last six boards under **最近**, and folding categories. Boards that were unreachable at the last survey stay in their category, dimmed and tagged 連不上. The 18禁 section asks for a birth year first, the same check the portal makes. In the portal's `menu` frame the sidebar uses the portal's live links and opens boards in the right-hand frame.
- **Light and dark.** The look follows the system appearance while the site theme is 預設, and the site's 夜間 theme when it is chosen in the toolbar's **⋯** menu, which also holds the site's own header links.

## Rules the design keeps

- **The site's own form is the form.** Komica's form uses random field names, honeypot fields and a Cloudflare Turnstile check, so the script never builds its own POST. It makes the existing form float, never moves, clones or hides it (moving it would reload the Turnstile frame and drop its token), and replies by adding a `resto` field to it, as the site's own Quick Reply does. The form posts into a hidden frame, so the list and the thread stay put. The text in the box is cleared only once the post is confirmed: the board page came back, or the reply turned up in the refetched thread. Anything else is reported as "看不出有沒有送出" and the text stays.
- **Post text is copied, not trusted.** The pane draws posts from the thread page's markup. Scripts, frames, event handlers, inline styles and `javascript:` links are dropped on the way.
- **What the pane does not have** is the site's own per-post tools: votes, report, the five-minute edit, and the ID popups. **↗** opens the thread in a new tab, where they all are.

## Install

1. Install a userscript manager: [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/). In Chrome 138 and later, also turn on **Allow user scripts** on the manager's page in `chrome://extensions`.
2. Open [komica-reader.user.js](https://raw.githubusercontent.com/operonlab/userscripts/main/komica-reader/komica-reader.user.js) and accept the install.

## Limits

- The reader runs on `gaia.komica1.org/00b/`. Links to Komica's other boards open those boards' own pages; they run other software on other hosts.
- Speed has a floor: the board's server takes 0.7 to 1.9 s to send a thread page (measured 2026-10-27). The script shows what it already has at once, but the full thread cannot arrive sooner than the server sends it.
- Stars, recent boards, folded categories and the 18禁 answer are shared across hosts through Tampermonkey's `GM_getValue`/`GM_setValue`; without them each host keeps its own.
- Posting has not been tested: the end-to-end test never submits. It checks that the form floats, takes the quote, carries the thread's `resto` and the Turnstile widget, and targets the hidden result frame.
- The site changes often: in October 2026 its scripts were updated almost daily. If something looks wrong after a site update, turn the script off for that tab; the board itself still works.

## Tests

- `node --test test/` runs the unit tests: links, quoting, widths, reply counts and times, keyboard steps, board URLs and search, the age check, media kinds and sizes, and how a post's result page is read.
- `node research/build-boards.mjs` refreshes the embedded board list from `research/survey-result.json`; add `--check` to fail if the list is stale.
- `node test/e2e.mjs [out-dir]` runs the live check in headless Chromium against the real board, using the `playwright` package. Set `PLAYWRIGHT_MODULE` to the package path if it cannot be resolved, and `KR_CHROMIUM` to a browser executable if Playwright's own build is not downloaded. It exits `0` pass, `1` a check failed, `2` could not check.
