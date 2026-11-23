# HIG audit: resizable (split views)

Source: [HIG Split views](https://developer.apple.com/design/human-interface-guidelines/split-views), read 2026-11-23 (change log: June 9, 2025). Code: `src/components/resizable/`, `hig/rules/split-views.yaml`.

Each guideline is either **library** (the component decides it) or **usage** (the app author decides it, so it belongs in the docs). Verdicts: **met**, **gap**, **deviation** (deliberate, with a reason), or **needs eyes** (a visual judgement for the maintainer). Rows marked "not stated on the HIG page" are platform behavior the page implies; they are checked against the WAI-ARIA window splitter pattern and the web platform, not against Apple's text. Nothing was run for this audit: no tests, no Storybook, no browser; the verdicts come from reading the source, stories and e2e files.

Components: `pl-resizable` (the group), `pl-resizable-panel`, `pl-resizable-handle` (the divider).

## Library guidelines

| Guideline (HIG wording, shortened)                                                              | Verdict   | Evidence                                                                                                                                                                                                                                                                                                  |
| ----------------------------------------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| (macOS) Panes arranged vertically, horizontally, or both; dividers drag to resize.              | met       | `orientation` is `horizontal` (side by side) or `vertical` (stacked); the group drags the divider with pointer capture (`resizable.ts`, `#onPointerDown`, `#onPointerMove`). Both together is nesting a group in a panel, not tried. Tests: drag, vertical group (rule split-views/1).                    |
| (macOS) Sensible minimum and maximum sizes so the divider stays visible.                        | met       | Panels take `min` (default 10) and `max` in percent; `resizePair` holds both neighbors within their bounds (`resizable-math.ts`). Test: "a drag stops at the limits of both panels" (rule split-views/2). The default of 10 is a choice; see Findings.                                                    |
| (macOS) Let people hide panes when it helps.                                                    | met       | `collapsible` panels collapse on Enter at the divider, and `collapsed` collapses from script; the others fill the space. The last open panel never collapses. Test: "Enter collapses a collapsible panel and restores it" (rule split-views/3).                                                           |
| (macOS) More than one way to restore a hidden pane (toolbar button, menu, shortcut).            | deviation | The library offers Enter on the divider and the `collapsed` property. The toolbar button, menu command or shortcut is the app's, wired to `collapsed`. Rule split-views/4 is a rubric rule with no test. Decided 2026-11-23.                                                                              |
| (macOS) Thin dividers (one point wide) for the most content space.                              | met       | The divider is a 1px line; its hit region is a strip centered on it, drawn over the panels (`resizable.css.ts`, `:host::before`), at least `--pl-size-hit-min` wide (24px fine pointer, 44px coarse). Tests: "thin line with a larger hit region", coarse pointer (rule split-views/5).                   |
| (macOS) A thicker divider only when a thin one is hard to tell apart.                           | deviation | No thick style. The line is `--pl-color-border` and gains contrast on hover, while dragged (selected color) and on focus. Deferred until an app needs it. Decided 2026-11-23.                                                                                                                             |
| (Platform behavior) Window splitter keys: arrows, Home, End, Enter. Not stated on the HIG page. | met       | The divider is `role="separator"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-controls` (the panel before it) and `aria-orientation`. Arrows move 1 percent, Home and End go to the smallest and largest size, Enter collapses or restores (`#onKeyDown`). Tests: keys, vertical group. |
| (Platform behavior) Right-to-left mirrors the layout and the keys. Not stated on the HIG page.  | met       | Flex direction follows `dir`; the group flips the horizontal arrow keys and the drag direction under rtl (`resizable.ts`). Test: "under rtl the first panel is at the right and the keys swap".                                                                                                           |
| (Platform behavior) Visible focus ring, also under forced colors.                               | met       | Outline on the divider (`resizable.css.ts`); forced colors use `Highlight`. Test: "shows a focus ring, also under forced colors".                                                                                                                                                                         |
| (Platform behavior) Reduced motion. Not stated on the HIG page.                                 | met       | The divider's only transition is its color; it is off under `prefers-reduced-motion` (and the duration tokens are 0). Test: "under reduced motion the divider changes color without a transition".                                                                                                        |
| (Platform behavior) A disabled divider is inert and not focusable.                              | met       | `disabled` sets `tabindex=-1`, `aria-disabled` and ignores keys and pointer. Test: "a disabled divider takes no focus and does not move".                                                                                                                                                                 |
| (Platform behavior) The dragging state is visible.                                              | met       | `:state(dragging)` colors the line with `--pl-color-selected`; forced colors use `Highlight`.                                                                                                                                                                                                             |
| (Platform behavior) Divider hit region of at least 44 points (Buttons page).                    | met       | 44px with a coarse pointer, 24px with a fine pointer (`--pl-size-hit-min`; see `design/audits/button.md`). Touch is `touch-action: none` on the divider.                                                                                                                                                  |

## Usage guidelines (for `docs/components.md`, not the component)

- Highlight the current selection in each pane that leads to a detail view (rule split-views/6).
- Consider drag and drop between panes, where the content allows it (rule split-views/7). Not part of this library.
- On iOS and iPadOS use a split view only in a regular horizontal environment, and test at narrow, compact and intermediate widths; below that, show one pane at a time (rule split-views/8). The library does not collapse panes by width.
- Give the group a definite size along its axis; it has none of its own.
- Offer a toolbar button, menu command or shortcut that sets `collapsed`, so a hidden pane is easy to restore (rule split-views/4).
- Name each divider with `label` after what it resizes ("Resize library"); the default is "Resize".
- Save the layout from `pl-resize` and restore it by setting `sizes`.
- Use `pl-sidebar` for navigation that hides and shows on its own; use a collapsible panel when the pane is content.

## Findings outside HIG

- The default `min` of 10 percent is a choice. On a narrow group 10 percent can be too small to hold content; set `min` per panel.
- A divider next to a collapsed panel is inert, and it stays visible. With a middle panel collapsed, the panels on either side cannot be resized against each other (`resizable.ts`, `#onKeyDown`). Read from the code; not run.
- `pl-resize` fires on every drag step and key press, not once on release, and is silent for changes made from script.
- The group is not a form control: it submits nothing and fires no native `input` or `change`.
- Collapse and restore are not animated; a panel appears and disappears at once.
- Both-direction layouts (a group inside a panel) are possible but untested.
