---
"purrlucent": minor
---

`pl-sidebar` and `pl-sidebar-item` changes for app integration:

- The narrow-screen state is applied in the same task as the width change, before the next frame, so a narrow screen never shows the inline sidebar or overflows horizontally.
- Hiding and showing animates the width with the motion tokens, and not under `prefers-reduced-motion: reduce`. A collapse caused by the screen width is not animated.
- With `no-toggle`, a collapsed sidebar takes no space. The host of the narrow-screen panel takes no place in the page flow.
- Reorder grips show on hover and focus within the row, and always on touch screens.
- The gap between an item's icon and its label uses `--pl-gap-icon` and is not affected by page CSS that resets margins.
- A `pl-sidebar-item` with `action` passes `aria-haspopup`, `aria-expanded` and, where the browser supports element references, `aria-controls` from the host to its button, so a `pl-menu` trigger exposes its state on the focused control.
- After the narrow-screen panel closes, focus returns to the toggle in every browser (#166).
