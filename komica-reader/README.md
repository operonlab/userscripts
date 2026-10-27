<!-- doctype: contract -->
# Komica Reader

A userscript for Komica's 綜合 board (`gaia.komica1.org/00b/`) and the desktop portal menu at `komica1.org`.

- **The board is a master list of threads.** Replies are collapsed on the board; each card shows the total reply count and the latest reply time, with a button to peek at its latest replies. Rows are compact: an 88px thumbnail, the title and three lines of text; the file line, votes and categories stay in the thread itself. Click a card (its thumbnail included) or a `>>No.` link to read the full thread in the detail pane. At 900px and wider the pane stays docked on the right, even with no thread selected. Drag its left edge to resize it; the width is remembered. Esc or × clears the selection. Use **j** and **k** to move through the list, then **Enter** or **o** to open the selected card. On narrower screens the detail is a full-screen overlay with **‹ 列表** to return.
- **The form comes to you.** The post form no longer sits at the top of the page. On the board it is a **✎ 發新串** pill in the corner. On a thread, in the drawer or in its own tab, it is a reply bar along the bottom. Clicking a post's **No.** quotes it into that bar and opens it. Clicking a reply's No. on the board opens its thread in the drawer with the quote already in the form. Esc folds the form again.
- **One board sidebar in both places.** On a wide board page it occupies 248px on the left; **«** hides it and **☰** restores it. Under 900px, **☰** opens it over the list and Esc closes it. Search board names or categories, press Enter for the first result, or press **/** to focus search. Star boards and find them under **★ 書籤**; **最近** holds the last six top-level board visits. Categories fold independently. Boards that were unreachable at the last survey stay in their category, dimmed and tagged 連不上 with the survey date. The 18禁 section asks for a birth year first, the same check the portal makes; the answer is remembered. The portal's `menu` frame uses the same sidebar with the portal's live links, widens its frame to 248px, and opens normal boards in `cont`. External links open in a new tab. A board loaded in `cont` has no second sidebar.

Thread cards also get a slightly larger, easier line height. A thread opened in its own tab or in the detail pane still shows every reply.

## Two rules the design keeps

- **The site's own form is the form.** The script never builds its own POST. Komica's form uses random field names, honeypot fields and a Cloudflare Turnstile check. The script only makes the existing form float. It never moves that form in the page, because moving it would reload the Turnstile frame and drop its token. The site's own Quick Reply box is not used, since it has no Turnstile widget.
- **The detail pane is the thread page itself.** It is a same-origin frame of `pixmicat.php?res=N`. Hover previews, Replies(n), votes, image expand and the reply form all work there because they are the site's own code.

## Install

1. Install a userscript manager: [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/). In Chrome 138 and later, also turn on **Allow user scripts** on the manager's page in `chrome://extensions`.
2. Open [komica-reader.user.js](https://raw.githubusercontent.com/operonlab/userscripts/main/komica-reader/komica-reader.user.js) and accept the install.

## Limits

- The reading layout and floating form run only on `gaia.komica1.org/00b/`; navigation links to other boards use those boards' own pages. The sidebar also replaces only the desktop `komica1.org/bbsmenu.html` menu frame.
- Tampermonkey's `GM_getValue` and `GM_setValue` grants share stars, recent visits, folded categories, and sidebar visibility across board hosts. Without those APIs, the script falls back to each host's localStorage, so preferences then stay on that host.
- The site is changing quickly: in October 2026 its own scripts were updated almost daily. If the drawer or the form looks wrong after a site update, the board itself still works. Disable the script for that tab.
- The end-to-end test never submits a post. It checks that the form floats, opens, takes the quote, and still contains the Turnstile widget with the thread's `resto`. Posting itself has not been tested.

## Tests

- `node --test test/` runs the unit tests: thread link parsing, quote insertion, drawer width, theme colour, reply counts and times, and keyboard navigation.
- `node research/build-boards.mjs` refreshes the embedded board list from `research/survey-result.json`; add `--check` to fail if the generated list is stale.
- `node test/e2e.mjs [out-dir]` runs the live check in headless Chromium against the real board, using the `playwright` package. Set `PLAYWRIGHT_MODULE` to the package path if it cannot be resolved, and `KR_CHROMIUM` to a browser executable if Playwright's own build is not downloaded. It exits `0` pass, `1` a check failed, `2` could not check.
