---
"purrlucent": minor
---

`pl-input`, `pl-textarea` and `pl-date-picker` forward `aria-required`, `aria-invalid`, `aria-describedby` and `aria-errormessage` set on the host to their native control, copying the referenced text to its `aria-description`, so forms that validate themselves with `novalidate` stay accessible. Return in a field of a form without a submit button inside a `pl-dialog` now presses the dialog's `default` action.
