#!/usr/bin/env bash
# Package a userscript as a Chrome extension: <name>/extension/ plus <name>.user.js as content.js.
# usage: build-extension.sh <name> [out dir, default dist/]
# Writes <out>/<name>/ (unpacked, for loading and tests) and <out>/<name>-<version>.zip (for the store).
# The version comes from the userscript's @version, so the two channels never drift.
# Exit 0 built · 1 the template disagrees with the userscript (printed) · 2 could not build (reason printed).
set -u
cd "$(dirname "$0")/.." || exit 2

name=${1:-}
[ -n "$name" ] || { printf 'usage: %s <name> [out dir]\n' "$0"; exit 2; }
out=${2:-dist}
case $out in /*) ;; *) out="$PWD/$out" ;; esac
[ "$out" != "/" ] || { printf 'CANNOT BUILD  refusing to build into /\n'; exit 2; }
src="$name/$name.user.js"
tpl="$name/extension"
[ -f "$src" ] || { printf 'CANNOT BUILD  no %s\n' "$src"; exit 2; }
[ -f "$tpl/manifest.json" ] || { printf 'CANNOT BUILD  no %s/manifest.json\n' "$tpl"; exit 2; }
command -v node >/dev/null 2>&1 || { printf 'CANNOT BUILD  node is not installed\n'; exit 2; }
command -v zip >/dev/null 2>&1 || { printf 'CANNOT BUILD  zip is not installed\n'; exit 2; }

stage="$out/$name"
{ rm -rf "$stage" && mkdir -p "$stage"; } || { printf 'CANNOT BUILD  cannot write %s\n' "$stage"; exit 2; }
{ cp -R "$tpl/." "$stage/" && rm -f "$stage/icon.svg" && cp "$src" "$stage/content.js"; } ||
  { printf 'CANNOT BUILD  copy into %s failed\n' "$stage"; exit 2; }

# check the template against the userscript header, then write the version in
version=$(node - "$src" "$stage" <<'EOF'
const fs = require('fs');
const [src, stage] = process.argv.slice(2);
const meta = fs.readFileSync(src, 'utf8').match(/\/\/ ==UserScript==([\s\S]*?)\/\/ ==\/UserScript==/);
if (!meta) { console.log('FAIL  no userscript header in ' + src); process.exit(1); }
const values = (key) => [...meta[1].matchAll(new RegExp(`^// @${key}\\s+(.+)$`, 'gm'))].map((m) => m[1].trim());
const manifest = JSON.parse(fs.readFileSync(`${stage}/manifest.json`, 'utf8'));
const problems = [];
if ('version' in manifest) problems.push('the template sets "version"; it comes from @version');
const version = values('version')[0] || '';
if (!/^\d+(\.\d+){0,3}$/.test(version)) problems.push(`@version "${version}" is not a Chrome version (1 to 4 dot-separated numbers)`);
const script = manifest.content_scripts?.[0] || {};
const want = values('match').sort().join(' ');
if ((script.matches || []).slice().sort().join(' ') !== want) problems.push(`content_scripts matches ${JSON.stringify(script.matches)} differ from @match ${want}`);
const runAt = { 'document-start': 'document_start', 'document-end': 'document_end', 'document-idle': 'document_idle' }[values('run-at')[0]];
if (runAt && script.run_at !== runAt) problems.push(`run_at "${script.run_at}" differs from @run-at (${runAt})`);
if (values('grant').some((g) => g !== 'none')) problems.push('the userscript uses GM_ APIs, which a content script does not have');
if (script.world !== 'MAIN') problems.push('a @grant none userscript runs in the page; the content script needs "world": "MAIN"');
for (const dir of fs.readdirSync(`${stage}/_locales`)) {
  const m = JSON.parse(fs.readFileSync(`${stage}/_locales/${dir}/messages.json`, 'utf8'));
  if ((m.name?.message || '').length > 75) problems.push(`${dir}: name over the store's 75 characters`);
  if ((m.description?.message || '').length > 132) problems.push(`${dir}: description over the store's 132 characters`);
}
for (const icon of Object.values(manifest.icons || {})) if (!fs.existsSync(`${stage}/${icon}`)) problems.push(`missing ${icon}`);
if (problems.length) { for (const p of problems) console.log('FAIL  ' + p); process.exit(1); }
manifest.version = version;
fs.writeFileSync(`${stage}/manifest.json`, JSON.stringify(manifest, null, 2) + '\n');
console.log(version);
EOF
)
rc=$?
[ "$rc" -eq 0 ] || { printf '%s\n' "$version"; [ "$rc" -eq 1 ] && exit 1; exit 2; }

zipfile="$out/$name-$version.zip"
rm -f "$zipfile"
# manifest.json at the archive root, as the store requires; no macOS metadata
(cd "$stage" && zip -qrX "$zipfile" . -x '.*' -x '__MACOSX*') || { printf 'CANNOT BUILD  zip failed\n'; exit 2; }
printf 'built %s and %s\n' "$stage" "$zipfile"
