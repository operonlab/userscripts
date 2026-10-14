#!/usr/bin/env bash
# Run before publishing, and in CI: unit tests, userscript headers, leak scan.
# Exit 0 ready to publish · 1 something to fix (each printed as FAIL) · 2 could not check (reason printed).
# Private patterns (names, local paths) come from RELEASE_CHECK_DENY, an extended regex, so the list of
# what must not be published is not itself published.
set -u
cd "$(dirname "$0")/.." || exit 2

fail=0
problem() { printf 'FAIL  %s\n' "$1"; fail=1; }
cannot() { printf 'CANNOT CHECK  %s\n' "$1"; exit 2; }

command -v node >/dev/null 2>&1 || cannot "node is not installed"
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || cannot "not inside a git checkout"

# 1. every script's unit tests (a script without any is reported in 2)
set -- */test/*.test.mjs
if [ -e "$1" ]; then
  out=$(node --test "$@" 2>&1) || { printf '%s\n' "$out"; problem "unit tests"; }
fi

# 2. headers: what a userscript manager needs to install, update and credit a script
for f in */*.user.js; do
  [ -e "$f" ] || continue
  dir=${f%%/*}
  ls "$dir"/test/*.test.mjs >/dev/null 2>&1 || problem "$dir: no test/*.test.mjs"
  meta=$(sed -n '/==UserScript==/,/==\/UserScript==/p' "$f")
  for key in name namespace version description author license match homepageURL supportURL updateURL downloadURL; do
    printf '%s\n' "$meta" | grep -qE "^// @${key}[[:space:]]" || problem "$f: no @$key"
  done
  for key in updateURL downloadURL; do
    url=$(printf '%s\n' "$meta" | sed -n "s|^// @${key}[[:space:]]*||p")
    case $url in
      */main/"$f") ;;
      *) problem "$f: @$key should end in /main/$f, is '$url'" ;;
    esac
  done
  version=$(printf '%s\n' "$meta" | sed -n 's|^// @version[[:space:]]*||p')
  version_re=$(printf '%s' "$version" | sed 's/\./\\./g')
  # managers update only when @version goes up, so every version a user can receive has an entry
  grep -qE "^## ${version_re}( |$)" "$dir/CHANGELOG.md" 2>/dev/null ||
    problem "$dir/CHANGELOG.md: no '## $version' entry"
done

# 3. leak scan over every file that would be published, tracked or new
deny='/Users/[^/ ]+|/home/[a-z][^/ ]*|[A-Za-z]:\\Users\\|ghp_[A-Za-z0-9]{30}|github_pat_|sk-[A-Za-z0-9_-]{20}|AKIA[0-9A-Z]{16}|xox[abp]-[0-9A-Za-z]|AIza[0-9A-Za-z_-]{30}|-----BEGIN [A-Z ]*PRIVATE KEY'
[ -n "${RELEASE_CHECK_DENY:-}" ] && deny="$deny|$RELEASE_CHECK_DENY"
# a broken pattern makes grep fail, and a failing grep finds nothing: prove it matches before trusting "no hits"
printf 'C:\\Users\\someone\n' | grep -qE "$deny" || cannot "the leak pattern does not match its own sample (bad RELEASE_CHECK_DENY?)"
# git grep exits 1 for "no hits"; a file it cannot read only shows on stderr, with the same exit code.
# Either way an unscanned file must not read as clean.
err=$(mktemp) || cannot "mktemp failed"
hits=$(git grep -nIE --untracked -e "$deny" -- . 2>"$err")
rc=$?
scan_errors=$(cat "$err")
rm -f "$err"
[ "$rc" -le 1 ] || cannot "the leak scan did not run (git grep exit $rc): $scan_errors"
[ -z "$scan_errors" ] || cannot "the leak scan could not read every file: $scan_errors"
[ "$rc" -eq 0 ] || hits=
# the deny= line names the patterns it looks for; every other line of this script is scanned
hits=$(printf '%s\n' "$hits" | grep -vE '^scripts/release-check\.sh:[0-9]+:deny=')
[ -z "$hits" ] || { printf '%s\n' "$hits"; problem "leak scan: the lines above must not be published"; }

[ "$fail" -eq 0 ] && printf 'ready to publish\n'
exit "$fail"
