// ==UserScript==
// @name         Komica Reader
// @name:zh-TW   K島閱讀改善
// @namespace    https://github.com/operonlab/userscripts
// @version      0.6.6
// @description  A three-column reader for Komica's 綜合 board, the 2cat boards and the portal, in a macOS style: boards, threads, and the thread itself with full-size images, opening at once; the post form floats over it.
// @description:zh-TW  K島綜合版、2cat 各板與入口改成 macOS 風格三欄閱讀：板塊、串列表、串內容（大圖直接顯示、點下去立刻出現），發文／回文表單浮在旁邊。
// @author       operonlab
// @license      MIT
// @homepageURL  https://github.com/operonlab/userscripts/tree/main/komica-reader
// @supportURL   https://github.com/operonlab/userscripts/issues
// @updateURL    https://raw.githubusercontent.com/operonlab/userscripts/main/komica-reader/komica-reader.user.js
// @downloadURL  https://raw.githubusercontent.com/operonlab/userscripts/main/komica-reader/komica-reader.user.js
// @match        https://gaia.komica1.org/00b/*
// @match        https://komica1.org/*
// @match        https://2cat.org/*
// @match        https://2cat.uk/*
// @match        https://cat.2nyan.org/*
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
    { c: '連線板', l: '2CAT', u: 'https://2cat.uk/', s: 'ok', p: 'https://2cat.komica1.org/' },
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
    { c: '連線二板', l: '職業', u: 'https://2cat.org/~career/', s: 'ok', f: 'https://2cat.org/career/' },
    { c: '連線二板', l: '財經', u: 'https://2cat.org/~finance/', s: 'ok' },
    { c: '連線二板', l: '生活消費', u: 'http://gzone-anime.info/UnitedSites/shopping/', s: 'ok' },
    { c: '連線二板', l: '法律', u: 'https://2cat.org/~law/', s: 'ok' },
    { c: '連線二板', l: '海外', u: 'https://eclair.nagatoyuki.org/outremer/', s: 'ok' },
    { c: '連線二板', l: '閒談@香港', u: 'https://kagaminerin.org/hongkong/', s: 'down' },
    { c: '連線二板', l: '藝術', u: 'http://gzone-anime.info/UnitedSites/art/', s: 'ok' },
    { c: '連線二板', l: '繪師', u: 'https://2cat.org/~artist/', s: 'ok', f: 'https://2cat.org/artist/' },
    { c: '連線二板', l: '交易合購', u: 'https://komica.yucie.net/trade/', s: 'down' },
    { c: '連線二板', l: '鋼普拉', u: 'https://gaia.komica1.org/00b/pixmicat2.php?c=%E9%8B%BC%E6%99%AE%E6%8B%89', s: 'ok' },
    { c: '連線二板', l: '生存遊戲', u: 'https://2cat.komica1.org/~gtr2003/pixmicat1/', s: 'down' },
    { c: '連線二板', l: '猜謎', u: 'https://2cat.org/~quiz/', s: 'ok' },
    { c: '連線二板', l: '故事接龍', u: 'https://storysol.boguspix.com/', s: 'ok' },
    { c: '連線二板', l: '歐美動畫', u: 'https://grea.komica1.org/76/', s: 'down' },
    { c: '連線二板', l: '大自然', u: 'https://2cat.komica1.org/~rt/pd/', s: 'down' },
    { c: '連線二板', l: '天文', u: 'https://2cat.org/~astronomy/', s: 'ok', f: 'https://2cat.org/astronomy/' },
    { c: '連線二板', l: '命理', u: 'https://gaia.komica1.org/00b/pixmicat2.php?c=%E5%91%BD%E7%90%86', s: 'ok' },
    { c: '連線二板', l: '戀愛', u: 'https://moecorner.com/iboards/Relationship/', s: 'down' },
    { c: '連線二板', l: '超常現象', u: 'https://2cat.org/~supernature/', s: 'ok' },
    { c: '連線二板', l: '夢', u: 'https://grea.komica1.org/dream/', s: 'down' },
    { c: '連線二板', l: '流言終結', u: 'https://eclair.nagatoyuki.org/myth/', s: 'ok' },
    { c: '連線二板', l: '旅遊', u: 'https://travel.voidfactory.com/', s: 'ok' },
    { c: '連線二板', l: '耳機', u: 'https://tomo.komica1.org/77/index.htm', s: 'down' },
    { c: '連線二板', l: '服飾', u: 'https://2cat.org/~pixmicat/', s: 'ok', f: 'https://2cat.org/dressing/' },
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
    { c: '遊戲', l: '女性向遊戲', u: 'https://2cat.org/~boylove/', s: 'ok', f: 'https://2cat.org/boylove/' },
    { c: '遊戲', l: '網頁遊戲', u: 'https://2cat.org/~webgame/', s: 'ok', f: 'https://2cat.org/webgame2/' },
    { c: '遊戲', l: '獨立遊戲', u: 'https://komica.dbfoxtw.me/indiegame/', s: 'ok' },
    { c: '遊戲', l: '手機遊戲', u: 'https://2cat.org/~handheld/', s: 'ok', f: 'https://2cat.org/cellphone/' },
    { c: '遊戲', l: 'VR/體感遊戲', u: 'https://2cat.org/~motion/', s: 'ok', f: 'https://2cat.org/motion/' },
    { c: '遊戲', l: '桌上遊戲', u: 'https://2cat.org/~boardgame/', s: 'ok', f: 'https://2cat.org/boardgame/' },
    { c: '遊戲', l: '麻將', u: 'https://moecorner.com/iboards/Mahjong/', s: 'down' },
    { c: '遊戲', l: '遊戲設計', u: 'https://komica.dbfoxtw.me/gameprogramming/', s: 'ok' },
    { c: '遊戲', l: '網路遊戲', u: 'https://grea.komica1.org/52/index.htm', s: 'down' },
    { c: '遊戲作品', l: 'AGA', u: 'https://selene.zawarudo.org/alicegearaegis/', s: 'ok' },
    { c: '遊戲作品', l: 'Azur Lane', u: 'https://2cat.org/~azurlane/', s: 'ok', f: 'https://2cat.org/azurlane/' },
    { c: '遊戲作品', l: 'DOTA2', u: 'https://dota2.akraft.net/', s: 'ok' },
    { c: '遊戲作品', l: 'FEZ', u: 'https://komica.yucie.net/fez/', s: 'down' },
    { c: '遊戲作品', l: 'GTA', u: 'https://fenrisulfr.org/gta/', s: 'ok' },
    { c: '遊戲作品', l: 'Minecraft', u: 'https://komica.peroneko.org/minecraft/', s: 'down' },
    { c: '遊戲作品', l: 'T7S', u: 'https://www.karlsland.net/t7s/', s: 'ok' },
    { c: '遊戲作品', l: 'WOW', u: 'http://www.wowhk.org/', s: 'down' },
    { c: '遊戲作品', l: '少女前線', u: 'https://selene.zawarudo.org/gf/', s: 'ok' },
    { c: '遊戲作品', l: '碧藍幻想', u: 'https://2cat.org/~granblue/', s: 'ok', f: 'https://2cat.org/granblue/' },
    { c: '遊戲作品', l: '戰車世界', u: 'https://fenrisulfr.org/wot/', s: 'ok' },
    { c: '遊戲作品', l: '戰地風雲', u: 'https://fenrisulfr.org/battlefield/', s: 'ok' },
    { c: '遊戲作品', l: '戰爭雷霆', u: 'https://fenrisulfr.org/war_thunder/', s: 'ok' },
    { c: '遊戲作品', l: '戰機世界', u: 'https://fenrisulfr.org/wowp/', s: 'ok' },
    { c: '遊戲作品', l: '戰艦世界', u: 'https://fenrisulfr.org/wows/', s: 'ok' },
    { c: '遊戲作品', l: '艦隊收藏', u: 'http://acgspace.wsfun.com/kancolle/', s: 'down' },
    { c: '遊戲作品', l: '魔物獵人', u: 'http://strange-komica.com/MonsterHunter/', s: 'ok', f: 'http://strange-komica.com/' },
    { c: '遊戲作品', l: '蔚藍檔案', u: 'https://www.gomiga.org/bluearchive/', s: 'ok' },
    { c: '動漫作品', l: '動物朋友', u: 'https://grea.komica1.org/68/', s: 'down' },
    { c: '動漫作品', l: '東方', u: 'https://2cat.org/~touhou/', s: 'ok' },
    { c: '動漫作品', l: '龍騎士07', u: 'https://2cat.org/~07expansion/', s: 'ok', f: 'https://2cat.org/07expansion/' },
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
    { c: '專題板', l: '御姊', u: 'http://sister.boguspix.com/', s: 'ok', f: 'https://sister.boguspix.com/' },
    { c: '專題板', l: '兄貴', u: 'http://p.komica.acg.club.tw/a/', s: 'ok' },
    { c: '專題板', l: '妹系', u: 'https://komica.yucie.net/imoto/', s: 'down' },
    { c: '專題板', l: '人外', u: 'https://komica.dbfoxtw.me/jingai/', s: 'ok' },
    { c: '專題板', l: '獸', u: 'https://kemono.wtako.net/kemono/', s: 'ok' },
    { c: '專題板', l: '機娘', u: 'http://msgirls.boguspix.com/', s: 'ok', f: 'https://msgirls.boguspix.com/' },
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
    { c: '飲食', l: '咖啡/茶', u: 'https://2cat.org/~coffee/', s: 'ok', f: 'https://2cat.org/coffee/' },
    { c: '飲食', l: '烹飪', u: 'https://2cat.org/~cooking/', s: 'ok', f: 'https://2cat.org/cooking/' },
    { c: '飲食', l: '素食', u: 'https://kagaminerin.org/vegetarian/', s: 'down' },
    { c: '體育運動', l: '體育', u: 'https://grea.komica1.org/49/index.htm', s: 'down' },
    { c: '體育運動', l: '足球', u: 'https://komica.yucie.net/worldcup/', s: 'down' },
    { c: '體育運動', l: '武術', u: 'https://komica.yucie.net/budou/', s: 'down' },
    { c: '動物', l: '動物綜合', u: 'https://2cat.org/~animal/', s: 'ok', f: 'https://2cat.org/animal/' },
    { c: '動物', l: '犬', u: 'https://komica.yucie.net/dog/', s: 'down' },
    { c: '動物', l: '貓', u: 'https://komica.yucie.net/cat/', s: 'down' },
    { c: '動物', l: '鳥', u: 'https://2cat.org/~bird/', s: 'ok', f: 'https://2cat.org/bird/' },
    { c: '動物', l: '水族', u: 'https://komica.yucie.net/grearium/', s: 'down' },
    { c: '動物', l: '認養', u: 'https://komica.yucie.net/adopt/', s: 'down' },
    { c: '桌布壁紙', l: '二次壁', u: 'https://2cat.org/~wallpaper/', s: 'ok', f: 'https://2cat.org/wallpaper/?repair' },
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
    { c: '▶ KOMICA2 (18禁) [鎖定]', l: '動畫裡', u: 'https://cat.2nyan.org/hanime/', s: 'ok', p: 'https://2cat.org/~hanime/' },
    { c: '▶ KOMICA2 (18禁) [鎖定]', l: '成人玩具', u: 'https://cat.2nyan.org/toy/', s: 'ok', p: 'https://2cat.org/~toy/' },
    { c: '▶ KOMICA2 (18禁) [鎖定]', l: '東方裡', u: 'https://2cat.org/touhoux/', s: 'ok' },
    { c: '▶ KOMICA2 (18禁) [鎖定]', l: '偽娘裡', u: 'https://cat.2nyan.org/futa/', s: 'ok', p: 'https://2cat.org/~futa/' },
    { c: '▶ KOMICA2 (18禁) [鎖定]', l: '詢問裡', u: 'https://majeur.zawarudo.org/demande/', s: 'ok' },
    { c: '▶ KOMICA2 (18禁) [鎖定]', l: '知識裡', u: 'https://cat.2nyan.org/know/', s: 'ok', p: 'https://2cat.org/~know/' },
    { c: '▶ KOMICA2 (18禁) [鎖定]', l: '高解析裡', u: 'https://2cat.org/~hisoura/', s: 'ok', f: 'https://2cat.org/hiso/' },
    { c: '▶ KOMICA2 (18禁) [鎖定]', l: 'GIF裡', u: 'https://cat.2nyan.org/gifura/', s: 'ok', p: 'https://2cat.org/~gifura/' },
    { c: '外部連結', l: '0rz.tw', u: 'http://0rz.tw/', s: 'ok' },
    { c: '外部連結', l: 'Google 日本', u: 'https://www.google.co.jp/ja', s: 'ok' },
    { c: '外部連結', l: 'goo 辞書', u: 'https://dictionary.goo.ne.jp/', s: 'down' },
    { c: '外部連結', l: 'Yahoo! 字典', u: 'https://tw.dictionary.yahoo.com/', s: 'ok' },
    { c: '外部連結', l: '英漢字典', u: 'https://cdict.net/', s: 'ok' },
    { c: '外部連結', l: '國語辭典', u: 'http://dict.revised.moe.edu.tw/cbdic/index.html', s: 'ok', f: 'http://dict.revised.moe.edu.tw/index.jsp' },
    { c: '外部連結', l: 'Excite 翻訳', u: 'https://www.excite.co.jp/world/chinese/', s: 'down' },
    { c: '外部連結', l: 'Babel Fish', u: 'https://www.babelfish.com/', s: 'ok' },
    { c: '外部連結', l: '維基百科', u: 'https://zh.wikipedia.org/', s: 'ok', f: 'https://zh.wikipedia.org/wiki/Wikipedia:%E9%A6%96%E9%A1%B5' },
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

  // a board answers to where it links (u), where that lands after a redirect (f) and where the portal still points (p)
  function knownBoard(href, boards) {
    const normalized = normalizeBoardUrl(href);
    return normalized ? boards.find((board) => [board.u, board.f, board.p].some((url) => url && normalizeBoardUrl(url) === normalized)) || null : null;
  }

  function matchBoard(href, boards) {
    const normalized = normalizeBoardUrl(href);
    if (!normalized) return null;
    const exact = knownBoard(normalized, boards);
    if (exact) return exact;
    const url = new URL(normalized);
    if (url.origin !== 'https://gaia.komica1.org' || !url.pathname.startsWith('/00b/')) {
      // elsewhere a board's later pages and threads (1.htm, ?page=2, ?res=N) sit in its directory
      const dir = (value) => {
        const u = new URL(value);
        return `${u.origin}${u.pathname.replace(/[^/]*$/, '')}`;
      };
      const here = dir(normalized);
      return boards.find((board) => [board.u, board.f].some((value) => {
        const n = value && normalizeBoardUrl(value);
        return !!n && new URL(n).pathname.endsWith('/') && dir(n) === here;
      })) || null;
    }
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
    // gaia and classic boards: pixmicat.php?res=N; 2cat's newer boards: the board directory itself, ?res=N
    if (dir(u.pathname) !== dir(b.pathname) || !/\/(pixmicat\.php|index\.php)?$/.test(u.pathname)) return null;
    const res = u.searchParams.get('res') || '';
    if (!/^[1-9]\d{0,11}$/.test(res)) return null;
    const m = /^#[rsq]([1-9]\d{0,11})$/.exec(u.hash);
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
    // gaia and classic: 「有回應 25 篇被省略」; 2cat's newer boards: 「有1541篇回應被省略」
    const match = /有\s*(?:回應\s*)?(\d+)\s*篇(?:回應)?被省略/.exec(String(text));
    return match ? Number(match[1]) : 0;
  }

  function shortTime(nowText, today) {
    // "2026/10/26(一) 13:16:28.456" on gaia, "26/08/23(日)08:04" on the classic boards (two-digit year, no seconds)
    const match = /^(\d{4}|\d{2})\/(\d{1,2})\/(\d{1,2})\([^)]*\)\s*(\d{1,2}):(\d{2})/.exec(String(nowText).trim());
    if (!match) return null;
    const [, yy, month, day, h, minute] = match;
    const year = yy.length === 2 ? `20${yy}` : yy;
    const hour = h.padStart(2, '0');
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
    // "…png-(1879 KB, 1054x1536)" on gaia and classic boards, "JPG - 170 KB - 960x1280" on 2cat's newer ones
    const m = /(?:^|[^\d.])(\d{2,5})\s*[x×]\s*(\d{2,5})(?!\d)/.exec(String(info));
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

  // a script that sends the page on assigns the location; one that only reads it (analytics, share buttons) does not
  function assignsLocation(script) {
    return /\blocation\s*(?:\.\s*href\s*)?=(?!=)|\blocation\s*\.\s*(?:replace|assign)\s*\(/.test(String(script));
  }

  // a post is confirmed only by a post newer than any known when it was sent that holds what was sent:
  // an older post saying 推 too proves nothing, and with nothing to look for (an image alone) nothing can be told
  function confirmPosted(posts, { after, probe }) {
    const squash = (text) => String(text).replace(/\s+/g, '');
    if (!after || !squash(probe)) return false;
    return posts.some((p) => p.no > after && squash(p.text).includes(squash(probe)));
  }

  // <base>/src/<file>: the file store a link points into, or null for a link the board wrote wrong. A post on GIF裡
  // links "gifura/src/…" from /gifura/, which resolves to /gifura/gifura/src/: a path-relative link that leaves the
  // board's own directory is a typo, not a second file store (it took every thumbnail on the board with it)
  function fileBase(href, page) {
    let url;
    try {
      url = new URL(href, page);
    } catch {
      return null;
    }
    const at = url.pathname.lastIndexOf('/src/');
    if (at < 0) return null;
    const base = url.pathname.slice(0, at);
    const dir = new URL(page).pathname.replace(/[^/]*$/, '').replace(/\/$/, '');
    if (!/^(?:[a-z][a-z\d+.-]*:|\/)/i.test(href) && base !== dir) return null;
    return `${url.origin}${base}`;
  }

  // links and images in post text may go to the web and nowhere else; the URL parser decides, as the browser will
  // (it drops tabs and leading control characters that a pattern would miss)
  function webUrl(value, base) {
    try {
      return /^https?:$/.test(new URL(value, base).protocol);
    } catch {
      return false;
    }
  }

  if (typeof window === 'undefined') {
    module.exports = { threadLink, insertQuote, clampWidth, omittedCount, shortTime, stepIndex, normalizeBoardUrl, knownBoard, matchBoard, filterBoards, ageVerdict, mediaKind, fileDims, postOutcome, postedProbe, assignsLocation, confirmPosted, webUrl, fileBase, MIN_W, MAX_W, LIST_MIN };
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
  --kr-id1: #0a6fd6; --kr-id2: #b85c00; --kr-id3: #c4312a;
  --kr-warn-bg: #fff0c7; --kr-warn-text: #6d3700; --kr-voted-up: #c0392b; --kr-voted-down: #2980b9;
}
html.kr[data-kr-dark] {
  --kr-text: #f5f5f7; --kr-text2: #a1a1a6; --kr-text3: #6e6e73;
  --kr-id1: #5aa9ff; --kr-id2: #ffa94d; --kr-id3: #ff7b72; --kr-warn-bg: #4a3613; --kr-warn-text: #ffd98a;
  --kr-voted-up: #ff6b5e; --kr-voted-down: #5dade2;
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
/* 2cat's newer boards keep the threads and the form inside #header: fold only the header's own chrome */
html.kr-md #header > :not(:has(#threads, #postform_main)):not(#threads, #postform_main), html.kr-md #board-post-divider-start, html.kr-md #board-post-divider-end,
html.kr-md #del, html.kr-md #threads .thread > hr { display: none !important; }
html.kr .kr-toolbar { position: sticky; top: 0; z-index: 50; display: flex; align-items: center; gap: 8px; margin: 0 -18px 12px; padding: 10px 18px;
  background: var(--kr-bar); backdrop-filter: blur(22px) saturate(180%); -webkit-backdrop-filter: blur(22px) saturate(180%);
  border-bottom: .5px solid var(--kr-sep); font-family: var(--kr-font); color: var(--kr-text); }
/* this board inside another site's frame (2cat.uk's): the browser keeps the site's cookies from it, so votes do nothing */
html.kr .kr-framed { display: block; margin: 0 0 10px; padding: 6px 12px; border-radius: 999px; background: var(--kr-warn-bg); color: var(--kr-warn-text) !important;
  font: 600 12px var(--kr-font); text-decoration: none; }
/* a page still arriving: the reader's frame (the sidebar, a bar and a spinner) over the site's page half laid out; the
   sidebar's glass shows the cover, not the site's colours under it */
html.kr .kr-boot { position: fixed; z-index: 1000; inset: 0; padding-left: var(--kr-side); box-sizing: border-box; display: flex; flex-direction: column;
  background: var(--kr-list-bg); font-family: var(--kr-font); }
html.kr.kr-booting .kr-side { z-index: 1001; }
html.kr.kr-booting .kr-side-open { z-index: 1002; }
html.kr .kr-boot-bar { display: flex; align-items: center; min-height: 52px; padding: 10px 18px; box-sizing: border-box; background: var(--kr-bar);
  border-bottom: .5px solid var(--kr-sep); color: var(--kr-text); font-size: 17px; font-weight: 600; }
html.kr .kr-boot-spin { margin: auto; width: 28px; height: 28px; box-sizing: border-box; border: 3px solid var(--kr-fill2); border-top-color: var(--kr-accent);
  border-radius: 50%; animation: kr-spin .8s linear infinite; }
@keyframes kr-spin { to { transform: rotate(360deg); } }
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
/* the site's 投票暫停 notice: while it shows, the site has disabled every ▲▼, so it keeps the site's warning colours */
html.kr #gaia-vote-pause-notice { position: fixed !important; left: calc(var(--kr-side) + 18px) !important; right: auto !important; top: auto !important; bottom: 16px !important;
  z-index: 60 !important; width: auto !important; max-width: 300px; margin: 0 !important; padding: 6px 12px !important; border: 0 !important; border-radius: 999px !important;
  background: var(--kr-warn-bg) !important; color: var(--kr-warn-text) !important; font: 600 12px var(--kr-font) !important; box-shadow: var(--kr-shadow) !important; }

/* master rows */
html.kr-md #threads .thread { max-width: 980px; margin: 0 auto 8px; padding: 12px 14px; border: 0; border-radius: var(--kr-r); background: var(--kr-card) !important;
  box-shadow: 0 0 0 .5px var(--kr-sep), 0 1px 2px rgba(0, 0, 0, .04); color: var(--kr-text); cursor: pointer;
  content-visibility: auto; contain-intrinsic-size: auto 124px; }
html.kr-md #threads .thread:hover { background: color-mix(in srgb, var(--kr-card) 95%, var(--kr-text)) !important; }
html.kr-md #threads .thread.kr-selected { background: var(--kr-sel) !important; box-shadow: 0 0 0 1.5px var(--kr-accent); }
html.kr-md #threads .post { background: none !important; color: var(--kr-text) !important; border: 0 !important; }
html.kr-md #threads .thread:not(.kr-peek) .post.reply, html.kr-md #threads .warn_txt2 { display: none !important; }
html.kr-md #threads .threadpost .file-text, html.kr-md #threads .threadpost .post-head input[type="checkbox"],
html.kr-md #threads .threadpost .post-head .id, html.kr-md #threads .threadpost .rlink,
html.kr-md #threads .threadpost .backquote,
html.kr-md #threads .threadpost #safari-ad, html.kr-md #threads .threadpost > br, html.kr-md #threads .threadpost .pugid-edit-slot { display: none !important; }
html.kr-md #threads .threadpost .md5-image { float: left; margin: 2px 12px 2px 0; }
html.kr-md #threads .threadpost .file-thumb img { width: 72px !important; height: 72px !important; object-fit: cover; border-radius: 9px; }
html.kr-md #threads .thread { position: relative; }
html.kr-md #threads .threadpost .post-head > :not(.title, .post-action-wrap), html.kr-md #threads .threadpost .post-head .kr-untitled,
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
/* classic boards: the row is drawn by the script, the site's own post markup stays hidden in the list */
html.kr-md #threads .kr-wrapped > :not(.kr-row):not(.kr-meta):not(.kr-when):not(.kr-peek-list) { display: none !important; }
html.kr .kr-peek-list { display: grid; gap: 6px; margin: 8px 0 0 84px; }
html.kr .kr-peek-item { padding: 8px 10px; border-radius: 10px; background: var(--kr-fill); font-size: 13px; }
html.kr .kr-peek-head { margin-bottom: 2px; font-size: 11px; color: var(--kr-text2); }
html.kr .kr-peek-text { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; white-space: pre-line; }
html.kr .kr-row { display: flex; gap: 12px; align-items: flex-start; }
html.kr .kr-row-thumb { flex: none; width: 72px; height: 72px; object-fit: cover; border-radius: 9px; background: var(--kr-fill); }
html.kr .kr-row-text { flex: 1; min-width: 0; margin-right: 56px; }
html.kr .kr-row-title { margin-bottom: 2px; font: 600 15px/1.35 var(--kr-font); color: var(--kr-text); }
html.kr .kr-row-snippet { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; overflow: hidden; white-space: pre-line;
  font-size: 14px; line-height: 1.55; color: var(--kr-text); }
/* the site's ads, as cards of their own marked 廣告 where the site puts them, never floated beside a row: on 綜合 above
   the list, the web or phone banner as the site's own rules pick (so no display here); on 2cat in the list, and on its
   older boards the column beside the list, its units side by side. 綜合's ad server answers "no banner" with its
   counting pixel alone (the beacon_ box): a slot holding nothing else is not shown. AdSense: a card none of whose units
   its script has taken up (blocked, or never handed one) or whose every unit it left "unfilled" folds to nothing,
   still laid out; once taken up, a unit loads only when it comes into view, which a folded one never does, so the card
   shows what the site shows until AdSense answers. "unfill-optimized" is no empty slot: its 深入瞭解 search topics.
   Folded by max-height: AdSense writes height:auto !important into the card's own style */
html.kr-md #board-post-transition { max-width: 980px; margin: 0 auto; }
html.kr-md :is(#board-post-transition .board-post-ad, #contents > #ad, #threads #ad0, #threads a:has(> ins.had2)) { position: relative; box-sizing: border-box;
  width: auto !important; max-width: 980px; margin: 0 auto 8px !important; padding: 24px 14px 12px; border-radius: var(--kr-r); background: var(--kr-card);
  text-align: center; float: none !important; }
html.kr-md #threads a:has(> ins.had2) { display: block; }
html.kr-md #contents > #ad { display: flex; flex-wrap: wrap; justify-content: center; gap: 16px; }
html.kr-md #contents > #ad > br { display: none; }
html.kr-md #contents > #ad > center { position: absolute; top: 5px; right: 14px; font-size: 11px; }
html.kr-md :is(.board-post-ad, #contents > #ad, #threads #ad0, #threads a:has(> ins.had2))::before { content: '廣告'; position: absolute;
  top: 6px; left: 14px; font: 11px var(--kr-font); color: var(--kr-text3); }
html.kr-md #threads ins.had2 { float: none !important; margin: 0 auto; }
html.kr-md :is(#contents > #ad, #threads #ad0, #threads a:has(> ins.had2)):not(:has(ins.adsbygoogle[data-adsbygoogle-status]:not([data-ad-status="unfilled"]))) {
  max-height: 0 !important; min-height: 0 !important; margin: 0 !important; padding: 0 !important; overflow: hidden; }
html.kr-md #board-post-transition .board-post-ad:not(:has(:not(ins, [id^="beacon_"], [id^="beacon_"] *, script, style, noscript, br))),
html.kr-md ins.adsbygoogle[data-ad-status="unfilled"] { display: none !important; }
/* 2cat's newer boards lay the whole page in an absolute #scroller over the window, past the sidebar and the pane; its #navi
   is a second list of this page's threads */
html.kr-md #scroller { position: static !important; width: auto !important; height: auto !important; }
html.kr-md #navi { display: none !important; }
html.kr-md .kr-meta { clear: both; display: flex; align-items: center; gap: 10px; margin-top: 8px; font-size: 12px; color: var(--kr-text2); }
html.kr-md .kr-meta button { border: 0; padding: 0; background: none; color: var(--kr-accent); font: inherit; cursor: pointer; }
/* the site's 類別 on a row: its links as chips under the text; 「類別:」 and the commas are typography, sized away */
html.kr-md #threads .threadpost .category { float: none !important; display: flex; flex-wrap: wrap; align-items: center; gap: 4px; margin: 6px 56px 0 0; font-size: 0; }
html.kr-md #threads .threadpost .category a, html.kr .kr-tag { display: inline-block; padding: 2px 8px; border-radius: 999px; background: var(--kr-fill); color: var(--kr-text2) !important;
  font: 11px/1.5 var(--kr-font); text-decoration: none; }
html.kr-md #threads .threadpost .category a:hover, html.kr .kr-tag:hover { background: var(--kr-fill2); color: var(--kr-text) !important; }
html.kr-md #threads .threadpost .category a:is(.tagproposal-open, [target="_blank"]), html.kr .kr-tag-propose { background: none; padding: 2px 4px; color: var(--kr-text3) !important;
  font: 11px var(--kr-font); text-decoration: none; }
html.kr .kr-tags { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; margin-top: 8px; }
/* the site's ▲▼ on a row: out of the clamped text, on the row's meta line (the site's own buttons and handler) */
html.kr-md #threads .threadpost .quote .postvote-slot { position: absolute; right: 44px; bottom: 10px; margin: 0; }
/* the site's ▾ (檢舉、隱藏、加入圖書館／映畫館…) at the row's corner and in each post's head: the site's own button and menu */
html.kr-md #threads .threadpost .post-head > .post-action-wrap { position: absolute; right: 12px; bottom: 9px; margin: 0; }
html.kr .post-menu-toggle { width: 26px; height: 22px; padding: 0; border: 0 !important; border-radius: 999px; background: var(--kr-fill) !important; color: var(--kr-text2) !important;
  font: 14px/22px var(--kr-font); text-align: center; cursor: pointer; }
html.kr .post-menu-toggle:hover, html.kr .post-menu-toggle[aria-expanded="true"] { background: var(--kr-fill2) !important; color: var(--kr-text) !important; }
/* the site-shaped context a pane ▾ is wrapped in (siteContext): no box of its own, its data never shown */
html.kr .kr-site-ctx, html.kr .kr-site-ctx > .post { display: contents !important; }
html.kr .kr-site-ctx [hidden] { display: none !important; }
html.kr .postvote-panel { gap: 2px; padding: 1px 4px; border: 0; border-radius: 999px; background: var(--kr-fill); color: var(--kr-text2); font: 12px/1 var(--kr-font); }
html.kr .postvote-up-wrap { border-right-color: var(--kr-sep); }
html.kr .postvote-btn { color: inherit; }
/* the site marks your own vote red or blue; the rule above would grey it out */
html.kr .postvote-btn.has-voted-up { color: var(--kr-voted-up); }
html.kr .postvote-btn.has-voted-down { color: var(--kr-voted-down); }
html.kr .postvote-btn:disabled { opacity: .35; cursor: not-allowed; }
/* the site's ▲▼ to the page's top and bottom (not votes): round grey buttons */
html.kr .kr-site-scroll { opacity: 1 !important; }
html.kr .kr-site-scroll table { border-spacing: 0; }
html.kr .kr-site-scroll td { height: 6px; padding: 0; font-size: 0; line-height: 0; }
html.kr .kr-site-scroll a { display: block; width: 34px; height: 34px; border-radius: 999px; background: var(--kr-glass); backdrop-filter: blur(20px);
  box-shadow: var(--kr-shadow); color: var(--kr-text2) !important; font: 13px/34px var(--kr-font); text-align: center; text-decoration: none; }
/* the site's pager and footer under the list: the same links and text, set as pills and a quiet line; the [ ] around
   the pager's links are typography, sized away rather than removed */
html.kr-md #page_switch { max-width: 980px; margin: 16px auto; font-size: 13px; color: var(--kr-text2); }
html.kr-md #page_switch table { margin: 0 auto; border: 0 !important; }
html.kr-md #page_switch td { padding: 0 2px; font-size: 0; white-space: normal !important; }
/* a cell that is only words (第一頁, 最後一頁) keeps them */
html.kr-md #page_switch td:not(:has(a, b, form)) { font: 13px var(--kr-font); color: var(--kr-text3); }
html.kr-md #page_switch :is(a, b, input[type="submit"]) { display: inline-block; min-width: 30px; box-sizing: border-box; margin: 2px; padding: 5px 10px;
  border: 0; border-radius: 999px; background: var(--kr-fill); color: var(--kr-text) !important; font: 500 13px/1.2 var(--kr-font); text-align: center; text-decoration: none; cursor: pointer; }
html.kr-md #page_switch :is(a, input[type="submit"]):hover { background: var(--kr-fill2); }
html.kr-md #page_switch b { background: var(--kr-accent); color: #fff !important; }
html.kr-md #footer { max-width: 980px; margin: 8px auto 0; text-align: center; font: 11px/1.6 var(--kr-font); color: var(--kr-text3) !important; }
html.kr-md #bottomlink { margin-bottom: 10px; font-size: 0; }
html.kr-md #bottomlink a { display: inline-flex; align-items: center; margin: 2px 4px; padding: 5px 14px; border-radius: 999px; background: var(--kr-fill); color: var(--kr-text2) !important;
  font: 12px var(--kr-font); text-decoration: none; }
html.kr-md #bottomlink a:hover { background: var(--kr-fill2); }
html.kr-md #footer :is(small, small a, #web-ad) { font-size: 11px !important; color: var(--kr-text3) !important; }
html.kr-md img[src*="flagcounter"] { margin-top: 8px; border-radius: 6px; opacity: .55; }

/* the site's own form, floating; never moved, never display:none (Turnstile lives in it) */
html.kr .kr-composer { position: fixed; z-index: 9001; right: 16px; bottom: 16px; width: min(480px, calc(100vw - 32px)); max-height: calc(100vh - 32px);
  overflow: auto; box-sizing: border-box; margin: 0; background: var(--kr-glass) !important; color: var(--kr-text) !important; font-family: var(--kr-font);
  backdrop-filter: blur(30px) saturate(180%); -webkit-backdrop-filter: blur(30px) saturate(180%);
  border: .5px solid var(--kr-sep); border-radius: 16px; box-shadow: var(--kr-shadow); }
html.kr .kr-composer #postform { padding: 0 12px 12px; background: none !important; }
html.kr .kr-composer[data-kr-state="collapsed"] #postform { position: absolute; left: 0; width: 440px; max-height: 0; padding: 0; overflow: hidden; }
/* the site's own lines in the form stay, small: 回應模式 with the view count, its notices (folded behind one line), and
   its 發文說明與注意事項, a <details> of its own */
html.kr .kr-composer .bar_reply { margin: 0 4px 4px; padding: 0; border: 0 !important; background: none !important; color: var(--kr-text3) !important; font: 11px var(--kr-font); text-align: left; }
html.kr .kr-composer #postinfo { margin: 6px 4px 0; font: 12px/1.5 var(--kr-font); color: var(--kr-text2); }
html.kr .kr-composer:not(.kr-notices-open) #postinfo .post-notices { display: none; }
html.kr .kr-composer #postinfo .post-notices { margin: 4px 0 6px; padding-left: 18px; }
html.kr .kr-composer #postinfo a { color: var(--kr-accent) !important; }
html.kr .kr-composer #postinfo .post-instructions > summary { cursor: pointer; }
html.kr .kr-composer #postinfo .post-instructions-hint { margin-left: 6px; color: var(--kr-text3); }
html.kr .kr-composer .kr-notices-toggle { display: block; padding: 2px 0; border: 0; background: none; color: var(--kr-text2); font: inherit; cursor: pointer; }
html.kr .kr-composer .kr-notices-toggle::after { content: ' ▸'; }
html.kr .kr-composer.kr-notices-open .kr-notices-toggle::after { content: ' ▾'; }
html.kr .kr-composer #postform_tbl { width: 100%; margin: 0 !important; border-collapse: separate; border-spacing: 0 4px; }
html.kr .kr-composer #postform_tbl td { padding: 0 4px; border: 0 !important; background: none !important; color: var(--kr-text2) !important; font-size: 12px; vertical-align: middle; }
html.kr .kr-composer #postform_tbl td.Form_bg { width: 4.5em; white-space: nowrap; }
html.kr .kr-composer #postform_tbl td.Form_bg b { font-weight: 500; }
html.kr .kr-composer input[type="text"], html.kr .kr-composer input[type="password"], html.kr .kr-composer select, html.kr .kr-composer textarea { box-sizing: border-box; padding: 6px 9px; border: .5px solid var(--kr-sep);
  border-radius: 8px; background: var(--kr-bg) !important; color: var(--kr-text) !important; font: 14px var(--kr-font); }
html.kr .kr-composer #fcom { width: 100% !important; height: 8.5em !important; resize: vertical; line-height: 1.5; }
/* fields the site sizes by character count (size="28") would push a phone-wide form past its edge */
html.kr .kr-composer #fname, html.kr .kr-composer #fsub, html.kr .kr-composer input[name="category"], html.kr .kr-composer #femail[type="text"],
html.kr .kr-composer input[type="password"] { width: 72%; }
html.kr .kr-composer select { max-width: 48%; padding: 4px 6px; }
/* 2cat draws its 送出 as a 70px-tall disc */
html.kr .kr-composer input[type="submit"] { height: 28px !important; width: auto !important; min-width: 0 !important; padding: 0 16px !important; border: 0; border-radius: 999px;
  background: var(--kr-accent) !important; color: #fff !important; font: 600 13px var(--kr-font) !important; cursor: pointer; }
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
html.kr-md:not(.kr-pane-open) .kr-composer.kr-reply-pane { right: 16px; bottom: 16px; width: min(480px, calc(100vw - 32px)); }
html.kr-md .kr-composer.kr-reply-pane[data-kr-state="expanded"] { max-height: 70vh; }
html.kr-md .kr-composer.kr-reply-pane[data-kr-state="collapsed"] .kr-composer-toggle { font-weight: 400; color: var(--kr-text2); }
/* the site's own thread page keeps its markup but takes the reader's colors: its beige posts under white dark-mode text were unreadable */
html.kr-thread #threads .threadpost, html.kr-thread #threads .reply { background: var(--kr-card) !important; color: var(--kr-text) !important; border-color: var(--kr-sep) !important; border-radius: var(--kr-r); }
/* 2cat's 推文 under a post come painted beige by the site; in the pane and on its thread page they take the reader's fill */
html.kr .kr-post-text .push_area, html.kr-thread #threads .push_area { margin-top: 8px; padding: 6px 10px; border-radius: 8px;
  background: var(--kr-fill) !important; color: var(--kr-text2) !important; font-size: 13px; }
/* 2cat keeps its form fields in #postform.hide until its own toggle opens them; the floating form shows them itself
   (folded, they sit off screen like everyone else's) */
html.kr .kr-composer #postform.hide { display: block !important; }
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
html.kr .kr-post-id { padding: 0 4px; border: 0; border-radius: 6px; background: none; color: inherit; font: 11px ui-monospace, SFMono-Regular, Menlo, monospace; cursor: pointer; }
html.kr .kr-post-id:hover { background: var(--kr-fill); }
html.kr .kr-post-id[data-level="1"] { color: var(--kr-id1); }
html.kr .kr-post-id[data-level="2"] { color: var(--kr-id2); font-weight: 600; }
html.kr .kr-post-id[data-level="3"] { color: var(--kr-id3); font-weight: 700; }
html.kr .kr-id-n { font-family: var(--kr-font); }
html.kr .kr-post-id[data-level="0"] .kr-id-n { color: var(--kr-text3); }
html.kr .kr-id-menu { padding: 0 5px; border: 0; border-radius: 6px; background: none; color: var(--kr-text3); font: 12px var(--kr-font); cursor: pointer; }
html.kr .kr-id-menu:hover { background: var(--kr-fill); color: var(--kr-text); }
html.kr .kr-pane.kr-id-focusing .kr-post:not(.kr-id-focus) { opacity: .3; }
html.kr .kr-pane.kr-id-focusing .kr-post.kr-id-focus .kr-post-id { background: var(--kr-sel); }
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
html.kr .kr-player-start, html.kr .kr-player { display: block; width: min(560px, 100%); max-height: 70vh; aspect-ratio: 16 / 9; border: 0; border-radius: 10px; }
html.kr .kr-player-start { background: #000 center / contain no-repeat; color: #fff; font-size: 40px; cursor: pointer; text-shadow: 0 2px 12px rgba(0, 0, 0, .8); }
html.kr .kr-player { background: #000; }
html.kr .kr-post-media:has(img[data-page])::after { content: '▶'; position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
  color: #fff; font-size: 32px; text-shadow: 0 2px 12px rgba(0, 0, 0, .8); pointer-events: none; }
html.kr .kr-post-file { margin-top: 4px; font-size: 11px; color: var(--kr-text3); }
html.kr .kr-spoiler img, html.kr .kr-spoiler video { filter: blur(28px) saturate(.6); pointer-events: none; }
html.kr .kr-spoiler-btn { position: absolute; inset: 0; width: 100%; border: 0; border-radius: 10px; background: rgba(0, 0, 0, .25); color: #fff;
  font: 600 13px var(--kr-font); cursor: pointer; }
html.kr .kr-post-media:not(.kr-spoiler) .kr-spoiler-btn { display: none; }
html.kr .kr-backlinks { display: flex; flex-wrap: wrap; gap: 2px 10px; margin-top: 8px; font-size: 12px; color: var(--kr-text2); }
html.kr .kr-backlinks a { color: var(--kr-accent); text-decoration: none; }
/* ▲▼ in the pane carry the site's own classes, so its handler sends the vote; a low-rated post folds as on the site */
html.kr .kr-vote { display: flex; margin-top: 8px; }
html.kr .kr-vote .postvote-btn { padding: 4px 8px; }
html.kr .kr-vote:has(> [hidden]) { display: none; }
html.kr .kr-fold { display: none; margin: 2px 0 6px; font-size: 13px; color: var(--kr-text2); }
html.kr .kr-fold button { margin-left: 6px; padding: 2px 9px; border: 0; border-radius: 999px; background: var(--kr-fill); color: var(--kr-accent); font: inherit; cursor: pointer; }
html.kr .kr-post:is([data-vote="collapsed"], [data-vote="review"]) { padding-left: 10px; box-shadow: inset 3px 0 var(--kr-text3); }
html.kr .kr-post:is([data-vote="collapsed"], [data-vote="review"]) > .kr-fold { display: block; }
html.kr .kr-post[data-vote="collapsed"]:not(.kr-open) > :is(.kr-post-media, .kr-post-text), html.kr .kr-post[data-vote="review"] > :is(.kr-post-media, .kr-post-text),
html.kr .kr-post[data-vote="review"] .kr-fold button { display: none; }
/* replies the reader's own 隱藏設定 on the site hides: NGID, keywords, posts hidden after a ▼ */
html.kr .kr-pane:not(.kr-reveal) .kr-post.kr-hidden { display: none; }
html.kr .kr-post.kr-hidden { opacity: .6; }
html.kr .kr-post.kr-hidden::before { content: '依你的隱藏設定（' attr(data-why) '）'; display: block; margin-bottom: 4px; font-size: 11px; color: var(--kr-text3); }
html.kr .kr-filtered { margin: 8px 0; padding: 8px 12px; border-radius: 10px; background: var(--kr-fill); font-size: 13px; color: var(--kr-text2); }
html.kr .kr-filtered button { margin-left: 6px; border: 0; padding: 0; background: none; color: var(--kr-accent); font: inherit; cursor: pointer; }
html.kr .kr-loading, html.kr .kr-pane-error { padding: 18px 0; font-size: 13px; color: var(--kr-text2); }
html.kr .kr-pane-error { color: #ff453a; }
html.kr .kr-pane-error .kr-btn { margin: 10px 8px 0 0; }
html.kr .kr-more { display: flex; width: 100%; height: auto; margin: 4px 0 14px; padding: 8px 12px; }
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
  html.kr .kr-boot-bar { padding-left: 52px; }
  html.kr.kr-pane-open #gaia-vote-pause-notice { bottom: 76px !important; }
  html.kr.kr-pane-open .kr-site-scroll { top: auto !important; bottom: 76px !important; }
  html.kr-md #threads .thread.kr-peek .post.reply { margin-left: 0; }
}
`;

  const el = (tag, attrs = {}, text) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    if (text !== undefined) n.textContent = text;
    return n;
  };

  // A page framed by another site (2cat.uk frames its boards, and anything opened from them) gets none of the site's
  // own cookies there: its vote identity and its login are blocked as cross-site. A frame cannot read its parent's
  // address; Chrome and Safari list it in ancestorOrigins. Unknown parent (Firefox): treated as not framed, as before.
  // ponytail: the last two labels as the site, right for the hosts this runs on; a public-suffix list if one is
  // ever under a two-label suffix (idv.tw)
  const siteOf = (host) => host.split('.').slice(-2).join('.');
  const topHost = (() => {
    if (window.top === window) return location.hostname;
    try {
      const anc = location.ancestorOrigins;
      return anc?.length ? new URL(anc[anc.length - 1]).hostname : window.top.location.hostname;
    } catch {
      return null;
    }
  })();
  const framedElsewhere = (url = location.href) => window.top !== window && !!topHost && siteOf(new URL(url, location.href).hostname) !== siteOf(topHost);

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
      // kept once the page is a board indeed (the frame puts the sidebar up before it can tell: a challenge or error
      // page at a board's address is not a visit)
      const keep = () => document.getElementById('threads') && store.set('kr.recent', recent);
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', keep, { once: true });
      else keep();
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
      if (!side.isConnected) return;
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
      // a board on another site than the page this one is framed in opens as the page itself, its cookies working
      // the portal's board frame is an old-style <frame>, which can give a board from another address no leave to go
      // fullscreen (its videos' button stays grey): from the portal such a board opens as the page, with its own
      // sidebar; the portal's own pages stay in its frame
      const elsewhere = portal ? new URL(board.u, location.href).hostname !== location.hostname : framedElsewhere(board.u);
      const link = el('a', { href: board.u, target: board.c === '外部連結' ? '_blank' : elsewhere ? '_top' : portal ? 'cont' : '_self' }, board.l);
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
        // a board that moved off the address the portal still has links to where it lives now
        const known = knownBoard(link.href, BOARDS);
        boards.push({ c: category, l: link.textContent.trim(), u: known?.u || link.href, s: known?.s || 'ok' });
      }
    }
    return boards;
  }

  function syncTheme() {
    const select = document.getElementById('theme-selector');
    const link = document.querySelector('link.second-style');
    const siteDark = select ? select.value === 'dark.css' : /dark/i.test(link?.getAttribute('href') || '');
    // no selector yet (the page still arriving) or at all: the site's dark stylesheet is its choice
    const siteChose = select ? select.value !== '' : siteDark;
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
  // sending: what was sent, to where, and the newest post number known then; the verdict reads that, not the form as it is now
  // unsure: the last send that ended in 看不出, whose result page may still turn up late
  // touched: the reader has written in the form on this page (text the browser restores on reload is not a draft)
  const composer = { form: null, resto: null, restoInput: null, mode: 'new', target: null, sending: null, unsure: null, touched: false, category: '' };

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
    // the site's notices stay in the form, folded behind one line until asked for
    const notices = form.querySelector('#postinfo .post-notices');
    if (notices) {
      const more = el('button', { type: 'button', class: 'kr-notices-toggle', 'aria-expanded': 'false' }, `站方公告 · ${notices.querySelectorAll(':scope > li').length} 則`);
      more.addEventListener('click', () => more.setAttribute('aria-expanded', String(form.classList.toggle('kr-notices-open'))));
      notices.before(more);
    }

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
      // formdata fires once the site's own submit checks have let the post through, and also for any script that
      // builds a FormData from the form: a page that never comes back ends in "看不出", not in 送出中 for ever
      form.addEventListener('formdata', () => {
        const known = [...document.querySelectorAll('[data-no]')].map((n) => Number(n.dataset.no)).filter(Number.isFinite);
        const sending = { mode: composer.mode, target: composer.target, text: document.getElementById('fcom')?.value || '', subject: document.getElementById('fsub')?.value || '', after: Math.max(0, ...known) };
        // the newest post when it was sent, not when the page loaded: replies since then are other people's. If ours
        // lands before this answers, it counts as known and the verdict is 看不出 — the safe side
        // without that number nothing can be confirmed (Infinity), rather than falling back to the page's older one
        sending.baseline = sending.mode === 'reply' && sending.target ? loadThread(sending.target, true).then((posts) => Math.max(0, ...posts.map((p) => p.no)), () => Infinity) : Promise.resolve(0);
        composer.sending = sending;
        composer.unsure = null;
        // what was sent is a draft from now on, even text the browser restored
        composer.touched = true;
        setStatus('送出中⋯');
        waitForResult(sending, 60000, '等不到回應頁');
      });
      sink.addEventListener('load', () => onPosted(sink));
      for (const type of ['input', 'change']) form.addEventListener(type, () => (composer.touched = true));
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

  // each send keeps its own timer: a late page for an older send must not cancel the wait of the one in flight
  function waitForResult(sending, ms, message) {
    clearTimeout(sending.timer);
    sending.timer = setTimeout(() => settle(sending, { kind: 'unknown', message }, null), ms);
  }

  function onPosted(sink) {
    // a result page that turns up after the wait gave up is still read
    const sending = composer.sending || composer.unsure;
    if (!sending) return;
    let doc = null;
    try {
      doc = sink.contentDocument;
    } catch {
      doc = null;
    }
    const outcome = postOutcome({
      readable: !!doc?.body,
      threads: !!doc?.getElementById('threads'),
      redirect: !!doc?.querySelector('meta[http-equiv="refresh" i]') || assignsLocation([...(doc?.scripts || [])].map((n) => n.textContent).join('\n')),
      text: doc?.body?.innerText || '',
    });
    // a redirect that never arrives ends the wait too
    if (outcome.kind === 'wait') waitForResult(sending, 15000, '回應頁停在轉址');
    else settle(sending, outcome, doc);
  }

  const within = (promise, ms) => Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error('伺服器太久沒回應')), ms))]);

  // the text is cleared only when the post itself is found: on the page it landed on, or in the refetched thread
  async function settle(sending, outcome, doc) {
    if (sending.done) return;
    clearTimeout(sending.timer);
    if (composer.sending === sending) {
      composer.sending = null;
      // only for the send in hand: a late answer must not drop the token of the next post being written
      resetTurnstile();
    }
    // until there is a verdict, a result page that turns up late is still read
    composer.unsure = sending;
    const unsure = (why) => {
      // a newer post on its way has the status line now; a verdict already reached stands
      if (sending.done || composer.sending) return;
      setStatus(`看不出有沒有送出（${why}）。內容還在框裡，請按 ↻ 或在新分頁確認。`, true);
    };
    const probe = postedProbe(sending.text);
    // an image or quotes alone leave nothing to tell this post from anyone else's
    if (!probe) return unsure(outcome.message || '只有圖或引用，認不出是哪一則');
    const look = { probe, after: Math.max(sending.after, await within(sending.baseline, 10000).catch(() => Infinity)) };
    const textOf = (thread) => readPosts(thread).map((p) => ({ no: p.no, op: p.op, text: p.quote?.textContent || '' }));
    const landed = outcome.kind === 'ok' ? doc.getElementById('threads') : null;
    if (landed && site.kind === 'pixmicat') wrapThreads(landed);
    if (sending.mode === 'reply' && sending.target) {
      const here = landed?.querySelector(`.thread[data-no="${sending.target}"]`);
      if (here && confirmPosted(textOf(here), look)) return posted(sending);
      try {
        const posts = await within(loadThread(sending.target, true), 20000);
        if (confirmPosted(posts.map((p) => ({ no: p.no, text: p.quote?.textContent || '' })), look)) return posted(sending);
        unsure(outcome.message || '串裡找不到這則');
      } catch (err) {
        unsure(err.message);
      }
      return;
    }
    const ops = landed ? [...landed.querySelectorAll('.thread')].flatMap(textOf).filter((p) => p.op) : [];
    if (confirmPosted(ops, look)) posted(sending);
    else unsure(outcome.message || '版面上找不到這串');
  }

  function posted(sending) {
    if (sending.done) return;
    sending.done = true;
    if (composer.unsure === sending) composer.unsure = null;
    const ta = document.getElementById('fcom');
    // only what was sent is cleared: text typed since then stays
    if (ta?.value === sending.text) {
      ta.value = '';
      const subject = document.getElementById('fsub');
      if (subject?.value === sending.subject) subject.value = '';
      const file = document.getElementById('fupfile');
      if (file) file.value = '';
      // a title changed while it was on its way is still a draft
      composer.touched = !!subject?.value.trim();
      collapse();
    }
    if (sending.mode === 'reply') {
      if (state.pane?.res === sending.target) openThread(sending.target, { fresh: true });
      // the emptied form goes back to the open thread, or to 發新串
      if (!hasDraft()) {
        if (state.pane?.res) composerReply(state.pane.res);
        else composerNew();
      }
    } else if (!hasDraft()) {
      location.reload();
    }
    // last, since moving the form clears the status line; a newer post on its way keeps it
    if (!composer.sending) setStatus('已送出');
  }

  // an unsent draft keeps the thread (or the new thread) it was written for, until it is sent, emptied, or
  // pointed elsewhere by hand (回覆, No., ✎ 發新串); opening or closing another thread does not move it
  function hasDraft() {
    return composer.touched && !!(document.getElementById('fcom')?.value.trim() || document.getElementById('fsub')?.value.trim() || document.getElementById('fupfile')?.files?.length);
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
    if (!composer.sending && (composer.mode !== 'reply' || composer.target !== res)) setStatus('');
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
    if (!composer.sending && composer.mode !== 'new') setStatus('');
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

  // ---- the other Pixmicat boards (2cat and the classic hosts): no element per thread; an OP and its replies are
  // siblings up to an <hr>. Wrapping them makes them look like gaia's .thread cards to everything below.
  const UNTITLED = /^(無題|無標題)$/;
  const STAMP = /(\d{2,4}\/\d{1,2}\/\d{1,2}\([^)]*\)\s*\d{1,2}:\d{2}(?::\d{2})?)\s*ID:\s*([A-Za-z0-9./+]+)/;
  const site = { kind: 'gaia', mediaBase: null, resPrefix: null };

  function isPixmicat(root) {
    return !!root.querySelector('#threads > div.threadpost[id^="r"]') && !root.querySelector('#threads .thread[data-no]');
  }

  function wrapThreads(threads) {
    if (!threads) return;
    let card = null;
    for (const node of [...threads.childNodes]) {
      if (node.nodeType === 1 && node.matches('div.threadpost[id^="r"]')) {
        card = threads.ownerDocument.createElement('div');
        card.className = 'thread kr-wrapped';
        card.dataset.no = node.id.slice(1);
        node.before(card);
      }
      if (!card) continue;
      const end = node.nodeType === 1 && node.tagName === 'HR';
      card.append(node);
      if (end) card = null;
    }
    // replies follow the OP on some boards and sit inside it on others
    for (const post of threads.querySelectorAll('.kr-wrapped div.threadpost[id^="r"], .kr-wrapped div.reply[id^="r"]')) {
      post.classList.add('post');
      post.dataset.no = post.id.slice(1);
      // 2cat's newer boards mark the OP .reply as well; here .reply means a reply
      if (post.classList.contains('threadpost')) post.classList.remove('reply');
    }
  }

  // a post's own text, without its body: where the classic boards keep the date, ID and file line
  function headTextOf(post) {
    const shell = post.cloneNode(true);
    for (const n of shell.querySelectorAll('.quote, .post')) n.remove();
    return shell.textContent;
  }

  function stampOf(post) {
    return post.querySelector('.post-head .now')?.textContent || STAMP.exec(headTextOf(post))?.[1] || '';
  }

  // 2cat's newer boards fill image links in with script; the live page shows where they point
  function mediaBase() {
    if (site.mediaBase) return site.mediaBase;
    const dir = location.pathname.replace(/[^/]*$/, '').replace(/\/$/, '');
    // file links only: a link someone wrote in a post's text is not where the board keeps its files
    const bases = [...document.querySelectorAll('#threads a[href*="/src/"]')].filter((a) => !a.closest('.quote')).map((a) => fileBase(a.getAttribute('href'), location.href)).filter(Boolean);
    // the board's own directory on whichever host serves it beats a link into some other board's files
    const base = bases.find((b) => new URL(b).pathname === dir) || bases[0];
    if (base) return (site.mediaBase = base);
    return `https://cat.2nyan.org${dir}`;
  }

  // the board's own reply links say how its thread URLs look: pixmicat.php?res=N, ?res=N, /board/?res=N
  function threadUrl(res) {
    if (!site.resPrefix) {
      const href = [...document.querySelectorAll('#threads a[href*="res="]')].map((a) => a.getAttribute('href')).find((h) => threadLink(h, location.href));
      site.resPrefix = /^(.*?[?&]res=)\d+/.exec(href || '')?.[1] || 'pixmicat.php?res=';
    }
    return `${site.resPrefix}${res}`;
  }

  // the first match that belongs to this post and not to a reply nested in it
  const own = (post, selector) => [...post.querySelectorAll(selector)].find((n) => n.closest('.post') === post) || null;

  function readPixmicatPost(post) {
    const head = headTextOf(post);
    const stamp = STAMP.exec(head);
    const fileA = [...post.querySelectorAll('a[href*="/src/"]')].find((n) => n.closest('.post') === post && !n.closest('.quote')) || null;
    const imglink = own(post, 'a.imglink[title]');
    const img = (fileA || imglink)?.querySelector('img') || own(post, 'img.img');
    let src = fileA?.getAttribute('href') || '';
    // a file link the board wrote wrong is rebuilt from its file name
    if (src && !fileBase(src, location.href)) src = `${mediaBase()}/src/${src.split(/[?#]/)[0].split('/').pop()}`;
    let thumb = img?.getAttribute('data-original') || '';
    if (!src && imglink?.title && /\.\w{3,4}$/.test(imglink.title)) {
      const base = mediaBase();
      src = `${base}/src/${imglink.title}`;
      if (/^\d+$/.test(img?.alt || '')) thumb = `${base}/thumb/${img.alt}s.jpg`;
    }
    // the alt is the file's number (a stray post has "1855 KB" there instead)
    if (!thumb && imglink && /^\d+$/.test(img?.alt || '')) thumb = `${mediaBase()}/thumb/${img.alt}s.jpg`;
    if (!thumb && img && !/\/(trans|white)\.png$/.test(img.getAttribute('src') || '')) thumb = img.getAttribute('src') || '';
    const abs = (u) => (u ? new URL(u, location.href).href : '');
    const info = own(post, '.imglink2')?.textContent.trim() || /[\w.-]+\.(?:jpe?g|png|gif|webp|webm|mp4)-\([^)]*\)/i.exec(head)?.[0] || '';
    return {
      no: Number(post.getAttribute('data-no')),
      op: post.classList.contains('threadpost'),
      title: own(post, '.title')?.textContent.trim() || '',
      name: own(post, '.name')?.textContent.trim() || '',
      time: (stamp && shortTime(stamp[1], new Date())) || '',
      id: stamp?.[2] || '',
      media: src ? { src: abs(src), thumb: abs(thumb), kind: mediaKind(src), dims: fileDims(info), info, spoiler: false } : null,
      quote: own(post, '.quote'),
    };
  }

  // ---- reading a thread out of the site's markup: a board card, or a thread page fetched in the background
  function readPosts(thread) {
    if (thread.classList.contains('kr-wrapped')) return [...thread.querySelectorAll('.post[data-no]')].map(readPixmicatPost);
    return [...thread.querySelectorAll('.post[data-no]')].map((post) => {
      const head = post.querySelector('.post-head');
      const headText = head?.textContent || '';
      const holder = post.querySelector('.md5-image[data-image-original]');
      const fileLink = post.querySelector('.file-text a[href]');
      const src = holder?.getAttribute('data-image-original') || fileLink?.getAttribute('href') || '';
      const info = (post.querySelector('.file-text')?.textContent || '').replace(/^\s*檔名[:：]\s*/, '').trim();
      const propose = post.querySelector('.category a.tagproposal-open')?.getAttribute('href') || '';
      const report = post.querySelector('.post-menu-toggle[data-report-url]')?.getAttribute('data-report-url') || '';
      return {
        no: Number(post.getAttribute('data-no')),
        op: post.classList.contains('threadpost'),
        title: head?.querySelector('.title')?.textContent.trim() || '',
        name: head?.querySelector('.name')?.textContent.trim() || '',
        time: shortTime(head?.querySelector('.now')?.textContent || '', new Date()) || '',
        stamp: head?.querySelector('.now')?.textContent.trim() || '',
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
        vote: readVote(post),
        tags: readTags(post),
        propose: /^pixmicat\.php\?mode=module&load=mod_tagproposal&view=form&no=\d+$/.test(propose) ? propose : null,
        menu: /^pixmicat\.php\?mode=module&load=mod_report&action=report&res=\d+$/.test(report) ? report : null,
      };
    });
  }

  // the site's 類別 on a post: its own links to its category pages, kept as such
  function readTags(post) {
    const tags = [];
    for (const a of post.querySelectorAll('.category a[href]')) {
      let url;
      try {
        url = new URL(a.getAttribute('href'), location.href);
      } catch {
        continue;
      }
      const c = url.searchParams.get('c');
      if (url.origin === location.origin && url.searchParams.get('mode') === 'category' && c) tags.push({ name: c, href: url.href });
    }
    return tags;
  }

  // gaia's ▲▼: the counts and the fold state as the page has them. The pane draws the slot again with the site's own
  // classes and number, and the site's click handler on document sends the vote and rewrites them.
  const VOTE_STATES = new Set(['normal', 'collapsed', 'review']);
  function readVote(post) {
    const slot = post.querySelector('.postvote-slot[data-no]');
    // held for review on the live page, the site has put its notice in place of the text, slot and all
    if (!slot) return post.classList.contains('postvote-review') ? { no: null, state: 'review' } : null;
    if (!/^\d+$/.test(slot.getAttribute('data-no'))) return null;
    const count = (attr, sel) => String(Math.max(0, Number(slot.getAttribute(attr) ?? slot.querySelector(sel)?.textContent) || 0));
    const state = slot.getAttribute('data-state') || (post.classList.contains('postvote-collapsed') ? 'collapsed' : 'normal');
    return {
      no: slot.getAttribute('data-no'),
      up: count('data-up', '.postvote-like-count'),
      down: count('data-down', '.postvote-dislike-count'),
      state: VOTE_STATES.has(state) ? state : 'normal',
      mine: slot.querySelector('.has-voted-up') ? 1 : slot.querySelector('.has-voted-down') ? -1 : 0,
    };
  }

  function voteSlot(v) {
    const slot = el('span', { class: 'postvote-slot', 'data-no': v.no, 'data-state': v.state, 'data-up': v.up, 'data-down': v.down });
    const panel = el('span', { class: 'postvote-panel', 'aria-label': '留言評價' });
    // the site disables the ▲▼ on the page when it finds voting paused, and only those; these come later
    const paused = document.getElementById('gaia-vote-pause-notice')?.style.display === 'block' ? { disabled: '' } : {};
    const side = (dir, label, mark, count, mine) => {
      const wrap = el('span', { class: `postvote-${dir}-wrap` });
      wrap.append(
        el('button', { type: 'button', class: `postvote-btn postvote-${dir}${mine ? ` has-voted-${dir}` : ''}`, title: label, 'aria-label': label, ...paused }, mark),
        el('span', { class: dir === 'up' ? 'postvote-like-count' : 'postvote-dislike-count' }, count),
      );
      return wrap;
    };
    panel.append(side('up', '按讚', '▲', v.up, v.mine === 1), side('down', '倒讚', '▼', v.down, v.mine === -1));
    slot.append(panel, el('span', { class: 'postvote-state' }));
    // the site's 一般設定 can hide the ▲▼ (its filter pass only reaches what is on the page when it runs)
    try {
      if (localStorage.getItem('hidePostVoteState') === 'true') slot.hidden = true;
    } catch {
      /* storage blocked: shown */
    }
    return slot;
  }

  // the fold follows the slot's data-state, which the site's handler rewrites after a vote
  function syncFold(art, state = art.querySelector('.kr-vote .postvote-slot')?.getAttribute('data-state')) {
    art.dataset.vote = state === 'collapsed' || state === 'review' ? state : 'normal';
    const label = art.querySelector(':scope > .kr-fold > span');
    if (label) label.textContent = state === 'review' ? '此留言已因評價異常隱藏，並送交管理員審核。' : '此留言評價較低，已預設折疊。';
  }

  // the reader's own 隱藏設定 on the site (its settings page keeps them in this origin's storage): IDs, keywords, and
  // the 隱藏貼文清單 when its setting is on. The site applies them to its board; the pane applies them here, read as
  // the site reads them (view-settings.js: readIDs, readKeywords, applyFilters).
  const SITE_ID = /^[A-Za-z0-9./]{8}$/;
  function siteFilters() {
    const read = (key) => {
      try {
        return JSON.parse(localStorage.getItem(key) || 'null');
      } catch {
        return null;
      }
    };
    const ids = read('komica_hidden_ids_v1');
    const words = read('komica_keyword_filter');
    const hidden = read('komica_hidden_posts_v1');
    let afterDown = false;
    try {
      afterDown = localStorage.getItem('hideFutureDownvotesState') === 'true';
    } catch {
      afterDown = false;
    }
    const list = (v) => (Array.isArray(v) ? v : []);
    return {
      ids: new Set(ids?.enabled === true ? list(ids.entries).map((e) => e?.id).filter((id) => typeof id === 'string' && SITE_ID.test(id)) : []),
      words: words?.enabled === true
        ? (typeof words.keywords === 'string' ? words.keywords.split(',') : list(words.entries).map((e) => (typeof e?.keyword === 'string' ? e.keyword : '')))
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      posts: afterDown && hidden && typeof hidden === 'object' ? hidden : {},
    };
  }

  function filterPane() {
    const pane = state.pane;
    if (!pane?.res) return;
    const f = siteFilters();
    let n = 0;
    for (const art of pane.body.querySelectorAll(':scope > .kr-post:not(.kr-post-op)')) {
      const why = [];
      if (art.dataset.id && f.ids.has(art.dataset.id)) why.push(`ID：${art.dataset.id}`);
      // the words the site matches: name, time, ID and text (not the reader's own badges in the head)
      const head = ['.kr-post-name', '.kr-post-time'].map((s) => art.querySelector(s)?.textContent || '').join(' ');
      const text = `${head}${art.dataset.id ? ` ID:${art.dataset.id}` : ''}${art.querySelector('.kr-post-text')?.textContent || ''}`;
      for (const w of f.words) if (text.includes(w)) why.push(`關鍵字：${w}`);
      if (f.posts[art.dataset.no]?.hidden === true) why.push('已加入隱藏貼文清單');
      art.classList.toggle('kr-hidden', why.length > 0);
      if (why.length) {
        art.dataset.why = why.join('、');
        n++;
      } else delete art.dataset.why;
    }
    let bar = pane.body.querySelector('.kr-filtered');
    if (!n) {
      bar?.remove();
      pane.el.classList.remove('kr-reveal');
      return;
    }
    if (!bar) {
      bar = el('div', { class: 'kr-filtered' });
      bar.append(el('span'), el('button', { type: 'button', class: 'kr-reveal-btn' }));
      const op = pane.body.querySelector('.kr-post-op');
      if (op) op.after(bar);
      else pane.body.prepend(bar);
    }
    const shown = pane.el.classList.contains('kr-reveal');
    bar.firstChild.textContent = `依你在站上的隱藏設定，${shown ? '這串有' : '藏起了'} ${n} 則回覆`;
    bar.lastChild.textContent = shown ? '恢復隱藏' : '暫時顯示';
  }

  // post text is user content: only the markup a post needs survives the copy. Elements are kept (2cat's 推文 are
  // divs, fonts and tables inside the text); attributes are not, beyond the few listed
  const DROP = 'script, style, iframe, frame, object, embed, applet, form, input, button, select, textarea, base, meta, link, template, noscript, svg, math, audio, video';
  const KEEP_ATTRS = new Set(['href', 'src', 'alt', 'title', 'class', 'color', 'size', 'face']);
  function cleanQuote(quote) {
    const q = quote.cloneNode(true);
    // the ▲▼ and the low-rating fold are drawn by renderPosts from the post's vote, not copied
    for (const n of q.querySelectorAll(`${DROP}, .postvote-slot, .postvote-notice, .backquote, .-expand-line, .text-button, .kr-meta`)) n.remove();
    for (const n of q.querySelectorAll('.hide, .postvote-collapsible-body')) n.replaceWith(...n.childNodes);
    for (const n of q.querySelectorAll('*')) {
      if (n.namespaceURI !== 'http://www.w3.org/1999/xhtml') {
        n.remove();
        continue;
      }
      for (const a of [...n.attributes]) if (!KEEP_ATTRS.has(a.name)) n.removeAttribute(a.name);
      // a post's own classes stay; the reader's are the reader's (a post cannot pose as a post, a fold or a button)
      if (n.hasAttribute('class')) n.setAttribute('class', n.getAttribute('class').split(/\s+/).filter((c) => c && !c.startsWith('kr-')).join(' '));
      for (const name of ['href', 'src']) if (n.hasAttribute(name) && !webUrl(n.getAttribute(name), location.href)) n.removeAttribute(name);
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
      // 2cat's 18禁 boards answer a video link with their own player page, not the file, and a <video> gives up on
      // it as MEDIA_ERR_SRC_NOT_SUPPORTED (4): offer that page instead. A network or decode error is not that.
      node.addEventListener('error', () => node.error?.code === 4 && boardPage(m.src) && node.replaceWith(playerPage(m)), { once: true });
      // until a frame is decoded the box is the poster's, the thumbnail's size: once the file gives its own, take it
      node.addEventListener('loadedmetadata', () => {
        const { videoWidth: w, videoHeight: h } = node;
        if (!w || !h) return;
        node.style.width = `min(${w}px, calc(70vh * ${w / h}))`;
        node.style.aspectRatio = `${w} / ${h}`;
      }, { once: true });
    } else {
      node = el('img', { src: m.src, alt: '', loading: 'lazy', decoding: 'async' });
      node.dataset.full = m.src;
      // the original did not load: show the thumbnail. gaia syncs uploads to its image host in the background, and
      // until then only the thumbnail exists; 2cat's 18禁 boards answer a GIF link with their own viewer page, which
      // a click then opens in a frame instead of the lightbox
      node.addEventListener('error', () => {
        if (m.thumb && node.getAttribute('src') !== m.thumb) node.setAttribute('src', m.thumb);
        if (site.kind === 'pixmicat' && boardPage(m.src)) node.dataset.page = m.src;
      }, { once: true });
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

  // only the board's own file store is framed, never an address a post supplies
  function boardPage(src) {
    const base = fileBase(src, location.href);
    return !!base && webUrl(src, location.href) && new URL(base).origin === new URL(mediaBase()).origin;
  }

  // the board's player page; sandboxed: it runs its own script but cannot take the window anywhere or open forms
  function playerFrame(src, aspect) {
    const frame = el('iframe', { class: 'kr-player', src, title: '影片', allow: 'autoplay; fullscreen', allowfullscreen: '', sandbox: 'allow-scripts allow-same-origin' });
    if (aspect) frame.style.aspectRatio = aspect;
    return frame;
  }

  // loaded on a click so that a thread of videos does not start playing all at once
  function playerPage(m) {
    const start = el('button', { type: 'button', class: 'kr-player-start', title: '用網站自己的播放器開啟' }, '▶');
    if (m.thumb) start.style.backgroundImage = `url(${JSON.stringify(m.thumb)})`;
    if (m.dims) start.style.aspectRatio = `${m.dims.w} / ${m.dims.h}`;
    start.addEventListener('click', () => start.replaceWith(playerFrame(m.src, start.style.aspectRatio)));
    return start;
  }

  function renderPosts(res, posts, note) {
    const pane = state.pane;
    const byNo = new Set(posts.map((p) => p.no));
    pane.posts = new Map(posts.map((p) => [p.no, p]));
    const backs = new Map();
    const articles = posts.map((p) => {
      const art = el('article', { class: `kr-post${p.op ? ' kr-post-op' : ''}`, id: `kr-p${p.no}`, 'data-no': String(p.no) });
      if (p.op && p.title && !UNTITLED.test(p.title)) art.append(el('h2', { class: 'kr-post-title' }, p.title));
      const head = el('header', { class: 'kr-post-head' });
      head.append(el('span', { class: 'kr-post-name' }, p.name || '無名'));
      if (p.time) head.append(el('span', { class: 'kr-post-time' }, p.time));
      if (p.id) {
        head.append(el('button', { type: 'button', class: 'kr-post-id', 'data-id': p.id, title: '標出這個 ID 在這串的每一篇' }, `ID:${p.id}`));
        // the site's ID menu (搜尋此 ID、隱藏此 ID): its own script opens it on any such button
        if (site.kind === 'gaia' && SITE_ID.test(p.id)) {
          head.append(el('button', { type: 'button', class: 'post-id-menu-toggle kr-id-menu', 'data-post-id': p.id, 'aria-haspopup': 'true', 'aria-expanded': 'false', 'aria-label': `ID:${p.id} 的選單`, title: '搜尋此 ID、隱藏此 ID' }, '⋯'));
        }
      }
      head.append(el('button', { type: 'button', class: 'kr-post-no', 'data-no': String(p.no), title: '引用這則並回覆' }, `No.${p.no}`));
      // the site's ▾: its own script picks up any such button and opens its menu on it
      if (p.menu) head.append(el('button', { type: 'button', class: 'post-menu-toggle', 'data-no': String(p.no), 'data-report-url': p.menu, 'aria-label': '貼文操作選單', 'aria-haspopup': 'true', 'aria-expanded': 'false' }, '▾'));
      art.append(head);
      if (p.id) art.dataset.id = p.id;
      if (p.vote) {
        const fold = el('div', { class: 'kr-fold' });
        fold.append(el('span'), el('button', { type: 'button', class: 'kr-fold-toggle' }, '展開'));
        art.append(fold);
      }
      if (p.media) art.append(renderMedia(p.media));
      const text = el('div', { class: 'kr-post-text' });
      if (p.quote) text.append(...cleanQuote(p.quote).childNodes);
      for (const a of text.querySelectorAll('a')) {
        // classic boards write >>No.N as a script link, which cleanQuote has already emptied: keep it as a quote
        const bare = /^>>\s*(?:No\.)?(\d+)$/.exec(a.textContent.trim());
        const href = a.getAttribute('href') || (bare ? `#r${bare[1]}` : '');
        if (!href) continue;
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
        } else if (!href.startsWith('#')) {
          // anything else leaves the board: a new tab, so the list, the thread and a draft stay
          a.target = '_blank';
          a.rel = 'noopener noreferrer nofollow';
        }
      }
      art.append(text);
      if (p.tags?.length) {
        const tags = el('div', { class: 'kr-tags' });
        // a new tab: the open thread and a draft in the form stay where they are
        for (const t of p.tags) tags.append(el('a', { class: 'kr-tag', href: t.href, target: '_blank', rel: 'noopener' }, t.name));
        if (p.propose) tags.append(el('a', { class: 'kr-tag-propose tagproposal-open', 'data-no': String(p.no), href: p.propose, target: '_blank', rel: 'noopener' }, '建議追加／移除標籤'));
        art.append(tags);
      }
      if (p.vote) {
        if (p.vote.no) {
          const bar = el('div', { class: 'kr-vote' });
          bar.append(voteSlot(p.vote));
          art.append(bar);
        }
        syncFold(art, p.vote.no ? undefined : p.vote.state);
      }
      return art;
    });
    for (const art of articles) {
      const from = backs.get(Number(art.dataset.no));
      if (!from) continue;
      const foot = el('footer', { class: 'kr-backlinks' }, '↩ ');
      for (const n of [...from].sort((a, b) => a - b)) foot.append(el('a', { class: 'kr-q', href: `#kr-p${n}`, 'data-no': String(n) }, `>>${n}`));
      art.append(foot);
    }
    // 同串 ID, as the site used to show it: how many posts each ID has here, coloured by that, once the thread is whole
    // (a board card holds only the latest replies, and a paged 2cat thread one page); a count that would change under
    // the reader is not shown
    if (!note && !posts.more) {
      const counts = new Map();
      for (const p of posts) if (p.id) counts.set(p.id, (counts.get(p.id) || 0) + 1);
      for (const b of articles.map((a) => a.querySelector('.kr-post-id')).filter(Boolean)) {
        const n = counts.get(b.dataset.id) || 1;
        b.dataset.level = String(n >= 7 ? 3 : n >= 4 ? 2 : n >= 2 ? 1 : 0);
        b.append(el('span', { class: 'kr-id-n' }, n > 1 ? ` ×${n}` : ' 單發'));
      }
    }
    const focus = pane.el.dataset.focusId;
    if (focus) for (const a of articles) a.classList.toggle('kr-id-focus', a.dataset.id === focus);
    pane.body.replaceChildren(...articles, ...(note ? [el('div', { class: 'kr-loading' }, note)] : []));
    if (posts.more) {
      const more = el('button', { type: 'button', class: 'kr-btn kr-more' }, '這串分頁了，這裡是最後一頁 · 載入全部');
      more.addEventListener('click', () => openThread(res, { all: true }));
      articles[0].after(more);
    }
    filterPane();
  }

  // ---- the detail pane
  const threadCache = new Map();
  const CACHE_MS = 60000;

  async function fetchThread(res, page = null, param = 'page') {
    const url = threadUrl(res);
    const r = await fetch(page === null ? url : `${url}${url.includes('?') ? '&' : '?'}${param}=${page}`, { credentials: 'same-origin', cache: 'no-cache' });
    if (!r.ok) throw new Error(`伺服器回應 HTTP ${r.status}`);
    const doc = new DOMParser().parseFromString(await r.text(), 'text/html');
    if (site.kind === 'pixmicat') wrapThreads(doc.getElementById('threads'));
    const thread = doc.querySelector(`#threads .thread[data-no="${res}"]`);
    if (!thread) throw new Error('這一頁裡沒有這串（可能已被刪除或下沉）');
    const posts = readPosts(thread);
    // 2cat shows a long thread a page at a time and opens on the last one: [0] [1] … [<b>10</b>],
    // as ?res=N&page=P on the newer boards and ?res=N&page_num=P on the classic ones
    const links = [...doc.querySelectorAll('#page_switch a[href*="res="]')].map((a) => /[?&](page(?:_num)?)=(\d+)/.exec(a.getAttribute('href'))).filter(Boolean);
    const nums = links.map((m) => Number(m[2]));
    posts.param = links[0]?.[1] || 'page';
    posts.page = links.length ? Number(doc.querySelector('#page_switch b')?.textContent.trim()) : NaN;
    posts.last = Math.max(0, ...nums, posts.page || 0);
    posts.more = nums.length > 0;
    return posts;
  }

  function cached(key, fresh, load) {
    const hit = threadCache.get(key);
    if (hit && !fresh && Date.now() - hit.at < CACHE_MS) return hit.promise;
    const promise = load();
    threadCache.set(key, { at: Date.now(), promise });
    promise.catch(() => threadCache.delete(key));
    return promise;
  }

  const loadThread = (res, fresh = false) => cached(res, fresh, () => fetchThread(res));

  // every page of a paged thread, merged; the site's own ALL link is only the latest 100 replies
  function loadWholeThread(res, fresh = false) {
    return cached(`${res}:all`, fresh, async () => {
      const base = await loadThread(res, fresh);
      const byNo = new Map(base.map((p) => [p.no, p]));
      const want = [];
      for (let n = 0; n <= base.last; n++) if (n !== base.page) want.push(n);
      // ponytail: four at a time is polite enough for the few-dozen-page threads seen; a progress note if longer ones appear
      let failed = false;
      const worker = async () => {
        try {
          while (want.length && !failed) for (const p of await fetchThread(res, want.shift(), base.param)) if (!byNo.has(p.no)) byNo.set(p.no, p);
        } catch (err) {
          failed = true;
          throw err;
        }
      };
      await Promise.all([worker(), worker(), worker(), worker()]);
      return [...byNo.values()].sort((a, b) => b.op - a.op || a.no - b.no);
    });
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
    const newtab = el('a', { class: 'kr-btn', target: '_blank', rel: 'noopener', title: '在新分頁開啟（檢舉、編輯在那裡）' }, '↗');
    const reload = el('button', { type: 'button', class: 'kr-btn', title: '重新載入這串' }, '↻');
    actions.append(reply, newtab, reload);
    const close = el('button', { type: 'button', class: 'kr-btn kr-pane-close', 'aria-label': '關閉', title: '關閉（Esc）' }, '×');
    head.append(back, titles, actions, close);
    const body = el('div', { class: 'kr-pane-body' });
    const preview = el('div', { class: 'kr-preview', hidden: '' });
    pane.append(resize, head, body);
    document.body.append(pane, preview);
    const p = (state.pane = { el: pane, body, title, sub, newtab, preview, res: null, full: false, seq: 0 });

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

    // the site's handler has rewritten the slot by the time it says so. Cached thread pages still hold the counts from
    // before: dropped, so reopening shows the vote. The filters are read again too (cheap; the site's lists may move with
    // it), and on a change from the settings page in another tab.
    document.addEventListener('postvote:vote', (e) => {
      const no = String(e.detail?.no || '');
      for (const slot of body.querySelectorAll('.kr-vote .postvote-slot')) if (slot.getAttribute('data-no') === no) syncFold(slot.closest('.kr-post'));
      threadCache.clear();
      setTimeout(filterPane);
    });
    window.addEventListener('storage', () => filterPane());
    // capture: on the way down, before the site's own handler on the button reads its surroundings
    body.addEventListener('click', (e) => {
      const btn = e.target.closest?.('.kr-post .post-menu-toggle');
      if (btn) siteContext(btn);
    }, true);
    // the site's own menus hide a post or an ID in this tab (and its toast undoes it): the pane follows at once
    document.addEventListener('click', (e) => e.target.closest?.('.post-action-menu, #post-id-actions, .post-id-toast') && setTimeout(filterPane));

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
      // an ID marks its posts in this thread and dims the rest; again, or another thread, and it lets go
      const idBtn = e.target.closest('.kr-post-id[data-id]');
      if (idBtn) {
        const on = pane.dataset.focusId !== idBtn.dataset.id;
        if (on) pane.dataset.focusId = idBtn.dataset.id;
        else delete pane.dataset.focusId;
        pane.classList.toggle('kr-id-focusing', on);
        for (const a of body.querySelectorAll(':scope > .kr-post')) a.classList.toggle('kr-id-focus', on && a.dataset.id === idBtn.dataset.id);
        return;
      }
      const fold = e.target.closest('.kr-fold-toggle');
      if (fold) {
        const art = fold.closest('.kr-post');
        art.classList.toggle('kr-open');
        fold.textContent = art.classList.contains('kr-open') ? '收起' : '展開';
        return;
      }
      if (e.target.closest('.kr-reveal-btn')) {
        pane.classList.toggle('kr-reveal');
        filterPane();
        return;
      }
      const spoiler = e.target.closest('.kr-spoiler-btn');
      if (spoiler) {
        spoiler.parentElement.classList.remove('kr-spoiler');
        return;
      }
      const img = e.target.closest('.kr-post-media img');
      if (img?.dataset.page) {
        img.replaceWith(playerFrame(img.dataset.page, img.naturalWidth ? `${img.naturalWidth} / ${img.naturalHeight}` : ''));
        return;
      }
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
      // a player open in the post would load and play a second time in the preview
      for (const f of copy.querySelectorAll('iframe')) f.remove();
      // the site's own scripts bind any ▲▼, ▾ or ID-menu button they find, a preview's copy included: it is a look only
      for (const n of copy.querySelectorAll('.kr-vote, .kr-site-ctx, .post-menu-toggle, .post-id-menu-toggle')) n.remove();
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

  // the site's ▾ reads its post from the page around the button: .thread, .post/.reply/.threadpost and their .title,
  // .name, .now, .quote and img (library-ui.js extractPostData, its copy link, 隱藏此討論串 for the first .post). A pane
  // post is the reader's own markup, so before the menu opens there the button is wrapped, once, in that context:
  // hidden, built from the post as the reader read it
  function siteContext(btn) {
    const pane = state.pane;
    const p = pane?.posts?.get(Number(btn.closest('.kr-post')?.dataset.no));
    if (!p || !pane.res || btn.closest('.kr-site-ctx')) return;
    const thread = el('span', { class: 'thread kr-site-ctx', 'data-no': String(pane.res) });
    // to the site a thread's first .post is its OP: a reply's context starts with the OP's number
    if (!p.op) thread.append(el('span', { class: 'post threadpost', 'data-no': String(pane.res), hidden: '' }));
    const post = el('span', { class: `post ${p.op ? 'threadpost' : 'reply'}`, 'data-no': String(p.no) });
    const data = el('span', { hidden: '' });
    if (p.op) data.append(el('span', { class: 'title' }, p.title || ''));
    data.append(el('span', { class: 'name' }, p.name || '無名'), el('span', { class: 'now' }, p.stamp || p.time || ''));
    const quote = el('span', { class: 'quote' });
    if (p.quote) quote.append(...cleanQuote(p.quote).childNodes);
    data.append(quote);
    if (p.media?.thumb && webUrl(p.media.thumb, location.href)) data.append(el('img', { src: p.media.thumb, alt: '' }));
    btn.replaceWith(thread);
    post.append(data, btn);
    thread.append(post);
  }

  // a post's words, line by line, without what the site puts inside its text box (its ▲▼, the fold notice) and
  // without what a 防雷 keeps closed
  function quoteText(quote) {
    if (!quote) return '';
    const q = quote.cloneNode(true);
    for (const n of q.querySelectorAll('.postvote-slot, .postvote-notice, .postvote-state, .text-spoiler-content')) n.remove();
    for (const n of q.querySelectorAll('br, div, p, li')) n.after('\n');
    return q.textContent;
  }

  function setPaneTitle(res, posts) {
    const p = state.pane;
    const card = document.querySelector(`#threads .thread[data-no="${res}"]`);
    const op = posts?.find((x) => x.op);
    const t = (op?.title || card?.querySelector('.threadpost .title')?.textContent || '').trim();
    // an untitled thread is named by its first line, as a mail without subject would be
    const quote = op?.quote || card?.querySelector('.threadpost .quote');
    const first = quoteText(quote).split('\n').map((l) => l.trim()).find((l) => l && !/^>>\d+$/.test(l)) || '';
    p.title.textContent = t && !UNTITLED.test(t) ? t : first.slice(0, 60) || `No.${res}`;
    const count = posts ? `${posts.length - 1} 則回應` : card?.querySelector('.kr-meta-count')?.textContent.replace(/^💬\s*/, '') || '';
    p.sub.textContent = [`No.${res}`, count].filter(Boolean).join(' · ');
    p.newtab.href = threadUrl(res);
  }

  function flashPost(no) {
    const post = state.pane?.body.querySelector(`#kr-p${no}`);
    if (!post) return false;
    // asked for by number: a reply the reader's filters hide is shown, with the others, rather than nothing happening
    if (post.classList.contains('kr-hidden') && !state.pane.el.classList.contains('kr-reveal')) {
      state.pane.el.classList.add('kr-reveal');
      filterPane();
    }
    post.scrollIntoView({ block: 'center' });
    post.classList.remove('kr-flash');
    void post.offsetWidth;
    post.classList.add('kr-flash');
    return true;
  }

  let openTimer = null;

  async function openThread(res, { post = null, quote = null, fresh = false, all = false } = {}) {
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
    if (quote || !hasDraft()) composerReply(res);
    if (quote) quoteIntoComposer(quote);
    if (switching) {
      p.full = false;
      p.all = false;
      p.el.classList.remove('kr-reveal', 'kr-id-focusing');
      delete p.el.dataset.focusId;
      p.body.scrollTop = 0;
      // what the board already shows (the OP and its latest replies) goes up at once; the rest follows the fetch
      const card = document.querySelector(`#threads .thread[data-no="${res}"]`);
      if (card) renderPosts(res, readPosts(card), '正在載入其餘回應⋯');
      else p.body.replaceChildren(el('div', { class: 'kr-loading' }, '載入中⋯'));
    }
    if (all && !p.all) {
      p.all = true;
      p.full = false;
      p.body.querySelector('.kr-more')?.replaceWith(el('div', { class: 'kr-loading' }, '正在載入全部回應⋯'));
    }
    if (p.full && !fresh) {
      if (post) flashPost(post);
      return;
    }
    // only the latest request draws: an older one (say the 載入全部 still loading) answering late must not cover it
    const seq = ++p.seq;
    let posts;
    try {
      posts = await (p.all ? loadWholeThread(res, fresh) : loadThread(res, fresh));
    } catch (err) {
      if (p.res !== res || p.seq !== seq) return;
      const box = el('div', { class: 'kr-pane-error' }, `沒能載入這串：${err.message}`);
      const retry = el('button', { type: 'button', class: 'kr-btn' }, '再試一次');
      retry.addEventListener('click', () => openThread(res, { fresh: true }));
      const tab = el('a', { class: 'kr-btn', href: threadUrl(res), target: '_blank', rel: 'noopener' }, '在新分頁開啟');
      box.append(el('br'), retry, tab);
      p.body.querySelector('.kr-loading')?.remove();
      p.body.append(box);
      return;
    }
    if (p.res !== res || p.seq !== seq) return;
    // the post being read stays where it is on screen: the whole thread adds posts above it
    const view = p.body.getBoundingClientRect().top;
    const anchor = p.body.scrollTop > 0 ? [...p.body.querySelectorAll('.kr-post')].find((n) => n.getBoundingClientRect().bottom > view) : null;
    const offset = anchor ? anchor.getBoundingClientRect().top - view : 0;
    renderPosts(res, posts);
    const again = anchor && p.body.querySelector(`#kr-p${anchor.dataset.no}`);
    p.body.scrollTop = again ? p.body.scrollTop + again.getBoundingClientRect().top - view - offset : 0;
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
    p.all = false;
    p.seq++;
    p.body.replaceChildren();
    p.preview.hidden = true;
    if (!hasDraft()) composerNew();
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
      const time = replies.length ? shortTime(stampOf(replies[replies.length - 1]), new Date()) : null;
      const label = total ? `💬 ${total} 則回應${time ? ` · 最後 ${time}` : ''}` : '還沒有回應';
      let meta = card.querySelector('.kr-meta');
      if (!meta) {
        meta = el('div', { class: 'kr-meta' });
        meta.append(el('span', { class: 'kr-meta-count' }));
        card.append(meta);
        // the row keeps only its title and text; when it was posted goes to the corner, as in a mail list
        // classic boards have no markup to restyle into a row: draw one from the OP
        if (card.classList.contains('kr-wrapped')) {
          const op = readPixmicatPost(card.querySelector('.threadpost'));
          const row = el('div', { class: 'kr-row' });
          const thumb = op.media && (op.media.thumb || (op.media.kind === 'image' ? op.media.src : ''));
          if (thumb) {
            // a board's own placeholder can be missing too (nosample.jpg): no picture beats a broken one
            const pic = el('img', { class: 'kr-row-thumb', src: thumb, alt: '', loading: 'lazy', decoding: 'async' });
            pic.addEventListener('error', () => pic.remove(), { once: true });
            row.append(pic);
          }
          const words = el('div', { class: 'kr-row-text' });
          if (op.title && !UNTITLED.test(op.title)) words.append(el('div', { class: 'kr-row-title' }, op.title));
          words.append(el('div', { class: 'kr-row-snippet' }, quoteText(op.quote).trim()));
          row.append(words);
          card.prepend(row);
        }
        const opTitle = card.querySelector('.threadpost .title');
        if (UNTITLED.test(opTitle?.textContent.trim() || '')) opTitle.classList.add('kr-untitled');
        const when = shortTime(stampOf(card.querySelector('.threadpost') || card), new Date());
        if (when) card.append(el('span', { class: 'kr-when' }, when));
      }
      if (meta.firstChild.textContent !== label) meta.firstChild.textContent = label;
      let peek = meta.querySelector('button');
      if (replies.length && !peek) {
        peek = el('button', { type: 'button' });
        peek.addEventListener('click', () => {
          card.classList.toggle('kr-peek');
          if (card.classList.contains('kr-wrapped')) peekList(card);
          peek.textContent = card.classList.contains('kr-peek') ? '收起 ▴' : `展開最新 ${card.querySelectorAll('.post.reply').length} 則 ▾`;
        });
        meta.append(peek);
      }
      if (peek && !replies.length) peek.remove();
      else if (peek && !card.classList.contains('kr-peek') && peek.textContent !== `展開最新 ${replies.length} 則 ▾`) peek.textContent = `展開最新 ${replies.length} 則 ▾`;
    }
  }

  // a drawn row peeks with drawn replies too: the classic markup has nothing to show as is
  function peekList(card) {
    card.querySelector('.kr-peek-list')?.remove();
    if (!card.classList.contains('kr-peek')) return;
    const list = el('div', { class: 'kr-peek-list' });
    for (const reply of card.querySelectorAll('.post.reply')) {
      const p = readPixmicatPost(reply);
      const item = el('div', { class: 'kr-peek-item' });
      item.append(el('div', { class: 'kr-peek-head' }, [p.name, p.time].filter(Boolean).join(' · ')), el('div', { class: 'kr-peek-text' }, quoteText(p.quote).trim()));
      list.append(item);
    }
    card.querySelector('.kr-meta').before(list);
  }

  function initBoard() {
    root.classList.add('kr-md');
    if ((window.name !== 'cont' || window.top === window) && !document.querySelector('.kr-side')) setupSidebar(BOARDS);
    if (isPixmicat(document)) {
      site.kind = 'pixmicat';
      wrapThreads(document.getElementById('threads'));
    }
    setupToolbar();
    setupPane();
    composerNew();
    decorateThreads();
    const threads = document.getElementById('threads');
    // one pass per frame at most, and none for our own footers; new threads on a classic board get wrapped first
    let queued = false;
    if (threads) {
      new MutationObserver((records) => {
        if (queued || records.every((r) => r.target.closest?.('.kr-meta'))) return;
        queued = true;
        requestAnimationFrame(() => {
          queued = false;
          if (site.kind === 'pixmicat') wrapThreads(threads);
          decorateThreads();
        });
      }).observe(threads, { childList: true, subtree: true });
    }

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

  let siteMenuEsc = false;
  function onKey(e) {
    if (e.isComposing || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const { form } = composer;
    if (e.key === 'Escape') {
      if (siteMenuEsc) return;
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

  // the site's ▲▼ scroll buttons (綜合) are a bare fixed div (inside a <center>) at the window's right edge, under an open
  // pane: on a board they get the list's edge. Where the pane covers the list (a phone) they sit over the thread, and move
  // it instead.
  function tagSiteScroll() {
    for (const n of document.querySelectorAll('div[style*="position: fixed"]:not([class])')) {
      if (!/^▲\s*▼$/.test(n.textContent.trim())) continue;
      n.classList.add('kr-site-scroll');
      n.addEventListener('click', (e) => {
        const a = e.target.closest('a');
        const p = state.pane;
        if (!a || !p || !root.classList.contains('kr-pane-open') || a.getBoundingClientRect().left < p.el.getBoundingClientRect().left) return;
        e.preventDefault();
        p.body.scrollTo({ top: a.getAttribute('href') === '#' ? 0 : p.body.scrollHeight });
      });
    }
  }

  // While the page is still arriving, the reader's frame comes first: a board's sidebar, and a bar with the page's name
  // and a spinner over the rest, instead of the site's page half laid out. init takes it away once the reader has the
  // page; one that never finishes arriving shows as it is after a while. The site's own feature pages are left alone.
  let booting = false;
  function boot() {
    if (root.classList.contains('kr-portal') || /[?&]mode=/.test(location.search)) return;
    booting = true;
    root.classList.add('kr-booting');
    const show = () => {
      if (!booting) return;
      syncTheme();
      if (!/[?&]res=/.test(location.search) && (window.name !== 'cont' || window.top === window)) setupSidebar(BOARDS);
      const cover = el('div', { class: 'kr-boot', role: 'status', 'aria-label': '載入中' });
      cover.append(el('div', { class: 'kr-boot-bar' }, document.title.trim()), el('div', { class: 'kr-boot-spin' }));
      document.body.append(cover);
    };
    if (document.body) show();
    else {
      new MutationObserver((_, mo) => {
        if (!document.body) return;
        mo.disconnect();
        show();
      }).observe(root, { childList: true });
    }
    setTimeout(unboot, 10000);
  }
  function unboot() {
    booting = false;
    root.classList.remove('kr-booting');
    document.querySelector('.kr-boot')?.remove();
  }

  function init() {
    try {
      setup();
    } finally {
      unboot();
    }
  }

  function setup() {
    if (root.classList.contains('kr-portal')) {
      root.toggleAttribute('data-kr-dark', window.matchMedia('(prefers-color-scheme: dark)').matches);
      setupSidebar(portalBoards(), true);
      return;
    }
    watchTheme();
    setupComposer();
    // an Esc that shuts one of the site's own menus (▾, ID) is for that menu, not for the thread: noted on the way
    // down, before the site's handler has shut it
    window.addEventListener('keydown', (e) => (siteMenuEsc = e.key === 'Escape' && !!document.querySelector('.post-action-menu:not([hidden]), #post-id-actions:not([hidden])')), true);
    document.addEventListener('keydown', onKey);
    if (composer.resto) {
      root.classList.add('kr-thread');
      window.addEventListener('click', (e) => onHeadNumber(e, (no) => quoteIntoComposer(no)), true);
    } else if (document.getElementById('threads')) {
      initBoard();
    } else {
      // not a board after all: the sidebar the frame put up goes
      document.querySelector('.kr-side')?.remove();
      document.querySelector('.kr-side-open')?.remove();
      root.style.removeProperty('--kr-side');
    }
    // A board or thread in a frame loses what the browser keeps from frames: inside another site's, 綜合's votes (its
    // cookies are withheld); inside one from another address with no leave to (the portal's old-style frame, which
    // cannot give it), videos going fullscreen. Say which, and offer the page itself.
    const framedWhy = location.hostname === 'gaia.komica1.org' && window.name !== 'cont' && framedElsewhere()
      ? `這一版開在 ${topHost} 的框架裡，瀏覽器擋掉站方的 cookie，投票不會生效`
      // (false, not merely absent: an iPhone has no such switch and takes a video fullscreen its own way)
      : window.top !== window && document.fullscreenEnabled === false && (composer.resto || document.getElementById('threads'))
        ? '這一版開在框架裡，影片不能全螢幕'
        : '';
    if (framedWhy) {
      const notice = el('a', { class: 'kr-framed', href: location.href, target: '_top' }, `${framedWhy} · 整頁開啟`);
      const bar = document.querySelector('.kr-toolbar');
      if (bar) bar.after(notice);
      else document.body.prepend(notice);
    }
    window.addEventListener('load', () => {
      tagSiteScroll();
      setTimeout(tagSiteScroll, 1500);
    }, { once: true });
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
    if (document.readyState === 'loading') {
      boot();
      document.addEventListener('DOMContentLoaded', init, { once: true });
    } else init();
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
