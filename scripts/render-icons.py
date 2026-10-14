"""Rasterize an extension's icon.svg into icons/{16,32,48,128}.png with transparent corners.

usage: python render-icons.py <script folder> [chrome executable]
Run it after editing icon.svg and commit the PNGs. It needs Playwright and a Chromium;
pass the executable when Playwright's own browser is not installed.
"""

import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

SIZES = (16, 32, 48, 128)

folder = Path(sys.argv[1]) / "extension"
svg = (folder / "icon.svg").read_text()
out = folder / "icons"
out.mkdir(exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=sys.argv[2] if len(sys.argv) > 2 else None)
    page = browser.new_page()
    for size in SIZES:
        page.set_viewport_size({"width": size, "height": size})
        page.set_content(
            "<style>html,body{margin:0;background:transparent}svg{display:block}</style>"
            + svg.replace("<svg ", f'<svg width="{size}" height="{size}" ', 1)
        )
        page.screenshot(path=str(out / f"{size}.png"), omit_background=True)
    browser.close()

print(f"wrote {', '.join(f'{s}.png' for s in SIZES)} to {out}")
