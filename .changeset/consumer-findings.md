---
"purrlucent": patch
---

Fixes found in a consumer app:

- `pl-progress` is a block as wide as its container, so it fills cards and rows and leaves no line-box space below it. Set `inline-size` for a shorter bar.
- A `fit-content` `pl-toggle-group` that scrolls fades the edges with more items past them.
- A sheet's title is a step larger, and the gap under it no longer depends on the description element's own margin, which page resets such as Tailwind's preflight removed.
- Opening a dialog on a page with a classic scrollbar keeps the page's width instead of shifting it sideways.
