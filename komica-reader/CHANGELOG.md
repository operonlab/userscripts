<!-- doctype: narrative -->
# Changelog

Userscript managers update a script only when `@version` goes up, so every version you can receive is listed here.

## 0.4.0 — 2026-10-27

- **A thread shows up at once.** The pane used to load the whole thread page with all of the site's scripts: 2.4 s before anything appeared. It now shows the OP and the replies the board already has straight away (under 0.1 s) and fills in the rest when the server answers (0.5 to 3 s, the server's own time). The row under the pointer and the row after the one you open are fetched ahead.
- **Images are full size in the thread.** No more clicking each thumbnail; click an image for full screen. `[hidepix]` media stays blurred until clicked.
- **New look, after macOS:** a toolbar on top of the list (the site's header links and theme are in its **⋯** menu), a translucent sidebar with accent selection, list rows like a mail list, and dark mode that follows the system while the site theme is 預設.
- Hover `>>No.` in a thread to preview the post; each post lists who replied to it.
- Replies are written in the board's own form, which now floats over the open thread. It posts into a hidden frame, so the list stays put, and keeps your text unless the post is confirmed.
- The thread pane no longer has the site's votes, report or edit buttons; **↗** opens the thread in a new tab for those.

## 0.3.0 — 2026-10-27

- Added a searchable board sidebar on the 綜合 page and in the desktop portal's menu frame. Stars, recent boards, folded categories, and sidebar visibility use userscript storage across hosts.
- Added current-board highlighting, dimmed 連不上 tags (with the survey date) on boards that were unreachable, kept in their own category, and a 248px portal menu column. The board sidebar becomes an overlay on narrow screens.
- The board list is generated from the survey with `research/build-boards.mjs` and checked with `--check`.
- The 18禁 section asks for a birth year, as the portal does, and remembers the answer across hosts.
- Board rows are compact (thumbnail, title, three lines); clicking the thumbnail opens the thread instead of expanding the image inside the list.

## 0.2.0 — 2026-10-27

- The board is now a master list: replies are collapsed by default, with a reply count, latest time, and a button to peek at recent replies. Clicking a card opens the full thread.
- On wide screens the detail pane stays docked, with an empty state until a thread is selected. Esc or × clears the selection. On narrow screens it opens full-screen, with **‹ 列表** to go back.
- **j** and **k** select nearby threads; **Enter** or **o** opens the selected thread.

## 0.1.0 — 2026-10-27

First release, for `gaia.komica1.org/00b/`.

- A thread opens in a drawer beside the board. Use **[回應]**, **在側邊看全部回應 ▸**, or a `>>No.` link into another thread. The drawer is resizable and closes with Esc.
- The post form floats instead of sitting at the top of the page: a **✎ 發新串** pill on the board, a reply bar at the bottom of a thread. Clicking **No.** quotes into it.
- Threads are shown as cards with a more comfortable line height.
