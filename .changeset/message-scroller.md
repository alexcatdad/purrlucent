---
"purrlucent": minor
---

Adds `pl-message-scroller`, `pl-message-scroller-item` and `pl-message-scroller-button`, a scrolling transcript for chat. It is a named, focusable region that holds a live log of rows. A new row marked `scroll-anchor` scrolls near the top with a peek of the row before it, `auto-scroll` follows streamed content while the reader is at the end, `default-scroll-position` picks where it opens, and older rows added before the first keep the visible rows in place. It offers `scrollToMessage`, `scrollToEnd` and `scrollToStart`, `data-scrollable` edge state, edge fades, and a scroll-to-end button.
