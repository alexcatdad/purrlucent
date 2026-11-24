---
"purrlucent": minor
---

New `purrlucent/tailwind.css` export. Tailwind's preflight zeroes `margin`, `padding` and `border` on every element, which outranks the components' own styles; imported after Tailwind, this file hands them back to every purrlucent element.
