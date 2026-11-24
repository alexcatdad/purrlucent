---
"purrlucent": minor
---

`pl-data-table` has a `renderCell(row, column)` property. It returns a string, a `Node` or a Lit template that a cell shows in place of its text, in both the plain and the model table, so cells can hold links, markers, checkboxes and buttons. Keyboard cell navigation still works, and controls in a cell stay reachable with Tab.
