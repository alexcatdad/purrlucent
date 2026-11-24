---
"purrlucent": minor
---

Clearer glass on small chrome. Glass now has two tiers, as Apple's small glass is clearer than its large glass:

- Bars, capsules and controls take a thin fill, `--pl-material-glass-thin`, under a 10px blur (`--pl-blur-sm`): a 60% pale film in light and a 66% ink film in dark. Only primary text goes on them. A text-only button in a glass bar takes the primary text color, handed down by the bar. Pressed, a thin control thickens halfway to the thick fill.
- Sidebars, panels and sheets keep the thick fill, `--pl-material-glass`. Controls that show grey, pink or red text read the new `--pl-material-capsule-strong` and `--pl-material-control-strong` tokens, which stay thick under glass: tabs, breadcrumbs, pagination, the select trigger, and tinted and destructive buttons. On glass a tinted or destructive button mixes 8% of its tone into its face, not 21%, and pressing lightens it, set by the new `--pl-material-tone-rest` and `--pl-material-tone-pressed`.
- The color boost rises to 180%, and the rim light and inner glow are brighter.
- On glass, the focus ring and the selection take `--pl-material-ring` and `--pl-material-selected`: the pink deepened in light and lifted in dark, so they hold 3:1 on the thin fill over any backdrop.

Every fill still holds its text at 4.5:1 over any backdrop, black to white, and reduced transparency, increased contrast and forced colors still make glass solid.
