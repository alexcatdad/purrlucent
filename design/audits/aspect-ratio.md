# HIG audit: aspect ratio

Source: [HIG Layout](https://developer.apple.com/design/human-interface-guidelines/layout). The HIG has no page for aspect ratio; the Layout page covers how content adapts to the space available. Code: `src/components/aspect-ratio/`, `hig/rules/layout.yaml`. Verdicts: **met**, **gap**, **deviation**, or **needs eyes**. Rows marked "not stated on the HIG page" are web behavior.

## Aspect ratio (`pl-aspect-ratio`)

| Guideline (HIG wording, shortened)                                   | Verdict    | Evidence                                                                                                                                                                                                        |
| -------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Layouts adapt to the space available; content keeps its proportions. | met        | `ratio` sets `--_ratio` (`aspect-ratio.ts:26-30`), read by CSS `aspect-ratio` on the host (`aspect-ratio.css.ts:13`). E2E: "the box keeps its ratio at any width" (`aspect-ratio.e2e.ts:18`). Rule layout/10.   |
| Media fills its frame without distortion.                            | met        | Slotted media is 100% by 100% with `object-fit: cover` (`aspect-ratio.css.ts:20-26`). E2E: "slotted media fills the box" (`aspect-ratio.e2e.ts:35`).                                                            |
| (Platform behavior) An invalid ratio is handled.                     | met        | A value that is not a number or a fraction, or is not above zero, falls back to `1` (`aspect-ratio.ts:4,28`). E2E: "a changing ratio resizes the box and a bad one falls back to 1" (`aspect-ratio.e2e.ts:45`). |
| (Platform behavior) Right-to-left.                                   | met        | The box has no directional rule; width and height do not flip. E2E: "the box keeps its ratio under rtl" (`aspect-ratio.e2e.ts:66`). Not stated on the HIG page.                                                 |
| (Platform behavior) The element adds no semantics.                   | met        | No role or label; the media carries its own name. Aria snapshot and axe in `aspect-ratio.e2e.ts:11,74`. Not stated on the HIG page.                                                                             |
| (Platform behavior) Cropping hides part of the media.                | needs eyes | `cover` crops what falls outside the ratio. Whether that hides something important is the author's call; there is no `fit` option yet.                                                                          |

## Usage guidelines

- Pick the ratio of the content, such as `16/9` for video, so little is cropped.
- Give the media an accessible name or `alt`; the box does not.

## Not verified

- Nothing was run in a browser; the e2e results above are read from the test files, not executed.
- The HIG Layout page was read as text; its images were not viewed.
