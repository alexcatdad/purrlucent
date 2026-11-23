---
"purrlucent": minor
---

Event details are typed. The element manifest gives each `purr-*` event its `CustomEvent<…>` type, and in React the `on<event-name>` props receive it, so `e.detail.value` of a `purr-select` is a `string`.
