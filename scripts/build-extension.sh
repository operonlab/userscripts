#!/usr/bin/env bash
# Package a userscript as a Chrome extension: <name>/extension/ plus <name>.user.js as content.js.
# usage: build-extension.sh <name> [out dir, default dist/]
# Writes <out>/<name>/ (unpacked, for loading and tests) and <out>/<name>-<version>.zip (for the store).
# The version comes from the userscript's @version, so the two channels never drift.
# Exit 0 built · 1 the template disagrees with the userscript (printed) · 2 could not build (reason printed).
set -u
cd "$(dirname "$0")/.." || exit 2
root=$(pwd -P)

cannot() { printf 'CANNOT BUILD  %s\n' "$1"; exit 2; }

name=${1:-}
[ -n "$name" ] || cannot "usage: $0 <name> [out dir]"
src="$name/$name.user.js"
tpl="$name/extension"
[ -f "$src" ] || cannot "no $src"
[ -f "$tpl/manifest.json" ] || cannot "no $tpl/manifest.json"
command -v node >/dev/null 2>&1 || cannot "node is not installed"
command -v zip >/dev/null 2>&1 || cannot "zip is not installed"

# the stage is deleted and rebuilt, so it must never be the source or sit inside it
out=${2:-dist}
mkdir -p "$out" 2>/dev/null || cannot "cannot create $out"
out=$(cd "$out" && pwd -P) || cannot "cannot resolve $out"
case "$out/" in
  "$root/" | "$root/$name/"*) cannot "$out would put the build on top of the source" ;;
esac
stage="$out/$name"
marker="$out/.$name.built-by-build-extension"
[ ! -e "$stage" ] || [ -f "$marker" ] || cannot "$stage exists and was not made by this script; not deleting it"
{ rm -rf "$stage" && mkdir -p "$stage" && : > "$marker"; } || cannot "cannot write $stage"
{ cp -R "$tpl/." "$stage/" && rm -f "$stage/icon.svg" && cp "$src" "$stage/content.js"; } ||
  cannot "copy into $stage failed"

# check the template against the userscript header, then write the version in
version=$(node scripts/check-extension.cjs "$src" "$stage")
rc=$?
[ "$rc" -eq 0 ] || { printf '%s\n' "$version"; [ "$rc" -eq 1 ] && exit 1; exit 2; }

zipfile="$out/$name-$version.zip"
rm -f "$zipfile"
# manifest.json at the archive root, as the store requires; no dotfiles (.DS_Store) at any depth
(cd "$stage" && zip -qrX "$zipfile" . -x '.*' -x '*/.*' -x '__MACOSX*') || cannot "zip failed"
printf 'built %s and %s\n' "$stage" "$zipfile"
