---
"purrlucent": minor
---

`pl-dialog` gains `closable` (a close button in the sheet header that cancels like Escape, named by `close-label`), an `actions-start` slot for status text in the actions row, a `nonmodal` mode that leaves the page interactive, and a `description` attribute. `pl-close` now reports `detail.reason` (`user` or `programmatic`). `pl-drawer` gains the `description` attribute. A `data-close` element inside a dialog in a drawer now closes only that dialog.
