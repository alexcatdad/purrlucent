---
"purrlucent": minor
---

New `pl-date-picker`, a form field for one day. The text entry reads the day as the locale writes it or as an ISO day, and a button opens a `pl-calendar` in a popover; choosing a day fills the field and returns focus to the button. The value is an ISO day, `yyyy-mm-dd`. The field takes `min`, `max`, `disabled-dates` and `required`, reports an invalid entry below itself, and fires `pl-input` and `pl-change` with the native `input` and `change`.
