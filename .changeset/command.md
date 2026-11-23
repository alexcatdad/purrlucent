---
"purrlucent": minor
---

New `pl-command`, `pl-command-item` and `pl-command-group`: a command palette with a search field above an always-visible list. Typing hides the items that do not match, and groups left empty; Down, Up, Home and End move the active item, Enter or a click fires `pl-select` with `{ value }`, and Escape clears the text. It works inside `pl-dialog`.
