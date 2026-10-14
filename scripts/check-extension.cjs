// Checks an extension template against its userscript header and writes the version in.
// usage: node check-extension.cjs <userscript> <stage dir>; called by build-extension.sh.
// Prints the version and exits 0, or prints FAIL lines and exits 1 (template problem), or exits 2.
const fs = require('fs');
const path = require('path');
const [src, stage] = process.argv.slice(2);
const problems = [];
try {
  const meta = fs.readFileSync(src, 'utf8').match(/\/\/ ==UserScript==([\s\S]*?)\/\/ ==\/UserScript==/);
  if (!meta) { console.log('FAIL  no userscript header in ' + src); process.exit(1); }
  const values = (key) => [...meta[1].matchAll(new RegExp(`^// @${key}(?:\\s+(.+))?$`, 'gm'))].map((m) => (m[1] || '').trim());
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(`${stage}/manifest.json`, 'utf8'));
  } catch (e) {
    console.log('FAIL  manifest.json is not valid JSON: ' + e.message);
    process.exit(1);
  }

  // every key the store's privacy answers (store/listing.md) were written for; anything else needs both updated
  const allowed = ['manifest_version', 'name', 'short_name', 'description', 'default_locale', 'minimum_chrome_version',
    'homepage_url', 'icons', 'content_scripts'];
  for (const k of Object.keys(manifest)) if (!allowed.includes(k)) problems.push(`"${k}" is not covered by store/listing.md's privacy answers; update both together`);

  const version = values('version')[0] || '';
  const parts = version.split('.');
  if (parts.length > 4 || !parts.every((p) => /^(0|[1-9]\d{0,4})$/.test(p) && Number(p) <= 65535)) {
    problems.push(`@version "${version}" is not a Chrome version (1 to 4 numbers, 0-65535, no leading zeros)`);
  }

  const scripts = manifest.content_scripts || [];
  if (scripts.length !== 1) problems.push(`expected one content_scripts entry, found ${scripts.length}`);
  const script = scripts[0] || {};
  for (const k of Object.keys(script)) if (!['matches', 'js', 'run_at', 'world', 'all_frames'].includes(k)) problems.push(`content_scripts.${k} is not expected`);
  if (JSON.stringify(script.js) !== '["content.js"]') problems.push(`content_scripts.js must be ["content.js"], is ${JSON.stringify(script.js)}`);
  const want = values('match').sort().join(' ');
  if ((script.matches || []).slice().sort().join(' ') !== want) problems.push(`content_scripts matches ${JSON.stringify(script.matches)} differ from @match ${want}`);
  const runAt = { 'document-start': 'document_start', 'document-end': 'document_end', 'document-idle': 'document_idle' }[values('run-at')[0]];
  if (runAt && script.run_at !== runAt) problems.push(`run_at "${script.run_at}" differs from @run-at (${runAt})`);
  if (values('noframes').length && script.all_frames) problems.push('@noframes, but all_frames is true');
  if (values('grant').some((g) => g !== 'none')) problems.push('the userscript uses GM_ APIs, which a content script does not have');
  if (script.world !== 'MAIN') problems.push('a @grant none userscript runs in the page; the content script needs "world": "MAIN"');

  const locales = path.join(stage, '_locales');
  const dirs = fs.existsSync(locales) ? fs.readdirSync(locales, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name) : [];
  if (!dirs.includes(manifest.default_locale)) problems.push(`no _locales/${manifest.default_locale} for default_locale`);
  for (const dir of dirs) {
    const m = JSON.parse(fs.readFileSync(path.join(locales, dir, 'messages.json'), 'utf8'));
    for (const field of ['name', 'short_name', 'description']) {
      const key = /^__MSG_(\w+)__$/.exec(manifest[field] || '')?.[1];
      if (key && !m[key]?.message) problems.push(`${dir}: no message "${key}" for ${field}`);
    }
    if ((m.name?.message || '').length > 75) problems.push(`${dir}: name over the store's 75 characters`);
    if ((m.short_name?.message || '').length > 12) problems.push(`${dir}: short_name over 12 characters`);
    if ((m.description?.message || '').length > 132) problems.push(`${dir}: description over the store's 132 characters`);
  }
  for (const icon of Object.values(manifest.icons || {})) if (!fs.existsSync(`${stage}/${icon}`)) problems.push(`missing ${icon}`);

  if (problems.length) { for (const p of problems) console.log('FAIL  ' + p); process.exit(1); }
  manifest.version = version;
  fs.writeFileSync(`${stage}/manifest.json`, JSON.stringify(manifest, null, 2) + '\n');
  console.log(version);
} catch (e) {
  console.log('CANNOT BUILD  ' + e.message);
  process.exit(2);
}
