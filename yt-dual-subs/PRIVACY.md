# Privacy policy: Dual Subs (YouTube Dual Subtitles)

Applies to the Chrome extension "Dual Subs / 雙語字幕" and the userscript "YouTube Dual Subtitles", which are the same code. Last updated 2026-10-15.

**It collects nothing.** No personal data, no browsing history, no analytics, no crash reports. Nothing is sent to the developer or to any third party, and there is no server of ours for anything to be sent to.

What it does touch, all inside your own browser:

- **YouTube's caption files.** On a YouTube watch page it reads the caption request the YouTube player itself makes, and asks YouTube for the same captions in a second language (YouTube's own translation). These requests go to youtube.com only, exactly like the player's own.
- **Your settings.** On/off, the two languages, box colour, gap and sizes are saved in youtube.com's local storage in your browser, under the key `ytds-settings`. They never leave your browser. Clearing youtube.com's site data deletes them; removing the extension leaves that small record in place, unused.
- **Your browser language** is read once to choose the default top language.

What it changes on the page: it adds its caption line, a button and a menu to the player; it may switch the player's caption track (the same as picking one from the CC menu) so the original language is on the bottom line; and while both lines show, it restyles the player's caption to match.

It runs only on `https://www.youtube.com/*`. It does not load or run code from anywhere else.

Questions: https://github.com/operonlab/userscripts/issues

---

# 隱私權政策：雙語字幕 Dual Subs

適用於 Chrome 擴充功能「雙語字幕 Dual Subs」與使用者腳本「YouTube Dual Subtitles」，兩者是同一份程式碼。最後更新 2026-10-15。

**不蒐集任何資料。** 沒有個人資料、沒有瀏覽紀錄、沒有分析或錯誤回報。不會傳送任何東西給開發者或第三方，我們也沒有任何伺服器可以接收。

它只在你的瀏覽器裡碰到這些：

- **YouTube 的字幕檔**：在 YouTube 觀看頁上，讀取 YouTube 播放器自己發出的字幕請求，再向 YouTube 要同一份字幕的第二種語言（YouTube 自己的翻譯）。這些請求只送往 youtube.com，跟播放器自己的請求一樣。
- **你的設定**：開關、上下語言、底色、間距與字級，存在你瀏覽器裡 youtube.com 的本機儲存空間（`ytds-settings`），不會離開你的瀏覽器。清除 youtube.com 的網站資料就會刪除；移除擴充後這筆小紀錄會留著，但不再被使用。
- **瀏覽器語言**：只讀取一次，用來決定預設的上方語言。

它對頁面做的改變：在播放器加上它的字幕行、一個按鈕和一個選單；為了讓下方顯示原文，可能會切換播放器的字幕軌（跟你自己從 CC 選單挑一條一樣）；兩行同時顯示時，會把播放器的字幕改成相配的樣式。

只在 `https://www.youtube.com/*` 上執行，不會從其他地方載入或執行程式碼。

問題回報：https://github.com/operonlab/userscripts/issues
