# HIG audit: menubar

Source: [HIG The menu bar](https://developer.apple.com/design/human-interface-guidelines/the-menu-bar) and [HIG Menus](https://developer.apple.com/design/human-interface-guidelines/menus). The pages were not re-read for this audit; verdicts come from the source, stories and e2e files and from the WAI-ARIA menubar pattern. Code: `src/components/menubar/`, `src/components/menu/`, `src/behaviors/roving-focus.ts`, `hig/rules/the-menu-bar.yaml`. Nothing was run: no tests, no Storybook, no browser.

Verdicts: **met**, **gap**, **deviation** (deliberate, with a reason), or **needs eyes** (a visual judgement for the maintainer). Rows marked "platform behavior" come from the web platform and the ARIA pattern, not from Apple's text.

`pl-menubar` holds `pl-menu` children and reuses them unchanged: each menu keeps its trigger, items, submenus, type-ahead, dismissal and `pl-select`. The bar adds the row, the roving tab stop over the triggers, and the switch between open menus.

## Library guidelines

| Guideline                                                                       | Verdict    | Evidence                                                                                                                                                                                                                                                      |
| ------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The bar is operable from the keyboard (the-menu-bar/1).                         | met        | Roving focus over the triggers with wrap, Home and End (`menubar.ts`); Down, Up, Enter and Space open through `pl-menu`. Test "Left and Right move between the triggers with wrap; Home and End jump".                                                        |
| Sideways movement with a menu open opens the neighboring menu (the-menu-bar/2). | met        | `#onKeydown` in `menubar.ts` hides the open menu and opens the next, with wrap. Test "with a menu open, Right and Left switch to the adjacent menu and wrap".                                                                                                 |
| (Platform behavior) Left and Right in a submenu keep their submenu meaning.     | met        | `pl-menu` handles Right on a row with a submenu and Left in a submenu, and the bar skips handled events. Right in a submenu with no deeper submenu moves to the next top-level menu. Tests "Right on a row with a submenu..." and "Left inside a submenu...". |
| (Platform behavior) Escape closes the menu and returns to its trigger.          | met        | `pl-menu` dismissal; test "Escape closes the open menu and returns to its trigger".                                                                                                                                                                           |
| (Platform behavior) Arrows mirror under right-to-left.                          | met        | The bar and the roving controller read `:dir(rtl)`. Test "under rtl the arrows are mirrored".                                                                                                                                                                 |
| (Platform behavior) The bar and its triggers carry menubar semantics.           | met        | `role="menubar"` named by `label`, triggers `role="menuitem"` with `aria-haspopup` and `aria-expanded` from `pl-menu`. A missing `label` warns. Test "the bar is a named menubar of menuitem triggers that declare a menu".                                   |
| (Platform behavior) Forced colors and reduced motion.                           | met        | The bar draws only the bar material (`barSurface`, which has forced-colors and increased-contrast edges) and no motion of its own; triggers and popups own their forced-colors and fade handling. Test "the focus ring stays visible under forced colors".    |
| Menu bar titles are single short words in the standard order (the-menu-bar/3).  | met        | App author's call; rubric rule, see Usage.                                                                                                                                                                                                                    |
| A menu with no available command stays in the bar, dimmed (the-menu-bar/4).     | deviation  | A disabled trigger is dimmed and skipped by the arrows and the switch, as in `pl-toolbar`, instead of staying focusable. The ARIA pattern allows disabled items to stay focusable; not built. Test "a disabled menu is skipped by the arrows and the switch". |
| (Platform behavior) Hovering another title while a menu is open switches to it. | gap        | Not built: only the keyboard and a click switch menus. The spec lists keyboard switching only.                                                                                                                                                                |
| The bar sits at the top of the window as a flat bar.                            | needs eyes | It uses the shared bar surface with a one-row height; the stories draw it unattached to a window.                                                                                                                                                             |

## Usage guidelines (for `docs/components.md`, not the component)

- Give the bar a `label`, such as "Application".
- Use a text trigger, such as a ghost `pl-button`, for each menu; keep titles to one short word in the familiar order (the-menu-bar/3).
- Disable a menu only when nothing in it is available (the-menu-bar/4).
- Bind shortcut keys in the app; items only display them.
