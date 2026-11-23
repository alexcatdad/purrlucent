---
"purrlucent": minor
---

New `pl-drawer`, a modal panel anchored to an edge: the counterpart of shadcn's Drawer and Sheet. `side="bottom"` (default) is an iOS-style sheet with a grabber button that can be dragged down to dismiss, and with `detents="medium large"` dragged between a half-screen and a large height; the grabber and the arrow keys do the same without a pointer. `side="start"` and `side="end"` are logical side panels that mirror in right-to-left. It takes `title`, `description`, default and `footer` slots, a `dismissible` backdrop, `data-close` on any element, and fires cancelable `pl-cancel`, `pl-open`, `pl-close` and `pl-resize`.
