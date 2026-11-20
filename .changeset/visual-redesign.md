---
"purrlucent": minor
---

New visual design for every component, following `design/visual-spec.md`.

- Palette: warm neutrals in one family; plum splits into accent text and accent fill; separate roles for dividers, control boundaries, selection, focus, a hover/pressed fill ladder and disabled labels.
- Glass: a tint, blur and saturation per surface (bar, sidebar, panel, sheet) with an edge highlight; elevation tokens replace outlines.
- Type, radii and hit regions follow the pointer: 13 px text and 28 px controls with a fine pointer, 17 px and 44 px with a coarse one.
- Segmented control: a sliding selection pill. Sidebar: one rounded selection shape and aligned labels. Toolbar: a new `purr-toolbar-group` element gives grouped items one container.

Breaking: the tokens `--purr-color-accent`, `--purr-color-separator`, `--purr-color-fill`, `--purr-color-destructive`, `--purr-glass-tint`, `--purr-glass-blur` and the `small`/`medium`/`large` radii are removed; see the mapping table in `design/visual-spec.md`.
