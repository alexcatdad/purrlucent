---
"purrlucent": minor
---

Breaking: the prefix is now `pl-` instead of `purr-`. Rename in your code:

- Elements: `<purr-button>` is `<pl-button>`, and so on for every element.
- Events: `purr-change` is `pl-change`; in React, `onpurr-change` is `onpl-change`.
- Tokens: `--purr-color-accent` is `--pl-color-accent`, and so on for every token.
- The glass attribute: `purr-material="glass"` is `pl-material="glass"`.
- The cascade layer: `purr.tokens` is `pl.tokens`.
- Classes and types: `PurrButton` is `PlButton`, and so on.

The package name and its import paths stay `purrlucent`.
