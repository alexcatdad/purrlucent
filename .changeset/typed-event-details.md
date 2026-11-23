---
"purrlucent": minor
---

Event details are typed. The element manifest gives each `pl-*` event its `CustomEvent<…>` type, and in React the `on<event-name>` props receive it, so `e.detail.value` of a `pl-select` is a `string`.
