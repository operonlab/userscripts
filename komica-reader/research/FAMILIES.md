# Komica 入口板型調查

資料來源：[survey-result.json](survey-result.json)，產生時間以其中 `generated_at` 為準。`ok` 表示 GET 成功，不保證該網址仍是討論板。以下只把有板頁 DOM 證據的站歸入具體板型；每個「觀察」都以本機 HTML 樣本為據，標為「推論」的 selector 尚待其他板或更多串頁驗證。`.samples/` 依 [.gitignore](.gitignore) 留在本機。

| 家族 | `ok` 筆數 | 代表入口 |
|---|---:|---|
| Pixmicat 2026 | 1 | [Gaia 綜合](https://gaia.komica1.org/00b/index.htm)（唯一成功板） |
| legacy Pixmicat | 24 | [rthost /sd/](http://rthost.win/sd/)、[GZone shopping](http://gzone-anime.info/UnitedSites/shopping/)、[Storysol](https://storysol.boguspix.com/) |
| 2cat Pixmicat | 19 | [career](https://2cat.org/~career/)、[artist](https://2cat.org/~artist/)、[astronomy](https://2cat.org/~astronomy/) |
| Tinyboard/vichan | 6 | [outremer](https://eclair.nagatoyuki.org/outremer/)、[myth](https://eclair.nagatoyuki.org/myth/)、[conseil](https://eclair.nagatoyuki.org/conseil/) |
| other/unknown | 15 | [站務公告](https://komica.blogspot.com/)、[rthost 繪圖板](http://rthost.win/aa/pbbs.html)、[akraft 服務頁](https://www.akraft.net/service/66a6eca2bfccee3f04a52bc4) |

`classic futaba table` 與 `kokonotsuba` 沒有可確認的 `ok` 板頁樣本；`<blockquote>`、`.rtd`、`td.reply` 等檢查欄位仍留在 JSON，不能由未連上的站名推定為這些家族。Gaia 的多個 `pixmicat2.php?c=…` 是同一 `/00b/` 板的分類視圖；已記錄全部分類 URL，只實際取 [index 樣本](.samples/gaia.komica1.org_00b_index_htm.html) 與一個 [動畫視圖樣本](.samples/gaia.komica1.org_00b_pixmicat2_php_c_E5_8B_95_E7_95_AB.html)。

## Pixmicat 2026

證據：[板頁樣本](.samples/gaia.komica1.org_00b_index_htm.html)、[串頁樣本](.samples/gaia.komica1.org_00b_pixmicat_php_res_30961947_thread.html)。板頁出現 `/common/js/script.js`、`.thread[data-no]`、`.post.threadpost`、`.post.reply`。

| 用途 | selector／規則 | 證據 |
|---|---|---|
| 串容器 | `.thread[data-no]` | 觀察：板頁、串頁 |
| OP／回覆 | `.post.threadpost`／`.post.reply` | 觀察：板頁、串頁 |
| 貼文編號 | `.post-head .qlink[data-no]` | 觀察：板頁 |
| 開串／回覆連結 | `.rlink a[href*="?res="]` | 觀察：板頁 |
| 省略回覆 | `.warn_txt2` | 觀察：板頁 |
| 完整串 URL | 同目錄 `pixmicat.php?res={threadNo}` | 觀察：板頁、串頁 |
| 投稿表單 | `#postform_main`，內含 `#postform` | 觀察：板頁、串頁 |
| 串號隱藏欄位 | `input[type="hidden"][name="resto"]` | 觀察：串頁 |
| CAPTCHA | `.cf-turnstile`；未見 `.g-recaptcha` | 觀察：板頁表單 |
| frame policy | 樣本回應無 `X-Frame-Options`、無 CSP `frame-ancestors` | 觀察：JSON 回應標頭 |

## legacy Pixmicat

證據：[rthost 板頁](.samples/rthost.win_sd.html)、[rthost 串頁](.samples/rthost.win_sd_pixmicat_php_res_353946_thread.html)、[GZone 板頁](.samples/gzone-anime.info_UnitedSites_shopping.html)。常見 `GazouBBS`／`Pixmicat!` 註解，與新版的 `.post.threadpost` 結構不同。

| 用途 | selector／規則 | 證據 |
|---|---|---|
| 串容器 | rthost 為 `#threads > .grid`；其他舊板未見統一容器 | 觀察：rthost 板頁；跨站通用性未確認 |
| OP／回覆 | `.threadpost`／`.reply` | OP 觀察：rthost；回覆推論：2cat 同系樣本，須逐板核對 |
| 貼文編號 | `a.qlink` | 觀察：rthost 板頁 |
| 開串／回覆連結 | `a[href*="pixmicat.php?res="]` | 觀察：rthost 板頁 |
| 省略回覆 | `.warn_txt2` | 觀察：rthost 板頁 |
| 完整串 URL | 同目錄 `pixmicat.php?res={threadNo}` | 觀察：rthost 板頁、串頁 |
| 投稿表單 | `#postform_main` | 觀察：rthost 板頁、串頁 |
| 串號隱藏欄位 | `input[type="hidden"][name="resto"]` | 觀察：rthost 串頁 |
| CAPTCHA | rthost 樣本未見 Turnstile 或 reCAPTCHA；其他站未知 | 觀察：rthost 板頁 |
| frame policy | rthost 樣本兩項標頭皆無；`kemono.wtako.net` 兩板回 `X-Frame-Options: SAMEORIGIN` 和 CSP `frame-ancestors https://komica1.org` | 觀察：JSON 回應標頭；不可概括整個家族 |

## 2cat Pixmicat

證據：[career 板頁](.samples/2cat.org_career.html)、[career 串頁](.samples/2cat.org_career_res_79556_thread.html)。這是 2cat.org 上實際有 Pixmicat 標記的 19 板；入口網址有些會導向別站，已另記為 `offsite-redirect`。

| 用途 | selector／規則 | 證據 |
|---|---|---|
| 串容器 | `#threads`；career 的 OP／回覆在其中，沒有每串獨立 `.thread` 包裹 | 觀察：career 板頁；跨板通用性未確認 |
| OP／回覆 | `.threadpost`／`.reply` | 觀察：career 板頁 |
| 貼文編號 | `a.qlink` | 觀察：career 板頁 |
| 開串／回覆連結 | `a.rlink[href*="res="]` | 觀察：career 板頁 |
| 省略回覆 | `.warn_txt2` | 觀察：career 板頁 |
| 完整串 URL | career 使用 `?res={threadNo}`；其他 2cat 板應由實際 href 決定 | 觀察：career 板頁、串頁；跨板形式推論 |
| 投稿表單 | `#postform_main`，action 指向 Pixmicat PHP | 觀察：career 板頁、串頁 |
| 串號隱藏欄位 | `input[type="hidden"][name="resto"]` | 觀察：career 串頁 |
| CAPTCHA | career 樣本未見 Turnstile 或 reCAPTCHA；其他板未知 | 觀察：career 板頁 |
| frame policy | career 樣本無 XFO、無 CSP `frame-ancestors` | 觀察：JSON 回應標頭 |
| 長串分頁 | 串頁預設開在**最後一頁**；`#page_switch` 列出 `[0] … [<b>目前</b>]`。舊版版型（career）參數是 `?res=N&page_num=P`，新版版型（cellphone）是 `?res=N&page=P`。新版的 `page=all`（標「顯示最後10頁」）**只回最新 100 則**，不是全串：要全串得逐頁抓 | 實測 2026-10-27：cellphone No.35532 列表 327 則，`page=all` 101 個 `id="rN"`，`page=0..10` 聯集 328；career No.79194 列表 70 則，`page_num=0..2` 聯集 71 |
| 新版版型的外框 | 新版（2cat.uk／2cat.org cellphone）把整頁包在執行期產生的 `#scroller`（`position:absolute; left:0; right:0`），body 的邊距對它無效 | 實測 2026-10-27，computed style |

## Tinyboard/vichan

證據：[outremer 板頁](.samples/eclair.nagatoyuki.org_outremer.html)、[outremer 串頁](.samples/eclair.nagatoyuki.org_outremer_res_458_html_thread.html)。頁尾明示 Tinyboard/vichan；六板都在 `eclair.nagatoyuki.org`。

| 用途 | selector／規則 | 證據 |
|---|---|---|
| 串容器 | `.thread[id^="thread_"]` | 觀察：outremer 板頁 |
| OP／回覆 | `.post.op`／`.post.reply` | 觀察：outremer 板頁、串頁 |
| 貼文編號 | `a.post_no` | 觀察：outremer 板頁 |
| 開串／回覆連結 | `a[href*="/res/"]`，位於 OP 的 `.intro` | 觀察：outremer 板頁 |
| 省略回覆 | 樣本未見明確省略標記；無可確認 selector | 未確認：outremer 板頁 |
| 完整串 URL | `/{board}/res/{threadNo}.html` | 觀察：outremer 板頁、串頁 |
| 投稿表單 | `form[name="post"][action="/post.php"]` | 觀察：outremer 板頁、串頁 |
| 串號隱藏欄位 | `input[type="hidden"][name="thread"]`；另有 `name="board"` | 觀察：outremer 串頁 |
| CAPTCHA | 樣本未見 Turnstile 或 reCAPTCHA；是否有其他驗證未知 | 觀察：outremer 板頁 |
| frame policy | 樣本無 XFO、無 CSP `frame-ancestors` | 觀察：JSON 回應標頭 |

## other/unknown

15 個成功 GET 包含站務公告、繪圖板、上傳或外部工具頁，也包含有頁面但缺乏可辨認討論串標記的入口。例：[Blogspot 樣本](.samples/komica.blogspot.com_root.html)、[rthost 繪圖板樣本](.samples/rthost.win_aa_pbbs_html.html)、[akraft 樣本](.samples/www.akraft.net_service_66a6eca2bfccee3f04a52bc4.html)。**串容器、OP、回覆、編號、開串連結、省略標記、完整串 URL、投稿表單、串號欄位和 CAPTCHA 均無通用 selector**；把它們套入任何 Pixmicat selector 都是未驗證推論。本家族沒有可辨認的 `res=`／thread 連結，因此未取得代表串頁。frame policy 亦逐站不同：教育部字典入口樣本有 `X-Frame-Options: SAMEORIGIN`；詳見 JSON。

## 挑戰與失聯

下列清單依本次唯一 GET 的結果分組。`challenge` 即停止，不繞過驗證；`unreachable` 包含 HTTP 錯誤、DNS／TLS／連線失敗與 15 秒逾時。具體 HTTP 狀態、最終 URL、原始空或錯誤頁樣本均見 JSON。`offsite-redirect` 另有 11 筆，仍留在 JSON，未納入可確認家族。

### challenge（11）

本次 HTML 命中防機器人挑戰標記；各網址僅取得挑戰頁，版型不可判定。

- [車](https://www.gomiga.org/car/)：HTTP 200，挑戰頁。
- [COSPLAY](https://selene.zawarudo.org/costumade/)：HTTP 200，挑戰頁。
- [旅遊](https://travel.voidfactory.com/)：HTTP 200，挑戰頁。
- [AGA](https://selene.zawarudo.org/alicegearaegis/)：HTTP 200，挑戰頁。
- [少女前線](https://selene.zawarudo.org/gf/)：HTTP 200，挑戰頁。
- [蔚藍檔案](https://www.gomiga.org/bluearchive/)：HTTP 200，挑戰頁。
- [線上繪圖](https://selene.zawarudo.org/dessin/)：HTTP 200，挑戰頁。
- [MMD/Vocaloid](https://selene.zawarudo.org/avenir/)：HTTP 200，挑戰頁。
- [程設交流](https://www.gomiga.org/cs/)：HTTP 200，挑戰頁。
- [人工智慧](https://www.gomiga.org/ai/)：HTTP 200，挑戰頁。
- [詢問裡](https://majeur.zawarudo.org/demande/)：HTTP 200，挑戰頁。

### unreachable（106）

| 原因 | 筆數 | 入口 |
|---|---:|---|
| TimeoutError: The operation was aborted due to timeout | 28 | [攝影](https://grea.komica1.org/50/index.htm)、[改造](https://sora.komica1.org/40/index.htm)、[數學](https://grea.komica1.org/75/index.htm)、[校園](https://grea.komica1.org/school/)、[歐美動畫](https://grea.komica1.org/76/)、[夢](https://grea.komica1.org/dream/)、[短片2](https://sora.komica1.org/69/)、[MAD](https://grea.komica1.org/39/index.htm)、[動物朋友](https://grea.komica1.org/68/)、[遊戲王](https://grea.komica1.org/73/index.htm)、[塗鴉王國](https://grea.komica1.org/30/index.htm)、[3D](https://grea.komica1.org/3d/index.htm)、[文化交流](https://grea.komica1.org/22/index.htm)、[寫真](https://sora.komica1.org/16/index.htm)、[擬人化](https://grea.komica1.org/36/index.htm)、[少女漫畫](https://grea.komica1.org/47/index.htm)、[音樂](https://grea.komica1.org/29/index.htm)、[布袋戲](https://grea.komica1.org/46/index.htm)、[求圖](https://sora.komica1.org/45/index.htm)、[綜合討論](https://grea.komica1.org/f1a/index.php)、[連結](https://grea.komica1.org/f3/index.php)、[豆知識](https://grea.komica1.org/f5/index.php)、[寫作](https://grea.komica1.org/f9/index.php)、[動畫裡](https://2cat.org/~hanime/)、[成人玩具](https://2cat.org/~toy/)、[偽娘裡](https://2cat.org/~futa/)、[知識裡](https://2cat.org/~know/)、[GIF裡](https://2cat.org/~gifura/) |
| Error: getaddrinfo ENOTFOUND komica.yucie.net | 25 | [投票所](http://komica.yucie.net/vote/)、[問答](http://komica.yucie.net/quiztest/)、[交易合購](https://komica.yucie.net/trade/)、[彈幕](https://komica.yucie.net/video/)、[直播](https://komica.yucie.net/boardcast/)、[格鬥遊戲](https://komica.yucie.net/fight/)、[養成遊戲](https://komica.yucie.net/slg/)、[戀愛遊戲](https://komica.yucie.net/renai/)、[FEZ](https://komica.yucie.net/fez/)、[Pretty Cure](https://komica.yucie.net/prettycure/)、[Capcom](https://komica.yucie.net/capcom/)、[京都動畫](https://komica.yucie.net/kyoutoanimate/)、[聲優綜合](https://komica.yucie.net/seiyuu/)、[釘宮](https://komica.yucie.net/kugimiya/)、[田村/堀江/水樹](https://komica.yucie.net/nana/)、[魔女](https://komica.yucie.net/magic/)、[蘿莉](https://komica.yucie.net/lori/)、[妹系](https://komica.yucie.net/imoto/)、[Lolita Fashion](https://komica.yucie.net/lolita/)、[足球](https://komica.yucie.net/worldcup/)、[武術](https://komica.yucie.net/budou/)、[犬](https://komica.yucie.net/dog/)、[貓](https://komica.yucie.net/cat/)、[水族](https://komica.yucie.net/grearium/)、[認養](https://komica.yucie.net/adopt/) |
| HTTP 404 | 15 | [閒談@香港](https://kagaminerin.org/hongkong/)、[美容](https://kagaminerin.org/cosmetic/)、[動作遊戲](https://kagaminerin.org/act/)、[2D STG](https://kagaminerin.org/stg/)、[3D STG](https://kagaminerin.org/fps/)、[冒險遊戲](https://kagaminerin.org/avg/)、[RPG](https://kagaminerin.org/rpg/)、[APH](https://kagaminerin.org/aph1/)、[Pokemon](https://kagaminerin.org/pokemon/)、[GAINAX](https://kagaminerin.org/gainax/)、[Sound Horizon](http://laurenthorizon.weebly.com/)、[角色配對](https://kagaminerin.org/flash/)、[催淚](https://kagaminerin.org/tearing/)、[素食](https://kagaminerin.org/vegetarian/)、[Excite 翻訳](https://www.excite.co.jp/world/chinese/) |
| Error: getaddrinfo ENOTFOUND 2cat.komica1.org | 11 | [2CAT](https://2cat.komica1.org/)、[貓管理部](https://2cat.komica1.org/0d/fstyle.html)、[萌](https://2cat.komica1.org/~kirur/img2/index.htm)、[詢問](https://2cat.komica1.org/~kirur/orz/index.htm)、[生存遊戲](https://2cat.komica1.org/~gtr2003/pixmicat1/)、[大自然](https://2cat.komica1.org/~rt/pd/)、[短片](https://2cat.komica1.org/~touhonoob/21d/)、[返信娘](https://2cat.komica1.org/~rt/hd/)、[PSV/手機壁](https://2cat.komica1.org/~touhonoob/14d/)、[Pixmicat!](https://2cat.komica1.org/~scribe/pixmicat_dev/)、[(Web)](https://2cat.komica1.org/~rt/irc/) |
| HTTP 523 | 11 | [耳機](https://tomo.komica1.org/77/index.htm)、[網路遊戲](https://grea.komica1.org/52/index.htm)、[性轉換](https://grea.komica1.org/72/)、[同人](https://grea.komica1.org/65/index.htm)、[體育](https://grea.komica1.org/49/index.htm)、[紙牌](https://grea.komica1.org/10/index.htm)、[高解析度](https://grea.komica1.org/33/index.htm)、[FLASH](https://grea.komica1.org/24/index.htm)、[電腦](https://grea.komica1.org/f6/index.php)、[單身](https://grea.komica1.org/f7b/index.php)、[精華區](https://grea.komica1.org/up/index.php) |
| Error: getaddrinfo ENOTFOUND moecorner.com | 4 | [戀愛](https://moecorner.com/iboards/Relationship/)、[麻將](https://moecorner.com/iboards/Mahjong/)、[SQEX](https://moecorner.com/iboards/Square_Enix/)、[Apple](https://moecorner.com/iboards/Apple/) |
| HTTP 500 | 2 | [螢幕攝](https://pixmicat.alica.idv.tw/screenshot/)、[巫女](https://pixmicat.alica.idv.tw/miko/) |
| Error: getaddrinfo ENOTFOUND komica.peroneko.org | 1 | [Minecraft](https://komica.peroneko.org/minecraft/) |
| Error: getaddrinfo ENOTFOUND www.wowhk.org | 1 | [WOW](http://www.wowhk.org/) |
| Error: certificate has expired | 1 | [艦隊收藏](http://acgspace.wsfun.com/kancolle/) |
| Error [ERR_TLS_CERT_ALTNAME_INVALID]: Hostname/IP does not match certificate's altnames: Host: nanoha.boguspix.com. is not in the cert's altnames: DNS:japan.bogus6.info | 1 | [奈葉](https://nanoha.boguspix.com/) |
| Error: getaddrinfo ENOTFOUND anzuchang.com | 1 | [IM@S](http://anzuchang.com/) |
| Error: getaddrinfo ENOTFOUND luna.komica1.org | 1 | [宣傳](https://luna.komica1.org/20d/index.htm) |
| HTTP 502 | 1 | [三次壁](http://2nee.org/bg_photo) |
| Error: getaddrinfo ENOTFOUND yuki.komica1.org | 1 | [KomicaWiki](https://yuki.komica1.org/) |
| Error: connect ECONNREFUSED 160.16.211.116:80 | 1 | [Komicolle](http://komicolle.org/) |
| Error: getaddrinfo ENOTFOUND dictionary.goo.ne.jp | 1 | [goo 辞書](https://dictionary.goo.ne.jp/) |

### offsite-redirect（11）

這些入口的最終主機不同，未當作原網址的板型證據。

| 入口 | 最終 URL |
|---|---|
| [財經](https://2cat.org/~finance/) | [https://cat.2nyan.org/finance/](https://cat.2nyan.org/finance/) |
| [法律](https://2cat.org/~law/) | [https://cat.2nyan.org/law/](https://cat.2nyan.org/law/) |
| [猜謎](https://2cat.org/~quiz/) | [https://cat.2nyan.org/quiz/](https://cat.2nyan.org/quiz/) |
| [超常現象](https://2cat.org/~supernature/) | [https://cat.2nyan.org/supernature/](https://cat.2nyan.org/supernature/) |
| [DOTA2](https://dota2.akraft.net/) | [https://www.akraft.net/service/61bc09b0e27a80b99d12c095](https://www.akraft.net/service/61bc09b0e27a80b99d12c095) |
| [Google 日本](https://www.google.co.jp/ja) | [https://www.google.com/?hl=ja](https://www.google.com/?hl=ja) |
| [Yahoo! 字典](https://tw.dictionary.yahoo.com/) | [https://tw.dictionary.search.yahoo.com/](https://tw.dictionary.search.yahoo.com/) |
| [Yahoo! 知識+](https://tw.answers.yahoo.com/) | [https://promo.campaign.yahoo.com.tw/superapp-intro/](https://promo.campaign.yahoo.com.tw/superapp-intro/) |
| [繁簡轉換](http://www.tdctrade.com/putonghua/index.htm) | [https://sourcing.hktdc.com/](https://sourcing.hktdc.com/) |
| [假名注音](http://www.hiragana.jp/) | [https://hiragana.jp/](https://hiragana.jp/) |
| [漢字轉換](http://nihongo.j-talk.com/) | [https://j-talk.com/convert](https://j-talk.com/convert) |

## 入口頁與導覽

- [桌面入口](https://komica1.org/) 是 `cols="128,*"` 的 frameset：`menu` frame 載入 [bbsmenu.html](https://komica1.org/bbsmenu.html)，`cont` frame 初始載入 [mainmenu2022.html](https://komica1.org/mainmenu2022.html)。兩個子頁都設 `<base target="cont">`，未另設 target 的連結會在右側 `cont` frame 取代目前內容。
- 選單本次有 229 個 `<a href>`（含 `#` 控制與頁尾連結）；181 個未明示 target、8 個明示 `cont`。另有 16 個 `_blank`，以及拼寫成 `_balnk`（22）、`blank`（1）與 `_blnak`（頁尾 1）的 target；後三者是具名 browsing context，不能當成標準 `_blank`。連結的實際 `target`、分類和標籤在 JSON 的 `portal.menu_links`。
- [行動入口](https://komica1.org/m/) 是獨立選單頁，沒有 frameset，設定 `<base target="_blank">`，預設將板頁開在新 browsing context；本次頁面共有 220 個 `<a>`。桌面主畫面是入口內容頁而非板頁，本次共有 56 個 `<a>`。
- 入口選單中的「外部連結」13 筆與「失效連結」1 筆仍逐一 GET 並保留狀態；「主題選擇」及 `#` 控制不作板頁 GET。
