---
"purrlucent": minor
---

`pl-combobox` can leave filtering to the app and offer action rows. The `manual-filter` attribute stops the field from narrowing or reordering the list, so an app that searches on a server can replace the options on each `pl-input`. A `pl-option` with the `action` attribute, or the `action-label` attribute (in English "Add {query}"), adds a row that fires `pl-action` with `detail.query` instead of choosing a value.
