---
"purrlucent": minor
---

Components follow a change of language while the page is open: when a `lang` attribute changes, `setMessages` registers text later or the browser's language changes, the elements on the page update their built-in text, their date and month names and the validation messages the library writes. A date picker writes its day again in the new language's format. A text field's own required message still comes from the browser.
