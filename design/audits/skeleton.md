# HIG audit: skeleton

Source: [HIG Loading](https://developer.apple.com/design/human-interface-guidelines/loading), read 2026-11-23 (no change log on the page). Code: `src/components/skeleton/`, `hig/rules/loading.yaml`. Related: [HIG Progress indicators](https://developer.apple.com/design/human-interface-guidelines/progress-indicators), audited in `progress-spinner.md`.

Each guideline is either **library** (the component decides it) or **usage** (the app author decides it). Verdicts: **met**, **gap**, **deviation** (deliberate, with a reason), or **needs eyes** (a visual judgement for the maintainer). Rows marked "not stated on the HIG page" are platform behavior the page implies. Nothing was run: the e2e tests cited were read, not executed.

## Library guidelines

| Guideline (HIG wording, shortened)                                            | Verdict    | Evidence                                                                                                                                                                                                                       |
| ----------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Show something as soon as possible; a blank screen can look broken.           | met        | The element is a block with a default size and a fill from `--pl-color-muted-1` (`skeleton.css.ts:9-15`). E2E: "a placeholder takes up space before content arrives". Rule loading/6.                                          |
| Replace the placeholder as content becomes available.                         | met        | The app removes the element; `LoadingRegion` and `Loaded` stories show the swap. Rule loading/7 is a rubric check.                                                                                                             |
| (Not stated on the HIG page) A placeholder is not read as content.            | met        | `aria-hidden="true"` is set on connect unless the author set the attribute (`skeleton.ts:31-34`). E2E: "a placeholder is hidden from assistive technology and the region is busy", aria snapshot.                              |
| (Not stated on the HIG page) Motion stops when the user asks for less motion. | met        | Under `prefers-reduced-motion` the band and its animation are removed (`skeleton.css.ts:60-66`). E2E: "under reduced motion the shimmer stops".                                                                                |
| (Not stated on the HIG page) The shimmer moves with the reading direction.    | met        | `:host([shimmer]:dir(rtl))` flips the gradient and reverses the sweep (`skeleton.css.ts:40-49`). E2E: "the shimmer is mirrored under rtl".                                                                                     |
| (Not stated on the HIG page) Forced colors keep the shape visible.            | met        | A `GrayText` border on `Canvas`, no gradient (`skeleton.css.ts:68-79`). E2E: "the placeholder keeps a visible border under forced colors".                                                                                     |
| (Not stated on the HIG page) Shapes.                                          | needs eyes | `rect` and `circle` only; the circle is 40px wide with a 1:1 ratio by default (`skeleton.css.ts:20-25`). Text lines are rects the app sizes. Check the fill against the page background in light, dark and increased contrast. |
| (Not stated on the HIG page) The sweep is slow and low in contrast.           | needs eyes | 1.4s a pass with `--pl-color-muted-3` as the band (`skeleton.css.ts:27-37`). Whether it reads as calm rather than busy is a visual judgement.                                                                                  |

## Usage guidelines (for `docs/components.md`, not the component)

- Put `aria-busy="true"` on the region that is loading and remove it when the content arrives; the placeholders inside are hidden (loading/6).
- Size each placeholder like the content that will replace it, so the layout does not jump (loading/7).
- When loading takes more than a moment or two, use a progress indicator as well: determinate when the duration is known, indeterminate when it is not (loading/9).
- Let people keep using the rest of the app while content loads (loading/8).

## Not verified

- The HIG loading page was read through its published data on 2026-11-23; it gives no guidance on placeholder shapes or shimmer, so those rows are platform behavior.
- Nothing was run in a browser.
