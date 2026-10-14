# Changelog

Userscript managers update a script only when `@version` goes up, so every version you can receive is listed here.

## 0.5.1 — 2026-10-15

- Also available as a Chrome extension, "Dual Subs / 雙語字幕", built from this same script. Use one or the other: if both are installed, the second copy turns itself off (a note appears in the browser console), so you never get two lines or two buttons.
- Verified on Chromium as well as Firefox.

## 0.5.0 — 2026-10-15

First public release.

- Two caption lines on YouTube: your language on top and larger, the original below and smaller, centred together on one box.
- A video already in your language keeps YouTube's single line.
- Settings menu next to the CC button, in the player's own style: on/off, top and bottom language (with search), box colour and opacity, gap, line sizes. Labels follow YouTube's interface language (Chinese or English).
- Auto-generated captions no longer jump between joined and split lines.

**Upgrading from a copy pasted in by hand:** this version has a new `@namespace`, so the manager treats it as a different script. Remove the old one first, or both copies run at once. Your settings are kept.
