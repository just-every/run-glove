# Fonts

Three families are self-hosted under the SIL Open Font License 1.1, each with its licence beside it:

| Family | Use | Files | Licence | Upstream |
| --- | --- | --- | --- | --- |
| Instrument Sans | body text, the app | `instrument-sans/*.woff2` (Latin, Latin Extended; 400–700) | `instrument-sans/LICENSE.txt` | https://github.com/Instrument/instrument-sans |
| Figtree | headings and the Glove wordmark on the run site, Run page, sign-in and setup | `figtree/*.woff2` (Latin, Latin Extended; 300–900) | `figtree/LICENSE.txt` | https://github.com/erikdkennedy/figtree |
| JetBrains Mono | commands and code | `jetbrains-mono/jetbrains-mono-latin-wght-normal.woff2` (Latin; 400–800) | `jetbrains-mono/LICENSE.txt` | https://github.com/JetBrains/JetBrainsMono |

The variable-weight WOFF2 subsets come from Fontsource's distributions of each family (`@fontsource-variable/*` 5.3).

The root document links `/fonts/fonts.css` once and preloads only the primary
Latin file (`src/base/font-head.ts`); the run site, sign-in, setup and the Lobby
link the same stylesheet through the edition identity. Do not import this CSS
from a component. Every body-font stack uses `--font-body`, including the local
`Instrument Sans Fallback` before generic fallback fonts; controls inherit it.

The fallback faces scale Arial to Instrument Sans's advance widths and give it
the font's vertical metrics per weight, so text does not reflow when the font
arrives. Recalculate them and the preload when changing the body font.
