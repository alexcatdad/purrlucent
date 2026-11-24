---
"purrlucent": minor
---

`pl-button` takes `href`, `target`, `rel` and `download`: it then renders a real link with the button's look, so opening in a new tab and copying the address work. The `click` reaches the host and can be cancelled for client-side routing. A disabled link has no address and cannot be focused, and an icon link's `aria-label` names the inner link. A link button takes part in `pl-toolbar`'s arrow-key focus like any other item.
