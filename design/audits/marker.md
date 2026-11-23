# HIG audit: marker

Source: [HIG Progress indicators](https://developer.apple.com/design/human-interface-guidelines/progress-indicators), [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility), [Right to left](https://developer.apple.com/design/human-interface-guidelines/right-to-left). Code: `src/components/marker/`, `src/typography/typography.css.ts`.

Verdicts: **met**, **gap**, **deviation** (deliberate, with a reason), or **needs eyes** (a visual judgement for the maintainer). Rows marked "not stated on the HIG page" are web platform behavior. Nothing was run for this audit; the verdicts come from reading the source, stories and e2e files.

## Library guidelines

| Guideline                                                                            | Verdict    | Evidence                                                                                                                              |
| ------------------------------------------------------------------------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Work of unknown length shows an indeterminate indicator; the marker takes a spinner. | met        | The `icon` slot holds a `pl-spinner` (`marker.stories.ts` Status).                                                                    |
| Motion stops when people ask for less.                                               | met        | The shimmer is plain text under reduced motion (`typography.css.ts`). E2E: "under reduced motion the shimmer is plain text".          |
| Layout mirrors in right-to-left, and the sweep follows reading direction.            | met        | Flex layout, logical properties, `:dir(rtl)` reverses the sweep. E2E: "under rtl the icon sits at the right edge", shimmer direction. |
| Decorative images are hidden from assistive technology.                              | met        | The icon wrapper is `aria-hidden`. E2E: "the icon is hidden from assistive technology".                                               |
| Text is not cut off at larger text sizes.                                            | met        | `overflow-wrap: anywhere`, `min-inline-size: 0`. E2E: "long text wraps without horizontal overflow at 200% text zoom".                |
| Touch targets are at least 44 by 44 points.                                          | met        | The link or button uses `--pl-size-hit-min`. E2E: coarse pointer tests. A plain marker is not a control.                              |
| (Platform behavior) A labelled divider is read, not skipped.                         | met        | The separator variant has no `separator` role. E2E: "the separator has no separator role and its label is read".                      |
| (Platform behavior) The shimmer does not hide text under forced colors.              | met        | Shimmer is dropped under forced colors. E2E: "under forced colors the shimmer is plain text".                                         |
| (Platform behavior) Contrast of shimmering text.                                     | needs eyes | The sweep dims a band to 40% of the text color; the base is the full muted color. Axe is checked with the shimmer stopped.            |
| (Platform behavior) Announcing progress.                                             | deviation  | No default role; apps set `role="status"` on live rows so a stream of rows does not all become live regions.                          |

## Usage guidelines (for `docs/components.md`, not the component)

- Set `role="status"` on one row that reports live progress, not on every marker.
- Give an icon-only marker no accessible name through the icon; add text.
- Do not set `role="separator"` on a separator marker.
- Listen for `click` on a marker with `interactive`; there is no `pl-` event.

## Not verified

- No test, Storybook or browser was run.
- The shimmer was not compared with a native one.
