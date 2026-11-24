---
"purrlucent": minor
---

`pl-menu` and `pl-menu-item` gain several options. A `pl-menu-item` with `href`, `target` and `rel` renders a real link, so middle-click, open in a new tab and copy link work; choosing it closes the menu. A `description` attribute or slot adds a second, muted line to an item. A `header` slot on `pl-menu` holds non-interactive content above the items. `placement` (`bottom-start`, `bottom-end`, `top-start`, `top-end`, `start`, `end`) sets where the menu opens, and it still flips when there is no room. `pl-menu` fires `pl-toggle` with `detail.open` when it opens and closes, and has a `show()` method that opens it with the first item focused, like `open` and `hide()`. `pl-select` now also reports the item element in `detail.item`, and the docs state that choosing an item dispatches `click` on it.
