// ==UserScript==
// @name         Komica Reader
// @name:zh-TW   K島閱讀改善
// @namespace    https://github.com/operonlab/userscripts
// @version      0.3.0
// @description  Board navigation on Komica's portal and gaia /00b/, with a master-detail thread view and floating post form.
// @description:zh-TW  K島入口與綜合版側欄導覽、討論串分欄閱讀，以及跟著捲動的發文／回文表單。
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
// ==/UserScript==

(() => {
  'use strict';

  const FRAME_NAME = 'kr-drawer';
  const WIDTH_KEY = 'kr.drawerWidth';
  const MIN_W = 380;
  const MAX_W = 1000;
  // the board list keeps at least this much room beside the drawer
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

  // while the drawer waits for thread `loading`, a `ready` from any other page is the previous one,
  // late; with nothing pending, any page the reader navigated to inside the drawer is accepted
  function readyAccepted(loading, res) {
    return loading === null || res === loading;
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

  // first non-transparent `rgb()/rgba()` among computed backgrounds, so the drawer matches the site theme
  function opaqueColor(colors, fallback) {
    for (const c of colors) {
      const m = /^rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/.exec(String(c).trim());
      if (!m) continue;
      const a = m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
      if (a > 0.5) return `rgb(${m[1]}, ${m[2]}, ${m[3]})`;
    }
    return fallback;
  }

  if (typeof window === 'undefined') {
    module.exports = { threadLink, insertQuote, clampWidth, opaqueColor, readyAccepted, omittedCount, shortTime, stepIndex, normalizeBoardUrl, matchBoard, filterBoards, MIN_W, MAX_W, LIST_MIN };
    return;
  }

  if (location.hostname === 'komica1.org' && !(location.pathname === '/bbsmenu.html' && window.name === 'menu')) return;
  if (window.__krState) return;
  const state = (window.__krState = { drawer: null, sideWidth: 0 });

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

  let embedded = false;
  try {
    embedded = window.name === FRAME_NAME && window.parent !== window && window.parent.location.origin === location.origin;
  } catch {
    embedded = false;
  }

  // set in start(): at document-start the <html> element may not exist yet
  let root = null;

  const CSS = `
html.kr { --kr-bg: #fff; --kr-line: color-mix(in srgb, currentColor 16%, transparent); --kr-drawer-w: 560px; --kr-side: 0px; }
html.kr body { font-family: system-ui, -apple-system, "PingFang TC", "Noto Sans TC", "Microsoft JhengHei", sans-serif; }
html.kr #threads .quote { font-size: 15px; line-height: 1.75; }
html.kr #threads .thread { max-width: 1100px; margin: 0 auto 18px; padding: 12px 16px 14px; border: 1px solid var(--kr-line);
  border-radius: 14px; background: color-mix(in srgb, currentColor 3%, transparent); }
html.kr #threads .thread > hr { display: none; }
html.kr #threads .thread.kr-selected { outline: 2px solid color-mix(in srgb, currentColor 45%, transparent); outline-offset: 2px; }
html.kr #threads .post.reply { border-radius: 10px; padding: 6px 12px; max-width: calc(100% - 24px); box-sizing: border-box; }
html.kr #threads .post-head { line-height: 1.6; }
html.kr-md #threads .thread { cursor: pointer; }
html.kr-md #threads .thread:not(.kr-peek) .post.reply, html.kr-md #threads .warn_txt2 { display: none !important; }
html.kr-md #threads .threadpost .quote { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; overflow: hidden;
  margin: 4px 0 0; font-size: 14px; line-height: 1.6; }
/* a master row: thumbnail, title line, three lines of text, the reply meta; the rest lives in the detail pane */
html.kr-md #threads .thread { margin-bottom: 10px; padding: 10px 14px; }
html.kr-md #threads .threadpost .file-text, html.kr-md #threads .threadpost .post-head input[type="checkbox"],
html.kr-md #threads .threadpost .post-head .id, html.kr-md #threads .threadpost .post-action-wrap, html.kr-md #threads .threadpost .rlink,
html.kr-md #threads .threadpost .postvote-slot, html.kr-md #threads .threadpost .category, html.kr-md #threads .threadpost .backquote,
html.kr-md #threads .threadpost #safari-ad, html.kr-md #threads .threadpost > br { display: none !important; }
html.kr-md #threads .threadpost .file-thumb img { width: 88px !important; height: 88px !important; object-fit: cover; border-radius: 8px; }
html.kr-md #threads .threadpost .md5-image { float: left; margin: 2px 12px 4px 0; }
html.kr-md #threads .threadpost .post-head { font-size: 12px; opacity: .9; }
html.kr-md #threads .threadpost .post-head .title { font-size: 15px; margin-right: 6px; }
html.kr-md #threads .thread .kr-meta { clear: both; margin-top: 6px; }
html.kr-md #board-post-transition, html.kr-md #board-post-divider-start, html.kr-md #board-post-divider-end { display: none !important; }
html.kr-md #toplink { font-size: 12px; }
html.kr-md .kr-meta { display: flex; align-items: center; gap: 10px; margin-top: 10px; font-size: 13px; opacity: .8; }
html.kr-md .kr-meta button { border: 0; padding: 2px 4px; background: none; color: inherit; font: inherit; cursor: pointer; }

/* the site's form, floating; collapsed it is a pill (board) or a bar (thread) */
html.kr .kr-composer { position: fixed; z-index: 9001; right: 16px; bottom: 16px; width: min(480px, calc(100vw - 32px));
  max-height: calc(100vh - 32px); overflow: auto; box-sizing: border-box; margin: 0; background: var(--kr-bg); color: inherit;
  border: 1px solid var(--kr-line); border-radius: 16px; box-shadow: 0 10px 32px rgba(0, 0, 0, .2); }
html.kr .kr-composer #postform { padding: 4px 12px 12px; }
/* folded: clipped, not display:none, so the Turnstile frame keeps running; absolute so the hidden
   table does not widen the pill */
html.kr .kr-composer[data-kr-state="collapsed"] #postform { position: absolute; left: 0; width: 440px; max-height: 0; padding: 0; overflow: hidden; }
html.kr .kr-composer #postinfo .post-notices, html.kr .kr-composer #postinfo .post-instructions,
html.kr .kr-composer .bar_reply, html.kr-embed .kr-composer .kr-backlink { display: none; }
html.kr .kr-composer #postform_tbl { width: 100%; margin: 0 !important; }
html.kr .kr-composer #postform_tbl td.Form_bg { width: 5em; white-space: nowrap; }
html.kr .kr-composer #fcom { width: 100% !important; height: 9em !important; box-sizing: border-box; resize: vertical; font: inherit; }
html.kr .kr-composer #fname, html.kr .kr-composer #fsub, html.kr .kr-composer input[name="category"] { width: 70%; box-sizing: border-box; }
html.kr .kr-composer-bar { position: sticky; top: 0; z-index: 1; display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: var(--kr-bg); }
html.kr .kr-composer-toggle { flex: 1; min-height: 28px; padding: 0; border: 0; background: none; color: inherit; font: inherit;
  font-size: 15px; font-weight: 600; text-align: left; cursor: pointer; }
html.kr .kr-composer-close { display: none; width: 32px; height: 32px; border: 0; border-radius: 8px; background: none; color: inherit;
  font-size: 20px; line-height: 1; cursor: pointer; }
html.kr .kr-composer[data-kr-state="expanded"] .kr-composer-close { display: block; }
html.kr .kr-composer-close:hover { background: color-mix(in srgb, currentColor 10%, transparent); }
html.kr-top .kr-composer.kr-new[data-kr-state="collapsed"] { width: auto; border-radius: 999px; }
html.kr .kr-composer.kr-reply { left: 12px; right: 12px; bottom: 12px; width: auto; max-width: 820px; margin: 0 auto; }
html.kr .kr-composer.kr-reply[data-kr-state="expanded"] { max-height: 75vh; }
html.kr .kr-composer.kr-reply[data-kr-state="collapsed"] .kr-composer-toggle { font-weight: 400; opacity: .75; }
html.kr body.kr-has-reply { padding-bottom: 88px; }

/* drawer: the thread page in a same-origin frame, beside the board */
html.kr .kr-drawer { position: fixed; z-index: 9000; top: 0; right: 0; bottom: 0; width: var(--kr-drawer-w); display: flex;
  flex-direction: column; box-sizing: border-box; background: var(--kr-bg); color: inherit; border-left: 1px solid var(--kr-line);
  box-shadow: -10px 0 30px rgba(0, 0, 0, .14); transform: translateX(100%); visibility: hidden; transition: transform .18s ease, visibility .18s; }
html.kr.kr-drawer-open .kr-drawer { transform: none; visibility: visible; }
html.kr-docked .kr-drawer { transform: none; visibility: visible; transition: none; }
html.kr-docked body { margin-left: var(--kr-side); margin-right: var(--kr-drawer-w); }
html.kr-docked .kr-composer.kr-new { right: calc(var(--kr-drawer-w) + 16px); }
html.kr .kr-drawer-head { display: flex; align-items: center; gap: 6px; padding: 8px 10px 8px 14px; border-bottom: 1px solid var(--kr-line); font-size: 14px; }
html.kr .kr-drawer-title { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 600; font-size: 15px; }
html.kr .kr-drawer-head a, html.kr .kr-drawer-head button { flex: none; padding: 4px 10px; border: 1px solid var(--kr-line); border-radius: 8px;
  background: none; color: inherit; font: inherit; text-decoration: none; cursor: pointer; }
html.kr .kr-drawer-head .kr-drawer-close { width: 34px; padding: 4px 0; border: 0; font-size: 20px; line-height: 1; }
html.kr .kr-drawer-head a:hover, html.kr .kr-drawer-head button:hover { background: color-mix(in srgb, currentColor 8%, transparent); }
html.kr .kr-drawer-frame { flex: 1; width: 100%; border: 0; background: var(--kr-bg); }
html.kr-md .kr-drawer-frame { display: none; }
html.kr-md.kr-drawer-open .kr-drawer-frame { display: block; }
html.kr .kr-drawer-empty { flex: 1; display: grid; align-content: center; gap: 12px; padding: 24px; text-align: center; }
html.kr .kr-drawer-empty small { opacity: .65; }
html.kr.kr-drawer-open .kr-drawer-empty { display: none; }
html.kr .kr-drawer-back { display: none; }
html.kr-md:not(.kr-drawer-open) .kr-drawer-reload, html.kr-md:not(.kr-drawer-open) .kr-drawer-newtab { display: none; }
html.kr .kr-drawer-resize { position: absolute; top: 0; bottom: 0; left: -5px; width: 10px; cursor: col-resize; }
html.kr.kr-resizing, html.kr.kr-resizing * { cursor: col-resize !important; user-select: none !important; }
html.kr.kr-resizing .kr-drawer-frame { pointer-events: none; }
html.kr .kr-side { position: fixed; z-index: 8999; inset: 0 auto 0 0; width: 248px; box-sizing: border-box; display: flex;
  flex-direction: column; background: var(--kr-bg); color: inherit; border-right: 1px solid var(--kr-line); font: 14px/1.4 system-ui, -apple-system, "PingFang TC", sans-serif; }
html.kr .kr-side-head { position: sticky; top: 0; z-index: 1; padding: 10px; background: var(--kr-bg); border-bottom: 1px solid var(--kr-line); }
html.kr .kr-side-title { display: flex; align-items: center; justify-content: space-between; font-weight: 700; font-size: 17px; }
html.kr .kr-side button { color: inherit; cursor: pointer; font: inherit; }
html.kr .kr-side-close, html.kr .kr-side-open { border: 0; background: transparent; border-radius: 6px; }
html.kr .kr-side-close { width: 30px; height: 30px; font-size: 20px; }
html.kr .kr-side-search { width: 100%; box-sizing: border-box; margin-top: 8px; padding: 7px 9px; background: var(--kr-bg); color: inherit;
  border: 1px solid var(--kr-line); border-radius: 8px; font: inherit; }
html.kr .kr-side-list { flex: 1; min-height: 0; overflow: auto; padding: 8px 6px 16px; }
html.kr .kr-side-group { margin-bottom: 6px; }
html.kr .kr-side-group-toggle { width: 100%; padding: 8px 7px 5px; border: 0; background: none; text-align: left;
  font-size: 12px !important; font-weight: 700 !important; letter-spacing: .06em; opacity: .65; }
html.kr .kr-side-row { display: flex; align-items: center; min-height: 32px; border-radius: 6px; }
html.kr .kr-side-row:hover, html.kr .kr-side-row[aria-current="page"] { background: color-mix(in srgb, currentColor 10%, transparent); }
html.kr .kr-side-row > a { flex: 1; min-width: 0; padding: 5px 6px 5px 10px; overflow: hidden; text-overflow: ellipsis;
  white-space: nowrap; text-decoration: none; color: inherit; }
html.kr .kr-side-star { flex: none; width: 28px; min-height: 28px; border: 0; background: none; }
html.kr .kr-side-down { opacity: .5; }
html.kr .kr-side-tag { flex: none; font-size: 10px; padding-right: 3px; }
html.kr .kr-side-open { display: none; position: fixed; z-index: 9000; top: 5px; left: 5px; width: 30px; height: 30px;
  border: 1px solid var(--kr-line); background: var(--kr-bg); color: inherit; cursor: pointer; }
html.kr.kr-side-hidden .kr-side { display: none; }
html.kr.kr-side-hidden .kr-side-open { display: block; }
html.kr-portal body { margin: 0; }
html.kr-portal body > :not(.kr-side):not(.kr-side-open) { display: none !important; }
html.kr-portal.kr-side-hidden .kr-side-open { display: block; }
@media (max-width: 899px) {
  html.kr-md .kr-side { box-shadow: 8px 0 24px rgba(0, 0, 0, .2); }
  html.kr-md:not(.kr-side-overlay) .kr-side { display: none; }
  html.kr-md:not(.kr-side-overlay) .kr-side-open { display: block; }
  html.kr-md.kr-side-overlay .kr-side { display: flex; }
  html.kr-md.kr-side-overlay .kr-side-open { display: none; }
  html.kr .kr-drawer { width: 100vw; }
  html.kr-md.kr-drawer-open body { overflow: hidden; }
  html.kr-md.kr-drawer-open .kr-composer.kr-new { right: 16px; }
  html.kr-md .kr-drawer-back { display: block; }
  html.kr-md .kr-drawer-close { display: none; }
  html.kr .kr-drawer-resize { display: none; }
}

/* inside the drawer only the thread and the reply form are left */
html.kr-embed #header, html.kr-embed #board-post-divider-start, html.kr-embed #board-post-transition, html.kr-embed #board-post-divider-end,
html.kr-embed #footer, html.kr-embed #page_switch, html.kr-embed #mobile-ad, html.kr-embed #web-ad { display: none !important; }
html.kr-embed body { margin: 0; padding: 12px 12px 96px; }
html.kr-embed #threads .thread { border: 0; padding: 0; background: none; }
html.kr .kr-flash { animation: kr-flash 1.6s ease-out; }
@keyframes kr-flash { from { box-shadow: 0 0 0 3px color-mix(in srgb, currentColor 50%, transparent); } to { box-shadow: 0 0 0 3px transparent; } }
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
        node.append(el('span', { class: 'kr-side-tag', title: link.title }, '連不上'));
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
      node.append(link, star);
      return node;
    };
    const group = (name, items, isCollapsed = false) => {
      if (!items.length) return;
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
        for (const board of filterBoards(boards, query)) list.append(row(board));
        return;
      }
      group('★ 書籤', stars.map(byUrl).filter(Boolean));
      group('最近', recent.map(byUrl).filter(Boolean));
      const categories = [...new Set(boards.map((board) => board.c))];
      for (const category of categories) {
        const items = boards.filter((board) => board.c === category && board.s !== 'down');
        // the site's menu keeps its 18禁 section locked until clicked; here it starts folded
        group(category, items, (collapsed[category] ?? /18禁/.test(category)) && !(currentExpanded && category === current?.c));
      }
      const down = boards.filter((board) => board.s === 'down');
      const downName = `目前連不上（${down.length}）`;
      group(downName, down, collapsed[downName] !== false);
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
    const colors = [document.body, root].filter(Boolean).map((n) => getComputedStyle(n).backgroundColor);
    root.style.setProperty('--kr-bg', opaqueColor(colors, '#fff'));
  }

  function watchTheme() {
    syncTheme();
    window.addEventListener('load', syncTheme, { once: true });
    document.getElementById('theme-selector')?.addEventListener('change', () => setTimeout(syncTheme, 150));
    const link = document.querySelector('link.second-style');
    if (link) {
      new MutationObserver(() => setTimeout(syncTheme, 150)).observe(link, { attributes: true, attributeFilter: ['href'] });
      link.addEventListener('load', syncTheme);
    }
  }

  // ---- composer: the site's own #postform_main, made to float. It is never moved or cloned:
  // moving the node would reload the Turnstile frame and drop its token.
  const composer = { form: null, resto: null };

  function setupComposer() {
    const form = document.getElementById('postform_main');
    if (!form) return;
    const resto = form.querySelector('input[name="resto"]')?.value || null;
    composer.form = form;
    composer.resto = resto;
    form.classList.add('kr-composer', resto ? 'kr-reply' : 'kr-new');
    if (resto) document.body.classList.add('kr-has-reply');

    const bar = el('div', { class: 'kr-composer-bar' });
    const toggle = el('button', { type: 'button', class: 'kr-composer-toggle', 'aria-expanded': 'false' });
    const close = el('button', { type: 'button', class: 'kr-composer-close', 'aria-label': '收起', title: '收起（Esc）' }, '×');
    bar.append(toggle, close);
    form.insertBefore(bar, form.firstChild);

    // "[回到版面]" would turn the drawer into the board; wrap it, brackets included, so CSS can drop it there
    const back = form.querySelector('#postform > a[href^="index.htm"]');
    if (back) {
      const wrap = el('span', { class: 'kr-backlink' });
      const prev = back.previousSibling;
      const next = back.nextSibling;
      back.before(wrap);
      if (prev?.nodeType === 3 && prev.data.endsWith('[')) {
        prev.data = prev.data.slice(0, -1);
        wrap.append('[');
      }
      wrap.append(back);
      if (next?.nodeType === 3 && next.data.startsWith(']')) {
        next.data = next.data.slice(1);
        wrap.append(']');
      }
    }

    toggle.addEventListener('click', () => (form.dataset.krState === 'expanded' && !resto ? collapse() : expand(true)));
    close.addEventListener('click', collapse);
    form.addEventListener('focusin', (e) => {
      if (!bar.contains(e.target)) expand(false);
    });
    collapse();
  }

  function setLabel() {
    const { form, resto } = composer;
    const toggle = form.querySelector('.kr-composer-toggle');
    const open = form.dataset.krState === 'expanded';
    toggle.textContent = resto ? (open ? `回覆 No.${resto}` : `✎ 回覆 No.${resto}⋯（點任一則的 No. 可引用）`) : '✎ 發新串';
    toggle.setAttribute('aria-expanded', String(open));
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

  function flashPost(no) {
    const post = document.getElementById(`r${no}`);
    if (!post) return;
    post.scrollIntoView({ block: 'center' });
    post.classList.remove('kr-flash');
    void post.offsetWidth;
    post.classList.add('kr-flash');
  }

  // No. in a post head: the site opens its own quick-reply box there. Quote into the floating form instead.
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

  // ---- drawer (top-level board page)
  function setupDrawer() {
    const drawer = el('aside', { class: 'kr-drawer', 'aria-label': '討論串' });
    const resize = el('div', { class: 'kr-drawer-resize', title: '拖曳調整寬度' });
    const head = el('header', { class: 'kr-drawer-head' });
    const back = el('button', { type: 'button', class: 'kr-drawer-back' }, '‹ 列表');
    const title = el('span', { class: 'kr-drawer-title' });
    const newtab = el('a', { class: 'kr-drawer-newtab', target: '_blank', rel: 'noopener' }, '新分頁');
    const reload = el('button', { type: 'button', class: 'kr-drawer-reload', title: '重新載入這串' }, '重新整理');
    const close = el('button', { type: 'button', class: 'kr-drawer-close', 'aria-label': '關閉', title: '關閉（Esc）' }, '×');
    const frame = el('iframe', { class: 'kr-drawer-frame', name: FRAME_NAME, title: '討論串內容' });
    const empty = el('div', { class: 'kr-drawer-empty' });
    empty.append(el('span', {}, '← 點左邊任一串，在這裡看全部回應'), el('small', {}, 'j／k 上下切換 · Enter 開啟 · Esc 取消選取'));
    head.append(back, title, newtab, reload, close);
    drawer.append(resize, head, frame, empty);
    document.body.appendChild(drawer);

    const d = (state.drawer = { el: drawer, frame, title, newtab, res: null, loading: null, ready: false, pending: [] });

    let width = null;
    try {
      width = Number(localStorage.getItem(WIDTH_KEY)) || null;
    } catch {
      width = null;
    }
    const applyWidth = () => {
      root.style.setProperty('--kr-drawer-w', `${clampWidth(width, window.innerWidth - state.sideWidth)}px`);
      root.classList.toggle('kr-docked', window.innerWidth >= 900);
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

    close.addEventListener('click', closeDrawer);
    back.addEventListener('click', closeDrawer);
    reload.addEventListener('click', () => {
      d.ready = false;
      try {
        frame.contentWindow.location.reload();
      } catch {
        frame.src = frame.src;
      }
    });

    const markReady = () => {
      d.loading = null;
      d.ready = true;
      for (const msg of d.pending.splice(0)) frame.contentWindow.postMessage(msg, location.origin);
    };

    window.addEventListener('message', (e) => {
      if (e.origin !== location.origin || e.source !== frame.contentWindow || !e.data || typeof e.data.kr !== 'string') return;
      if (e.data.kr === 'ready') {
        const res = /^\d+$/.test(String(e.data.res || '')) ? Number(e.data.res) : null;
        if (!readyAccepted(d.loading, res)) return;
        if (res) setThread(res, e.data.title);
        else leaveThread(e.data.title, e.data.href);
        markReady();
      } else if (e.data.kr === 'close') {
        closeDrawer();
      }
    });

    // the requested page loaded but never said ready (an error page, say): stop waiting for it
    frame.addEventListener('load', () => {
      if (d.loading === null) return;
      let href = '';
      try {
        href = frame.contentWindow.location.href;
      } catch {
        return;
      }
      if (threadLink(href, location.href)?.res === d.loading) markReady();
    });
  }

  // the drawer moved off a thread (to the board, a module page): forget the thread so opening it reloads
  function leaveThread(titleText, href) {
    const d = state.drawer;
    d.res = null;
    d.title.textContent = String(titleText || '').trim() || '討論串以外的頁面';
    let same = null;
    try {
      same = new URL(String(href || ''), location.href);
    } catch {
      same = null;
    }
    if (same && same.origin === location.origin) d.newtab.href = same.href;
    else d.newtab.removeAttribute('href');
    for (const n of document.querySelectorAll('#threads .thread.kr-selected')) n.classList.remove('kr-selected');
  }

  function setThread(res, titleText) {
    const d = state.drawer;
    d.res = res;
    const listTitle = document.querySelector(`#threads .thread[data-no="${res}"] .threadpost .title`)?.textContent?.trim();
    const t = (titleText || listTitle || '').trim();
    d.title.textContent = t && t !== '無題' ? `${t}　No.${res}` : `No.${res}`;
    d.newtab.href = `pixmicat.php?res=${res}`;
    for (const n of document.querySelectorAll('#threads .thread.kr-selected')) n.classList.remove('kr-selected');
    document.querySelector(`#threads .thread[data-no="${res}"]`)?.classList.add('kr-selected');
  }

  function sendToFrame(msg) {
    const d = state.drawer;
    if (d.ready) d.frame.contentWindow.postMessage(msg, location.origin);
    else d.pending.push(msg);
  }

  function openDrawer(res, { post = null, quote = null } = {}) {
    const d = state.drawer;
    if (!d) return;
    clearTimeout(openTimer);
    if (d.res !== res) {
      d.loading = res;
      d.ready = false;
      d.pending = [];
      d.frame.src = `pixmicat.php?res=${res}`;
    }
    setThread(res);
    root.classList.add('kr-drawer-open');
    if (post && post !== res) sendToFrame({ kr: 'scroll', post });
    if (quote) sendToFrame({ kr: 'quote', no: quote });
  }

  function closeDrawer() {
    const d = state.drawer;
    if (!d) return;
    clearTimeout(openTimer);
    root.classList.remove('kr-drawer-open');
    for (const n of document.querySelectorAll('#threads .thread.kr-selected')) n.classList.remove('kr-selected');
    // blank the frame so a playing video in it stops
    d.frame.src = 'about:blank';
    d.res = null;
    d.loading = null;
    d.ready = false;
    d.pending = [];
  }

  let openTimer = null;

  function decorateThreads(scope) {
    for (const card of scope.querySelectorAll('#threads .thread')) {
      const replies = card.querySelectorAll('.post.reply');
      const total = replies.length + omittedCount(card.querySelector('.warn_txt2')?.textContent || '');
      const time = replies.length ? shortTime(replies[replies.length - 1].querySelector('.now')?.textContent || '', new Date()) : null;
      const label = total ? `💬 ${total} 則回應${time ? ` · 最後 ${time}` : ''}` : '還沒有回應';
      let meta = card.querySelector('.kr-meta');
      if (!meta) {
        meta = el('div', { class: 'kr-meta' });
        meta.append(el('span'));
        card.append(meta);
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

  function initTop() {
    root.classList.add('kr-md');
    if (window.name !== 'cont' || window.top === window) setupSidebar(BOARDS);
    setupDrawer();
    decorateThreads(document);
    const threads = document.getElementById('threads');
    if (threads) new MutationObserver(() => decorateThreads(document)).observe(threads, { childList: true, subtree: true });

    window.addEventListener(
      'click',
      (e) => {
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        if (!e.target.closest?.('#threads')) return;
        // on a thread page the No. quotes into this page's own form (see init)
        if (!composer.resto) onHeadNumber(e, (no, op) => openDrawer(op, { quote: no }));
        if (e.defaultPrevented) return;
        // an OP thumbnail in the list opens the thread (the pane shows the full image); the site would expand it in the row
        const thumb = e.target.closest('.threadpost .file-thumb');
        const thumbRes = Number(thumb?.closest('.thread[data-no]')?.dataset.no);
        if (thumbRes) {
          e.preventDefault();
          e.stopPropagation();
          openDrawer(thumbRes);
          return;
        }
        const a = e.target.closest('a[href]');
        if (a && (!a.target || a.target === '_self')) {
          const link = threadLink(a.getAttribute('href'), location.href);
          if (link) {
            e.preventDefault();
            e.stopPropagation();
            openDrawer(link.res, { post: link.post });
            return;
          }
        }
        if (e.target.closest('a, button, input, label, textarea, select, summary, video, .file-thumb, .postvote-slot, .post-menu-toggle, .qlink')) return;
        const card = e.target.closest('#threads .thread[data-no]');
        if (card) openDrawer(Number(card.dataset.no));
      },
      true,
    );
  }

  function initEmbed() {
    // a board or module page opened inside the drawer has no resto
    const res = composer.resto;
    const title = res ? document.querySelector('#threads .threadpost .title')?.textContent || '' : document.title;
    window.addEventListener('message', (e) => {
      if (e.origin !== location.origin || e.source !== window.parent || !e.data) return;
      if (e.data.kr === 'quote' && /^\d+$/.test(String(e.data.no))) {
        flashPost(Number(e.data.no));
        quoteIntoComposer(Number(e.data.no));
      } else if (e.data.kr === 'scroll' && /^\d+$/.test(String(e.data.post))) {
        flashPost(Number(e.data.post));
      }
    });
    window.parent.postMessage({ kr: 'ready', res, title, href: location.href }, location.origin);
  }

  function onKey(e) {
    if (e.isComposing || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const { form } = composer;
    if (e.key === 'Escape' && form && form.dataset.krState === 'expanded') {
      collapse();
      return;
    }
    if (e.key === 'Escape') {
      if (embedded) window.parent.postMessage({ kr: 'close' }, location.origin);
      else closeDrawer();
      return;
    }
    if (!root.classList.contains('kr-md') || e.target.closest?.('input, textarea, select, [contenteditable]') || e.target.isContentEditable) return;
    const cards = [...document.querySelectorAll('#threads .thread[data-no]')];
    if (e.key === 'j' || e.key === 'k') {
      const current = cards.findIndex((card) => card.classList.contains('kr-selected'));
      const next = stepIndex(current, e.key === 'j' ? 1 : -1, cards.length);
      if (next < 0) return;
      e.preventDefault();
      for (const card of cards) card.classList.remove('kr-selected');
      cards[next].classList.add('kr-selected');
      cards[next].scrollIntoView({ block: 'nearest' });
      clearTimeout(openTimer);
      openTimer = setTimeout(() => openDrawer(Number(cards[next].dataset.no)), 250);
    } else if (e.key === 'Enter' || e.key === 'o') {
      const card = document.querySelector('#threads .thread.kr-selected');
      if (card) {
        e.preventDefault();
        openDrawer(Number(card.dataset.no));
      }
    }
  }

  function init() {
    if (root.classList.contains('kr-portal')) {
      setupSidebar(portalBoards(), true);
      return;
    }
    watchTheme();
    setupComposer();
    if (composer.resto) window.addEventListener('click', (e) => onHeadNumber(e, (no) => quoteIntoComposer(no)), true);
    document.addEventListener('keydown', onKey);
    if (embedded) initEmbed();
    else if (document.getElementById('threads') && !document.querySelector('#postform_main input[name="resto"]')) initTop();
  }

  function start() {
    root = document.documentElement;
    root.classList.add('kr', location.hostname === 'komica1.org' ? 'kr-portal' : embedded ? 'kr-embed' : 'kr-top');
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
