// ==UserScript==
// @name         Komica Reader
// @name:zh-TW   K島閱讀改善
// @namespace    https://github.com/operonlab/userscripts
// @version      0.4.0
// @description  A three-column reader for Komica's 綜合 board and portal, in a macOS style: boards, threads, and the thread itself with full-size images, opening at once; the post form floats over it.
// @description:zh-TW  K島綜合版與入口改成 macOS 風格三欄閱讀：板塊、串列表、串內容（大圖直接顯示、點下去立刻出現），發文／回文表單浮在旁邊。
// @author       operonlab
// @license      MIT
// @homepageURL  https://github.com/operonlab/userscripts/tree/main/komica-reader
// @supportURL   https://github.com/operonlab/userscripts/issues
// @updateURL    https://raw.githubusercontent.com/operonlab/userscripts/main/komica-reader/komica-reader.user.js
// @downloadURL  https://raw.githubusercontent.com/operonlab/userscripts/main/komica-reader/komica-reader.user.js
// @match        https://gaia.komica1.org/00b/*
// @match        https://komica1.org/*
// @run-at       document-start
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        unsafeWindow
// ==/UserScript==

(() => {
  'use strict';

  const WIDTH_KEY = 'kr.drawerWidth';
  const MIN_W = 380;
  const MAX_W = 1000;
  // the board list keeps at least this much room beside the detail pane
  const LIST_MIN = 360;

  // <boards>
  const BOARDS_AT = '2026-10-27';
  const BOARDS = [
    { c: '連線板', l: '2CAT', u: 'https://2cat.komica1.org/', s: 'down' },
    { c: '連線板', l: '貓管理部', u: 'https://2cat.komica1.org/0d/fstyle.html', s: 'down' },
    { c: '連線板', l: '站務公告', u: 'https://komica.blogspot.com/', s: 'ok' },
    { c: '連線板', l: '動畫', u: 'https://gaia.komica1.org/00b/pixmicat2.php?c=%E5%8B%95%E7%95%AB', s: 'ok' },
    { c: '連線板', l: '漫畫', u: 'https://gaia.komica1.org/00b/pixmicat2.php?c=%E6%BC%AB%E7%95%AB', s: 'ok' },
    { c: '連線板', l: '影視', u: 'https://www.akraft.net/service/66a6eca2bfccee3f04a52bc4', s: 'ok' },
    { c: '連線板', l: '綜合', u: 'https://gaia.komica1.org/00b/index.htm', s: 'ok' },
    { c: '連線板', l: '掛圖', u: 'https://gaia.komica1.org/00b/pixmicat2.php?c=%E6%8E%9B%E5%9C%96', s: 'ok' },
    { c: '連線板', l: '新聞', u: 'https://gaia.komica1.org/00b/pixmicat2.php?c=%E6%96%B0%E8%81%9E', s: 'ok' },
    { c: '連線板', l: '政治', u: 'https://gaia.komica1.org/00b/pixmicat2.php?c=%E6%94%BF%E6%B2%BB', s: 'ok' },
    { c: '連線板', l: '氣象', u: 'https://gaia.komica1.org/00b/pixmicat2.php?c=%E6%B0%A3%E8%B1%A1', s: 'ok' },
    { c: '連線板', l: '新番捏他', u: 'https://gaia.komica1.org/00b/pixmicat2.php?c=%E6%96%B0%E7%95%AA%E6%8D%8F%E4%BB%96', s: 'ok' },
    { c: '連線板', l: '新番實況', u: 'https://gaia.komica1.org/00b/pixmicat2.php?c=%E6%96%B0%E7%95%AA%E5%AF%A6%E6%B3%81', s: 'ok' },
    { c: '連線板', l: '模型', u: 'https://gaia.komica1.org/00b/pixmicat2.php?c=%E6%A8%A1%E5%9E%8B', s: 'ok' },
    { c: '連線板', l: 'Figure/GK', u: 'https://gaia.komica1.org/00b/pixmicat2.php?c=Figure', s: 'ok' },
    { c: '連線板', l: '玩偶', u: 'https://gaia.komica1.org/00b/pixmicat2.php?c=%E7%8E%A9%E5%81%B6', s: 'ok' },
    { c: '連線板', l: '螢幕攝', u: 'https://pixmicat.alica.idv.tw/screenshot/', s: 'down' },
    { c: '連線板', l: '歡樂惡搞', u: 'https://gaia.komica1.org/00b/pixmicat2.php?c=%E6%AD%A1%E6%A8%82%E6%83%A1%E6%90%9E', s: 'ok' },
    { c: '連線板', l: '特攝', u: 'https://gaia.komica1.org/00b/pixmicat2.php?c=%E7%89%B9%E6%94%9D', s: 'ok' },
    { c: '連線板', l: '祭典', u: 'http://rthost.win/sd/', s: 'ok' },
    { c: '連線板', l: '蘿蔔', u: 'https://gaia.komica1.org/00b/pixmicat2.php?c=%E8%98%BF%E8%94%94', s: 'ok' },
    { c: '連線板', l: '攝影', u: 'https://grea.komica1.org/50/index.htm', s: 'down' },
    { c: '連線板', l: '軍武', u: 'https://gaia.komica1.org/00b/pixmicat2.php?c=%E8%BB%8D%E6%AD%A6', s: 'ok' },
    { c: '連線板', l: '車', u: 'https://www.gomiga.org/car/', s: 'ok' },
    { c: '連線板', l: '萌', u: 'https://2cat.komica1.org/~kirur/img2/index.htm', s: 'down' },
    { c: '連線板', l: '詢問', u: 'https://2cat.komica1.org/~kirur/orz/index.htm', s: 'down' },
    { c: '連線板', l: 'AA', u: 'http://rthost.win/aa/pbbs.html', s: 'ok' },
    { c: '連線板', l: 'COSPLAY', u: 'https://selene.zawarudo.org/costumade/', s: 'ok' },
    { c: '連線板', l: '改造', u: 'https://sora.komica1.org/40/index.htm', s: 'down' },
    { c: '連線板', l: '投票所', u: 'http://komica.yucie.net/vote/', s: 'down' },
    { c: '連線板', l: '問答', u: 'http://komica.yucie.net/quiztest/', s: 'down' },
    { c: '連線板', l: 'UP', u: 'http://rthost.win/komica-up/upload.php', s: 'ok' },
    { c: '連線二板', l: '數學', u: 'https://grea.komica1.org/75/index.htm', s: 'down' },
    { c: '連線二板', l: '校園', u: 'https://grea.komica1.org/school/', s: 'down' },
    { c: '連線二板', l: '職業', u: 'https://2cat.org/~career/', s: 'ok' },
    { c: '連線二板', l: '財經', u: 'https://2cat.org/~finance/', s: 'ok' },
    { c: '連線二板', l: '生活消費', u: 'http://gzone-anime.info/UnitedSites/shopping/', s: 'ok' },
    { c: '連線二板', l: '法律', u: 'https://2cat.org/~law/', s: 'ok' },
    { c: '連線二板', l: '海外', u: 'https://eclair.nagatoyuki.org/outremer/', s: 'ok' },
    { c: '連線二板', l: '閒談@香港', u: 'https://kagaminerin.org/hongkong/', s: 'down' },
    { c: '連線二板', l: '藝術', u: 'http://gzone-anime.info/UnitedSites/art/', s: 'ok' },
    { c: '連線二板', l: '繪師', u: 'https://2cat.org/~artist/', s: 'ok' },
    { c: '連線二板', l: '交易合購', u: 'https://komica.yucie.net/trade/', s: 'down' },
    { c: '連線二板', l: '鋼普拉', u: 'https://gaia.komica1.org/00b/pixmicat2.php?c=%E9%8B%BC%E6%99%AE%E6%8B%89', s: 'ok' },
    { c: '連線二板', l: '生存遊戲', u: 'https://2cat.komica1.org/~gtr2003/pixmicat1/', s: 'down' },
    { c: '連線二板', l: '猜謎', u: 'https://2cat.org/~quiz/', s: 'ok' },
    { c: '連線二板', l: '故事接龍', u: 'https://storysol.boguspix.com/', s: 'ok' },
    { c: '連線二板', l: '歐美動畫', u: 'https://grea.komica1.org/76/', s: 'down' },
    { c: '連線二板', l: '大自然', u: 'https://2cat.komica1.org/~rt/pd/', s: 'down' },
    { c: '連線二板', l: '天文', u: 'https://2cat.org/~astronomy/', s: 'ok' },
    { c: '連線二板', l: '命理', u: 'https://gaia.komica1.org/00b/pixmicat2.php?c=%E5%91%BD%E7%90%86', s: 'ok' },
    { c: '連線二板', l: '戀愛', u: 'https://moecorner.com/iboards/Relationship/', s: 'down' },
    { c: '連線二板', l: '超常現象', u: 'https://2cat.org/~supernature/', s: 'ok' },
    { c: '連線二板', l: '夢', u: 'https://grea.komica1.org/dream/', s: 'down' },
    { c: '連線二板', l: '流言終結', u: 'https://eclair.nagatoyuki.org/myth/', s: 'ok' },
    { c: '連線二板', l: '旅遊', u: 'https://travel.voidfactory.com/', s: 'ok' },
    { c: '連線二板', l: '耳機', u: 'https://tomo.komica1.org/77/index.htm', s: 'down' },
    { c: '連線二板', l: '服飾', u: 'https://2cat.org/~pixmicat/', s: 'ok' },
    { c: '連線二板', l: '美容', u: 'https://kagaminerin.org/cosmetic/', s: 'down' },
    { c: '連線二板', l: '圖書', u: 'http://gzone-anime.info/UnitedSites/books/', s: 'ok' },
    { c: '連線二板', l: '煩惱相談', u: 'https://eclair.nagatoyuki.org/conseil/', s: 'ok' },
    { c: '連線二板', l: '安價', u: 'https://eclair.nagatoyuki.org/ancre/', s: 'ok' },
    { c: '影音', l: '短片', u: 'https://2cat.komica1.org/~touhonoob/21d/', s: 'down' },
    { c: '影音', l: '短片2', u: 'https://sora.komica1.org/69/', s: 'down' },
    { c: '影音', l: '彈幕', u: 'https://komica.yucie.net/video/', s: 'down' },
    { c: '影音', l: '直播', u: 'https://komica.yucie.net/boardcast/', s: 'down' },
    { c: '影音', l: 'MAD', u: 'https://grea.komica1.org/39/index.htm', s: 'down' },
    { c: '影音', l: 'VTuber', u: 'https://gaia.komica1.org/00b/pixmicat2.php?c=VTuber', s: 'ok' },
    { c: '遊戲', l: '遊戲速報', u: 'https://gaia.komica1.org/00b/pixmicat2.php?c=%E9%81%8A%E6%88%B2', s: 'ok' },
    { c: '遊戲', l: '動作遊戲', u: 'https://kagaminerin.org/act/', s: 'down' },
    { c: '遊戲', l: '格鬥遊戲', u: 'https://komica.yucie.net/fight/', s: 'down' },
    { c: '遊戲', l: '2D STG', u: 'https://kagaminerin.org/stg/', s: 'down' },
    { c: '遊戲', l: '3D STG', u: 'https://kagaminerin.org/fps/', s: 'down' },
    { c: '遊戲', l: '冒險遊戲', u: 'https://kagaminerin.org/avg/', s: 'down' },
    { c: '遊戲', l: 'RPG', u: 'https://kagaminerin.org/rpg/', s: 'down' },
    { c: '遊戲', l: '賽車遊戲', u: 'https://warehouse-no-99.neocities.org/rcg-slg/', s: 'ok' },
    { c: '遊戲', l: '戰略遊戲', u: 'https://warehouse-no-99.neocities.org/rcg-slg/', s: 'ok' },
    { c: '遊戲', l: '養成遊戲', u: 'https://komica.yucie.net/slg/', s: 'down' },
    { c: '遊戲', l: '戀愛遊戲', u: 'https://komica.yucie.net/renai/', s: 'down' },
    { c: '遊戲', l: '女性向遊戲', u: 'https://2cat.org/~boylove/', s: 'ok' },
    { c: '遊戲', l: '網頁遊戲', u: 'https://2cat.org/~webgame/', s: 'ok' },
    { c: '遊戲', l: '獨立遊戲', u: 'https://komica.dbfoxtw.me/indiegame/', s: 'ok' },
    { c: '遊戲', l: '手機遊戲', u: 'https://2cat.org/~handheld/', s: 'ok' },
    { c: '遊戲', l: 'VR/體感遊戲', u: 'https://2cat.org/~motion/', s: 'ok' },
    { c: '遊戲', l: '桌上遊戲', u: 'https://2cat.org/~boardgame/', s: 'ok' },
    { c: '遊戲', l: '麻將', u: 'https://moecorner.com/iboards/Mahjong/', s: 'down' },
    { c: '遊戲', l: '遊戲設計', u: 'https://komica.dbfoxtw.me/gameprogramming/', s: 'ok' },
    { c: '遊戲', l: '網路遊戲', u: 'https://grea.komica1.org/52/index.htm', s: 'down' },
    { c: '遊戲作品', l: 'AGA', u: 'https://selene.zawarudo.org/alicegearaegis/', s: 'ok' },
    { c: '遊戲作品', l: 'Azur Lane', u: 'https://2cat.org/~azurlane/', s: 'ok' },
    { c: '遊戲作品', l: 'DOTA2', u: 'https://dota2.akraft.net/', s: 'ok' },
    { c: '遊戲作品', l: 'FEZ', u: 'https://komica.yucie.net/fez/', s: 'down' },
    { c: '遊戲作品', l: 'GTA', u: 'https://fenrisulfr.org/gta/', s: 'ok' },
    { c: '遊戲作品', l: 'Minecraft', u: 'https://komica.peroneko.org/minecraft/', s: 'down' },
    { c: '遊戲作品', l: 'T7S', u: 'https://www.karlsland.net/t7s/', s: 'ok' },
    { c: '遊戲作品', l: 'WOW', u: 'http://www.wowhk.org/', s: 'down' },
    { c: '遊戲作品', l: '少女前線', u: 'https://selene.zawarudo.org/gf/', s: 'ok' },
    { c: '遊戲作品', l: '碧藍幻想', u: 'https://2cat.org/~granblue/', s: 'ok' },
    { c: '遊戲作品', l: '戰車世界', u: 'https://fenrisulfr.org/wot/', s: 'ok' },
    { c: '遊戲作品', l: '戰地風雲', u: 'https://fenrisulfr.org/battlefield/', s: 'ok' },
    { c: '遊戲作品', l: '戰爭雷霆', u: 'https://fenrisulfr.org/war_thunder/', s: 'ok' },
    { c: '遊戲作品', l: '戰機世界', u: 'https://fenrisulfr.org/wowp/', s: 'ok' },
    { c: '遊戲作品', l: '戰艦世界', u: 'https://fenrisulfr.org/wows/', s: 'ok' },
    { c: '遊戲作品', l: '艦隊收藏', u: 'http://acgspace.wsfun.com/kancolle/', s: 'down' },
    { c: '遊戲作品', l: '魔物獵人', u: 'http://strange-komica.com/MonsterHunter/', s: 'ok' },
    { c: '遊戲作品', l: '蔚藍檔案', u: 'https://www.gomiga.org/bluearchive/', s: 'ok' },
    { c: '動漫作品', l: '動物朋友', u: 'https://grea.komica1.org/68/', s: 'down' },
    { c: '動漫作品', l: '東方', u: 'https://2cat.org/~touhou/', s: 'ok' },
    { c: '動漫作品', l: '龍騎士07', u: 'https://2cat.org/~07expansion/', s: 'ok' },
    { c: '動漫作品', l: '涼宮', u: 'https://eclair.nagatoyuki.org/szmy/', s: 'ok' },
    { c: '動漫作品', l: '奈葉', u: 'https://nanoha.boguspix.com/', s: 'down' },
    { c: '動漫作品', l: '遊戲王', u: 'https://grea.komica1.org/73/index.htm', s: 'down' },
    { c: '動漫作品', l: 'APH', u: 'https://kagaminerin.org/aph1/', s: 'down' },
    { c: '動漫作品', l: 'Homestuck', u: 'https://komica.dbfoxtw.me/homestuck/', s: 'ok' },
    { c: '動漫作品', l: 'IM@S', u: 'http://anzuchang.com/', s: 'down' },
    { c: '動漫作品', l: 'Pokemon', u: 'https://kagaminerin.org/pokemon/', s: 'down' },
    { c: '動漫作品', l: 'Pretty Cure', u: 'https://komica.yucie.net/prettycure/', s: 'down' },
    { c: '動漫作品', l: 'Strike Witches', u: 'https://www.karlsland.net/sw/', s: 'ok' },
    { c: '製作公司', l: 'Capcom', u: 'https://komica.yucie.net/capcom/', s: 'down' },
    { c: '製作公司', l: 'GAINAX', u: 'https://kagaminerin.org/gainax/', s: 'down' },
    { c: '製作公司', l: 'KOEI', u: 'https://www.karlsland.net/koei/', s: 'ok' },
    { c: '製作公司', l: 'SQEX', u: 'https://moecorner.com/iboards/Square_Enix/', s: 'down' },
    { c: '製作公司', l: 'TYPE-MOON', u: 'http://gzone-anime.info/UnitedSites/TypeMoon/', s: 'ok' },
    { c: '製作公司', l: '京都動畫', u: 'https://komica.yucie.net/kyoutoanimate/', s: 'down' },
    { c: '聲優藝人', l: '聲優綜合', u: 'https://komica.yucie.net/seiyuu/', s: 'down' },
    { c: '聲優藝人', l: '釘宮', u: 'https://komica.yucie.net/kugimiya/', s: 'down' },
    { c: '聲優藝人', l: '田村/堀江/水樹', u: 'https://komica.yucie.net/nana/', s: 'down' },
    { c: '聲優藝人', l: 'Sound Horizon', u: 'http://laurenthorizon.weebly.com/', s: 'down' },
    { c: '專題板', l: '角色配對', u: 'https://kagaminerin.org/flash/', s: 'down' },
    { c: '專題板', l: '催淚', u: 'https://kagaminerin.org/tearing/', s: 'down' },
    { c: '專題板', l: '性轉換', u: 'https://grea.komica1.org/72/', s: 'down' },
    { c: '專題板', l: '巫女', u: 'https://pixmicat.alica.idv.tw/miko/', s: 'down' },
    { c: '專題板', l: '魔女', u: 'https://komica.yucie.net/magic/', s: 'down' },
    { c: '專題板', l: '蘿莉', u: 'https://komica.yucie.net/lori/', s: 'down' },
    { c: '專題板', l: '正太', u: 'http://p.komica.acg.club.tw/s/', s: 'ok' },
    { c: '專題板', l: '御姊', u: 'http://sister.boguspix.com/', s: 'ok' },
    { c: '專題板', l: '兄貴', u: 'http://p.komica.acg.club.tw/a/', s: 'ok' },
    { c: '專題板', l: '妹系', u: 'https://komica.yucie.net/imoto/', s: 'down' },
    { c: '專題板', l: '人外', u: 'https://komica.dbfoxtw.me/jingai/', s: 'ok' },
    { c: '專題板', l: '獸', u: 'https://kemono.wtako.net/kemono/', s: 'ok' },
    { c: '專題板', l: '機娘', u: 'http://msgirls.boguspix.com/', s: 'ok' },
    { c: '專題板', l: '返信娘', u: 'https://2cat.komica1.org/~rt/hd/', s: 'down' },
    { c: '專題板', l: 'Lolita Fashion', u: 'https://komica.yucie.net/lolita/', s: 'down' },
    { c: '創作', l: '塗鴉王國', u: 'https://grea.komica1.org/30/index.htm', s: 'down' },
    { c: '創作', l: '線上繪圖', u: 'https://selene.zawarudo.org/dessin/', s: 'ok' },
    { c: '創作', l: '塗鴉保育區', u: 'https://kemono.wtako.net/kemozone/', s: 'ok' },
    { c: '創作', l: '3D', u: 'https://grea.komica1.org/3d/index.htm', s: 'down' },
    { c: '創作', l: 'MMD/Vocaloid', u: 'https://selene.zawarudo.org/avenir/', s: 'ok' },
    { c: '創作', l: '同人', u: 'https://grea.komica1.org/65/index.htm', s: 'down' },
    { c: '創作', l: '宣傳', u: 'https://luna.komica1.org/20d/index.htm', s: 'down' },
    { c: '飲食', l: '飲食', u: 'https://gaia.komica1.org/00b/pixmicat2.php?c=%E9%A3%B2%E9%A3%9F', s: 'ok' },
    { c: '飲食', l: '酒', u: 'https://eclair.nagatoyuki.org/beverage/', s: 'ok' },
    { c: '飲食', l: '咖啡/茶', u: 'https://2cat.org/~coffee/', s: 'ok' },
    { c: '飲食', l: '烹飪', u: 'https://2cat.org/~cooking/', s: 'ok' },
    { c: '飲食', l: '素食', u: 'https://kagaminerin.org/vegetarian/', s: 'down' },
    { c: '體育運動', l: '體育', u: 'https://grea.komica1.org/49/index.htm', s: 'down' },
    { c: '體育運動', l: '足球', u: 'https://komica.yucie.net/worldcup/', s: 'down' },
    { c: '體育運動', l: '武術', u: 'https://komica.yucie.net/budou/', s: 'down' },
    { c: '動物', l: '動物綜合', u: 'https://2cat.org/~animal/', s: 'ok' },
    { c: '動物', l: '犬', u: 'https://komica.yucie.net/dog/', s: 'down' },
    { c: '動物', l: '貓', u: 'https://komica.yucie.net/cat/', s: 'down' },
    { c: '動物', l: '鳥', u: 'https://2cat.org/~bird/', s: 'ok' },
    { c: '動物', l: '水族', u: 'https://komica.yucie.net/grearium/', s: 'down' },
    { c: '動物', l: '認養', u: 'https://komica.yucie.net/adopt/', s: 'down' },
    { c: '桌布壁紙', l: '二次壁', u: 'https://2cat.org/~wallpaper/', s: 'ok' },
    { c: '桌布壁紙', l: '三次壁', u: 'http://2nee.org/bg_photo', s: 'down' },
    { c: '桌布壁紙', l: 'PSV/手機壁', u: 'https://2cat.komica1.org/~touhonoob/14d/', s: 'down' },
    { c: '電腦網路', l: '電腦/消費電子', u: 'https://gaia.komica1.org/00b/pixmicat2.php?c=%E9%9B%BB%E8%85%A6', s: 'ok' },
    { c: '電腦網路', l: 'Pixmicat!', u: 'https://2cat.komica1.org/~scribe/pixmicat_dev/', s: 'down' },
    { c: '電腦網路', l: '程設交流', u: 'https://www.gomiga.org/cs/', s: 'ok' },
    { c: '電腦網路', l: '人工智慧', u: 'https://www.gomiga.org/ai/', s: 'ok' },
    { c: '電腦網路', l: 'Apple', u: 'https://moecorner.com/iboards/Apple/', s: 'down' },
    { c: '本地板', l: '文化交流', u: 'https://grea.komica1.org/22/index.htm', s: 'down' },
    { c: '本地板', l: '寫真', u: 'https://sora.komica1.org/16/index.htm', s: 'down' },
    { c: '本地板', l: '女性角色', u: 'https://gaia.komica1.org/00b/pixmicat2.php?c=%E5%A5%B3%E6%80%A7%E8%A7%92%E8%89%B2', s: 'ok' },
    { c: '本地板', l: '男性角色', u: 'https://gaia.komica1.org/00b/pixmicat2.php?c=%E7%94%B7%E6%80%A7%E8%A7%92%E8%89%B2', s: 'ok' },
    { c: '本地板', l: '中性角色', u: 'https://gaia.komica1.org/00b/pixmicat2.php?c=%E4%B8%AD%E6%80%A7%E8%A7%92%E8%89%B2', s: 'ok' },
    { c: '本地板', l: '四格', u: 'https://gaia.komica1.org/00b/pixmicat2.php?c=%E5%9B%9B%E6%A0%BC', s: 'ok' },
    { c: '本地板', l: '擬人化', u: 'https://grea.komica1.org/36/index.htm', s: 'down' },
    { c: '本地板', l: '少女漫畫', u: 'https://grea.komica1.org/47/index.htm', s: 'down' },
    { c: '本地板', l: '音樂', u: 'https://grea.komica1.org/29/index.htm', s: 'down' },
    { c: '本地板', l: '布袋戲', u: 'https://grea.komica1.org/46/index.htm', s: 'down' },
    { c: '本地板', l: '小說', u: 'https://gaia.komica1.org/00b/pixmicat2.php?c=%E5%B0%8F%E8%AA%AA', s: 'ok' },
    { c: '本地板', l: '奇幻/科幻', u: 'https://gaia.komica1.org/00b/pixmicat2.php?c=%E5%A5%87%E5%B9%BB%E7%A7%91%E5%B9%BB', s: 'ok' },
    { c: '本地板', l: '紙牌', u: 'https://grea.komica1.org/10/index.htm', s: 'down' },
    { c: '本地板', l: '高解析度', u: 'https://grea.komica1.org/33/index.htm', s: 'down' },
    { c: '本地板', l: 'GIF', u: 'https://gaia.komica1.org/00b/pixmicat2.php?c=GIF', s: 'ok' },
    { c: '本地板', l: 'WebM', u: 'https://gaia.komica1.org/00b/pixmicat2.php?c=WebM', s: 'ok' },
    { c: '本地板', l: 'MP4', u: 'https://gaia.komica1.org/00b/pixmicat2.php?c=MP4', s: 'ok' },
    { c: '本地板', l: 'FLASH', u: 'https://grea.komica1.org/24/index.htm', s: 'down' },
    { c: '本地板', l: '求圖', u: 'https://sora.komica1.org/45/index.htm', s: 'down' },
    { c: '文字板', l: '綜合討論', u: 'https://grea.komica1.org/f1a/index.php', s: 'down' },
    { c: '文字板', l: '連結', u: 'https://grea.komica1.org/f3/index.php', s: 'down' },
    { c: '文字板', l: '豆知識', u: 'https://grea.komica1.org/f5/index.php', s: 'down' },
    { c: '文字板', l: '電腦', u: 'https://grea.komica1.org/f6/index.php', s: 'down' },
    { c: '文字板', l: '單身', u: 'https://grea.komica1.org/f7b/index.php', s: 'down' },
    { c: '文字板', l: '寫作', u: 'https://grea.komica1.org/f9/index.php', s: 'down' },
    { c: '其他', l: 'KomicaWiki', u: 'https://yuki.komica1.org/', s: 'down' },
    { c: '其他', l: '精華區', u: 'https://grea.komica1.org/up/index.php', s: 'down' },
    { c: '其他', l: 'Komicolle', u: 'http://komicolle.org/', s: 'down' },
    { c: '聊天室', l: 'BarGiko', u: 'http://l4cs.jpn.org/gikopoi/', s: 'ok' },
    { c: '聊天室', l: 'IRC', u: 'irc://irc.freenode.net/2cat', s: 'ok' },
    { c: '聊天室', l: '(Web)', u: 'https://2cat.komica1.org/~rt/irc/', s: 'down' },
    { c: '▶ KOMICA2 (18禁) [鎖定]', l: '動畫裡', u: 'https://2cat.org/~hanime/', s: 'down' },
    { c: '▶ KOMICA2 (18禁) [鎖定]', l: '成人玩具', u: 'https://2cat.org/~toy/', s: 'down' },
    { c: '▶ KOMICA2 (18禁) [鎖定]', l: '東方裡', u: 'https://2cat.org/touhoux/', s: 'ok' },
    { c: '▶ KOMICA2 (18禁) [鎖定]', l: '偽娘裡', u: 'https://2cat.org/~futa/', s: 'down' },
    { c: '▶ KOMICA2 (18禁) [鎖定]', l: '詢問裡', u: 'https://majeur.zawarudo.org/demande/', s: 'ok' },
    { c: '▶ KOMICA2 (18禁) [鎖定]', l: '知識裡', u: 'https://2cat.org/~know/', s: 'down' },
    { c: '▶ KOMICA2 (18禁) [鎖定]', l: '高解析裡', u: 'https://2cat.org/~hisoura/', s: 'ok' },
    { c: '▶ KOMICA2 (18禁) [鎖定]', l: 'GIF裡', u: 'https://2cat.org/~gifura/', s: 'down' },
    { c: '外部連結', l: '0rz.tw', u: 'http://0rz.tw/', s: 'ok' },
    { c: '外部連結', l: 'Google 日本', u: 'https://www.google.co.jp/ja', s: 'ok' },
    { c: '外部連結', l: 'goo 辞書', u: 'https://dictionary.goo.ne.jp/', s: 'down' },
    { c: '外部連結', l: 'Yahoo! 字典', u: 'https://tw.dictionary.yahoo.com/', s: 'ok' },
    { c: '外部連結', l: '英漢字典', u: 'https://cdict.net/', s: 'ok' },
    { c: '外部連結', l: '國語辭典', u: 'http://dict.revised.moe.edu.tw/cbdic/index.html', s: 'ok' },
    { c: '外部連結', l: 'Excite 翻訳', u: 'https://www.excite.co.jp/world/chinese/', s: 'down' },
    { c: '外部連結', l: 'Babel Fish', u: 'https://www.babelfish.com/', s: 'ok' },
    { c: '外部連結', l: '維基百科', u: 'https://zh.wikipedia.org/', s: 'ok' },
    { c: '外部連結', l: 'Yahoo! 知識+', u: 'https://tw.answers.yahoo.com/', s: 'ok' },
    { c: '外部連結', l: '繁簡轉換', u: 'http://www.tdctrade.com/putonghua/index.htm', s: 'ok' },
    { c: '外部連結', l: '假名注音', u: 'http://www.hiragana.jp/', s: 'ok' },
    { c: '外部連結', l: '漢字轉換', u: 'http://nihongo.j-talk.com/', s: 'ok' },
    { c: '失效連結', l: '綜合學術', u: 'http://gzone-anime.info/UnitedSites/academic/', s: 'ok' },
  ];
  // </boards>

  function normalizeBoardUrl(value) {
    try {
      const url = new URL(value);
      if (!/^https?:$/.test(url.protocol)) return null;
      url.hash = '';
      url.pathname = url.pathname.replace(/index\.(?:htm|html|php)$/i, '');
      if (!/\.[^/]+$/.test(url.pathname) && !url.pathname.endsWith('/')) url.pathname += '/';
      return url.href;
    } catch {
      return null;
    }
  }

  function matchBoard(href, boards) {
    const normalized = normalizeBoardUrl(href);
    if (!normalized) return null;
    const exact = boards.find((board) => normalizeBoardUrl(board.u) === normalized);
    if (exact) return exact;
    const url = new URL(normalized);
    if (url.origin !== 'https://gaia.komica1.org' || !url.pathname.startsWith('/00b/')) return null;
    if (url.pathname === '/00b/pixmicat2.php' && url.searchParams.has('c')) {
      return boards.find((board) => {
        const candidate = new URL(board.u);
        return candidate.origin === url.origin && candidate.pathname === url.pathname && candidate.searchParams.get('c') === url.searchParams.get('c');
      }) || null;
    }
    if (url.pathname === '/00b/' || /^\/00b\/\d+\.htm$/.test(url.pathname) ||
      (url.pathname === '/00b/pixmicat.php' && /^\d+$/.test(url.searchParams.get('res') || ''))) {
      return boards.find((board) => normalizeBoardUrl(board.u) === 'https://gaia.komica1.org/00b/') || null;
    }
    return null;
  }

  // the portal's own rule: a year from 1900 to this year, at least 18 years ago
  function ageVerdict(value, currentYear) {
    const year = /^\s*\d{4}\s*$/.test(String(value)) ? Number(value) : NaN;
    if (!(year >= 1900 && year <= currentYear)) return 'invalid';
    return currentYear - year >= 18 ? 'adult' : 'minor';
  }

  function filterBoards(boards, query) {
    const needle = String(query).trim().toLocaleLowerCase();
    return needle ? boards.filter((board) => `${board.l} ${board.c}`.toLocaleLowerCase().includes(needle)) : boards;
  }

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


  function omittedCount(text) {
    const match = /有回應\s+(\d+)\s+篇被省略/.exec(String(text));
    return match ? Number(match[1]) : 0;
  }

  function shortTime(nowText, today) {
    const match = /^(\d{4})\/(\d{1,2})\/(\d{1,2})\([^)]*\)\s+(\d{2}):(\d{2}):\d{2}/.exec(String(nowText).trim());
    if (!match) return null;
    const [, year, month, day, hour, minute] = match;
    const date = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
    if (date.getFullYear() !== Number(year) || date.getMonth() + 1 !== Number(month) || date.getDate() !== Number(day)) return null;
    const time = `${hour}:${minute}`;
    return date.toDateString() === today.toDateString() ? time : `${month.padStart(2, '0')}/${day.padStart(2, '0')} ${time}`;
  }

  function stepIndex(current, delta, length) {
    return length ? Math.max(0, Math.min(length - 1, current + delta)) : -1;
  }


  function mediaKind(src) {
    return /\.(mp4|webm|mov|m4v)(?:[?#]|$)/i.test(String(src)) ? 'video' : 'image';
  }

  // "1793….png-(1879 KB, 1054x1536)" → { w, h }, so an image keeps its box before it loads
  function fileDims(info) {
    const m = /(\d{2,5})\s*[x×]\s*(\d{2,5})\s*\)/.exec(String(info));
    return m ? { w: Number(m[1]), h: Number(m[2]) } : null;
  }

  // what the page a post lands on tells us: the board itself → posted; a redirect → wait for its target;
  // anything else is not a verdict either way, and the caller has to check
  function postOutcome({ readable, threads, redirect, text }) {
    if (!readable) return { kind: 'unknown', message: '讀不到送出後的回應頁' };
    if (threads) return { kind: 'ok' };
    if (redirect) return { kind: 'wait' };
    const said = String(text).replace(/\s+/g, ' ').trim().slice(0, 160);
    return { kind: 'unknown', message: said ? `回應頁寫著：「${said}」` : '回應頁是空的' };
  }

  // the first line of a reply that is not a >>No. quote: what to look for in the thread afterwards
  function postedProbe(text) {
    const line = String(text).split('\n').map((l) => l.trim()).find((l) => l && !/^>>\d+$/.test(l));
    return line ? line.slice(0, 30) : '';
  }

  if (typeof window === 'undefined') {
    module.exports = { threadLink, insertQuote, clampWidth, omittedCount, shortTime, stepIndex, normalizeBoardUrl, matchBoard, filterBoards, ageVerdict, mediaKind, fileDims, postOutcome, postedProbe, MIN_W, MAX_W, LIST_MIN };
    return;
  }

  if (location.hostname === 'komica1.org' && !(location.pathname === '/bbsmenu.html' && window.name === 'menu')) return;
  if (window.__krState) return;
  const state = (window.__krState = { pane: null, sideWidth: 0 });

  const store = {
    get(key, fallback) {
      try {
        if (typeof GM_getValue === 'function') return GM_getValue(key, fallback);
        const value = localStorage.getItem(key);
        return value === null ? fallback : JSON.parse(value);
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try {
        if (typeof GM_setValue === 'function') GM_setValue(key, value);
        else localStorage.setItem(key, JSON.stringify(value));
      } catch {
        return;
      }
    },
  };

  // set in start(): at document-start the <html> element may not exist yet
  let root = null;

  const CSS = `
/* macOS-style tokens; dark follows the site's 夜間 theme, or the system when the site is on 預設 */
html.kr {
  --kr-accent: #0a84ff; --kr-text: #1d1d1f; --kr-text2: #6e6e73; --kr-text3: #a1a1a6;
  --kr-bg: #ffffff; --kr-list-bg: #f2f2f5; --kr-card: #ffffff; --kr-fill: rgba(120, 120, 128, .12); --kr-fill2: rgba(120, 120, 128, .2);
  --kr-sep: rgba(0, 0, 0, .1); --kr-glass: rgba(246, 246, 248, .78); --kr-bar: rgba(255, 255, 255, .86);
  --kr-shadow: 0 10px 34px rgba(0, 0, 0, .14); --kr-r: 12px; --kr-drawer-w: 560px; --kr-side: 0px;
  --kr-font: -apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang TC", "Noto Sans TC", "Microsoft JhengHei", system-ui, sans-serif;
  --kr-sel: color-mix(in srgb, var(--kr-accent) 13%, var(--kr-card));
}
html.kr[data-kr-dark] {
  --kr-text: #f5f5f7; --kr-text2: #a1a1a6; --kr-text3: #6e6e73;
  --kr-bg: #1e1e20; --kr-list-bg: #141416; --kr-card: #232326; --kr-fill: rgba(120, 120, 128, .24); --kr-fill2: rgba(120, 120, 128, .36);
  --kr-sep: rgba(255, 255, 255, .1); --kr-glass: rgba(38, 38, 41, .8); --kr-bar: rgba(30, 30, 32, .86); --kr-shadow: 0 10px 34px rgba(0, 0, 0, .5);
  color-scheme: dark;
}
html.kr body { font-family: var(--kr-font); -webkit-font-smoothing: antialiased; }
html.kr-md body, html.kr-thread body { background: var(--kr-list-bg) !important; color: var(--kr-text) !important; }
html.kr-md #threads a, html.kr-thread #threads a { color: var(--kr-accent); }
.kr-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 28px; min-width: 28px; padding: 0 11px; box-sizing: border-box;
  border: 0; border-radius: 999px; background: var(--kr-fill); color: var(--kr-text) !important; font: 500 13px/1 var(--kr-font); text-decoration: none !important;
  cursor: pointer; white-space: nowrap; }
.kr-btn:hover { background: var(--kr-fill2); }
.kr-btn.kr-primary { background: var(--kr-accent); color: #fff !important; }
.kr-btn.kr-primary:hover { background: color-mix(in srgb, var(--kr-accent) 88%, #000); }

/* board page: a toolbar on top of the list column, the site's header folded into its ⋯ menu */
html.kr-md body { margin: 0 0 0 var(--kr-side) !important; padding: 0 18px 28px !important; }
/* the pane exists only while a thread is open; closed, the list has the whole width */
html.kr-md.kr-pane-open body { margin-right: var(--kr-drawer-w) !important; }
html.kr-docked:not(.kr-pane-open) .kr-pane { display: none; }
html.kr-md #header, html.kr-md #board-post-transition, html.kr-md #board-post-divider-start, html.kr-md #board-post-divider-end,
html.kr-md #del, html.kr-md #threads .thread > hr { display: none !important; }
html.kr .kr-toolbar { position: sticky; top: 0; z-index: 50; display: flex; align-items: center; gap: 8px; margin: 0 -18px 12px; padding: 10px 18px;
  background: var(--kr-bar); backdrop-filter: blur(22px) saturate(180%); -webkit-backdrop-filter: blur(22px) saturate(180%);
  border-bottom: .5px solid var(--kr-sep); font-family: var(--kr-font); color: var(--kr-text); }
html.kr .kr-toolbar-titles { flex: 1; min-width: 0; display: flex; align-items: baseline; gap: 8px; overflow: hidden; white-space: nowrap; }
html.kr .kr-toolbar-title { font: 700 17px/1.2 var(--kr-font); overflow: hidden; text-overflow: ellipsis; }
html.kr .kr-toolbar-sub, html.kr .kr-toolbar #online-counter { font: 12px var(--kr-font) !important; color: var(--kr-text2); margin: 0 !important; }
html.kr .kr-menu { position: absolute; top: calc(100% + 6px); right: 14px; z-index: 60; min-width: 220px; padding: 6px; border-radius: 12px;
  background: var(--kr-glass); backdrop-filter: blur(30px) saturate(180%); -webkit-backdrop-filter: blur(30px) saturate(180%);
  border: .5px solid var(--kr-sep); box-shadow: var(--kr-shadow); }
html.kr .kr-menu[hidden] { display: none; }
html.kr .kr-menu a { display: block; padding: 6px 10px; border-radius: 6px; color: var(--kr-text) !important; text-decoration: none; font-size: 13px; }
html.kr .kr-menu a:hover { background: var(--kr-accent); color: #fff !important; }
html.kr .kr-menu-sep { height: .5px; margin: 6px 4px; background: var(--kr-sep); }
html.kr .kr-menu-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 6px 10px; font-size: 13px; color: var(--kr-text2); }
html.kr .kr-menu-row select { font: inherit; }
html.kr #gaia-vote-pause-notice { position: fixed !important; left: calc(var(--kr-side) + 18px) !important; right: auto !important; top: auto !important; bottom: 16px !important;
  z-index: 60 !important; width: auto !important; max-width: 300px; margin: 0 !important; padding: 6px 12px !important; border: 0 !important; border-radius: 999px !important;
  background: var(--kr-glass) !important; backdrop-filter: blur(20px); color: var(--kr-text2) !important; font: 12px var(--kr-font) !important; box-shadow: var(--kr-shadow) !important; }

/* master rows */
html.kr-md #threads .thread { max-width: 980px; margin: 0 auto 8px; padding: 12px 14px; border: 0; border-radius: var(--kr-r); background: var(--kr-card) !important;
  box-shadow: 0 0 0 .5px var(--kr-sep), 0 1px 2px rgba(0, 0, 0, .04); color: var(--kr-text); cursor: pointer;
  content-visibility: auto; contain-intrinsic-size: auto 124px; }
html.kr-md #threads .thread:hover { background: color-mix(in srgb, var(--kr-card) 95%, var(--kr-text)) !important; }
html.kr-md #threads .thread.kr-selected { background: var(--kr-sel) !important; box-shadow: 0 0 0 1.5px var(--kr-accent); }
html.kr-md #threads .post { background: none !important; color: var(--kr-text) !important; border: 0 !important; }
html.kr-md #threads .thread:not(.kr-peek) .post.reply, html.kr-md #threads .warn_txt2 { display: none !important; }
html.kr-md #threads .threadpost .file-text, html.kr-md #threads .threadpost .post-head input[type="checkbox"],
html.kr-md #threads .threadpost .post-head .id, html.kr-md #threads .threadpost .post-action-wrap, html.kr-md #threads .threadpost .rlink,
html.kr-md #threads .threadpost .postvote-slot, html.kr-md #threads .threadpost .category, html.kr-md #threads .threadpost .backquote,
html.kr-md #threads .threadpost #safari-ad, html.kr-md #threads .threadpost > br, html.kr-md #threads .threadpost .pugid-edit-slot { display: none !important; }
html.kr-md #threads .threadpost .md5-image { float: left; margin: 2px 12px 2px 0; }
html.kr-md #threads .threadpost .file-thumb img { width: 72px !important; height: 72px !important; object-fit: cover; border-radius: 9px; }
html.kr-md #threads .thread { position: relative; }
html.kr-md #threads .threadpost .post-head > :not(.title), html.kr-md #threads .threadpost .post-head .kr-untitled,
html.kr-md #threads .threadpost .quote .text-button { display: none !important; }
html.kr-md #threads .threadpost .post-head .title { display: block; margin: 0 56px 2px 0; color: var(--kr-text) !important; font: 600 15px/1.35 var(--kr-font); }
html.kr-md .kr-when { position: absolute; top: 13px; right: 14px; font-size: 12px; color: var(--kr-text3); }
html.kr-md #threads .post-head .name, html.kr-md #threads .post-head .now { color: var(--kr-text2) !important; font-weight: 400; }
html.kr-md #threads .post-head .qlink { color: var(--kr-text3) !important; }
html.kr-md #threads .threadpost .quote { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; overflow: hidden;
  margin: 0 56px 0 0; font-size: 14px; line-height: 1.55; color: var(--kr-text) !important; }
html.kr-md #threads .threadpost .post-head .kr-untitled + * { margin-top: 0; }
html.kr-md.kr-pane-open .kr-site-scroll { right: calc(var(--kr-drawer-w) + 10px) !important; }
html.kr-md #threads .thread.kr-peek .post.reply { display: block; margin: 8px 0 0 84px; padding: 8px 10px; border-radius: 10px; background: var(--kr-fill) !important; font-size: 13px; }
html.kr-md .kr-meta { clear: both; display: flex; align-items: center; gap: 10px; margin-top: 8px; font-size: 12px; color: var(--kr-text2); }
html.kr-md .kr-meta button { border: 0; padding: 0; background: none; color: var(--kr-accent); font: inherit; cursor: pointer; }
html.kr-md #page_switch { max-width: 980px; margin: 16px auto; font-size: 13px; color: var(--kr-text2); }
html.kr-md #page_switch a { display: inline-block; margin: 2px; padding: 4px 10px; border-radius: 999px; background: var(--kr-fill); text-decoration: none; }

/* the site's own form, floating; never moved, never display:none (Turnstile lives in it) */
html.kr .kr-composer { position: fixed; z-index: 9001; right: 16px; bottom: 16px; width: min(480px, calc(100vw - 32px)); max-height: calc(100vh - 32px);
  overflow: auto; box-sizing: border-box; margin: 0; background: var(--kr-glass) !important; color: var(--kr-text) !important; font-family: var(--kr-font);
  backdrop-filter: blur(30px) saturate(180%); -webkit-backdrop-filter: blur(30px) saturate(180%);
  border: .5px solid var(--kr-sep); border-radius: 16px; box-shadow: var(--kr-shadow); }
html.kr .kr-composer #postform { padding: 0 12px 12px; background: none !important; }
html.kr .kr-composer[data-kr-state="collapsed"] #postform { position: absolute; left: 0; width: 440px; max-height: 0; padding: 0; overflow: hidden; }
html.kr .kr-composer #postinfo .post-notices, html.kr .kr-composer #postinfo .post-instructions, html.kr .kr-composer .bar_reply { display: none; }
html.kr .kr-composer #postform_tbl { width: 100%; margin: 0 !important; border-collapse: separate; border-spacing: 0 4px; }
html.kr .kr-composer #postform_tbl td { padding: 0 4px; border: 0 !important; background: none !important; color: var(--kr-text2) !important; font-size: 12px; vertical-align: middle; }
html.kr .kr-composer #postform_tbl td.Form_bg { width: 4.5em; white-space: nowrap; }
html.kr .kr-composer #postform_tbl td.Form_bg b { font-weight: 500; }
html.kr .kr-composer input[type="text"], html.kr .kr-composer textarea { box-sizing: border-box; padding: 6px 9px; border: .5px solid var(--kr-sep);
  border-radius: 8px; background: var(--kr-bg) !important; color: var(--kr-text) !important; font: 14px var(--kr-font); }
html.kr .kr-composer #fcom { width: 100% !important; height: 8.5em !important; resize: vertical; line-height: 1.5; }
html.kr .kr-composer #fname, html.kr .kr-composer #fsub, html.kr .kr-composer input[name="category"] { width: 72%; }
html.kr .kr-composer input[type="submit"] { height: 28px; padding: 0 16px; border: 0; border-radius: 999px; background: var(--kr-accent); color: #fff;
  font: 600 13px var(--kr-font); cursor: pointer; }
html.kr .kr-composer-bar { position: sticky; top: 0; z-index: 1; display: flex; align-items: center; gap: 8px; padding: 10px 14px; }
html.kr .kr-composer-toggle { flex: 1; min-height: 26px; padding: 0; border: 0; background: none; color: var(--kr-text); font: 600 14px var(--kr-font);
  text-align: left; cursor: pointer; }
html.kr .kr-composer-close { display: none; width: 28px; height: 28px; border: 0; border-radius: 999px; background: var(--kr-fill); color: var(--kr-text);
  font-size: 17px; line-height: 1; cursor: pointer; }
html.kr .kr-composer[data-kr-state="expanded"] .kr-composer-close { display: block; }
html.kr .kr-composer-status { padding: 0 14px 10px; font-size: 12px; color: var(--kr-text2); white-space: pre-wrap; }
html.kr .kr-composer-status:empty { display: none; }
html.kr .kr-composer-status.kr-error { color: #ff453a; }
html.kr-md.kr-pane-open .kr-composer.kr-new { right: calc(var(--kr-drawer-w) + 16px); }
html.kr-md .kr-composer.kr-new[data-kr-state="collapsed"] { width: auto; border-radius: 999px; }
html.kr-md .kr-composer.kr-reply-pane { right: 12px; bottom: 12px; width: calc(var(--kr-drawer-w) - 24px); }
html.kr-md .kr-composer.kr-reply-pane[data-kr-state="expanded"] { max-height: 70vh; }
html.kr-md .kr-composer.kr-reply-pane[data-kr-state="collapsed"] .kr-composer-toggle { font-weight: 400; color: var(--kr-text2); }
html.kr-thread .kr-composer.kr-reply { left: 12px; right: 12px; bottom: 12px; width: auto; max-width: 820px; margin: 0 auto; }
html.kr-thread .kr-composer.kr-reply[data-kr-state="expanded"] { max-height: 75vh; }
html.kr-thread body { padding-bottom: 88px !important; }

/* detail pane: the thread, fetched and drawn here */
html.kr .kr-pane { position: fixed; z-index: 55; top: 0; right: 0; bottom: 0; width: var(--kr-drawer-w); display: flex; flex-direction: column;
  box-sizing: border-box; background: var(--kr-bg); color: var(--kr-text); border-left: .5px solid var(--kr-sep); font-family: var(--kr-font); }
html.kr .kr-pane-head { display: flex; align-items: center; gap: 6px; min-height: 52px; padding: 8px 12px 8px 16px; box-sizing: border-box;
  background: var(--kr-bar); backdrop-filter: blur(22px) saturate(180%); -webkit-backdrop-filter: blur(22px) saturate(180%); border-bottom: .5px solid var(--kr-sep); }
html.kr .kr-pane-titles { flex: 1; min-width: 0; }
html.kr .kr-pane-title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font: 600 15px/1.3 var(--kr-font); }
html.kr .kr-pane-sub { font-size: 12px; color: var(--kr-text2); }
html.kr .kr-pane-body { flex: 1; overflow: auto; overscroll-behavior: contain; padding: 8px 20px 120px; }
html.kr .kr-pane-actions { display: flex; gap: 6px; }
html.kr .kr-pane-back { display: none; }
html.kr .kr-pane-resize { position: absolute; top: 0; bottom: 0; left: -5px; width: 10px; cursor: col-resize; }
html.kr.kr-resizing, html.kr.kr-resizing * { cursor: col-resize !important; user-select: none !important; }
html.kr .kr-post { padding: 14px 0; border-bottom: .5px solid var(--kr-sep); }
html.kr .kr-post:last-of-type { border-bottom: 0; }
html.kr .kr-post-title { margin: 6px 0 8px; font: 700 21px/1.3 var(--kr-font); color: var(--kr-text); }
html.kr .kr-post-head { display: flex; flex-wrap: wrap; align-items: baseline; gap: 2px 10px; margin-bottom: 6px; font-size: 12px; color: var(--kr-text2); }
html.kr .kr-post-name { font-weight: 600; color: var(--kr-text); }
html.kr .kr-post-id { font: 11px ui-monospace, SFMono-Regular, Menlo, monospace; }
html.kr .kr-post-no { margin-left: auto; padding: 0; border: 0; background: none; color: var(--kr-text3); font: inherit; cursor: pointer; }
html.kr .kr-post-no:hover { color: var(--kr-accent); }
html.kr .kr-post-text { font-size: 15px; line-height: 1.7; overflow-wrap: anywhere; }
html.kr .kr-post-op .kr-post-text { font-size: 16px; }
html.kr .kr-post-text a { color: var(--kr-accent); text-decoration: none; }
html.kr .kr-post-text a:hover { text-decoration: underline; }
html.kr .kr-post-text .resquote, html.kr .kr-post-text .unkfunc { color: var(--kr-text2); }
html.kr .kr-post-media { position: relative; display: inline-block; max-width: 100%; margin: 4px 0 8px; }
html.kr .kr-post-media img, html.kr .kr-post-media video { display: block; max-width: 100%; max-height: 70vh; width: auto; height: auto;
  border-radius: 10px; background: var(--kr-fill); }
html.kr .kr-post-media img { cursor: zoom-in; }
html.kr .kr-post-file { margin-top: 4px; font-size: 11px; color: var(--kr-text3); }
html.kr .kr-spoiler img, html.kr .kr-spoiler video { filter: blur(28px) saturate(.6); pointer-events: none; }
html.kr .kr-spoiler-btn { position: absolute; inset: 0; width: 100%; border: 0; border-radius: 10px; background: rgba(0, 0, 0, .25); color: #fff;
  font: 600 13px var(--kr-font); cursor: pointer; }
html.kr .kr-post-media:not(.kr-spoiler) .kr-spoiler-btn { display: none; }
html.kr .kr-backlinks { display: flex; flex-wrap: wrap; gap: 2px 10px; margin-top: 8px; font-size: 12px; color: var(--kr-text2); }
html.kr .kr-backlinks a { color: var(--kr-accent); text-decoration: none; }
html.kr .kr-loading, html.kr .kr-pane-error { padding: 18px 0; font-size: 13px; color: var(--kr-text2); }
html.kr .kr-pane-error { color: #ff453a; }
html.kr .kr-pane-error .kr-btn { margin: 10px 8px 0 0; }
html.kr .kr-preview { position: fixed; z-index: 10000; width: min(440px, 90vw); max-height: 52vh; overflow: hidden; padding: 4px 16px; box-sizing: border-box;
  border-radius: 12px; background: var(--kr-glass); backdrop-filter: blur(30px) saturate(180%); -webkit-backdrop-filter: blur(30px) saturate(180%);
  border: .5px solid var(--kr-sep); box-shadow: var(--kr-shadow); color: var(--kr-text); font-family: var(--kr-font); pointer-events: none; }
html.kr .kr-preview[hidden] { display: none; }
html.kr .kr-preview .kr-post { border: 0; }
html.kr .kr-preview img, html.kr .kr-preview video { max-height: 180px; }
html.kr .kr-lightbox { position: fixed; inset: 0; z-index: 10001; display: grid; place-items: center; background: rgba(0, 0, 0, .85); cursor: zoom-out; }
html.kr .kr-lightbox img { max-width: 96vw; max-height: 94vh; border-radius: 8px; }
html.kr .kr-flash { animation: kr-flash 1.6s ease-out; }
@keyframes kr-flash { from { background: color-mix(in srgb, var(--kr-accent) 22%, transparent); } to { background: transparent; } }

/* sidebar: to the window edge, translucent, accent selection */
/* stacking: list toolbar 50 < sidebar 51 < its ☰ 52 < pane 55 < form 9001 */
html.kr .kr-side { position: fixed; z-index: 51; inset: 0 auto 0 0; width: 248px; box-sizing: border-box; display: flex; flex-direction: column;
  background: var(--kr-glass); backdrop-filter: blur(30px) saturate(180%); -webkit-backdrop-filter: blur(30px) saturate(180%);
  border-right: .5px solid var(--kr-sep); color: var(--kr-text); font: 13px/1.35 var(--kr-font); }
html.kr .kr-side-head { padding: 12px 10px 6px; }
html.kr .kr-side-title { display: flex; align-items: center; justify-content: space-between; padding: 0 4px 8px; font: 700 13px var(--kr-font); color: var(--kr-text2); }
html.kr .kr-side button { color: inherit; cursor: pointer; font: inherit; }
html.kr .kr-side-close { width: 26px; height: 26px; border: 0; border-radius: 7px; background: none; font-size: 17px; color: var(--kr-text2); }
html.kr .kr-side-close:hover { background: var(--kr-fill); }
html.kr .kr-side-search { width: 100%; box-sizing: border-box; padding: 6px 10px 6px 28px; border: 0; border-radius: 8px; background-color: var(--kr-fill);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%238e8e93' stroke-width='2.4' stroke-linecap='round'%3E%3Ccircle cx='11' cy='11' r='7'/%3E%3Cpath d='m20 20-3.5-3.5'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: 9px 50%; color: var(--kr-text); font: 13px var(--kr-font); outline: none; }
html.kr .kr-side-search:focus { box-shadow: 0 0 0 3px color-mix(in srgb, var(--kr-accent) 40%, transparent); }
html.kr .kr-side-list { flex: 1; min-height: 0; overflow: auto; padding: 2px 8px 16px; }
html.kr .kr-side-group { margin-bottom: 4px; }
html.kr .kr-side-group-toggle { width: 100%; padding: 10px 6px 4px; border: 0; background: none; text-align: left; font-size: 11px !important;
  font-weight: 600 !important; color: var(--kr-text2) !important; }
html.kr .kr-side-row { display: flex; align-items: center; min-height: 28px; margin: 1px 0; border-radius: 7px; }
html.kr .kr-side-row:hover { background: var(--kr-fill); }
html.kr .kr-side-row[aria-current="page"] { background: var(--kr-accent); }
html.kr .kr-side-row > a { flex: 1; min-width: 0; padding: 4px 6px 4px 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  text-decoration: none; color: var(--kr-text) !important; }
html.kr .kr-side-row[aria-current="page"] > a, html.kr .kr-side-row[aria-current="page"] .kr-side-star, html.kr .kr-side-row[aria-current="page"] .kr-side-tag { color: #fff !important; }
html.kr .kr-side-star { flex: none; width: 26px; min-height: 26px; border: 0; background: none; color: var(--kr-text3); opacity: 0; }
html.kr .kr-side-row:hover .kr-side-star, html.kr .kr-side-star[aria-pressed="true"] { opacity: 1; }
html.kr .kr-side-star[aria-pressed="true"] { color: #ff9f0a; }
html.kr .kr-side-down > a { color: var(--kr-text3) !important; }
html.kr .kr-side-tag { flex: none; padding-right: 2px; font-size: 10px; color: var(--kr-text3); }
html.kr .kr-side-gate { display: flex; flex-wrap: wrap; gap: 6px; padding: 4px 6px 8px; }
html.kr .kr-side-gate[hidden] { display: none; }
html.kr .kr-side-gate input { flex: 1; min-width: 0; padding: 5px 8px; border: 0; border-radius: 7px; background: var(--kr-fill); color: inherit; font: inherit; }
html.kr .kr-side-gate button { padding: 5px 12px; border: 0; border-radius: 999px; background: var(--kr-accent); color: #fff; }
html.kr .kr-side-gate-error { flex-basis: 100%; font-size: 12px; color: #ff453a; }
html.kr .kr-side-gate-error:empty { display: none; }
html.kr .kr-side-open { display: none; position: fixed; z-index: 52; top: 11px; left: 10px; width: 30px; height: 30px; border: .5px solid var(--kr-sep);
  border-radius: 8px; background: var(--kr-glass); backdrop-filter: blur(20px); color: var(--kr-text); cursor: pointer; }
html.kr.kr-side-hidden .kr-side { display: none; }
html.kr.kr-side-hidden .kr-side-open { display: block; }
html.kr-md.kr-side-hidden .kr-toolbar { padding-left: 52px; }
html.kr-portal body { margin: 0; background: var(--kr-bg); }
html.kr-portal body > :not(.kr-side):not(.kr-side-open) { display: none !important; }
html.kr-portal .kr-side { border-right: 0; }

@media (max-width: 899px) {
  html.kr-md body { margin: 0 !important; padding: 0 12px 24px !important; }
  html.kr .kr-toolbar { margin: 0 -12px 10px; padding: 10px 12px 10px 52px; }
  html.kr-md .kr-side { box-shadow: var(--kr-shadow); }
  html.kr-md:not(.kr-side-overlay) .kr-side { display: none; }
  html.kr-md:not(.kr-side-overlay) .kr-side-open { display: block; }
  html.kr-md.kr-side-overlay .kr-side { display: flex; }
  html.kr-md.kr-side-overlay .kr-side-open { display: none; }
  html.kr .kr-pane { width: 100vw; border-left: 0; transform: translateX(100%); visibility: hidden; transition: transform .22s ease, visibility .22s; }
  html.kr.kr-pane-open .kr-pane { transform: none; visibility: visible; }
  html.kr.kr-pane-open body { overflow: hidden; }
  html.kr .kr-pane-back { display: inline-flex; }
  html.kr .kr-pane-close, html.kr .kr-pane-resize { display: none; }
  html.kr-md .kr-composer.kr-new { right: 16px; }
  html.kr-md .kr-composer.kr-reply-pane { left: 12px; right: 12px; width: auto; }
  html.kr-md #threads .thread.kr-peek .post.reply { margin-left: 0; }
}
`;

  const el = (tag, attrs = {}, text) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    if (text !== undefined) n.textContent = text;
    return n;
  };

  function setupSidebar(boards, portal = false) {
    const current = portal ? null : matchBoard(location.href, boards);
    let stars = store.get('kr.stars', []);
    let recent = store.get('kr.recent', []);
    let collapsed = store.get('kr.collapsed', {});
    let adultOk = store.get('kr.k2', false) === true;
    if (portal && !adultOk) {
      try {
        adultOk = localStorage.getItem('k2_verified') === '1';
      } catch {
        adultOk = false;
      }
    }
    if (!Array.isArray(stars)) stars = [];
    if (!Array.isArray(recent)) recent = [];
    if (!collapsed || typeof collapsed !== 'object' || Array.isArray(collapsed)) collapsed = {};
    if (current && !portal) {
      recent = [current.u, ...recent.filter((url) => url !== current.u)].slice(0, 6);
      store.set('kr.recent', recent);
    }

    const side = el('aside', { class: 'kr-side', 'aria-label': '板塊導覽' });
    const head = el('header', { class: 'kr-side-head' });
    const title = el('div', { class: 'kr-side-title' });
    const close = el('button', { type: 'button', class: 'kr-side-close', 'aria-label': '收起板塊導覽' }, '«');
    title.append(el('span', {}, 'K島'), close);
    const search = el('input', { class: 'kr-side-search', type: 'search', placeholder: '搜尋板塊…', 'aria-label': '搜尋板塊' });
    head.append(title, search);
    const list = el('div', { class: 'kr-side-list' });
    const open = el('button', { type: 'button', class: 'kr-side-open', 'aria-label': '開啟板塊導覽' }, '☰');
    side.append(head, list);
    document.body.append(side, open);

    const frameset = portal ? (() => {
      try {
        return window.parent.document.querySelector('frameset');
      } catch {
        return null;
      }
    })() : null;
    let hidden = store.get('kr.sideHidden', false) === true;
    let overlay = false;
    let currentExpanded = !!current;
    const applySide = () => {
      const mobile = !portal && window.innerWidth < 900;
      const visible = mobile ? overlay : !hidden;
      root.classList.toggle('kr-side-hidden', !visible);
      root.classList.toggle('kr-side-overlay', mobile && overlay);
      state.sideWidth = !portal && !mobile && visible ? 248 : 0;
      root.style.setProperty('--kr-side', `${state.sideWidth}px`);
      try {
        if (frameset) frameset.cols = visible ? '248,*' : '40,*';
      } catch {
        return;
      }
      window.dispatchEvent(new Event('kr-side-resize'));
    };
    close.addEventListener('click', () => {
      if (window.innerWidth < 900 && !portal) overlay = false;
      else {
        hidden = true;
        store.set('kr.sideHidden', true);
      }
      applySide();
    });
    open.addEventListener('click', () => {
      if (window.innerWidth < 900 && !portal) overlay = true;
      else {
        hidden = false;
        store.set('kr.sideHidden', false);
      }
      applySide();
      search.focus();
    });
    if (!portal) window.addEventListener('resize', applySide);

    const byUrl = (url) => boards.find((board) => normalizeBoardUrl(board.u) === normalizeBoardUrl(url));
    const row = (board) => {
      const node = el('div', { class: `kr-side-row${board.s === 'down' ? ' kr-side-down' : ''}` });
      const link = el('a', { href: board.u, target: board.c === '外部連結' ? '_blank' : portal ? 'cont' : '_self' }, board.l);
      if (board.c === '外部連結') link.rel = 'noopener';
      if (board.s === 'down') {
        link.title = `上次檢查 ${BOARDS_AT} 連不上`;
        node.dataset.tag = '連不上';
      }
      if (current && normalizeBoardUrl(current.u) === normalizeBoardUrl(board.u)) {
        node.setAttribute('aria-current', 'page');
        link.setAttribute('aria-current', 'page');
      }
      link.addEventListener('click', () => {
        if (window.innerWidth < 900 && !portal) {
          overlay = false;
          applySide();
        }
      });
      const starred = stars.includes(board.u);
      const star = el('button', { type: 'button', class: 'kr-side-star', 'aria-label': `${starred ? '移除' : '加入'}書籤 ${board.l}`, 'aria-pressed': String(starred) }, starred ? '★' : '☆');
      star.addEventListener('click', () => {
        stars = starred ? stars.filter((url) => url !== board.u) : [...stars, board.u];
        store.set('kr.stars', stars);
        render();
      });
      node.append(link);
      if (node.dataset.tag) node.append(el('span', { class: 'kr-side-tag', title: link.title }, node.dataset.tag));
      node.append(star);
      return node;
    };
    // the portal locks its 18禁 section behind a birth-year question; the sidebar asks the same question
    const isAdult = (board) => /18禁/.test(board.c);
    const ageGate = (name) => {
      const section = el('section', { class: 'kr-side-group' });
      const toggle = el('button', { type: 'button', class: 'kr-side-group-toggle', 'aria-expanded': 'false' }, `🔒 ${name.replace(/^▶\s*/, '').replace(/\s*\[鎖定\]$/, '')}`);
      const form = el('form', { class: 'kr-side-gate', hidden: '' });
      const year = el('input', { type: 'number', inputmode: 'numeric', placeholder: '出生年（西元）', 'aria-label': '出生年（西元）' });
      const error = el('span', { class: 'kr-side-gate-error', role: 'alert' });
      form.append(year, el('button', { type: 'submit' }, '確認'), error);
      toggle.addEventListener('click', () => {
        form.hidden = !form.hidden;
        if (!form.hidden) year.focus();
      });
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const verdict = ageVerdict(year.value, new Date().getFullYear());
        if (verdict !== 'adult') {
          error.textContent = verdict === 'minor' ? '未滿 18 歲不得瀏覽' : '請輸入有效的出生西元年';
          return;
        }
        adultOk = true;
        store.set('kr.k2', true);
        if (portal) {
          try {
            localStorage.setItem('k2_verified', '1');
          } catch {
            /* the site's own flag is a nicety; the sidebar already remembers */
          }
        }
        render();
      });
      section.append(toggle, form);
      list.append(section);
    };
    const group = (name, items, isCollapsed = false) => {
      if (!items.length) return;
      if (!adultOk && items.some(isAdult)) {
        ageGate(name);
        return;
      }
      const section = el('section', { class: 'kr-side-group' });
      const toggle = el('button', { type: 'button', class: 'kr-side-group-toggle', 'aria-expanded': String(!isCollapsed) }, `${isCollapsed ? '▸' : '▾'} ${name.replace(/^▶\s*/, '').replace(/\s*\[鎖定\]$/, '')}`);
      toggle.addEventListener('click', () => {
        currentExpanded = false;
        collapsed[name] = !isCollapsed;
        store.set('kr.collapsed', collapsed);
        render();
      });
      section.append(toggle);
      if (!isCollapsed) for (const board of items) section.append(row(board));
      list.append(section);
    };
    const render = () => {
      list.replaceChildren();
      const query = search.value.trim();
      if (query) {
        for (const board of filterBoards(boards, query)) if (adultOk || !isAdult(board)) list.append(row(board));
        return;
      }
      group('★ 書籤', stars.map(byUrl).filter(Boolean));
      group('最近', recent.map(byUrl).filter(Boolean));
      // unreachable boards stay in their category, dimmed: moving them out made categories look short
      const categories = [...new Set(boards.map((board) => board.c))];
      for (const category of categories) {
        group(category, boards.filter((board) => board.c === category), !!collapsed[category] && !(currentExpanded && category === current?.c));
      }
    };
    search.addEventListener('input', render);
    search.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const first = list.querySelector('.kr-side-row a');
        if (first) {
          e.preventDefault();
          first.click();
        }
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay) {
        overlay = false;
        applySide();
        e.stopImmediatePropagation();
      } else if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey && !e.target.closest?.('input, textarea, select, [contenteditable]') && !e.target.isContentEditable) {
        e.preventDefault();
        if (root.classList.contains('kr-side-hidden')) open.click();
        else search.focus();
      }
    }, true);
    applySide();
    render();
  }

  function portalBoards() {
    const statuses = new Map(BOARDS.map((board) => [normalizeBoardUrl(board.u), board.s]));
    const boards = [];
    let category = '';
    for (const item of document.querySelectorAll('li')) {
      if (item.classList.contains('category')) {
        category = item.textContent.trim();
        continue;
      }
      if (!category || category === '主題選擇') continue;
      for (const link of item.querySelectorAll(':scope > a[href]')) {
        const href = link.getAttribute('href');
        if (!href || href === '#' || /^javascript:/i.test(href)) continue;
        const url = link.href;
        boards.push({ c: category, l: link.textContent.trim(), u: url, s: statuses.get(normalizeBoardUrl(url)) || 'ok' });
      }
    }
    return boards;
  }

  function syncTheme() {
    const select = document.getElementById('theme-selector');
    const link = document.querySelector('link.second-style');
    const siteDark = select ? select.value === 'dark.css' : /dark/i.test(link?.getAttribute('href') || '');
    const siteChose = select ? select.value !== '' : false;
    const dark = siteChose ? siteDark : window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.toggleAttribute('data-kr-dark', dark);
  }

  function watchTheme() {
    syncTheme();
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', syncTheme);
    document.getElementById('theme-selector')?.addEventListener('change', () => setTimeout(syncTheme, 50));
  }

  // ---- composer: the site's own #postform_main, made to float. It is never moved, cloned or display:none'd:
  // the Turnstile frame inside it would reload and drop its token.
  const composer = { form: null, resto: null, restoInput: null, mode: 'new', target: null, posting: false, sent: '', category: '' };

  function setupComposer() {
    const form = document.getElementById('postform_main');
    if (!form) return;
    const resto = form.querySelector('input[name="resto"]')?.value || null;
    composer.form = form;
    composer.resto = resto;
    form.classList.add('kr-composer', resto ? 'kr-reply' : 'kr-new');

    const bar = el('div', { class: 'kr-composer-bar' });
    const toggle = el('button', { type: 'button', class: 'kr-composer-toggle', 'aria-expanded': 'false' });
    const close = el('button', { type: 'button', class: 'kr-composer-close', 'aria-label': '收起', title: '收起（Esc）' }, '×');
    bar.append(toggle, close);
    form.insertBefore(bar, form.firstChild);
    form.append(el('div', { class: 'kr-composer-status', role: 'status' }));

    toggle.addEventListener('click', () => (form.dataset.krState === 'expanded' && composer.mode === 'new' && !resto ? collapse() : expand(true)));
    close.addEventListener('click', collapse);
    form.addEventListener('focusin', (e) => {
      if (!bar.contains(e.target)) expand(false);
    });

    if (!resto) {
      // replying from the board page: the site's own Quick Reply posts the same form with a resto field
      composer.restoInput = el('input', { type: 'hidden', name: 'resto', value: '', disabled: '' });
      form.append(composer.restoInput);
      composer.category = form.querySelector('input[name="category"]')?.value || '';
      // results land in a hidden frame so the board and the open thread stay where they are
      const sink = el('iframe', { name: 'kr-sink', title: '發文結果', hidden: '' });
      document.body.append(sink);
      form.target = 'kr-sink';
      // formdata fires only once the site's own submit checks have let the post through
      form.addEventListener('formdata', () => {
        composer.posting = true;
        composer.sent = document.getElementById('fcom')?.value || '';
        setStatus('送出中⋯');
      });
      sink.addEventListener('load', () => onPosted(sink));
    }
    collapse();
  }

  function setStatus(text, error = false) {
    const status = composer.form?.querySelector('.kr-composer-status');
    if (!status) return;
    status.textContent = text;
    status.classList.toggle('kr-error', error);
  }

  function resetTurnstile() {
    try {
      const page = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
      page.turnstile?.reset();
    } catch {
      /* no widget on this board */
    }
  }

  function onPosted(sink) {
    if (!composer.posting) return;
    let doc = null;
    try {
      doc = sink.contentDocument;
    } catch {
      doc = null;
    }
    const scripts = [...(doc?.scripts || [])].map((n) => n.textContent).join('\n');
    const outcome = postOutcome({
      readable: !!doc?.body,
      threads: !!doc?.getElementById('threads'),
      redirect: !!doc?.querySelector('meta[http-equiv="refresh" i]') || /location\s*\.\s*(href|replace|assign)|window\.location\s*=/.test(scripts),
      text: doc?.body?.innerText || '',
    });
    if (outcome.kind === 'wait') return;
    composer.posting = false;
    resetTurnstile();
    if (outcome.kind === 'ok') {
      posted();
      return;
    }
    // no verdict from the page: in a thread, the thread itself shows whether the reply landed
    const probe = postedProbe(composer.sent);
    const unsure = () =>
      // the text stays in the box: nothing is cleared unless the post is confirmed
      setStatus(`看不出有沒有送出（${outcome.message}）。內容還在框裡，請按 ↻ 或在新分頁確認。`, true);
    if (composer.mode === 'reply' && composer.target && probe) {
      const res = composer.target;
      loadThread(res, true).then(
        (posts) => (posts.some((p) => (p.quote?.textContent || '').includes(probe)) ? posted() : unsure()),
        unsure,
      );
    } else {
      unsure();
    }
  }

  function posted() {
    setStatus('已送出');
    const ta = document.getElementById('fcom');
    if (ta) ta.value = '';
    const file = document.getElementById('fupfile');
    if (file) file.value = '';
    collapse();
    if (composer.mode === 'reply' && composer.target) openThread(composer.target, { fresh: true });
    else location.reload();
  }

  function setLabel() {
    const { form, resto, mode, target } = composer;
    const toggle = form.querySelector('.kr-composer-toggle');
    const open = form.dataset.krState === 'expanded';
    const no = resto || (mode === 'reply' ? target : null);
    toggle.textContent = no ? (open ? `回覆 No.${no}` : `✎ 回覆 No.${no}⋯　點任一則的 No. 可引用`) : open ? '發新串' : '✎ 發新串';
    toggle.setAttribute('aria-expanded', String(open));
  }

  function composerReply(res) {
    const { form, restoInput } = composer;
    if (!form || !restoInput) return;
    if (composer.mode !== 'reply' || composer.target !== res) setStatus('');
    composer.mode = 'reply';
    composer.target = res;
    restoInput.value = String(res);
    restoInput.disabled = false;
    // the site's Quick Reply clears the board's default category for replies on /00b/
    const category = form.querySelector('input[name="category"]');
    if (category) category.value = '';
    form.classList.add('kr-reply-pane');
    form.classList.remove('kr-new');
    setLabel();
  }

  function composerNew() {
    const { form, restoInput } = composer;
    if (!form || !restoInput) return;
    if (composer.mode !== 'new') setStatus('');
    composer.mode = 'new';
    composer.target = null;
    restoInput.value = '';
    restoInput.disabled = true;
    const category = form.querySelector('input[name="category"]');
    if (category && !category.value) category.value = composer.category;
    form.classList.add('kr-new');
    form.classList.remove('kr-reply-pane');
    setLabel();
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

  // No. in a post head on the site's own pages: the site opens its quick-reply box there. Quote into the floating form instead.
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

  // ---- reading a thread out of the site's markup: a board card, or a thread page fetched in the background
  function readPosts(thread) {
    return [...thread.querySelectorAll('.post[data-no]')].map((post) => {
      const head = post.querySelector('.post-head');
      const headText = head?.textContent || '';
      const holder = post.querySelector('.md5-image[data-image-original]');
      const fileLink = post.querySelector('.file-text a[href]');
      const src = holder?.getAttribute('data-image-original') || fileLink?.getAttribute('href') || '';
      const info = (post.querySelector('.file-text')?.textContent || '').replace(/^\s*檔名[:：]\s*/, '').trim();
      return {
        no: Number(post.getAttribute('data-no')),
        op: post.classList.contains('threadpost'),
        title: head?.querySelector('.title')?.textContent.trim() || '',
        name: head?.querySelector('.name')?.textContent.trim() || '',
        time: shortTime(head?.querySelector('.now')?.textContent || '', new Date()) || '',
        // the site moves the ID out of .now into .id[data-id] once its script runs; a fetched page still has it in .now
        id: head?.querySelector('.id')?.getAttribute('data-id') || /ID:\s*([A-Za-z0-9./+]+)/.exec(head?.querySelector('.now')?.textContent || headText)?.[1] || '',
        media: src
          ? {
              src,
              thumb: holder?.getAttribute('data-image-thumb') || post.querySelector('.file-thumb img')?.getAttribute('src') || '',
              kind: mediaKind(src),
              dims: fileDims(info),
              info,
              spoiler: !!post.querySelector('.media-spoiler'),
            }
          : null,
        quote: post.querySelector('.quote'),
      };
    });
  }

  // post text is user content: only the markup a post needs survives the copy
  function cleanQuote(quote) {
    const q = quote.cloneNode(true);
    for (const n of q.querySelectorAll('script, style, iframe, object, embed, form, input, button, .postvote-slot, .backquote, .-expand-line, .text-button, .kr-meta')) n.remove();
    for (const n of q.querySelectorAll('.hide')) n.replaceWith(...n.childNodes);
    for (const n of q.querySelectorAll('*')) {
      for (const a of [...n.attributes]) if (/^on/i.test(a.name) || a.name === 'style' || a.name === 'id') n.removeAttribute(a.name);
      if (/^\s*(javascript|data|vbscript):/i.test(n.getAttribute('href') || '')) n.removeAttribute('href');
      if (/^\s*(javascript|vbscript):/i.test(n.getAttribute('src') || '')) n.removeAttribute('src');
    }
    while (q.lastChild && (q.lastChild.nodeName === 'BR' || (q.lastChild.nodeType === 3 && !q.lastChild.data.trim()))) q.lastChild.remove();
    return q;
  }

  function renderMedia(m) {
    const box = el('div', { class: `kr-post-media${m.spoiler ? ' kr-spoiler' : ''}` });
    let node;
    if (m.kind === 'video') {
      node = el('video', { controls: '', preload: 'metadata', playsinline: '', src: m.src });
      if (m.thumb) node.poster = m.thumb;
    } else {
      node = el('img', { src: m.src, alt: '', loading: 'lazy', decoding: 'async' });
      node.dataset.full = m.src;
      // the board syncs uploads to its image host in the background: until then only the thumbnail exists
      if (m.thumb) node.addEventListener('error', () => node.getAttribute('src') !== m.thumb && node.setAttribute('src', m.thumb), { once: true });
    }
    // images reserve their box from the file line; videos take their own size (the line can be off for them)
    if (m.dims && m.kind !== 'video') {
      node.setAttribute('width', String(m.dims.w));
      node.setAttribute('height', String(m.dims.h));
    }
    box.append(node);
    if (m.spoiler) box.append(el('button', { type: 'button', class: 'kr-spoiler-btn' }, '發文者標了防雷・點一下顯示'));
    if (m.info) box.append(el('div', { class: 'kr-post-file' }, m.info));
    return box;
  }

  function renderPosts(res, posts, note) {
    const pane = state.pane;
    const byNo = new Set(posts.map((p) => p.no));
    const backs = new Map();
    const articles = posts.map((p) => {
      const art = el('article', { class: `kr-post${p.op ? ' kr-post-op' : ''}`, id: `kr-p${p.no}`, 'data-no': String(p.no) });
      if (p.op && p.title && p.title !== '無題') art.append(el('h2', { class: 'kr-post-title' }, p.title));
      const head = el('header', { class: 'kr-post-head' });
      head.append(el('span', { class: 'kr-post-name' }, p.name || '無名'));
      if (p.time) head.append(el('span', { class: 'kr-post-time' }, p.time));
      if (p.id) head.append(el('span', { class: 'kr-post-id' }, `ID:${p.id}`));
      head.append(el('button', { type: 'button', class: 'kr-post-no', 'data-no': String(p.no), title: '引用這則並回覆' }, `No.${p.no}`));
      art.append(head);
      if (p.media) art.append(renderMedia(p.media));
      const text = el('div', { class: 'kr-post-text' });
      if (p.quote) text.append(...cleanQuote(p.quote).childNodes);
      for (const a of text.querySelectorAll('a[href]')) {
        const href = a.getAttribute('href');
        const local = /^#r(\d+)$/.exec(href);
        const link = local ? { res, post: Number(local[1]) } : threadLink(href, location.href);
        if (link && link.res === res && link.post && byNo.has(link.post)) {
          a.className = 'kr-q';
          a.dataset.no = String(link.post);
          a.setAttribute('href', `#kr-p${link.post}`);
          a.removeAttribute('target');
          if (!backs.has(link.post)) backs.set(link.post, new Set());
          backs.get(link.post).add(p.no);
        } else if (link) {
          a.className = 'kr-q-thread';
          a.dataset.res = String(link.res);
          if (link.post) a.dataset.post = String(link.post);
          a.removeAttribute('target');
        } else if (/^https?:/i.test(href)) {
          a.target = '_blank';
          a.rel = 'noopener noreferrer nofollow';
        }
      }
      art.append(text);
      return art;
    });
    for (const art of articles) {
      const from = backs.get(Number(art.dataset.no));
      if (!from) continue;
      const foot = el('footer', { class: 'kr-backlinks' }, '↩ ');
      for (const n of [...from].sort((a, b) => a - b)) foot.append(el('a', { class: 'kr-q', href: `#kr-p${n}`, 'data-no': String(n) }, `>>${n}`));
      art.append(foot);
    }
    pane.body.replaceChildren(...articles, ...(note ? [el('div', { class: 'kr-loading' }, note)] : []));
  }

  // ---- the detail pane
  const threadCache = new Map();
  const CACHE_MS = 60000;

  function loadThread(res, fresh = false) {
    const hit = threadCache.get(res);
    if (hit && !fresh && Date.now() - hit.at < CACHE_MS) return hit.promise;
    const promise = fetch(`pixmicat.php?res=${res}`, { credentials: 'same-origin' })
      .then((r) => {
        if (!r.ok) throw new Error(`伺服器回應 HTTP ${r.status}`);
        return r.text();
      })
      .then((html) => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const thread = doc.querySelector(`#threads .thread[data-no="${res}"]`);
        if (!thread) throw new Error('這一頁裡沒有這串（可能已被刪除或下沉）');
        return readPosts(thread);
      });
    threadCache.set(res, { at: Date.now(), promise });
    promise.catch(() => threadCache.delete(res));
    return promise;
  }

  function setupPane() {
    const pane = el('aside', { class: 'kr-pane', 'aria-label': '討論串' });
    const resize = el('div', { class: 'kr-pane-resize', title: '拖曳調整寬度' });
    const head = el('header', { class: 'kr-pane-head' });
    const back = el('button', { type: 'button', class: 'kr-btn kr-pane-back' }, '‹ 列表');
    const titles = el('div', { class: 'kr-pane-titles' });
    const title = el('div', { class: 'kr-pane-title' }, '討論串');
    const sub = el('div', { class: 'kr-pane-sub' });
    titles.append(title, sub);
    const actions = el('div', { class: 'kr-pane-actions' });
    const reply = el('button', { type: 'button', class: 'kr-btn kr-primary', title: '回覆這串' }, '✎ 回覆');
    const newtab = el('a', { class: 'kr-btn', target: '_blank', rel: 'noopener', title: '在新分頁開啟（推噓、檢舉、編輯在那裡）' }, '↗');
    const reload = el('button', { type: 'button', class: 'kr-btn', title: '重新載入這串' }, '↻');
    actions.append(reply, newtab, reload);
    const close = el('button', { type: 'button', class: 'kr-btn kr-pane-close', 'aria-label': '關閉', title: '關閉（Esc）' }, '×');
    head.append(back, titles, actions, close);
    const body = el('div', { class: 'kr-pane-body' });
    const preview = el('div', { class: 'kr-preview', hidden: '' });
    pane.append(resize, head, body);
    document.body.append(pane, preview);
    const p = (state.pane = { el: pane, body, title, sub, newtab, preview, res: null, full: false });

    let width = null;
    try {
      width = Number(localStorage.getItem(WIDTH_KEY)) || null;
    } catch {
      width = null;
    }
    const applyWidth = () => {
      const docked = window.innerWidth >= 900;
      root.classList.toggle('kr-docked', docked);
      root.style.setProperty('--kr-drawer-w', docked ? `${clampWidth(width, window.innerWidth - state.sideWidth)}px` : '0px');
    };
    applyWidth();
    window.addEventListener('resize', applyWidth);
    window.addEventListener('kr-side-resize', applyWidth);

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
        width = clampWidth(width, window.innerWidth - state.sideWidth);
        try {
          localStorage.setItem(WIDTH_KEY, String(width));
        } catch {
          /* private mode: the width just is not remembered */
        }
      };
      resize.addEventListener('pointermove', move);
      resize.addEventListener('lostpointercapture', up, { once: true });
    });

    close.addEventListener('click', closePane);
    back.addEventListener('click', closePane);
    reload.addEventListener('click', () => p.res && openThread(p.res, { fresh: true }));
    reply.addEventListener('click', () => {
      if (!p.res) return;
      composerReply(p.res);
      expand(true);
    });

    body.addEventListener('click', (e) => {
      const q = e.target.closest('.kr-q[data-no]');
      if (q) {
        e.preventDefault();
        flashPost(Number(q.dataset.no));
        return;
      }
      const other = e.target.closest('.kr-q-thread[data-res]');
      if (other && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
        e.preventDefault();
        openThread(Number(other.dataset.res), { post: Number(other.dataset.post) || null });
        return;
      }
      const no = e.target.closest('.kr-post-no');
      if (no) {
        composerReply(p.res);
        quoteIntoComposer(Number(no.dataset.no));
        return;
      }
      const spoiler = e.target.closest('.kr-spoiler-btn');
      if (spoiler) {
        spoiler.parentElement.classList.remove('kr-spoiler');
        return;
      }
      const img = e.target.closest('.kr-post-media img');
      if (img) openLightbox(img.dataset.full || img.src);
    });

    // hovering a >>No. shows that post, as the site's popups do
    body.addEventListener('mouseover', (e) => {
      const q = e.target.closest('.kr-q[data-no]');
      if (!q) return;
      const post = body.querySelector(`#kr-p${q.dataset.no}`);
      if (!post) return;
      const copy = post.cloneNode(true);
      copy.removeAttribute('id');
      for (const v of copy.querySelectorAll('video')) v.removeAttribute('autoplay');
      preview.replaceChildren(copy);
      preview.hidden = false;
      const r = q.getBoundingClientRect();
      const w = preview.offsetWidth;
      const h = preview.offsetHeight;
      preview.style.left = `${Math.max(8, Math.min(r.left, window.innerWidth - w - 8))}px`;
      preview.style.top = `${r.top - h - 8 > 8 ? r.top - h - 8 : Math.min(r.bottom + 8, window.innerHeight - h - 8)}px`;
    });
    body.addEventListener('mouseout', (e) => {
      if (e.target.closest('.kr-q[data-no]')) preview.hidden = true;
    });
    // only the reader's own scrolling hides it: images loading above shift the scroll position (scroll anchoring)
    // and fire scroll events that are not the reader's
    for (const type of ['wheel', 'touchmove']) body.addEventListener(type, () => (preview.hidden = true), { passive: true });
  }

  function openLightbox(src) {
    const box = el('div', { class: 'kr-lightbox', role: 'dialog', 'aria-label': '原圖' });
    box.append(el('img', { src, alt: '' }));
    box.addEventListener('click', () => box.remove());
    document.body.append(box);
  }

  function selectCard(res) {
    for (const n of document.querySelectorAll('#threads .thread.kr-selected')) n.classList.remove('kr-selected');
    document.querySelector(`#threads .thread[data-no="${res}"]`)?.classList.add('kr-selected');
  }

  function setPaneTitle(res, posts) {
    const p = state.pane;
    const card = document.querySelector(`#threads .thread[data-no="${res}"]`);
    const op = posts?.find((x) => x.op);
    const t = (op?.title || card?.querySelector('.threadpost .title')?.textContent || '').trim();
    // an untitled thread is named by its first line, as a mail without subject would be
    const quote = op?.quote || card?.querySelector('.threadpost .quote');
    const first = (quote?.innerText || quote?.textContent || '').split('\n').map((l) => l.trim()).find((l) => l && !/^>>\d+$/.test(l)) || '';
    p.title.textContent = t && t !== '無題' ? t : first.slice(0, 60) || `No.${res}`;
    const count = posts ? `${posts.length - 1} 則回應` : card?.querySelector('.kr-meta-count')?.textContent.replace(/^💬\s*/, '') || '';
    p.sub.textContent = [`No.${res}`, count].filter(Boolean).join(' · ');
    p.newtab.href = `pixmicat.php?res=${res}`;
  }

  function flashPost(no) {
    const post = state.pane?.body.querySelector(`#kr-p${no}`);
    if (!post) return false;
    post.scrollIntoView({ block: 'center' });
    post.classList.remove('kr-flash');
    void post.offsetWidth;
    post.classList.add('kr-flash');
    return true;
  }

  let openTimer = null;

  async function openThread(res, { post = null, quote = null, fresh = false } = {}) {
    const p = state.pane;
    if (!p || !res) return;
    clearTimeout(openTimer);
    const switching = p.res !== res;
    p.res = res;
    const wasOpen = root.classList.contains('kr-pane-open');
    root.classList.add('kr-pane-open');
    selectCard(res);
    // opening the pane narrows the list and rewraps every row: keep the chosen row in sight
    if (!wasOpen) document.querySelector(`#threads .thread[data-no="${res}"]`)?.scrollIntoView({ block: 'nearest' });
    setPaneTitle(res);
    composerReply(res);
    if (quote) quoteIntoComposer(quote);
    if (switching) {
      p.full = false;
      p.body.scrollTop = 0;
      // what the board already shows (the OP and its latest replies) goes up at once; the rest follows the fetch
      const card = document.querySelector(`#threads .thread[data-no="${res}"]`);
      if (card) renderPosts(res, readPosts(card), '正在載入其餘回應⋯');
      else p.body.replaceChildren(el('div', { class: 'kr-loading' }, '載入中⋯'));
    }
    if (p.full && !fresh) {
      if (post) flashPost(post);
      return;
    }
    let posts;
    try {
      posts = await loadThread(res, fresh);
    } catch (err) {
      if (p.res !== res) return;
      const box = el('div', { class: 'kr-pane-error' }, `沒能載入這串：${err.message}`);
      const retry = el('button', { type: 'button', class: 'kr-btn' }, '再試一次');
      retry.addEventListener('click', () => openThread(res, { fresh: true }));
      const tab = el('a', { class: 'kr-btn', href: `pixmicat.php?res=${res}`, target: '_blank', rel: 'noopener' }, '在新分頁開啟');
      box.append(el('br'), retry, tab);
      p.body.querySelector('.kr-loading')?.remove();
      p.body.append(box);
      return;
    }
    if (p.res !== res) return;
    const top = p.body.scrollTop;
    renderPosts(res, posts);
    p.body.scrollTop = top;
    p.full = true;
    setPaneTitle(res, posts);
    if (post) flashPost(post);
    // the next row is the likeliest next read (j): fetch it while this one is being read
    const next = document.querySelector(`#threads .thread[data-no="${res}"]`)?.nextElementSibling;
    const nextNo = Number(next?.closest('.thread')?.dataset.no || next?.dataset?.no);
    if (nextNo) loadThread(nextNo).catch(() => {});
  }

  function closePane() {
    const p = state.pane;
    if (!p) return;
    clearTimeout(openTimer);
    root.classList.remove('kr-pane-open');
    selectCard(null);
    p.res = null;
    p.full = false;
    p.body.replaceChildren();
    p.preview.hidden = true;
    composerNew();
  }

  // ---- the board page's own header, folded into a toolbar
  function setupToolbar() {
    const header = document.getElementById('header');
    const bar = el('div', { class: 'kr-toolbar' });
    const titles = el('div', { class: 'kr-toolbar-titles' });
    const boardName = header?.querySelector('h1')?.textContent.trim() || document.title;
    const view = new URL(location.href).searchParams.get('c');
    titles.append(el('span', { class: 'kr-toolbar-title' }, view || boardName));
    if (view) titles.append(el('span', { class: 'kr-toolbar-sub' }, boardName));
    const online = document.getElementById('online-counter');
    if (online) titles.append(online);
    const write = el('button', { type: 'button', class: 'kr-btn kr-primary' }, '✎ 發新串');
    write.addEventListener('click', () => {
      composerNew();
      expand(true);
    });
    const refresh = el('a', { class: 'kr-btn', href: location.href.split('#')[0], title: '重新整理' }, '↻');
    const more = el('button', { type: 'button', class: 'kr-btn', 'aria-haspopup': 'menu', 'aria-expanded': 'false', title: '更多' }, '⋯');
    const menu = el('div', { class: 'kr-menu', role: 'menu', hidden: '' });
    for (const a of header?.querySelectorAll('#toplink a[href]') || []) {
      const item = el('a', { href: a.getAttribute('href'), role: 'menuitem' }, a.textContent.trim());
      if (a.target) item.target = a.target;
      menu.append(item);
    }
    const theme = document.getElementById('theme-selector');
    if (theme) {
      const row = el('label', { class: 'kr-menu-row' }, '主題');
      row.append(theme);
      menu.append(el('div', { class: 'kr-menu-sep' }), row);
    }
    const toggleMenu = (open) => {
      menu.hidden = !open;
      more.setAttribute('aria-expanded', String(open));
    };
    more.addEventListener('click', () => toggleMenu(menu.hidden));
    document.addEventListener('click', (e) => {
      if (!menu.hidden && !menu.contains(e.target) && !more.contains(e.target)) toggleMenu(false);
    });
    bar.append(titles, write, refresh, more, menu);
    document.body.prepend(bar);
  }

  // ---- the board page's list rows
  function decorateThreads() {
    for (const card of document.querySelectorAll('#threads .thread')) {
      const replies = card.querySelectorAll('.post.reply');
      const total = replies.length + omittedCount(card.querySelector('.warn_txt2')?.textContent || '');
      const time = replies.length ? shortTime(replies[replies.length - 1].querySelector('.now')?.textContent || '', new Date()) : null;
      const label = total ? `💬 ${total} 則回應${time ? ` · 最後 ${time}` : ''}` : '還沒有回應';
      let meta = card.querySelector('.kr-meta');
      if (!meta) {
        meta = el('div', { class: 'kr-meta' });
        meta.append(el('span', { class: 'kr-meta-count' }));
        card.append(meta);
        // the row keeps only its title and text; when it was posted goes to the corner, as in a mail list
        const opTitle = card.querySelector('.threadpost .title');
        if (opTitle?.textContent.trim() === '無題') opTitle.classList.add('kr-untitled');
        const when = shortTime(card.querySelector('.threadpost .now')?.textContent || '', new Date());
        if (when) card.append(el('span', { class: 'kr-when' }, when));
      }
      if (meta.firstChild.textContent !== label) meta.firstChild.textContent = label;
      let peek = meta.querySelector('button');
      if (replies.length && !peek) {
        peek = el('button', { type: 'button' });
        peek.addEventListener('click', () => {
          card.classList.toggle('kr-peek');
          peek.textContent = card.classList.contains('kr-peek') ? '收起 ▴' : `展開最新 ${card.querySelectorAll('.post.reply').length} 則 ▾`;
        });
        meta.append(peek);
      }
      if (peek && !replies.length) peek.remove();
      else if (peek && !card.classList.contains('kr-peek') && peek.textContent !== `展開最新 ${replies.length} 則 ▾`) peek.textContent = `展開最新 ${replies.length} 則 ▾`;
    }
  }

  function initBoard() {
    root.classList.add('kr-md');
    if (window.name !== 'cont' || window.top === window) setupSidebar(BOARDS);
    setupToolbar();
    setupPane();
    composerNew();
    decorateThreads();
    const threads = document.getElementById('threads');
    // one pass per frame at most, and none for our own footers
    let queued = false;
    if (threads) {
      new MutationObserver((records) => {
        if (queued || records.every((r) => r.target.closest?.('.kr-meta'))) return;
        queued = true;
        requestAnimationFrame(() => {
          queued = false;
          decorateThreads();
        });
      }).observe(threads, { childList: true, subtree: true });
    }

    // the site's ▲▼ scroll buttons are a bare fixed div (inside a <center>) at the window's right edge, now under the pane:
    // give them the list's edge
    const tagScroll = () => {
      for (const n of document.querySelectorAll('div[style*="position: fixed"]:not([class])')) {
        if (/^▲\s*▼$/.test(n.textContent.trim())) n.classList.add('kr-site-scroll');
      }
    };
    window.addEventListener('load', () => {
      tagScroll();
      setTimeout(tagScroll, 1500);
    }, { once: true });

    // a row the pointer rests on is probably next: start its fetch
    let hoverTimer = null;
    threads?.addEventListener('mouseover', (e) => {
      const card = e.target.closest('.thread[data-no]');
      if (!card || card.contains(e.relatedTarget)) return;
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => loadThread(Number(card.dataset.no)).catch(() => {}), 180);
    });

    window.addEventListener(
      'click',
      (e) => {
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        if (!e.target.closest?.('#threads')) return;
        onHeadNumber(e, (no, op) => openThread(op, { quote: no }));
        if (e.defaultPrevented) return;
        // an OP thumbnail opens the thread (the pane shows the full image); the site would expand it in the row
        const thumbRes = Number(e.target.closest('.threadpost .file-thumb')?.closest('.thread[data-no]')?.dataset.no);
        if (thumbRes) {
          e.preventDefault();
          e.stopPropagation();
          openThread(thumbRes);
          return;
        }
        const a = e.target.closest('a[href]');
        if (a && (!a.target || a.target === '_self')) {
          const link = threadLink(a.getAttribute('href'), location.href);
          if (link) {
            e.preventDefault();
            e.stopPropagation();
            openThread(link.res, { post: link.post });
            return;
          }
        }
        if (e.target.closest('a, button, input, label, textarea, select, summary, video, .file-thumb, .postvote-slot, .post-menu-toggle, .qlink')) return;
        const card = e.target.closest('#threads .thread[data-no]');
        if (card) openThread(Number(card.dataset.no));
      },
      true,
    );
  }

  function onKey(e) {
    if (e.isComposing || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const { form } = composer;
    if (e.key === 'Escape') {
      const box = document.querySelector('.kr-lightbox');
      if (box) box.remove();
      else if (form && form.dataset.krState === 'expanded') collapse();
      else closePane();
      return;
    }
    if (!root.classList.contains('kr-md') || e.target.closest?.('input, textarea, select, [contenteditable]') || e.target.isContentEditable) return;
    const cards = [...document.querySelectorAll('#threads .thread[data-no]')];
    if (e.key === 'j' || e.key === 'k') {
      const current = cards.findIndex((card) => card.classList.contains('kr-selected'));
      const next = stepIndex(current, e.key === 'j' ? 1 : -1, cards.length);
      if (next < 0) return;
      e.preventDefault();
      selectCard(Number(cards[next].dataset.no));
      cards[next].scrollIntoView({ block: 'nearest' });
      clearTimeout(openTimer);
      openTimer = setTimeout(() => openThread(Number(cards[next].dataset.no)), 200);
    } else if (e.key === 'Enter' || e.key === 'o') {
      const card = document.querySelector('#threads .thread.kr-selected');
      if (card) {
        e.preventDefault();
        openThread(Number(card.dataset.no));
      }
    }
  }

  function init() {
    if (root.classList.contains('kr-portal')) {
      root.toggleAttribute('data-kr-dark', window.matchMedia('(prefers-color-scheme: dark)').matches);
      setupSidebar(portalBoards(), true);
      return;
    }
    watchTheme();
    setupComposer();
    document.addEventListener('keydown', onKey);
    if (composer.resto) {
      root.classList.add('kr-thread');
      window.addEventListener('click', (e) => onHeadNumber(e, (no) => quoteIntoComposer(no)), true);
    } else if (document.getElementById('threads')) {
      initBoard();
    }
  }

  function start() {
    // the hidden frame that receives posts loads the board too; it needs none of this
    if (window.name === 'kr-sink') return;
    root = document.documentElement;
    root.classList.add('kr', location.hostname === 'komica1.org' ? 'kr-portal' : 'kr-top');
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
