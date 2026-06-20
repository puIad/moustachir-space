# MoustachirSpace — Mobile App UI Kit

Interactive recreation of the **MousSpace** mobile app: the field tool the
Moustachir agency uses to capture leads, track missions, and log client feedback.

## Run
Open `index.html`. The bundle (`_ds_bundle.js`) and `styles.css` are loaded from
the design-system root; Phosphor icon CSS from CDN.

## Flow
`Login` → **Log In** → `Dashboard` → centre **FAB** → `New Lead` → **Submit** → toast → `Dashboard`.
The bottom-nav **feedback** tab opens `Client Feedback`. Other tabs toast "Coming soon".

## Screens
| File | Surface |
|------|---------|
| `LoginScreen.jsx` | Navy "space" hero + glossy sign-in form |
| `DashboardScreen.jsx` | Greeting header, stat cards, recent activity, mission list |
| `NewLeadScreen.jsx` | Lead-capture form (fields, selects, notes) |
| `FeedbackScreen.jsx` | Search, client card, segmented mode, star rating, tag chips |

Every screen composes design-system primitives (`window.MoustachirSpaceDesignSystem_d4c8ce`)
— `AppHeader`, `BottomNav`, `Button`, `TextField`, `Select`, `Chip`,
`SegmentedControl`, `StatCard`, `ListRow`, `StatusPill`, `ProgressRing`,
`StarRating`, `Avatar`. No bespoke component logic — cosmetic recreations only.

> Source of truth: `uploads/MouSpace.pdf` (5 screens). Sample data (names,
> mission IDs, Algerian `+213` numbers, "Merhba," greeting) mirrors the original mockups.
