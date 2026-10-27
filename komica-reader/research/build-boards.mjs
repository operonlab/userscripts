import { readFileSync, writeFileSync } from 'node:fs';

const survey = JSON.parse(readFileSync(new URL('survey-result.json', import.meta.url), 'utf8'));
const script = new URL('../komica-reader.user.js', import.meta.url);
const source = readFileSync(script, 'utf8');
const statuses = new Map();
for (const board of survey.boards) {
  statuses.set(board.url, board.status);
  for (const view of board.category_views || []) statuses.set(view.url, view.status || board.category_view_sample?.status || board.status);
}

const entries = survey.portal.menu_links
  .filter(({ category, href, in_menu_item }) => in_menu_item && category !== '主題選擇' && href && href !== '#' && !/^javascript:/i.test(href))
  .map(({ category, label, href }) => {
    const status = statuses.get(href);
    return { c: category, l: label, u: href, s: status === 'unreachable' ? 'down' : 'ok' };
  });

const begin = '  // <boards>\n';
const end = '  // </boards>';
const at = source.indexOf(begin);
const after = source.indexOf(end, at + begin.length);
if (at < 0 || after < 0 || source.indexOf(begin, at + 1) >= 0) throw new Error('Expected one boards block');
const quote = (value) => `'${JSON.stringify(value).slice(1, -1).replace(/'/g, "\\'")}'`;
const lines = entries.map((board) => `    { c: ${quote(board.c)}, l: ${quote(board.l)}, u: ${quote(board.u)}, s: ${quote(board.s)} },`).join('\n');
const block = `${begin}  const BOARDS_AT = '${survey.generated_at.slice(0, 10)}';\n  const BOARDS = [\n${lines}\n  ];\n`;
const next = source.slice(0, at) + block + source.slice(after);
if (process.argv.includes('--check')) {
  if (next !== source) {
    console.error('Board data is stale; run node research/build-boards.mjs');
    process.exitCode = 1;
  }
} else if (next !== source) {
  writeFileSync(script, next);
}
