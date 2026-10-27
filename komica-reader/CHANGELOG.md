<!-- doctype: narrative -->
# Changelog

Userscript managers update a script only when `@version` goes up, so every version you can receive is listed here.

## 0.6.7 — 2026-10-28

- **On a phone, a post's ▾ stays beside its number.** A dated post header is too long for a phone's width and breaks in two, and the ▾ (or the ⋯ beside an ID) often landed alone at the start of the next line, looking like it belonged to nothing. The number and its ▾ now move to the next line together, and so do an ID and its ⋯.
- **No cream strip above the bar.** 綜合's page keeps a thin margin above everything in the site's cream; in dark mode it showed above the reader's bar, and on a phone pulled down past the top. It is the list's colour now.
- **2cat's own ↑ ⟳ ↓ on a phone** sat under the floating 發新串 button, the ↓ hidden behind it. They are round grey buttons now, like 綜合's, stacked just above it.

## 0.6.6 — 2026-10-28

- **The site's ads are back, in the reader's style.** The reader had hidden them all. Now each one is a card of its own marked 廣告, where the site puts it and no longer floated beside a row: on 綜合 above the list, the site's wide-screen or phone banner as the site picks it; on 2cat among the threads, and on 2cat's older boards (職業) the column the site keeps beside the list, now a card above it. A slot the ad network left empty is not shown.
- **A row the pointer rests on is no longer fetched ahead.** Every row the pointer crossed cost the board's server a whole thread page, read or not. The row after the one you open is still fetched ahead, as before.

## 0.6.5 — 2026-10-27

- **Videos go fullscreen again from the komica1.org portal.** The portal shows boards in an old-style frame, and the browser lets nothing from another address inside it go fullscreen: every video's button was grey (on the plain site too). The portal's sidebar now opens a board as the page itself, with the reader's own sidebar. A board or thread found in a frame that cannot let it go fullscreen says so at the top, with a link that opens it as the page.

## 0.6.4 — 2026-10-27

- **No more flash of the old page between pages.** The reader can lay a page out only once the whole of it has arrived, and until then the browser showed the site's page half laid out, the old look, for a moment on every page change and more on a slow line. Now the reader's frame comes first: on a board the sidebar, a bar with the board's name and a spinner, and the list replaces the spinner when it is ready; on a thread page the bar and the spinner.

## 0.6.3 — 2026-10-27

- **Votes on 綜合 opened from 2cat.uk.** 2cat.uk shows its boards inside a frame, and the reader's sidebar opened other boards in that same frame, so 綜合 ended up inside 2cat.uk. There the browser blocks 綜合's own cookies as another site's, its vote identity among them, and every ▲▼ came to nothing. Boards on another site now open as the page itself. If a 綜合 board or thread is found inside another site's frame anyway, a line at the top says votes will not count there and opens it as the page. Both need the browser to say which site the frame is in, which Chrome and Safari do and Firefox does not; there it stays as before.

## 0.6.2 — 2026-10-27

- **Your own vote shows.** The site marks the ▲ or ▼ you gave red or blue; the reader had greyed that out, so a post you had already voted on looked untouched, and tapping it again (which changed nothing when tried on the live site) looked like a failed vote.
- **The site's floating ▲▼ at the right edge** (to the top and bottom of the page, not votes) are round grey buttons now, unlike the votes. On a phone with a thread open they scrolled the list hidden behind it, so they seemed to do nothing; there they now take the thread to its start or end. Elsewhere they scroll the page as on the site, and beside a thread on a wider screen they keep to the list's edge, as before.

## 0.6.1 — 2026-10-27

- **When the site pauses voting, the reader shows it.** The site then turns every ▲▼ off and puts up 系統忙碌，投票功能暫停，請稍後再試。 The reader had set that notice in small grey type, under the reply form on a phone with a thread open, and drew the turned-off ▲▼ like working ones, so a tap did nothing and nothing said why. The notice now keeps the site's warning colours and, on a phone with a thread open, sits above the folded reply form (the form, opened, still covers it); the turned-off ▲▼ are dimmed, and the pane's ▲▼ are off from the start as the site's are. When the site reopens voting, all of them work again.

## 0.6.0 — 2026-10-27

What users of the board asked for, and the site features they like, carried into the reader.

- **ID tools in the pane.** Once the thread is whole, each ID shows how many posts it has in it (×N, or 單發) and is coloured by that, as the site used to. Clicking an ID marks its posts and dims the rest. The site's ID menu (搜尋此 ID、隱藏此 ID) opens from the ⋯ beside it.
- **The site's ▾ post menu** on list rows and on every post in the pane (綜合): 檢舉, 隱藏此留言／此討論串, 加入圖書館／映畫館／備忘錄, 複製, each reading the right post, thread, name and words. Hiding from it applies in the pane at once, and Esc shuts the menu without closing the thread.
- **類別** show on list rows and under posts in the pane, as links to the site's category pages.
- **The form keeps the site's own lines**: 回應模式 with the view count, the site's notices (folded behind one line, 站方公告 · N 則) and its 發文說明與注意事項.
- An untitled thread's title no longer picks up the ▲▼ counts (0.5.2 showed 「…▲0▼0」).

## 0.5.2 — 2026-10-27

- **▲▼ are back**, on the list rows and under every post in the pane. They are the site's own: its handler sends the vote and the counts follow its answer. The site's setting that hides them hides them here too.
- **A low-rated post folds in the pane as it does on the site**, with 展開; one held for review shows the site's notice instead of its text. The pane used to show both the fold notice and the whole post.
- **Your own 隱藏設定 on the site apply in the pane**: replies from a hidden ID, with a hidden keyword, or on your 隱藏貼文清單 are kept out of sight, with a line saying how many and 暫時顯示. Jumping to one by its number shows them.
- **Videos in the pane take their own size** as soon as the file says what it is. They stayed the size of their thumbnail until played.
- The pager and the footer under the list are set as pills and a quiet line. Everything in them stays: the links, the credits, the notice and the visitor counter.

## 0.5.1 — 2026-10-27

- **Videos and thumbnails on GIF裡** (and the other boards on `cat.2nyan.org`). One post there links its file wrongly, and while it was on the page every thumbnail and video on the board went to an address that does not exist. Links like it are now set aside.
- Videos and GIFs that a board serves only through its own player page (2cat's 18禁 boards) show as their thumbnail with ▶; tapping it opens the board's player in the post.
- A list thumbnail that cannot load is left out instead of showing as a broken image.
- **Dark mode on the site's own thread pages**: posts take the reader's colors. They kept the site's beige under white text. 2cat's 推文 likewise, in the pane too.
- **2cat's form shows its fields.** They sat in a section the site keeps folded, so the floating form opened empty. They now also fit a phone's width, and 送出 is the reader's own button.

## 0.5.0 — 2026-10-27

- **2cat boards** (`2cat.org`, `2cat.uk`) get the same reader: list rows, the thread pane, the floating form and the sidebar. Both of 2cat's layouts are read, the older one (職業) and the newer one (手機遊戲).
- A long 2cat thread opens on its last page, as the site does; **載入全部** fetches every page and draws the whole thread. The site's own ALL link shows only the latest 100 replies.
- The sidebar finds the current board when its menu link redirects (`2cat.org/~career/` lands on `/career/`).
- A reply you have started stays with its thread: opening or closing another thread no longer moves it, and a new thread you have started no longer turns into a reply. **回覆** or **No.** moves it on purpose.
- Posting is judged more strictly. The text is cleared only when the post itself shows up: newer than anything the page knew and holding what was sent. An older post that happens to say the same short thing (推) no longer counts. A result page that never arrives, or that only reads its own address, ends in 看不出有沒有送出 rather than 送出中 for ever, and a result that turns up after that is still read. A reply that is only an image or only quotes cannot be told from anyone else's, so it always ends in 看不出: check the thread. What a late answer clears is only what was sent, never text typed since.
- Post text keeps fewer attributes, and links and images must be `http` or `https` as the browser reads them, so a `javascript:` link hidden behind a tab character no longer gets through.
- A long thread keeps the post you are reading in place when the rest arrives, a late answer no longer overwrites a newer one, and the error box's 在新分頁開啟 works on 2cat. The sidebar marks a board on its later pages and inside its threads too.
- Five 18禁 boards the portal still lists at dead addresses (動畫裡, 成人玩具, 偽娘裡, 知識裡, GIF裡) link to where they live now, `cat.2nyan.org`, and 2CAT links to `2cat.uk`. They are no longer tagged 連不上.

## 0.4.0 — 2026-10-27

- **A thread shows up at once.** The pane used to load the whole thread page with all of the site's scripts: 2.4 s before anything appeared. It now shows the OP and the replies the board already has straight away (under 0.1 s) and fills in the rest when the server answers (0.5 to 3 s, the server's own time). The row under the pointer and the row after the one you open are fetched ahead.
- **Images are full size in the thread.** No more clicking each thumbnail; click an image for full screen. `[hidepix]` media stays blurred until clicked.
- **New look, after macOS:** a toolbar on top of the list (the site's header links and theme are in its **⋯** menu), a translucent sidebar with accent selection, list rows like a mail list, and dark mode that follows the system while the site theme is 預設.
- Hover `>>No.` in a thread to preview the post; each post lists who replied to it.
- Replies are written in the board's own form, which now floats over the open thread. It posts into a hidden frame, so the list stays put, and keeps your text unless the post is confirmed.
- The thread pane no longer has the site's votes, report or edit buttons; **↗** opens the thread in a new tab for those.
- The pane is there only while a thread is open: × or Esc closes it and the list takes the whole width.

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
