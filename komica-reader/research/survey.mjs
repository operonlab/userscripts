import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('.', import.meta.url);
const sampleDir = new URL('./.samples/', root);
const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
let lastRequest = 0;

async function get(url) {
  const wait = 1000 - (Date.now() - lastRequest);
  if (wait > 0) await pause(wait);
  lastRequest = Date.now();
  try {
    const response = await fetch(url, { headers: { 'User-Agent': ua, Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8' }, redirect: 'follow', signal: AbortSignal.timeout(15000) });
    return { response, html: await response.text() };
  } catch (error) {
    return { error: String(error.cause || error) };
  }
}

function attr(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  return match?.[1] ?? match?.[2] ?? match?.[3] ?? null;
}
function plain(html) {
  return html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/\s+/g, ' ').trim();
}
function tags(html, name) {
  return [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))].map(x => x[0]);
}
function menuLinks(html) {
  const clean = html.replace(/<!--[\s\S]*?-->/g, '');
  let category = null;
  const links = [];
  const categories = [...clean.matchAll(/<li\b[^>]*class\s*=\s*["'][^"']*\bcategory\b[^"']*["'][^>]*>([\s\S]*?)<\/li>/gi)];
  let nextCategory = 0;
  for (const match of clean.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/gi)) {
    while (nextCategory < categories.length && categories[nextCategory].index < match.index) {
      category = plain(categories[nextCategory][1]);
      nextCategory++;
    }
    const token = match[0];
    const href = attr(token.slice(0, token.indexOf('>') + 1), 'href');
    const liOpen = clean.lastIndexOf('<li', match.index);
    const liClose = clean.lastIndexOf('</li', match.index);
    if (href !== null) links.push({ category, label: plain(token), href, target: attr(token, 'target'), in_menu_item: liOpen > liClose });
  }
  return links;
}
function structure(url, html, response) {
  const frames = tags(html, 'frame').map(tag => ({ name: attr(tag, 'name'), src: attr(tag, 'src'), loads: new URL(attr(tag, 'src'), url).href }));
  return { url, final_url: response?.url ?? null, http_status: response?.status ?? null, frameset: tags(html, 'frameset').map(tag => ({ cols: attr(tag, 'cols'), rows: attr(tag, 'rows') })), frames, base_target: attr(tags(html, 'base')[0] || '', 'target'), link_count: tags(html.replace(/<!--[\s\S]*?-->/g, ''), 'a').length };
}
function markers(html) {
  const count = re => (html.match(re) || []).length;
  const forms = [...html.matchAll(/<form\b[^>]*>/gi)].map(x => ({ action: attr(x[0], 'action'), method: attr(x[0], 'method'), id: attr(x[0], 'id') }));
  const scripts = tags(html, 'script').map(x => attr(x, 'src')).filter(Boolean);
  const comments = [...html.matchAll(/<!--[\s\S]*?-->/g)].map(x => x[0]).filter(x => /pixmicat|gazoubbs|futaba|koko|kokonotsuba/i.test(x)).map(x => x.slice(0, 180));
  return {
    thread_data_no: count(/<[^>]*class\s*=\s*["'][^"']*\bthread\b[^"']*["'][^>]*data-no\s*=|<[^>]*data-no\s*=[^>]*class\s*=\s*["'][^"']*\bthread\b/gi),
    post_threadpost: count(/<[^>]*class\s*=\s*["'][^"']*\bpost\s+threadpost\b/gi),
    post_reply: count(/<[^>]*class\s*=\s*["'][^"']*\bpost\s+reply\b/gi),
    post_head: count(/<[^>]*class\s*=\s*["'][^"']*\bpost-head\b/gi),
    qlink: count(/<[^>]*class\s*=\s*["'][^"']*\bqlink\b/gi),
    warn_txt2: count(/\bwarn_txt2\b/gi),
    rlink: count(/<[^>]*class\s*=\s*["'][^"']*\brlink\b/gi),
    postform_main: count(/\bid\s*=\s*["']postform_main["']/gi),
    postform: count(/\bid\s*=\s*["']postform["']/gi),
    resto: count(/\bname\s*=\s*["']resto["']/gi),
    cf_turnstile: count(/\bcf-turnstile\b/gi),
    g_recaptcha: count(/\bg-recaptcha\b/gi),
    forms, frameset: count(/<frameset\b/gi),
    blockquote: count(/<blockquote\b/gi),
    rtd: count(/\bclass\s*=\s*["'][^"']*\brtd\b/gi),
    td_reply: count(/<td\b[^>]*class\s*=\s*["'][^"']*\breply\b/gi),
    email: count(/\bname\s*=\s*["']email["']/gi),
    hidden_inputs: [...html.matchAll(/<input\b[^>]*>/gi)].map(x => x[0]).filter(x => attr(x, 'type')?.toLowerCase() === 'hidden').map(x => ({ name: attr(x, 'name'), id: attr(x, 'id'), value: attr(x, 'value') })).slice(0, 30),
    generator: { meta: tags(html, 'meta').filter(x => /generator/i.test(attr(x, 'name') || '')).map(x => attr(x, 'content')), comments, scripts: scripts.filter(x => /script|pixmicat|koko|futaba/i.test(x)), names: [...new Set((html.match(/Pixmicat!?|GazouBBS|ふたば|kokonotsuba|koko(?:\.php)?|futaba(?:\.php)?|pixmicat(?:2)?\.php/gi) || []))].slice(0, 20) }
  };
}
function family(board) {
  const m = board.markers || {};
  const hint = JSON.stringify(m.generator || {}).toLowerCase();
  if (m.thread_data_no || m.post_threadpost || /\/common\/js\/script\.js/.test(hint)) return 'Pixmicat 2026';
  if (m.post_reply && m.forms?.some(x => /post\.php/.test(x.action || ''))) return 'Tinyboard/vichan';
  if (/kokonotsuba|koko\.php/.test(hint)) return 'kokonotsuba';
  if (/2cat\.org|2cat\.komica1\.org/.test(board.url) && (m.qlink || m.postform_main)) return '2cat Pixmicat';
  if (m.qlink && (m.postform_main || /pixmicat|gazoubbs/.test(hint))) return 'legacy Pixmicat';
  if (m.td_reply || m.rtd || (m.blockquote && /futaba|gazoubbs/.test(hint))) return 'classic futaba table';
  return 'other/unknown';
}
function sampleName(url, suffix = '') {
  const u = new URL(url);
  const slug = `${u.pathname}${u.search}`.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '').slice(0, 110) || 'root';
  return `${u.hostname}_${slug}${suffix}.html`;
}
function firstThread(html, base) {
  const threadStart = html.search(/<[^>]*class\s*=\s*["'][^"']*\bthread\b[^"']*["'][^>]*data-no\s*=/i);
  const candidates = threadStart >= 0 ? [html.slice(threadStart), html] : [html];
  for (const fragment of candidates) for (const x of fragment.matchAll(/<a\b[^>]*href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))[^>]*>/gi)) {
    const rawHref = x[1] ?? x[2] ?? x[3];
    if (!rawHref) continue;
    const href = rawHref.replace(/&amp;/gi, '&');
    if (!/(?:[?&]res=\d+|\/res\/\d+|\/thread\/\d+|\/res\/\d+\.htm)/i.test(href)) continue;
    try {
      const u = new URL(href, base);
      if (!/^https?:$/.test(u.protocol) || u.hostname !== new URL(base).hostname) continue;
      if (u.searchParams.has('mode') || u.searchParams.has('load') || u.searchParams.has('action')) continue;
      return u.href;
    } catch {}
  }
  return null;
}
function statusOf(url, response, html) {
  if (!response) return 'unreachable';
  const final = new URL(response.url);
  const original = new URL(url);
  if (final.hostname !== original.hostname && !final.hostname.endsWith(`.${original.hostname}`)) return 'offsite-redirect';
  if ([403, 429, 503].includes(response.status) && /cloudflare|attention required|checking your browser|challenge-platform|cf-chl/i.test(html)) return 'challenge';
  if (/cf-chl|challenge-platform|just a moment\.\.\./i.test(html)) return 'challenge';
  return response.ok ? 'ok' : 'unreachable';
}
function headerInfo(response) {
  const csp = response?.headers.get('content-security-policy') || '';
  return { x_frame_options: response?.headers.get('x-frame-options') ?? null, frame_ancestors: csp.match(/(?:^|;)\s*frame-ancestors\s+([^;]+)/i)?.[1]?.trim() ?? null };
}

await mkdir(sampleDir, { recursive: true });
const portalUrls = ['https://komica1.org/bbsmenu.html', 'https://komica1.org/', 'https://komica1.org/mainmenu2022.html', 'https://komica1.org/m/'];
const portal = {};
let links = [];
for (const url of portalUrls) {
  const result = await get(url);
  if (!result.response?.ok) throw new Error(`Portal fetch failed: ${url}: ${result.error || result.response?.status}`);
  portal[new URL(url).pathname || '/'] = structure(url, result.html, result.response);
  if (url.endsWith('bbsmenu.html')) links = menuLinks(result.html);
}
portal.menu_links = links;
const boards = [];
const byUrl = new Map();
for (const link of links) {
  if (!link.in_menu_item) continue;
  if (link.category === '主題選擇') continue;
  let url;
  try { url = new URL(link.href, 'https://komica1.org/bbsmenu.html'); } catch { continue; }
  if (!/^https?:$/.test(url.protocol) || link.href === '#') continue;
  const isGaiaView = url.hostname === 'gaia.komica1.org' && url.pathname === '/00b/pixmicat2.php' && url.searchParams.has('c');
  const key = isGaiaView ? 'https://gaia.komica1.org/00b/index.htm' : url.href;
  const existing = byUrl.get(key);
  if (existing) {
    existing.menu_entries.push(link);
    if (isGaiaView) existing.category_views.push({ label: link.label, url: url.href });
    continue;
  }
  const board = { category: link.category, label: link.label, url: key, host: new URL(key).hostname, menu_entries: [link], category_views: isGaiaView ? [{ label: link.label, url: url.href }] : [], portal_section: ['外部連結', '失效連結'].includes(link.category) ? link.category : null };
  byUrl.set(key, board);
  boards.push(board);
}
for (let i = 0; i < boards.length; i++) {
  const board = boards[i];
  // A category view and /00b/index.htm represent one board; request index.htm once.
  const result = await get(board.url);
  const { response, html = '', error } = result;
  board.final_url = response?.url ?? null;
  board.http_status = response?.status ?? null;
  board.status = statusOf(board.url, response, html);
  board.reason = error || (!response?.ok ? `HTTP ${response?.status}` : null);
  board.response_headers = headerInfo(response);
  board.markers = markers(html);
  board.family = board.status === 'ok' ? family(board) : null;
  board.thread_url = board.status === 'ok' ? firstThread(html, response.url) : null;
  board.sample_file = `research/.samples/${sampleName(board.url)}`;
  await writeFile(new URL(sampleName(board.url), sampleDir), html);
  if (board.category_views.length) {
    const view = board.category_views[0];
    const viewResult = await get(view.url);
    const viewHtml = viewResult.html || '';
    board.category_view_sample = {
      label: view.label, url: view.url, final_url: viewResult.response?.url ?? null,
      http_status: viewResult.response?.status ?? null,
      status: statusOf(view.url, viewResult.response, viewHtml),
      reason: viewResult.error || (!viewResult.response?.ok ? `HTTP ${viewResult.response?.status}` : null),
      response_headers: headerInfo(viewResult.response), markers: markers(viewHtml),
      sample_file: `research/.samples/${sampleName(view.url)}`
    };
    await writeFile(new URL(sampleName(view.url), sampleDir), viewHtml);
  }
  process.stderr.write(`[${i + 1}/${boards.length}] ${board.status} ${board.url}\n`);
}
const thread_samples = [];
for (const kind of [...new Set(boards.filter(b => b.status === 'ok').map(b => b.family))]) {
  const board = boards.find(b => b.status === 'ok' && b.family === kind && b.thread_url);
  if (!board) { thread_samples.push({ family: kind, status: 'unreachable', reason: 'No res= or thread link found on board sample' }); continue; }
  const result = await get(board.thread_url);
  const { response, html = '', error } = result;
  const sample_file = `research/.samples/${sampleName(board.thread_url, '_thread')}`;
  await writeFile(new URL(sampleName(board.thread_url, '_thread'), sampleDir), html);
  thread_samples.push({ family: kind, board_url: board.url, url: board.thread_url, final_url: response?.url ?? null, http_status: response?.status ?? null, status: statusOf(board.thread_url, response, html), reason: error || (!response?.ok ? `HTTP ${response?.status}` : null), sample_file, markers: markers(html), response_headers: headerInfo(response) });
}
const counts = { menu_links: links.length, unique_boards: boards.length, ok: 0, challenge: 0, unreachable: 0, offsite_redirect: 0, skipped: links.filter(x => !x.in_menu_item || x.category === '主題選擇' || x.href === '#').length };
for (const board of boards) counts[board.status.replace(/-/g, '_')]++;
const output = { generated_at: new Date().toISOString(), portal, counts, boards, thread_samples };
await writeFile(new URL('survey-result.json', root), JSON.stringify(output, null, 2) + '\n');
console.log(JSON.stringify(counts));
