---
"purrlucent": minor
---

`pl-sidebar-item` labels and descriptions truncate with an ellipsis on one line, and the full text shows as the control's title only when truncated. The reorder grip has a fixed width independent of the row height and no longer takes room from the label while hidden.

The disclosure chevron of a group now sits at the trailing end of the row, after the label and the detail, so icons and labels of group and plain rows line up. The new `chevron` attribute on `pl-sidebar` (`end`, the default, or `start`) restores the leading position. Beside a link, the disclosure button now follows the link in the tab order when the chevron is at the end.
