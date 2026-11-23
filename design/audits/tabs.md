# HIG audit: tabs

Source: HIG Tab views (https://developer.apple.com/design/human-interface-guidelines/tab-views). The page could not be fetched when this was written, so the rules in `hig/rules/tab-views.yaml` come from general knowledge of the guidance and are **unverified**; re-read the page before relying on them. Code: `src/components/tabs/`, `src/behaviors/roving-focus.ts`, `src/behaviors/pressable.ts`.

Verdicts: **met**, **gap**, **deviation** (deliberate, with a reason), or **needs eyes** (a visual judgement for the maintainer).

## Library guidelines

| Guideline                                                               | Verdict    | Evidence                                                                                                                                                                                       |
| ----------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| One pane of several is shown at a time, in the same area (tab-views/1). | met        | `pl-tabs` hides every `pl-tab-panel` but the one whose `value` matches (`tabs.ts`, `updated`). Test: "a click selects a tab and shows only its panel".                                         |
| The selected tab is clearly marked (tab-views/2).                       | needs eyes | An indicator line on the shared edge plus the accent text color (`tabs.css.ts`), so selection is not color alone. Forced colors paint `Highlight` (test: "stays visible under forced colors"). |
| Tabs expose roles, one tab stop and arrow keys (tab-views/5).           | met        | `role="tablist"`, `tab`, `tabpanel`; roving focus with wrap, Home and End; automatic activation; `:dir(rtl)` mirrors the arrows. Vertical tabs use Up and Down.                                |
| Platform behavior (not stated on HIG): a disabled tab is skipped.       | met        | The roving items exclude disabled tabs; no tab stop, no `pl-change` (test: "a disabled tab is skipped by arrows and ignores clicks").                                                          |
| Platform behavior (not stated on HIG): touch targets.                   | met        | Tabs use `--pl-size-md`, 44px under a coarse pointer (test: "a coarse pointer keeps each tab at 44 by 44").                                                                                    |
| Reduced motion.                                                         | met        | The indicator fades with `--pl-duration`, which is 0s under reduced motion (test: "the indicator does not animate under reduced motion").                                                      |

## Usage guidelines (for `docs/components.md`, not the component)

- Short noun labels and a small number of tabs (tab-views/3). The tab list scrolls when it overflows; the component does not enforce a count.
- Tabs switch the panels of one view. To pick a value or mode, use a toggle group (a segmented control); for the sections of an app, use a sidebar (tab-views/4).
- Always set `label` (or `aria-label`) on `pl-tabs`.

## Findings outside HIG

- Tabs are not form-associated and submit nothing; they still fire native `input` and `change` after `pl-change`, so React's `onChange` sees a user's choice.
- Each tab sets `slot="tab"` on itself, so authors write `pl-tab` and `pl-tab-panel` as plain siblings inside `pl-tabs`.
- Panels are hidden with `hidden`, not removed, so their state survives a switch.
- The panel is a tab stop (`tabindex="0"`), as the APG tabs pattern advises when a panel may have no focusable content.
