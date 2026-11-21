# purrlucent

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
