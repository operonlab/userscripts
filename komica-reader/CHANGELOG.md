<!-- doctype: narrative -->
# Changelog

Userscript managers update a script only when `@version` goes up, so every version you can receive is listed here.

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
