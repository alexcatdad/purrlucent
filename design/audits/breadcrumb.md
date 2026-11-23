# HIG audit: breadcrumb

Source: [HIG Path controls](https://developer.apple.com/design/human-interface-guidelines/path-controls), read 2026-11-23. Code: `src/components/breadcrumb/`, `hig/rules/path-controls.yaml`.

`pl-breadcrumb` is the standard-style path control for web navigation. The HIG page describes file-system paths on macOS only; the web trail is a generalization. Verdicts: **met**, **deviation** (deliberate, with a reason), **needs eyes**.

| Guideline (HIG wording, shortened)                                        | Verdict    | Evidence                                                                                                                                                                                                                                 |
| ------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Standard style: a linear list from the root to the selected item.         | met        | An ordered list of items, root first, the last one `current` with `aria-current="page"`. E2E: "aria snapshot", "only the last item is the current page". Rule path-controls/1.                                                           |
| Each item shows an icon and a name.                                       | deviation  | Items show a name only; an icon can be slotted but gets no layout of its own. A file icon is file-system specific.                                                                                                                       |
| If too long, names between the first and last items are hidden.           | deviation  | Every name shrinks to an ellipsis and offers its full text as the title; no names are removed. The trail stays a complete list for assistive technology. E2E: "a long name is truncated and offers its full text". Rule path-controls/2. |
| Use it in the window body, not the frame; not in toolbars or status bars. | met        | Usage, documented in the class comment. Rule path-controls/3 is a rubric check.                                                                                                                                                          |
| Pop-up style: a menu of the path.                                         | needs eyes | Not built. A compact pop-up form could be composed from `pl-menu`.                                                                                                                                                                       |
| Editable: drag an item onto the control.                                  | deviation  | File-system only; not applicable to links.                                                                                                                                                                                               |
| (Platform behavior) Landmark, list, current page, hidden separators.      | met        | `role="navigation"` with a `label` (default "Breadcrumb"), an `ol`, chevrons with `aria-hidden`. E2E: "the separators are hidden from assistive technology", "virtual screen reader ...". Not stated on the HIG page.                    |
| (Platform behavior) Keyboard, hit size, focus ring.                       | met        | Each link is a tab stop at least the hit minimum tall; ring from the ring tokens. E2E: "every link is a tab stop in reading order", "a link meets the minimum hit height".                                                               |
| (Platform behavior) Right-to-left, forced colors, reduced motion.         | met        | Chevron mirrors; system colors under forced colors; transitions use duration tokens. E2E for each.                                                                                                                                       |

## Not verified

- Nothing was run in a browser; results are read from the test files, not executed.
- The truncation title repeats the name for screen readers that announce titles as descriptions; check with a real screen reader.
