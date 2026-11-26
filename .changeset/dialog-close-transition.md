---
"purrlucent": minor
---

pl-dialog animates its close as well as its open: the dialog fades and scales to 0.96, and the scrim fades out. `pl-close` still fires as the close starts. Reduced motion stays instant, and a browser without the CSS `overlay` property closes at once. While a dialog or drawer closes, it and its scrim take no presses.
