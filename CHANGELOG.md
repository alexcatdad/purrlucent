# purrlucent

## 0.6.0

### Minor Changes

- b2368a9: `purr-dialog` takes a `--purr-dialog-width` custom property that sets the width of a sheet. A sheet opened over another sheet now logs a warning; an alert over a sheet does not.
- 15b2fa2: A popover is now only as wide as its content, from a minimum that keeps the arrow clear of the corners up to the previous fixed width; longer content wraps.
- 9d61e85: A progress bar at exactly 0 now shows an empty track, and a small value still shows a visible fill. `purr-spinner` takes `value` and `max` to draw a determinate circular indicator that reports its value to assistive technology.
- cd28951: A `purr-sidebar-item` with child items and an `href` is now a link that selects, with its own disclosure button beside it. Its accessible name defaults to "<item label>, show items" and `toggle-label` on the item replaces it.
- 84a4e5b: A text field value wider than the field now ends in an ellipsis. The number field reads the locale from the closest `lang` attribute, accepts and shows that locale's decimal separator, and only lets digits, one separator and a leading minus be typed or pasted; the form still gets a plain number.
- 49f821b: Shift-click on a number field's stepper button moves ten steps, also while the button is held, like Page Up and Page Down.
- c0f1dc1: Adds `purr-toolbar-spacer` for a leading, center and trailing area in a toolbar, and a toolbar title that ends in an ellipsis instead of wrapping the bar. Exports `backGlyph` and `closeGlyph` for Back and Close buttons.

### Patch Changes

- 2d5198e: The HIG decisions that need no code are recorded in `design/decisions.md` and the component audits.
- d11024a: A select with a slotted label no longer crashes Firefox; a click on the label focuses the select.

## 0.5.0

### Minor Changes

- 8b0c33d: Escape now closes only a hover-opened submenu and keeps focus on its row; a second Escape closes the menu.
- ed4fe2e: Opening a popover, including with `show()` or the `open` property, now closes any other open popover on the page. A popover nested in another keeps its parent open.
- 1e27568: Horizontal radio groups now give every radio the width of the longest label, so the spacing between radios is even, and long labels wrap within their column.
- c990282: Clicking a sidebar row that has no link selects it, moves `aria-current` to it and fires `purr-change`, as a link row already does.
- 4b7fed8: `purr-slider` accepts `step="any"` for a continuous value. A drag is only clamped to the range, arrow keys move by a hundredth of the range and Page keys by a tenth.
- 3d7e3ad: `purr-spinner` has a small size (`size="sm"`, 16px) that fits inside a control. `purr-button` has a `busy` attribute that shows a spinner before the label and ignores presses while the button stays focusable.
- 627d15a: A toggle group segment can hold an svg icon, sized to the medium icon size. An icon-only segment is named with `aria-label`.
- d9102d9: A switch with a wrapping label keeps its track beside the label's first line. In a combobox, Return with the list closed presses the form's default button, a required field left empty shows its validation message below it, the list is as wide as the field with long options wrapping, and a long value ends in an ellipsis.

### Patch Changes

- 8147124: `purr-dialog` now warns when an alert has more than three buttons, and `purr-toolbar` warns about an item without an accessible name.

## 0.4.0

### Minor Changes

- 6cbc20a: `purr-button` takes `default` and `cancel`: in a dialog, Return activates the default button and Escape or Command-Period the cancel button, and the default draws as primary. A destructive button cannot be the default. Enter in a field that submits a form no longer also reaches the dialog.
- e48d8f6: `purr-select` and `purr-combobox` take a visible label in `slot="label"` that also names the control, like `purr-input`.
- 68ad4ed: Control labels, field text, menu items, tooltips and secondary text use the regular weight (400) instead of medium (500), as macOS controls do. Headings keep their bold weight.
- b402600: Built-in strings are translatable: validation messages use the browser's localized text, and the other labels have attributes (`toggle-label`, `empty-label`, `increase-label`, `decrease-label`, `clear-label`).

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
