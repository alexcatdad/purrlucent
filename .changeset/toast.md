---
"purrlucent": minor
---

Add `pl-toast` and `pl-toaster`: non-blocking status messages in a polite live region at the inline-end bottom edge. A toast has a title, an optional description and action, and a close button; one without an action dismisses itself after `duration` (6s by default, 0 keeps it), pausing while hovered or focused, and Escape closes the focused toast. Show toasts from script with `PlToaster.show({ title, description, variant, action, duration })`. `pl-close` reports the `reason`.
