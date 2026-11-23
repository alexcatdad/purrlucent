# HIG audit: pagination

Source: [HIG Page controls](https://developer.apple.com/design/human-interface-guidelines/page-controls), read 2026-11-23. The HIG has no page for numbered web pagination; page controls are the nearest page, and its principles apply to ordered pages. Code: `src/components/pagination/`, `hig/rules/page-controls.yaml`.

Each guideline is either **library** (the component decides it) or **usage** (the app author decides it, so it belongs in the docs). Verdicts: **met**, **gap**, **deviation** (deliberate, with a reason), or **needs eyes** (a visual judgement for the maintainer). Rows marked "not stated on the HIG page" are platform or web behavior the page implies.

## Library guidelines

| Guideline (HIG wording, shortened)                                              | Verdict    | Evidence                                                                                                                                                                                        |
| ------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Keep the number of indicators small; many are hard to count at a glance.        | met        | `pageItems` shows at most seven items, with ellipses for the pages left out (`pages.ts`); tested by "a long range stays seven items wide with ellipses" and `pages.test.ts`.                    |
| The current page is clearly highlighted.                                        | met        | The current page takes the selected fill and `aria-current="page"` (`pagination.css.ts`); under forced colors it paints `Highlight` (e2e "the current page stays visible under forced colors"). |
| The current-page mark must not depend on color alone (not stated; WCAG 1.4.1).  | needs eyes | Fill plus text color change; the weight does not change. Increased contrast adds the boundary stroke. Whether that reads in the default theme is visual.                                        |
| Page controls do not support text; indicators are simple (HIG page controls).   | deviation  | Web pagination shows page numbers, since people jump to a known page; the arrows are plain chevrons. Dots would not give a page address or a name.                                              |
| Center the control near the bottom of the view.                                 | deviation  | The component does not place itself: it is a block that the app positions. Noted in usage.                                                                                                      |
| Support tapping (not stated on the HIG page for the web).                       | met        | Each control is at least the touch minimum under a coarse pointer (`--pl-size-hit-min`); tested at 44 by 44.                                                                                    |
| Platform behavior (not stated): a landmark with a name, previous and next ends. | met        | The host is a `navigation` named by `label`; Previous is disabled on the first page, Next on the last (e2e tests of the same names).                                                            |
| Platform behavior (not stated): pages can be real links.                        | met        | `href-template` renders anchors; a plain click fires `pl-change`, a click with a modifier key changes nothing so "open in new tab" works.                                                       |
| Platform behavior (not stated): focus survives a change.                        | met        | After a change, focus moves to the current page, or stays on Previous or Next while they are enabled (`pagination.ts`, e2e "Previous and Next step one page ...").                              |
| Platform behavior (not stated): right-to-left mirrors the row and arrows.       | met        | Flex order follows direction; `:dir(rtl)` mirrors the chevrons (`pagination.css.ts`); e2e "under rtl the first page is at the right edge".                                                      |
| Motion.                                                                         | met        | Only a background fade, set to 0s under reduced motion by the duration tokens and `transition: none` under forced colors.                                                                       |

## Usage guidelines (for `docs/components.md`, not the component)

- Use it only for movement through an ordered list of pages. For a few peer views use a toggle group; for hierarchy use a sidebar (page-controls/1).
- Give each pagination on a page its own `label`.
- With more than about ten peer pages, consider a different arrangement (page-controls/3).
- Place the control where people can always find it, for example centered below the content.
- Set `href-template` when each page should have an address; handle `pl-change` to load the page in an app.

## Findings outside HIG

- Page buttons are named by their number alone; a localized "Page 3" name is not offered. `previous-label` and `next-label` set the arrow names.
- The component is not form-associated: the page is navigation state, not a field value. It still fires native `input` and `change`.
