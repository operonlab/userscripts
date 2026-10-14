# Chrome Web Store listing: Dual Subs / 雙語字幕

Everything the developer dashboard asks for, in the order it asks. Upload `dist/yt-dual-subs-<version>.zip` from `bash scripts/build-extension.sh yt-dual-subs`.

**Submit only after this folder is on `main` of github.com/operonlab/userscripts**: the privacy-policy and homepage URLs below must resolve when the reviewer opens them.

## Package

- **Name / short description**: come from the zip (`_locales/*/messages.json`); the dashboard shows them read-only.
- **Languages**: English (default), 中文（繁體）, 中文（简体）. Add a listing description for each below. (Chrome has no zh_HK locale; Hong Kong users see the zh_TW or English text.)

## Store listing

- **Category**: Education. (Alternatives: Accessibility, Entertainment. Language learners are the core audience.)
- **Homepage URL**: https://github.com/operonlab/userscripts/tree/main/yt-dual-subs
- **Support URL**: https://github.com/operonlab/userscripts/issues
- **Mature content**: No
- **Graphic assets** (in `store/`): icon is in the zip (`icons/128.png`); `screenshot-*.png` 1280×800; `promo-small.png` 440×280.

### Description: English

```
Watch YouTube with two caption lines: your language on top, the original language right below it, like the bilingual subtitles of classic Hong Kong films.

• Your language on top, larger; the original underneath, smaller, both centred on one caption box.
• A video that is already in your language keeps YouTube's ordinary single line.
• Uses YouTube's own captions only: a human track in your language when the video has one, otherwise YouTube's own translation. No account, no API key, nothing to pay.
• Auto-generated captions stay steady: one sentence at a time, no jumping lines.
• A settings menu beside the CC button, in the player's own style: on/off, top and bottom language (with search), box colour and opacity, line gap and sizes.
• YouTube's own captions are never hidden. If anything goes wrong, you still have them.
• To put the original language on the bottom line, it may switch the player's caption track, the same as picking one from the CC menu; while both lines show, it restyles the player's caption to match.

Privacy: collects no data at all. It runs only on youtube.com, talks only to youtube.com, and keeps your settings in your own browser. Policy: https://github.com/operonlab/userscripts/blob/main/yt-dual-subs/PRIVACY.md

Open source (MIT): https://github.com/operonlab/userscripts
Also available as a userscript for Tampermonkey / Violentmonkey.

Not affiliated with or endorsed by YouTube or Google.
```

### Description: 中文（繁體）

```
用兩行字幕看 YouTube：上方是你的語言，下方緊貼著原文，就像經典港片的中英字幕。

• 你的語言在上、字大；原文在下、字小，兩行置中排在同一塊字幕底色上。
• 影片本身就是你的語言時，維持 YouTube 一般的單行字幕。
• 只用 YouTube 自己的字幕：影片有你的語言的人工字幕就用人工字幕，沒有就用 YouTube 自己的翻譯。不需帳號、不需 API 金鑰、不用付費。
• 自動產生的字幕不再跳動：一次一句，不會上下亂跳。
• CC 按鈕旁有設定選單，樣式跟播放器一致：開關、上下語言（可搜尋）、底色與透明度、行距與字級。
• 從不隱藏 YouTube 原本的字幕，萬一出問題，原生字幕照樣在。
• 為了讓下方顯示原文，它可能會切換播放器的字幕軌，效果跟你自己從 CC 選單挑一條一樣；兩行同時顯示時，會把播放器的字幕改成相配的樣式。

隱私：完全不蒐集資料。只在 youtube.com 執行、只連 youtube.com，設定存在你自己的瀏覽器。隱私權政策：https://github.com/operonlab/userscripts/blob/main/yt-dual-subs/PRIVACY.md

開放原始碼（MIT）：https://github.com/operonlab/userscripts
也有 Tampermonkey／Violentmonkey 使用者腳本版本。

本擴充與 YouTube、Google 無關，亦未獲其背書。
```

### Description: 中文（简体）

```
用两行字幕看 YouTube：上方是你的语言，下方紧贴着原文，就像经典港片的中英字幕。

• 你的语言在上、字大；原文在下、字小，两行居中排在同一块字幕底色上。
• 视频本身就是你的语言时，保持 YouTube 普通的单行字幕。
• 只用 YouTube 自己的字幕：视频有你的语言的人工字幕就用人工字幕，没有就用 YouTube 自己的翻译。不需要账号、不需要 API 密钥、不用付费。
• 自动生成的字幕不再跳动：一次一句，不会上下乱跳。
• CC 按钮旁有设置菜单，样式与播放器一致：开关、上下语言（可搜索）、底色与透明度、行距与字号。
• 从不隐藏 YouTube 原本的字幕，万一出问题，原生字幕照样在。
• 为了让下方显示原文，它可能会切换播放器的字幕轨，效果跟你自己从 CC 菜单选一条一样；两行同时显示时，会把播放器的字幕改成相配的样式。

隐私：完全不收集数据。只在 youtube.com 运行、只连接 youtube.com，设置保存在你自己的浏览器里。隐私政策：https://github.com/operonlab/userscripts/blob/main/yt-dual-subs/PRIVACY.md

开源（MIT）：https://github.com/operonlab/userscripts
也有 Tampermonkey／Violentmonkey 用户脚本版本。

本扩展与 YouTube、Google 无关，亦未获其背书。
```

## Privacy practices

- **Single purpose**: `Shows a second caption line on YouTube videos: the viewer's language above the original-language caption.`
- **Permission justification, host permission (www.youtube.com)**: `The content script runs only on YouTube watch pages. It reads the caption request the YouTube player makes and asks youtube.com for the same captions in a second language, then draws that line above the player's own caption.`
- **Remote code**: No, I am not using remote code. (All code is in the package; the only network requests fetch caption data, JSON, from youtube.com.)
- **Data usage**: tick nothing. It collects no user data of any kind.
- **Certifications**: tick all three (no selling data, no use unrelated to the single purpose, no creditworthiness use).
- **Privacy policy URL**: https://github.com/operonlab/userscripts/blob/main/yt-dual-subs/PRIVACY.md

## Distribution

- Free · Public · all regions.

## Account (once, by the account owner)

- Contact email verified; publisher display name `operonlab`.
- Trader status (EU Digital Services Act): **non-trader**. The extension is free with no ads, purchases or data monetisation. This is a declaration made in the owner's name, so the owner picks it.

## How the images were made

Frames from *Sintel* (© copyright Blender Foundation | www.sintel.org, CC BY 3.0; the credit is on each screenshot), played on YouTube with this extension loaded in Chromium at 2× scale, the channel's logo overlay hidden (logos are outside the film's licence). Headline and frame composed in HTML and rendered at exactly 1280×800 and 440×280. Re-shoot them when the menu or the caption look changes.
