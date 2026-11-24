---
"purrlucent": minor
---

Built-in text follows the page language. `setMessages(lang, messages)` registers an app's text for a language once, and every component inside an element with that `lang` uses it, also inside other components; English is built in. The data-table column and row menus, the prompt-input Send and Stop buttons, the carousel's role words and the sidebar item's disclosure name are now translatable too, and prompt-input gains `send-label` and `stop-label`. Label attributes now default to empty and still win over the registered text. Breadcrumb and pagination always have a name.
