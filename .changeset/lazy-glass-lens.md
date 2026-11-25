---
"purrlucent": patch
---

The glass lens loads only when glass is on. Until an element sits inside `pl-material="glass"`, the controls and navigation that refract glass read no layout and observe no resizes, and the lens code (about 4 KB gzipped) is not downloaded. A page using `purrlucent/button` alone loads 5.7 KB gzipped instead of 9.2 KB. Under glass the lens arrives with one extra request; until then the surface shows the frosted fill.
