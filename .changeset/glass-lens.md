---
"purrlucent": minor
---

Glass refracts in Chromium. Toolbars, menubars, navigation menus, buttons and segmented controls on glass bend what is behind their rim, as Apple's glass does: each gets an SVG displacement filter sized to its box, read through the new non-inheriting `--pl-lens` property ahead of the blur. Safari and Firefox cannot draw an SVG filter in `backdrop-filter`, so they keep the plain frosted glass. Refraction only moves the backdrop, so text contrast on glass is unchanged, and reduced transparency, increased contrast and forced colors still make glass solid.
