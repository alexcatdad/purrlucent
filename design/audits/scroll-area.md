# HIG audit: scroll area

Source: [HIG Scroll views](https://developer.apple.com/design/human-interface-guidelines/scroll-views), read 2026-11-23 (change log: June 8, 2026). Code: `src/components/scroll-area/`, `hig/rules/scroll-views.yaml`. Verdicts: **met**, **gap**, **deviation** (deliberate, with a reason), or **needs eyes**. Rows marked "not stated on the HIG page" are web behavior. Scroll edge effects, page-by-page scrolling, zoom and the platform sections for visionOS, watchOS, tvOS and iOS page controls do not apply to a plain scrolling region and are not audited.

## Scroll area (`pl-scroll-area`)

### Library guidelines

| Guideline (HIG wording, shortened)                                                   | Verdict    | Evidence                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------------------------------------ | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Support default scrolling gestures and keyboard shortcuts.                           | met        | The host is the scroller: `overflow: auto` (`scroll-area.css.ts:22-33`); no transforms. E2E: "scrolling is native and the content is not moved by a transform" (`scroll-area.e2e.ts:67`). Rule scroll-views/1.                                                                                  |
| The keyboard can scroll the region.                                                  | met        | An overflowing region with no focusable content gets `tabindex="0"` (`scroll-area.ts:69-84`). E2E: "the keyboard scrolls the focused region" (`scroll-area.e2e.ts:51`), "an overflowing region without focusable content takes a tab stop" (`scroll-area.e2e.ts:27`). Rules scroll-views/2, /3. |
| (Platform behavior) A region that fits, or holds controls, is not an extra tab stop. | met        | `needsStop` needs overflow and no focusable descendant (`scroll-area.ts:74-76`). E2E at `scroll-area.e2e.ts:34,39,46`. Not stated on the HIG page.                                                                                                                                              |
| macOS: small scroll bars suit tight spaces.                                          | met        | `scrollbar-width: thin`, colors from `--pl-color-thumb` and `--pl-color-track` (`scroll-area.css.ts:13-14`). E2E: "the scrollbar is thin" (`scroll-area.e2e.ts:84`). Rule scroll-views/4.                                                                                                       |
| Make it apparent when content is scrollable.                                         | needs eyes | A thin bar shows on classic-scrollbar systems; overlay scrollbars hide until scrolled, so the author should cut content at the edge. Rule scroll-views/5 is a rubric check.                                                                                                                     |
| (Platform behavior) Named region.                                                    | met        | `label` sets `role="region"` and `aria-label` (`scroll-area.ts:59-65`); without a label there is no role. E2E at `scroll-area.e2e.ts:20,124`. Not stated on the HIG page.                                                                                                                       |
| (Platform behavior) Focus is visible.                                                | met        | `:host(:focus-visible)` draws the ring from `--pl-color-ring` (`scroll-area.css.ts:35-38`). E2E: "the focused region shows a ring" (`scroll-area.e2e.ts:106`).                                                                                                                                  |
| (Platform behavior) Horizontal and both-axis regions.                                | met        | `orientation` is `vertical`, `horizontal` or `both` (`scroll-area.css.ts:22-33`). E2E at `scroll-area.e2e.ts:93`.                                                                                                                                                                               |
| (Platform behavior) Content added later is noticed.                                  | met        | A `ResizeObserver` on the host and the content wrapper, and a `MutationObserver` on the subtree, re-check the tab stop (`scroll-area.ts:30-31,42-45`). E2E at `scroll-area.e2e.ts:46`.                                                                                                          |
| (Platform behavior) Increased contrast and forced colors.                            | met        | The thumb takes `--pl-color-input-border` under `prefers-contrast: more`; forced colors use the system scrollbar (`scroll-area.css.ts:45-55`).                                                                                                                                                  |
| (Platform behavior) Hit size of the bar.                                             | deviation  | The native thin bar is narrower than `--pl-size-hit-min`. The bar is the browser's own; the region itself is scrollable by wheel, touch and keys, so the bar is not the only way. Firefox and Chromium size `thin` bars themselves.                                                             |

### Usage guidelines (for `docs/components.md`, not the component)

- Give the region a size, such as `block-size` or `max-block-size`; without one it grows with its content and never scrolls.
- Do not nest scroll areas with the same orientation (scroll-views/6).
- Scroll selected or searched content into view with `scrollIntoView({ block: "nearest" })` so it moves only as far as needed (scroll-views/7).

## Not verified

- Nothing was run in a browser; the e2e results above are read from the test files, not executed.
- Thumb contrast against the track was not measured.
- The HIG page text was read through its published JSON on 2026-11-23; its images were not viewed.
