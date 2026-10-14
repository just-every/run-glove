# Fonts

Instrument Sans is self-hosted under the SIL Open Font License 1.1 in
`instrument-sans/LICENSE.txt`. The Latin and Latin Extended variable-weight
WOFF2 subsets (400–700) come from Fontsource's Instrument Sans distribution;
upstream: https://github.com/Instrument/instrument-sans.

The root document links `/fonts/fonts.css` once and preloads only the primary
Latin file (`src/base/font-head.ts`); the run site, sign-in, setup and the Lobby
link the same stylesheet through `public/rer-theme.css` and the edition
identity. Do not import this CSS from a component. Every body-font stack uses
`--font-body`, including the local `Instrument Sans Fallback` before generic
fallback fonts; controls inherit it.

The fallback faces scale Arial to Instrument Sans's advance widths and give it
the font's vertical metrics per weight, so text does not reflow when the font
arrives. Recalculate them and the preload when changing the brand font.
