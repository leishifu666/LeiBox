# Torph

- Package: `torph@0.1.3`
- Author: Lochie Axon
- Source: https://github.com/lochie/torph
- Published distribution: https://registry.npmjs.org/torph/-/torph-0.1.3.tgz
- npm shasum: `479b017319d6174f0ac821cd329d68fd48db1eeb`
- Retrieved: 2026-10-25
- License: MIT, complete upstream notice in LICENSE. The published `dist/index.mjs` is preserved as index.mjs.

The component builder wraps these exports in a per-instance closure and supplies a document facade so Torph's stylesheet stays inside the instance. WAAPI calls pass through an instance animation tracker so an exiting glyph's detached transform is cancelled on unmount too. It uses the original MorphController/TextMorph matching and animation implementation, not an iframe. The Graphical layout and sticker vectors are independently reconstructed, and Graphical's commercial fonts and original artwork are not included.
