# ASCII Sharks upstream

Source: https://github.com/stackedlol/ascii-sharks

Pinned revision: a0074c16a106f0abc665fe9712ca445f8f98ad8e

Copyright (c) 2026 drewdi. MIT license, preserved in LICENSE and in generated distributions.

The four upstream TypeScript files are copied unchanged from this revision. The LeiBox adapter reuses World and AsciiRenderer, replaces the page-global OceanEngine lifecycle with the project's instance-scoped lifecycle, gives each simulation an independent seeded random generator, and supplies the light/inverted display, optional local composer, keyboard controls, pause/resume and native framework entries. The constructor and rendering methods are bundled normally; no eval, injected runtime code or iframe is used inside the downloadable components.

Geist Mono SemiBold and Geist Sans Light are embedded from the installed geist package. The font's OFL notice is included in the generated engine. Lucide controls retain their ISC notice. Video and raw reference frames are kept under outputs only.
