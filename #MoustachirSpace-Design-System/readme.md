# MoustachirSpace Design System

The design system for **MousSpace** — the internal mobile app of **Moustachir**, a
creative / dev studio (Algeria — French-Arabic context). Account managers use it in
the field to **add leads**, **track missions** (website dev, branding, academy
platforms…), and **collect client feedback**. The aesthetic is confident and
techy: an electric-blue brand on deep "space" navy, glossy skeuomorphic buttons,
soft rounded cards, and a friendly geometric voice.

> **Source material:** `uploads/MouSpace.pdf` — a 5-screen mobile mockup
> (Login, Dashboard, New Lead, Client Feedback). No codebase or Figma was
> provided. Colours and layout were extracted from the rendered PDF; the logo was
> lifted from the vector splash. Type is **substituted** (see Fonts, below).

---

## Content Fundamentals

**Voice — warm, local, plain-spoken.** The product greets the user in
Algerian-Arabic: **"Merhba,"** ("Welcome,") above their name. Microcopy is short,
sentence-or-title case, and direct — labels are nouns (*Full Name*, *Project
Sector*, *Lead Source*), actions are single verbs (*Log In*, *Submit*).

- **Casing:** Title Case for screen titles & section headers ("New Lead", "My
  Missions", "Recent Activity"); Sentence case for helper text; the wordmark is
  **MOUSTACHIR** in caps with "Space" set below.
- **Person:** Addresses the user implicitly ("your MousSpace Account"). No "I".
  Questions are used for feedback prompts ("What went well the most?", "Any issues
  raised?").
- **Numbers & metrics:** Big and declarative — "14 Leads Added", "4.2 Avg.
  Feedback", "+3 vs last week". Deltas are explicit and comparative.
- **IDs:** Missions carry a code like `#MC-0418`. Phones are Algerian `(+213) …`.
- **Status language:** *In Progress · Scheduled · Delayed · Completed.*
- **Emoji:** none. The single decorative glyph is the rating **★**. Everything
  else is an icon.
- **Vibe:** competent operations tool with a spark of personality — not corporate,
  not playful-to-a-fault.

---

## Visual Foundations

**Colour.** One hero hue — **electric blue `#0074ff`** — does the heavy lifting
(icons, active states, stars, the FAB). A glossy button **gradient**
(`#5b9bf5 → #2667e8`) is the signature interactive surface. Deep **navy `#161624`**
anchors the login "space" hero and the logo. A warm **orange `#ff9142`** is the
lone accent (delays, alerts, an at-risk progress ring). Backgrounds are cool
near-whites (`#f4f6fa` app, `#ffffff` cards). Greens/reds appear only as semantic
deltas. See `tokens/colors.css`.

**Type.** Geometric-grotesque pairing: **Space Grotesk** (bold, −2% tracking) for
display, titles, section headers and big metric numbers; **Manrope** for body,
labels and field values; **Space Mono** for codes/specimens. Hierarchy is carried
by weight + size, not colour. See `tokens/typography.css`.

**Spacing & layout.** 4-pt base, 16-pt screen gutters, 24-pt section gaps.
Single-column mobile, content max ~420px. Two-up grids for stat cards; horizontal
scroll rails for activity. A persistent bottom tab bar with a **centre raised FAB**.

**Backgrounds & texture.** Mostly flat cool neutrals. The one rich surface is the
login **hero**: a radial navy gradient dusted with a faint **starfield + grid**
("space" motif). No photographic backgrounds, no full-bleed imagery.

**Corners & cards.** Generously rounded — chips 6, inputs 10, field cards 14,
cards 18, hero 24, buttons fully **pill**. Cards are white with a **soft, cool
shadow** (`0 4px 16px rgba(21,35,63,.07)`); some use a faint hairline instead.
Stat cards sit on a light grey fill with a large, ~5%-opacity **watermark glyph**.

**Shadows.** Two systems: (1) soft cool elevation for cards/sheets; (2) a **glossy
button** stack — blue cast shadow + inner top sheen (`--shadow-btn`,
`--gloss-overlay`). The FAB gets a blue **glow** (`rgba(0,116,255,.35)`).

**Borders.** Hairlines `#e2e5ee`; inputs use an inset 1px ring that becomes a 1.5px
**blue ring + focus halo** on focus, or a red ring on error.

**Motion.** Restrained and quick (120–320ms). `ease-out` for most transitions; a
gentle **spring** (`cubic-bezier(.34,1.56,.64,1)`) for the segmented-control thumb
and star pop. Progress rings animate their stroke on mount.

**States.** *Hover* (where pointers exist): subtle lift / lighter gradient.
*Press*: scale to **0.97** (buttons), 0.92 (icon buttons), plus a recessed
button shadow. *Selected*: solid fill (chips, segmented thumb, nav icon → blue +
fill weight). *Disabled*: ~55% opacity, no shadow.

**Transparency & blur.** Used sparingly — a bottom fade behind sticky Submit bars;
the hero's translucent star/grid layer. No heavy glassmorphism.

---

## Iconography

**System: [Phosphor Icons](https://phosphoricons.com)** (loaded from CDN —
`@phosphor-icons/web`). Phosphor's **regular** weight covers line icons (back
arrow, eye, search, caret, chevrons) and its **fill** weight matches the app's
chunky solid icons (bottom-nav active tabs, the bell, stat-card watermarks,
activity badges). **Bold** weight is used for tiny trend arrows and the checkbox tick.

> **Substitution flagged:** the original mockup's icons are bespoke/outlined in the
> PDF (no icon font embedded). Phosphor is the closest CDN match for stroke weight
> and the line/fill duality. Swap to the brand's real set if one exists.

- Active bottom-nav tabs swap to the **fill** weight in electric blue; idle tabs
  are line icons in `--ink-300`.
- Icons inside list rows / selects sit in a **tinted square tile** (`--blue-50`
  bg, `--blue-500` glyph).
- The only non-icon symbol is the rating **★**. No emoji, no ad-hoc unicode.

Usage: `<i class="ph ph-house"></i>` (line) · `<i class="ph-fill ph-bell"></i>`
(solid) · `<i class="ph-bold ph-trend-up"></i>` (bold).

---

## Brand assets (`assets/`)

| File | Use |
|------|-----|
| `moustachir-logo.png` | Full colour lockup on light |
| `moustachir-logo-transparent.png` | Colour lockup, transparent bg |
| `moustachir-logo-white.png` | White lockup for the navy hero / dark surfaces |
| `moustachir-mark.png` | Standalone mark (navy flag + blue figure) — avatars, favicons |

Clear space ≥ the mark's height; never recolour the wordmark outside navy / white.

---

## Fonts — substitution notice ⚠️

The source PDF ships its type as **outlines** (no embedded font binaries), so the
exact faces can't be confirmed. Identified by eye and substituted with the closest
**Google Fonts**:

| Role | Substitute | Original (likely) |
|------|-----------|-------------------|
| Display / headings | **Space Grotesk** | a geometric grotesque (on-brand with "Space") |
| Body / UI | **Manrope** | a neutral geometric sans |
| Mono | **Space Mono** | — |

**If you have the studio's real fonts, drop them in `assets/fonts/` and replace the
`@import` in `tokens/fonts.css` with `@font-face` rules.** Please confirm or supply
the originals.

---

## Index / manifest

**Tokens & global CSS**
- `styles.css` — entry point (consumers link this); `@import`s the token files
- `tokens/colors.css` · `typography.css` · `spacing.css` · `effects.css` · `fonts.css`

**Components** (`window.MoustachirSpaceDesignSystem_d4c8ce.*`)
- `components/forms/` — Button, IconButton, TextField, Textarea, Select, Chip, SegmentedControl, SearchField
- `components/data/` — StatCard, ProgressRing, StatusPill, Avatar, StarRating, ListRow
- `components/layout/` — Card, AppHeader, BottomNav

**UI kit**
- `ui_kits/moustachir-app/` — interactive mobile-app recreation (`index.html` + 4 screens)

**Foundations** (Design System tab cards)
- `guidelines/*.card.html` — Colors, Type, Spacing, Brand specimen cards

**Other**
- `SKILL.md` — Agent-Skill manifest · `assets/` — logos & mark
