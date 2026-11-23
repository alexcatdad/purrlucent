# HIG audit: calendar

Source: HIG Date pickers (`https://developer.apple.com/design/human-interface-guidelines/date-pickers`). The page could not be fetched when this audit was written (HTTP 404 on the page and its data file, 2026-11-23), so the guidelines below are the ones the library's rules (`hig/rules/date-pickers.yaml`) state from general knowledge of the page, and **each needs a check against the live page** before the audit is final. Code: `src/components/calendar/` (`calendar.ts`, `calendar.css.ts`, `dates.ts`), `hig/rules/date-pickers.yaml`. WAI-ARIA Authoring Practices, date picker dialog and date grid, is the keyboard and role reference. Nothing was run for this audit, so every verdict comes from reading the code and the tests as written.

Verdicts: **met**, **gap**, **deviation** (deliberate, with a reason), or **needs eyes** (a visual judgement for the maintainer).

## Library guidelines

| Guideline (shortened)                                                             | Verdict    | Evidence                                                                                                                                                                                                                                                                                                                 |
| --------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| One month as a grid of days under weekday headings, with previous and next month. | met        | `role="grid"` named by the month title, `th` weekday headings, two month buttons. Rule date-pickers/4; test "the days are a grid named by the month, with weekday headings".                                                                                                                                             |
| Limit the choice with a minimum and a maximum.                                    | met        | `min` and `max` mark days `aria-disabled`, clamp keyboard moves and stop the month buttons at the range. Rule date-pickers/6; test "min and max grey out the days outside and stop the month buttons", "keyboard moves stay inside min and max".                                                                         |
| Make individual days unavailable.                                                 | met        | `disabled-dates` list and a `disabledDates` function. Rule date-pickers/7; tests "disabled-dates takes a list of ISO days and they cannot be selected", "the disabledDates property takes a function".                                                                                                                   |
| Names and the first day of the week follow the locale.                            | met        | `Intl.DateTimeFormat` for the title, weekdays and full day names; `Intl.Locale` week info for the first day, Monday where the engine has none, `first-day` overrides. Rule date-pickers/9; tests "month names, weekday names and the first weekday follow the locale", "first-day overrides the locale's first weekday". |
| Today is marked.                                                                  | met        | `aria-current="date"` and bold, accent-coloured text. Rule date-pickers/10; test "today is marked".                                                                                                                                                                                                                      |
| Mirrors under a right-to-left language.                                           | met        | Header order, chevrons and the left and right arrow keys mirror. Rule date-pickers/13; test "under rtl the month buttons and the arrow keys mirror".                                                                                                                                                                     |
| Targets are large enough for touch.                                               | met        | The day cell and month buttons use `--pl-size-lg` and `--pl-size-hit-min`, 44px on a coarse pointer. Rule date-pickers/14; test "the days and the month buttons are at least 44 by 44".                                                                                                                                  |
| Selected, today and unavailable days differ by more than colour.                  | needs eyes | Selected is filled, today is bold, unavailable is dimmed and ignores presses; forced colors fill the selection with `Highlight` and underline today. Rule date-pickers/12 is a rubric rule.                                                                                                                              |
| (Platform behavior) Date grid keys: arrows, Home, End, Page Up, Page Down, Enter. | met        | One tab stop that roves; Shift with Page Up or Down moves a year. Tests under "arrow keys", "Home and End", "Page Up and Page Down", "Enter and Space select the focused day".                                                                                                                                           |
| (Platform behavior) Focus is clearly visible; motion respects the setting.        | met        | A ring on the focused day and month buttons; forced colors use `Highlight`; transitions are off under reduced motion. Tests "the focus ring is drawn on the focused day", "nothing fades under reduced motion".                                                                                                          |

## Decisions and findings

- Only the Gregorian calendar is shown, whatever the locale's usual calendar, so the ISO value and the grid always agree (`dates.ts`).
- Days outside the month show as blank cells, not as the neighbouring month's days, so a day cannot be selected from a month it does not belong to.
- Disabled days stay focusable, so keyboard movement is the same on every day and a screen reader can reach and announce them.
- A day wider than the cell (very large text) is not handled beyond the 200% text zoom test.
- The default month buttons' labels are English; `prev-label` and `next-label` replace them.
- The calendar is a standalone single-date control; range selection, week numbers and a year or month picker are not built.

## Usage guidelines (for `docs/components.md`, not the component)

- Use a calendar for a date near today; for a distant date, let people type it (date-pickers/1).
- Set `min` and `max` rather than checking the value later.
- Pass `locale` when the page's `lang` is not the audience's.
- Provide `prev-label` and `next-label` in the page's language.
