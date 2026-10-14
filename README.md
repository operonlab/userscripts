# userscripts

Browser userscripts by operonlab. Each one lives in its own folder with its tests, changelog and screenshots.

You need a userscript manager: [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/). Click **Install** below, and the manager offers to add the script. It checks this repo for updates on its own.

| Script | What it does | |
|---|---|---|
| [YouTube Dual Subtitles](yt-dual-subs/) | Two caption lines on YouTube: your language on top, the original below, styled like the player's own captions. | [Install](https://raw.githubusercontent.com/operonlab/userscripts/main/yt-dual-subs/yt-dual-subs.user.js) |

In Chrome 138 and later, Tampermonkey runs scripts only after you turn on **Allow user scripts** on its page in `chrome://extensions`.

## Adding a script

- **Folder** `<name>/` with `<name>.user.js`, `README.md`, `CHANGELOG.md`, `test/` and, for screenshots, `docs/`.
- **Header**: `@name`, `@namespace https://github.com/operonlab/userscripts`, `@version`, `@description`, `@author operonlab`, `@license MIT`, `@match`, `@homepageURL`, `@supportURL`. Set both `@updateURL` and `@downloadURL` to `https://raw.githubusercontent.com/operonlab/userscripts/main/<name>/<name>.user.js`.
- **Releasing**: raise `@version` and add a `## <version> — <date>` entry to the changelog in the same commit. Managers update only when the version goes up. Write the entry for someone upgrading, not for someone reading the diff.
- **Checks**: `bash scripts/release-check.sh` runs every script's `test/*.test.mjs`, checks the headers and changelog, and scans for local paths and tokens. CI runs it on every push. It exits `0` ready, `1` something to fix, `2` could not check.
- Add a row to the table above.

## License

MIT, see [LICENSE](LICENSE).
