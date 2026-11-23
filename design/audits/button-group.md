# HIG audit: button-group

Source: [HIG Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons), rules in `hig/rules/buttons.yaml`. Code: `src/components/button-group/`, `src/components/button/`. The HIG Buttons page has no guideline for a joined group of buttons; the rows below are platform behavior the page implies and are unverified against Apple's own controls.

Verdicts: **met**, **gap**, **deviation** (deliberate, with a reason), or **needs eyes** (a visual judgement for the maintainer).

## Library guidelines

| Guideline                                                                                            | Verdict    | Evidence                                                                                                                                                                                                 |
| ---------------------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Every custom button has a visible pressed state (buttons/2).                                         | met        | The group wraps `pl-button` and adds nothing to its states; the face, hover and pressed states stay the button's (`button.css.ts`, `interaction.css.ts`).                                                |
| Buttons with equal weight share one size (buttons/4).                                                | deviation  | The group does not force one size; each button keeps its own `size` and `variant`. The docs say to give grouped buttons equal weight. Forcing it would take away a consumer's choice.                    |
| Each button states its purpose through an icon or label (buttons/6).                                 | met        | The group does not touch the label. An icon button needs its own `aria-label`; the Icons story and test "an icon button is named by aria-label inside the group" cover it.                               |
| Only the likeliest action is primary (buttons/8).                                                    | met        | Not changed by the group; a group of equal buttons is documented as one variant.                                                                                                                         |
| Platform behavior (not stated on HIG): related buttons read as one control.                          | met        | Buttons touch with no gap; inner edges are square, outer ends keep `--pl-radius` (`button-group.css.ts`); tested by "a horizontal group rounds only the outer ends" and "the buttons touch with no gap". |
| Platform behavior (not stated on HIG): a hairline separates joined buttons.                          | needs eyes | A 1px `--pl-color-border` line on the leading edge of every button but the first (`button-group.css.ts`). Whether it reads well on every variant and under increased contrast is visual.                 |
| Platform behavior (not stated on HIG): the group is a labeled set, not a selection.                  | met        | `role="group"` with `label` as `aria-label`; no selection state, no events (`button-group.ts`). Test: aria snapshot. For one choice use `pl-toggle-group`.                                               |
| Platform behavior (not stated on HIG): vertical stacking.                                            | met        | `orientation="vertical"` stacks the buttons and rounds the top and bottom ends; test "a vertical group stacks the buttons and rounds the top and bottom".                                                |
| Platform behavior (not stated on HIG): focus ring stays whole.                                       | met        | A focused button gets `z-index: 1` so its ring is not covered by the next button (`button-group.css.ts`); test "the focused button's ring is not covered by its neighbour".                              |
| Platform behavior (not stated on HIG): each button keeps its own tab stop; arrows do not move focus. | met        | The group adds no roving focus; this is the APG group pattern. Test "each button is its own tab stop". A toolbar is the place for arrow-key navigation.                                                  |
| Platform behavior (not stated on HIG): the layout mirrors under right-to-left.                       | met        | Flex order and logical corner radii; test "under rtl the first button is on the right"; `Rtl` story.                                                                                                     |
| Platform behavior (not stated on HIG): forced colors keep one outline.                               | met        | Each button's own 1px border overlaps its neighbour by `-1px` and the separator is hidden (`button-group.css.ts`); test "the buttons share one outline under forced colors".                             |
| Platform behavior (not stated on HIG): motion.                                                       | met        | The group has no transition or animation; the buttons' own reduced-motion handling applies.                                                                                                              |

## Usage guidelines (for `docs/components.md`, not the component)

- Group buttons only when their actions are closely related; the group is layout, not selection. For one choice from a set use a toggle group (buttons/4).
- Always set `label` (or `aria-label`); the group has no accessible name otherwise.
- Give grouped buttons one size and one variant; do not mix a primary button into a group (buttons/4, buttons/8).
- Use only `pl-button` children.

## Findings outside HIG

- The rounding uses `:first-child` and `:last-child` on slotted buttons; a non-button element slotted first or last makes the neighbour button keep square outer corners. Unverified.
- Hiding a first or last button leaves the visible edge button square on that side, because `:first-child` ignores `hidden`.
