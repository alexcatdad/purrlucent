# purrlucent

## 0.3.0

### Minor Changes

- bc7d8bc: Invalid text fields show their validation message with an icon, a selected toggle gets a filled face, and each banner tone draws its own icon when none is slotted, so no state is shown by color alone.
- 786e319: A single segmented-control item can be disabled with its own `disabled` attribute: it takes no focus, arrows and Tab skip it, and it cannot be selected. A disabled group still disables every item, and the default selection skips disabled items.

### Patch Changes

- a27fff1: Enter no longer toggles a checkbox; Space does, as with a native checkbox. When a checkbox or radio label wraps, the box now stays beside the label's first line instead of centering on the whole label.
- 2f6fa42: Enter no longer toggles a switch or chooses a radio or segmented-control item; Space does, as with native controls.

## 0.2.1

### Patch Changes

- e929a1b: Checkbox and radio sizes now draw distinct boxes: 16px for `md`, 20px for `lg` and 24px for `xl`. Before, `lg` and `xl` drew the same 18px box.

## 0.2.0

### Minor Changes

- 1e1ac6a: New visual design and token set for every component.

  - Tokens: five palette colors and one spacing base (`--purr-spacing`); every other color, size and radius is calculated from them. Names follow Tailwind conventions, such as `--purr-color-foreground`, `--purr-color-muted-1` to `-5`, `--purr-size-md`, `--purr-radius` and `--purr-ring-width`. Colors are `light-dark()` pairs.
  - Button: variants `primary`, `secondary` (default), `tinted` and `ghost`; sizes `md`, `lg` and `xl`; an `icon` attribute for a round icon button. A destructive button takes the tinted look in red.
  - Toggle group: `purr-toggle-group` and `purr-toggle-group-item` replace `purr-segmented-control` and `purr-segment`. The selected item fills its whole column; a `size` attribute is added.
  - Sidebar: rows at least 32 px tall, a subtle fill on the selected row, and the toggle in a bar as tall as a toolbar.
  - Toolbar: `purr-toolbar-group` is a raised container for icon buttons; the bar height is `--purr-size-bar`.
  - Sidebar on narrow screens (600 px or less, any pointer): it collapses on its own and fires `purr-collapse`; opened again, it fills the width. A collapse it made itself is undone when the screen widens.
  - Controls are at least 44 by 44 px with a coarse pointer.

  Breaking:

  - Every token name from 0.1.0 is removed or renamed.
  - `purr-segmented-control` and `purr-segment` are removed; use `purr-toggle-group` and `purr-toggle-group-item`.
  - Button variants `plain`, `bordered` and `prominent` are removed; use `ghost`, `secondary` and `primary`.
  - The app must paint `--purr-color-background` behind the components: control fills are translucent.

### Patch Changes

- d5800a0: Input, textarea and number field take their accessible name from a native `<label for>` that points at them, when they have no slotted label and no `label` attribute.

## 0.1.0

### Minor Changes

- 48717c5: First release: design tokens, behaviors and surfaces, with the button, segmented control, toolbar and sidebar components.
