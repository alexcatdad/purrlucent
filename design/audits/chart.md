# HIG audit: chart

Source: [HIG Charts](https://developer.apple.com/design/human-interface-guidelines/charts) and [HIG Charting data](https://developer.apple.com/design/human-interface-guidelines/charting-data), read 2026-11-23 through their published data. Code: `src/components/chart/`, `hig/rules/charts.yaml`, `hig/rules/charting-data.yaml`.

Each guideline is either **library** (the component decides it) or **usage** (the app author decides it). Verdicts: **met**, **gap**, **deviation** (deliberate, with a reason), or **needs eyes** (a visual judgement for the maintainer). Nothing was run in a browser: the e2e tests cited were written, not executed.

## Library guidelines

| Guideline (HIG wording, shortened)                                        | Verdict    | Evidence                                                                                                                                                                                                                                 |
| ------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Make every chart accessible; label chart elements.                        | met        | `label` is required, becomes the host's `aria-label` and the drawing's name; a console warning fires without it. Rules charts/1, charts/2.                                                                                               |
| Describe the chart; text does not replace labels.                         | met        | `description` becomes the drawing's `<desc>`. Rule charts/3.                                                                                                                                                                             |
| Never require interaction to reveal critical information.                 | met        | A native `<table>` of the same values is always in the page, clipped until `show-table`. Rules charts/4, charting-data/2.                                                                                                                |
| Interactive charts are keyboard navigable with a logical path.            | met        | One tab stop; arrow keys, Home and End walk the points (TanStack's group-x order); Enter or Space pins the tooltip and fires `pl-select`. Rule charts/5.                                                                                 |
| Enlarge hit targets to the full plot area.                                | met        | `focus: "group-x"` with an infinite focus distance picks a category from anywhere over it. Rubric charts/6.                                                                                                                              |
| Animate changes only if helpful; do not rely on animation.                | met        | Updates animate; reduced motion builds the definition without animation, and TanStack also checks the media query. The values stay in the tooltip and table. Rule charts/7.                                                              |
| Do not rely on color alone.                                               | needs eyes | Lines carry point markers, a legend names series, the table lists values. Bars and areas of different series differ by color only; check the palette under color-blindness simulation. Rubric charts/8.                                  |
| Separate adjacent color areas.                                            | met        | Donut slices are stroked with the background (`--_slice-edge`; `Canvas` under forced colors). Grouped bars use a band gap. Rubric charts/9.                                                                                              |
| Familiar tick steps; light grid lines.                                    | met        | `nice: true` on the value axis; TanStack's grid is a 0.11-opacity line. Rubric charts/13.                                                                                                                                                |
| Colors follow appearance and increased contrast.                          | needs eyes | `--pl-chart-1..6` are `color-mix()` of the color tokens, lifted toward the text color (22%, 45% under increased contrast). Contrast of each hue against light, dark and glass surfaces needs a visual check. Rules charts/10, charts/11. |
| (Not stated on the HIG page) Forced colors.                               | met        | The palette becomes system colors, the drawing opts out of forced color adjustment so they survive, the slice edge is `Canvas`, the ring is `Highlight`. Rule charts/12.                                                                 |
| (Not stated on the HIG page) Right-to-left.                               | needs eyes | Legend and table follow `dir`. TanStack sets the SVG `direction` from its container; whether the value axis moves to the right is unconfirmed. Rule charts/14.                                                                           |
| Prefer common types; keep charts simple.                                  | met        | Bar, line, area and donut only in the simple form; other charts go through `definition`. Rubric charting-data/3.                                                                                                                         |
| Keep one palette for the same data.                                       | met        | Palette order is first-seen series order, shared by drawing and legend. Rule charting-data/5.                                                                                                                                            |
| (Not stated on the HIG page) Text does not overflow at larger text sizes. | met        | Axis text size is read from the host's computed font; the table and legend wrap. Rule charting-data/6.                                                                                                                                   |

## Usage guidelines (for `docs/components.md`, not the component)

- Write the label as what is measured, for whom, over which period and in which unit; keep conclusions out of it (charts/1).
- Put a title or a one-line takeaway beside the chart in HTML (charting-data/4).
- Use the same series order and the same chart type for one dataset everywhere (charting-data/5).
- Offer `show-table`, or a table instead, when readers need exact values (charting-data/2).
- Axis text is drawn in SVG and ignores page text zoom after load; the tooltip and table follow it.

## Not verified

- Nothing was run in a browser. Hosting TanStack's element inside this shadow root was decided from its source (it reads `composedPath()`, keeps the tooltip inside the chart, and the portal extension is not used), not tested.
- The palette's contrast and color-blind separation were estimated, not measured.
