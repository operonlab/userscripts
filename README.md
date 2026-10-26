# userscripts

Browser userscripts by operonlab. Each one lives in its own folder with its tests, changelog and screenshots.

You need a userscript manager: [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/). Click **Install** below, and the manager offers to add the script. It checks this repo for updates on its own.

| Script | What it does | |
|---|---|---|
| [Komica Reader](komica-reader/) | Komica's 綜合 board: threads open in a drawer beside the board, and the post form floats where you are instead of at the top. | [Install](https://raw.githubusercontent.com/operonlab/userscripts/main/komica-reader/komica-reader.user.js) |
| [YouTube Dual Subtitles](yt-dual-subs/) | Two caption lines on YouTube: your language on top, the original below, styled like the player's own captions. | [Install](https://raw.githubusercontent.com/operonlab/userscripts/main/yt-dual-subs/yt-dual-subs.user.js) · [Chrome Web Store](https://chromewebstore.google.com/detail/dual-subs/iglkfnajleldidbmkgblfnkigfaeigcn) |

In Chrome 138 and later, Tampermonkey runs scripts only after you turn on **Allow user scripts** on its page in `chrome://extensions`.

## Adding a script

- **Folder** `<name>/` with `<name>.user.js`, `README.md`, `CHANGELOG.md`, `test/` and, for screenshots, `docs/`.
- **Header**: `@name`, `@namespace https://github.com/operonlab/userscripts`, `@version`, `@description`, `@author operonlab`, `@license MIT`, `@match`, `@homepageURL`, `@supportURL`. Set both `@updateURL` and `@downloadURL` to `https://raw.githubusercontent.com/operonlab/userscripts/main/<name>/<name>.user.js`.
- **Releasing**: raise `@version` and add a `## <version> — <date>` entry to the changelog in the same commit. Managers update only when the version goes up. Write the entry for someone upgrading, not for someone reading the diff.
- **Checks**: `bash scripts/release-check.sh` runs every script's `test/*.test.mjs`, checks the headers and changelog, and scans for local paths and tokens. CI runs it on every push. It exits `0` ready, `1` something to fix, `2` could not check.
- Add a row to the table above.

## Store extension (optional)

A script that should reach people who will not install a userscript manager can also ship as a Chrome extension, built from the same file:

- `<name>/extension/` holds `manifest.json` (no `version`; it is taken from `@version`), `_locales/`, `icon.svg` and the `icons/` rendered from it by `scripts/render-icons.py`.
- `bash scripts/build-extension.sh <name>` writes `dist/<name>/` (load it unpacked) and `dist/<name>-<version>.zip` (upload it to the store). It refuses a template whose matches, run-at or frames differ from the userscript header, a script that uses `GM_` APIs, and any manifest key (a permission, say) that the store's privacy answers in `<name>/store/listing.md` were not written for; the checks live in `scripts/check-extension.cjs`.
- Only `@grant none` scripts qualify: the content script runs in the page's main world, as the userscript does.
- Fixes reach userscript users as soon as they are pushed; the store version follows after its review. Both channels can be installed at once; the second copy stays off.

## License

MIT, see [LICENSE](LICENSE).
