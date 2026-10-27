# Inline morph SVG assets

Retrieved on 2026-10-25. Pinned source files are stored beside this document.

- `codex-color.svg`: https://raw.githubusercontent.com/lobehub/lobe-icons/master/packages/static-svg/icons/codex-color.svg — Lobe Icons, Copyright (c) 2023 LobeHub, MIT. The importer preserves the original cloud path and gradient, removes the app tile, and adds a white sticker outline. The reference labels this icon “ChatGPT”; that label is retained.
- `claude-color.svg`: https://www.graphicalui.com/marketing/agents/claude-color.svg — the exact sticker SVG used by the reference page. The underlying path matches Lobe Icons' `claude-color.svg`; the reference adds a white outline.
- `cursor.svg`: https://www.graphicalui.com/marketing/agents/cursor.svg — the exact sticker SVG used by the reference page. The underlying path matches Lobe Icons' `cursor.svg`; the reference adds a white outline.
- `grok-bot.svg`: https://www.graphicalui.com/marketing/agents/grok.svg — the exact Grok Bot sticker SVG used by the reference page; it is distinct from Grok's swoosh logomark. No separate artwork license was supplied with this asset.

Lobe Icons repository: https://github.com/lobehub/lobe-icons
Full MIT notice: `LICENSE` in this directory. That notice covers Lobe Icons' code and vector contributions; brand marks remain their respective owners' trademarks. Graphical's design and additional artwork license is not independently verified.

`scripts/import-inline-agent-icons.mjs` converts these pinned files into `src/data/inline-agent-icons.mjs`; it does not redraw their paths. Generated component bundles retain this record and the MIT notice. The other feature stickers remain local reconstructions.

## Corrected feature SVGs

The themes and spacing shapes in `src/data/inline-text-morph.mjs` adapt the reference page's public inline SVG geometry, observed in https://www.graphicalui.com/ and its JavaScript artwork module `10ysidpnhxe89.js` retrieved with the reference evidence. Themes retains the original card dimensions, colours, and back-to-front paint order. Spacing retains the original rounded ruler shape, tick path, white outline, and `paint-order="stroke fill"`. Their overall rotations remain the local replica's measured angles. Other feature stickers remain local reconstructions. These two reference SVGs have no separately verified artwork license; the Lobe Icons MIT notice does not grant a license for them.
