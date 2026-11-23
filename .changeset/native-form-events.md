---
"purrlucent": minor
---

Form controls fire the native `input` and `change` events after their own `purr-input` and `purr-change`, so React's `onInput` and `onChange` and form libraries such as react-hook-form work with them. `purr-checkbox` and `purr-switch` have a `type` of `checkbox`, so form libraries read `checked`.
