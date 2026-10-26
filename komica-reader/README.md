# Komica Reader

A userscript for Komica's 綜合 board (`gaia.komica1.org/00b/`). It changes two things about reading and replying there:

- **A thread opens beside the board.** Its replies show in a drawer on the right while the board stays on the left. **[回應]**, the new **在側邊看全部回應 ▸** button under a thread with hidden replies, and any `>>No.` link into another thread all open the drawer. Drag the drawer's left edge to resize it; the width is remembered. Esc or × closes it.
- **The form comes to you.** The post form no longer sits at the top of the page. On the board it is a **✎ 發新串** pill in the corner. On a thread, in the drawer or in its own tab, it is a reply bar along the bottom. Clicking a post's **No.** quotes it into that bar and opens it. Clicking a reply's No. on the board opens its thread in the drawer with the quote already in the form. Esc folds the form again.

Threads also get a card layout and a slightly larger, easier line height.

## Two rules the design keeps

- **The site's own form is the form.** The script never builds its own POST. Komica's form uses random field names, honeypot fields and a Cloudflare Turnstile check. The script only makes the existing form float. It never moves that form in the page, because moving it would reload the Turnstile frame and drop its token. The site's own Quick Reply box is not used, since it has no Turnstile widget.
- **The drawer is the thread page itself.** It is a same-origin frame of `pixmicat.php?res=N`. Hover previews, Replies(n), votes, image expand and the reply form all work there because they are the site's own code.

## Install

1. Install a userscript manager: [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/). In Chrome 138 and later, also turn on **Allow user scripts** on the manager's page in `chrome://extensions`.
2. Open [komica-reader.user.js](https://raw.githubusercontent.com/operonlab/userscripts/main/komica-reader/komica-reader.user.js) and accept the install.

## Limits

- Only `gaia.komica1.org/00b/` for now. Komica's other boards are spread across many hosts and run different software.
- The site is changing quickly: in October 2026 its own scripts were updated almost daily. If the drawer or the form looks wrong after a site update, the board itself still works. Disable the script for that tab.
- The end-to-end test never submits a post. It checks that the form floats, opens, takes the quote, and still contains the Turnstile widget with the thread's `resto`. Posting itself has not been tested.

## Tests

- `node --test test/` runs the unit tests: thread link parsing, quote insertion, drawer width, theme colour.
- `node test/e2e.mjs [out-dir]` runs the live check in headless Chromium against the real board, using the `playwright` package. Set `PLAYWRIGHT_MODULE` to the package path if it cannot be resolved, and `KR_CHROMIUM` to a browser executable if Playwright's own build is not downloaded. It exits `0` pass, `1` a check failed, `2` could not check.
