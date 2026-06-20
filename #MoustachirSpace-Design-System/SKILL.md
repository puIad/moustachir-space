---
name: moustachirspace-design
description: Use this skill to generate well-branded interfaces and assets for MoustachirSpace (MousSpace) — the Moustachir studio's lead / mission / client-feedback mobile app — for production or throwaway prototypes/mocks. Contains essential design guidelines, colors, type, fonts, assets, and UI-kit components for prototyping.
user-invocable: true
---

Read the `readme.md` file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets
out and create static HTML files for the user to view. If working on production code,
you can copy assets and read the rules here to become an expert in designing with this
brand.

If the user invokes this skill without any other guidance, ask them what they want to
build or design, ask some questions, and act as an expert designer who outputs HTML
artifacts _or_ production code, depending on the need.

## Quick reference
- **Global CSS:** link `styles.css` (pulls in all tokens). Brand hue `--blue-500 #0074ff`; hero navy `--navy-800 #161624`; accent `--orange-500 #ff9142`.
- **Type:** Space Grotesk (display) + Manrope (UI) + Space Mono — substituted from Google Fonts (see readme "Fonts" notice).
- **Icons:** Phosphor Icons via CDN — `ph` (line) / `ph-fill` (solid). No emoji.
- **Signature:** glossy electric-blue pill button (`--grad-primary` + `--gloss-overlay` + `--shadow-btn`); soft rounded cards; bottom nav with a centre raised FAB; floating-label card fields.
- **Components:** load `_ds_bundle.js`, then `const { Button, TextField, … } = window.MoustachirSpaceDesignSystem_d4c8ce`. See `components/**/*.prompt.md` for each one's API.
- **Full app example:** `ui_kits/moustachir-app/`.
- **Assets:** `assets/moustachir-logo*.png`, `assets/moustachir-mark.png`.
