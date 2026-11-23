---
"purrlucent": minor
---

Form controls fire the native `input` and `change` events after their own `pl-input` and `pl-change`, so React's `onInput` and `onChange` and form libraries such as react-hook-form work with them. `pl-checkbox` and `pl-switch` have a `type` of `checkbox`, so form libraries read `checked`.
