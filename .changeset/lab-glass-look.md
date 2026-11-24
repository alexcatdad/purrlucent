---
"purrlucent": minor
---

Glass looks like Apple's: thin and lit.

- Bars, controls, sidebars, panels, popups and sheets take one thin fill, `--pl-material-glass-thin`: a pale film in light and an ink one in dark, under a 4px frost (`--pl-blur-sm`) and a 180% color boost.
- The rim catches light: a bright top edge, a faint rim around the other edges and a glow inside the top. Glass controls and panels cast a deep soft shadow, `--pl-material-drop`.
- In Chromium, popovers, menus, the select's list, navigation menu panels, dialogs and drawers refract too. The lens can target an element in a component's shadow root.
- A toolbar with `floating` is a capsule that floats over the content.
- The legibility floor on glass over any backdrop is now 3.5:1 for primary text and 3:1 for the focus ring and selection. Over mid-grey and lighter backdrops in light, and over any backdrop in dark, primary text reaches 4.5:1. Tabs, breadcrumbs, pagination, the select and tinted and destructive buttons keep the thicker fill and 4.5:1 for their colored text.
- On glass the focus ring and selection are a deeper pink in light, so they hold 3:1 on the thin fill.
