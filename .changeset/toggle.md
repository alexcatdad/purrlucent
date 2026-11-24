---
"purrlucent": minor
---

`pl-toggle` and `pl-toggle-group` fire `pl-change` as a cancelable event before the new state is applied. Calling `preventDefault()` keeps the previous `pressed` or `value`, and a group then fires no `input` or `change`.
