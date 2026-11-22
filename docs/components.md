# Components

This page is generated from the code by `bun scripts/component-docs.ts`. Each component has its own import path; `import "purrlucent"` loads all of them. Examples for every component are in Storybook.

## Banner

```ts
import "purrlucent/banner";
```

### `<purr-banner>`

A notification banner: an icon, a title, a message, optional actions and a close button. It is a live region (`status`, or `alert` for the destructive tone) and never takes focus when it appears. The close button hides the banner and fires `purr-close`.

| Attribute     | Type                      | Default     | Description                                                |
| ------------- | ------------------------- | ----------- | ---------------------------------------------------------- |
| `open`        | `boolean`                 | `false`     | The banner is showing.                                     |
| `tone`        | `"info" \| "destructive"` | `"info"`    | `info` (default) or `destructive`.                         |
| `close-label` | `string`                  | `"Dismiss"` | The close button's accessible name. Defaults to "Dismiss". |

**Slots**

- `icon`: An `svg` shown as a tile. Without one, the tone draws its own: information for `info`, an error mark for `destructive`.
- `title`: The heading.
- default: The message.
- `actions`: Buttons below the message.

**Parts**

- `text`: The title and message.
- `close`: The close button.

**Events**

- `purr-close`: The user closed the banner.

## Button

```ts
import "purrlucent/button";
```

### `<purr-button>`

A button. The label is the slotted text and is required for an accessible name; an `icon` button takes an `aria-label` instead. A destructive button never takes the filled primary look. With `type="submit"` or `type="reset"` it submits or resets the form it is in; the default `button` does neither. In a dialog, `default` marks the button Return activates (not from a multi-line text field) and `cancel` the one Escape or Command-Period activates. The default button draws as primary unless it has another variant. A destructive button cannot be the default; the dialog warns.

| Attribute     | Type                              | Default       | Description                                                                                              |
| ------------- | --------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------- |
| `default`     | `boolean`                         | `false`       | The dialog's default button: Return activates it, it draws as primary and it takes initial focus.        |
| `cancel`      | `boolean`                         | `false`       | The dialog's cancel button: Escape and Command-Period activate it.                                       |
| `busy`        | `boolean`                         | `false`       | The action is running: a spinner shows before the label, the button ignores presses and stays focusable. |
| `variant`     | `PurrButtonVariant`               | `"secondary"` |                                                                                                          |
| `type`        | `"button" \| "submit" \| "reset"` | `"button"`    |                                                                                                          |
| `size`        | `PurrButtonSize`                  | `"md"`        |                                                                                                          |
| `icon`        | `boolean`                         | `false`       |                                                                                                          |
| `destructive` | `boolean`                         | `false`       |                                                                                                          |
| `disabled`    | `boolean`                         | `false`       |                                                                                                          |

**Slots**

- default: The button label, with an optional leading svg icon.

**Parts**

- `label`: The wrapper around the label.

**Events**

- `purr-press`: When the button is activated by pointer, Enter or Space.

## Checkbox

```ts
import "purrlucent/checkbox";
```

### `<purr-checkbox>`

A checkbox: a choice that is on, off or mixed. The slotted text is its label and accessible name; without it, set `aria-label`. It takes part in forms like a native checkbox: when checked it submits `name` with `value`, a form reset returns it to its `checked` and `indeterminate` attributes, and a disabled fieldset disables it. A click turns it on or off and clears mixed.

| Attribute       | Type                   | Default | Description                                                         |
| --------------- | ---------------------- | ------- | ------------------------------------------------------------------- |
| `checked`       | `boolean`              | `false` | The starting state. The `checked` property holds the current one.   |
| `indeterminate` | `boolean`              | `false` | Starts mixed. The `indeterminate` property holds the current state. |
| `name`          | `string`               | `""`    | The name submitted with a form.                                     |
| `value`         | `string`               | `"on"`  | The value submitted when checked. Defaults to `on`.                 |
| `size`          | `"md" \| "lg" \| "xl"` | `"md"`  | `md` (default), `lg` or `xl`.                                       |
| `required`      | `boolean`              | `false` | The form is invalid while the box is unchecked.                     |
| `disabled`      | `boolean`              | `false` | No focus, no feedback, nothing submitted.                           |

**Slots**

- default: The label.

**Parts**

- `box`: The drawn box.
- `label`: The wrapper around the label.

**Events**

- `purr-change`: The user changed the box. `detail.checked` holds the new state.

## Combobox

```ts
import "purrlucent/combobox";
```

### `<purr-combobox>`

A text field with a list of suggestions. It follows the editable combobox pattern with list autocomplete: a native input inside does the editing and keeps focus, the `purr-option` children are the choices, and the list shows the ones whose label matches the typed text (starting with it first, then containing it). It takes part in forms like `purr-input`: it submits `name` with `value`, a form reset returns it to the option marked `selected`, and a disabled fieldset disables it. A `slot="label"` element is a visible label that names the field; without it, `label` becomes the accessible name, and without both a native `<label for>` names it. Leaving the field with text that matches no option restores the last chosen option's label, or keeps the text as the value when `allow-custom` is set. Empty text means no value. Return with the list closed presses the form's default button, as in a text field. Once the field has been left, a required field with no value shows the validation message below it. The list is as wide as the field: a long option wraps, and a long value ends in an ellipsis.

| Attribute      | Type                   | Default        | Description                                                                                                                         |
| -------------- | ---------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `value`        | `string`               | `""`           | The chosen option's value, or the custom text.                                                                                      |
| `text`         | `string`               | `""`           | The visible text of the field.                                                                                                      |
| `name`         | `string`               | `""`           | The name submitted with a form.                                                                                                     |
| `label`        | `string`               | `""`           | The accessible name when there is no slotted label.                                                                                 |
| `placeholder`  | `string`               | `""`           | Hint shown while the field is empty.                                                                                                |
| `required`     | `boolean`              | `false`        | The form is invalid while there is no value.                                                                                        |
| `disabled`     | `boolean`              | `false`        | No focus, no list, nothing submitted.                                                                                               |
| `size`         | `"md" \| "lg" \| "xl"` | `"md"`         | `md` (default), `lg` or `xl`.                                                                                                       |
| `allow-custom` | `boolean`              | `false`        | Text that matches no option becomes the value.                                                                                      |
| `open`         | `boolean`              | `false`        | The list is showing.                                                                                                                |
| `toggle-label` | `string`               | `TOGGLE_LABEL` | The chevron button's accessible name. Defaults to "Show options", which becomes "<label>, show options" when the field has a label. |
| `empty-label`  | `string`               | `"No results"` | The text shown when no option matches. Defaults to "No results".                                                                    |
| `_active`      | `PurrOption \| null`   | `null`         |                                                                                                                                     |
| `_labelled`    | `boolean`              | `false`        |                                                                                                                                     |

**Slots**

- default: The `purr-option` children.
- `label`: The visible label.

**Parts**

- `label`: The visible label.
- `field`: The shell around the input and the button.
- `control`: The native input.
- `button`: The chevron button that toggles the list.
- `listbox`: The popup.
- `empty`: The "no results" row.
- `message`: The validation message below the field.

**Events**

- `name`:
- `purr-input`: The text changed through typing or Escape. `detail.text` holds it.
- `purr-change`: The value changed. `detail.value` holds it.

## Dialog

```ts
import "purrlucent/dialog";
```

### `<purr-dialog>`

A modal dialog. A native `<dialog>` inside opened with `showModal()` gives the top layer, the inert page, the focus trap and Escape. The `alert` variant is a compact, urgent question with an `alertdialog` role; the `sheet` variant is a larger panel with a title area, a scrolling body and a row of actions. The accessible name is the slotted title, or `label` when there is none. The description is the default slot of an alert and the `description` slot of a sheet, so a sheet's form is not read out as a description. Initial focus goes to the element with `autofocus`, otherwise the default action (a `purr-button` with `default`, unless destructive), the cancel action (`cancel`) or the first action. Return clicks the default action, except in a multi-line text field or on a focused button; Escape and Command-Period click the cancel action, and without one Escape closes the dialog. A destructive default is ignored and warned about. Focus returns to the element that had it before opening. An element inside with `data-close="value"` closes the dialog with that return value. The page cannot scroll while a dialog is open.

| Attribute     | Type                 | Default   | Description                                                            |
| ------------- | -------------------- | --------- | ---------------------------------------------------------------------- |
| `open`        | `boolean`            | `false`   | The dialog is showing. Setting it opens the dialog modally.            |
| `variant`     | `"alert" \| "sheet"` | `"sheet"` | `sheet` (default) or `alert`.                                          |
| `label`       | `string`             | `""`      | The accessible name when there is no slotted title.                    |
| `dismissible` | `boolean`            | `false`   | A sheet also closes when the backdrop is pressed. An alert never does. |
| `_scrolls`    | `boolean`            | `false`   |                                                                        |
| `_actions`    | `number`             | `0`       |                                                                        |

**Slots**

- `icon`: An `svg` shown as a tile.
- `title`: The heading.
- `description`: A short explanation under the sheet's title.
- default: The alert's message, or the sheet's scrolling body.
- `actions`: `purr-button` elements, in the order they are shown.

**Parts**

- `dialog`: The native dialog.
- `surface`: The padded panel inside it.
- `header`: The icon and title.
- `body`: The scrolling content.
- `actions`: The row or column of actions.

**Events**

- `name`:
- `purr-cancel`: Escape, or the backdrop of a dismissible sheet, asked to close. Cancelable: `preventDefault()` keeps the dialog open.
- `purr-close`: The dialog closed. `detail.returnValue` holds the value it closed with.

## Input

```ts
import "purrlucent/input";
```

### `<purr-input>`

A single-line text field. A native input inside does the editing, so typing, selection, IME, autofill and mobile keyboards behave as usual. The slotted text is a visible label; without it, `label` becomes the input's accessible name, and without both a native `<label for>` names it. It takes part in forms like a native input: it submits `name` with its value, a reset returns it to its `value` attribute, a disabled fieldset disables it, and the native validity (`required`, `pattern`, `type=email`...) is the element's validity. Enter submits the form.

| Attribute      | Type                   | Default   | Description                                                                                                                                          |
| -------------- | ---------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`         | `string`               | `"text"`  | `text` (default), `search`, `password`, `email`, `url`, `tel` or `number`. A search field gets a magnifier and a clear button, and Escape clears it. |
| `value`        | `string`               | `""`      | The starting value. The `value` property holds the current one.                                                                                      |
| `label`        | `string \| undefined`  |           | The accessible name when there is no slotted label.                                                                                                  |
| `size`         | `"md" \| "lg" \| "xl"` | `"md"`    | `md` (default), `lg` or `xl`.                                                                                                                        |
| `name`         | `string`               | `""`      | The name submitted with a form.                                                                                                                      |
| `placeholder`  | `string \| undefined`  |           | Hint shown while empty.                                                                                                                              |
| `required`     | `boolean`              | `false`   | The form is invalid while the field is empty.                                                                                                        |
| `readonly`     | `boolean`              | `false`   | The value can be selected but not edited, and a search field cannot be cleared.                                                                      |
| `disabled`     | `boolean`              | `false`   | No focus, nothing submitted.                                                                                                                         |
| `minlength`    | `string \| undefined`  |           | Shortest valid value.                                                                                                                                |
| `maxlength`    | `string \| undefined`  |           | Longest allowed value.                                                                                                                               |
| `min`          | `string \| undefined`  |           | Smallest valid value of a `number` field.                                                                                                            |
| `max`          | `string \| undefined`  |           | Largest valid value of a `number` field.                                                                                                             |
| `step`         | `string \| undefined`  |           | Step of a `number` field; `any` allows decimals.                                                                                                     |
| `pattern`      | `string \| undefined`  |           | A regular expression the value must match.                                                                                                           |
| `autocomplete` | `string \| undefined`  |           | The autofill hint.                                                                                                                                   |
| `inputmode`    | `string \| undefined`  |           | The virtual keyboard hint.                                                                                                                           |
| `clear-label`  | `string`               | `"Clear"` | The clear button's accessible name. Defaults to "Clear".                                                                                             |
| `_labelled`    | `boolean`              | `false`   |                                                                                                                                                      |

**Slots**

- default: The visible label.

**Parts**

- `label`: The visible label.
- `field`: The shell around the input.
- `control`: The native input.
- `glyph`: The magnifier of a search field.
- `clear`: The clear button of a search field.
- `message`: The icon and validation message below the field while it is invalid.

**Events**

- `name`:
- `purr-input`: The value changed through editing or the clear button. `detail.value` holds it.
- `purr-change`: The value was committed (blur or Enter after an edit) or cleared. `detail.value` holds it.

## Menu

```ts
import "purrlucent/menu";
```

### `<purr-menu-item>`

One command in a `purr-menu`. Its text is the label. With `type` it becomes a checkbox or radio item; radio items in a run (no separator, label or other kind of item between them) are a group. A nested `purr-menu` in the `submenu` slot makes it open a submenu.

| Attribute     | Type                          | Default | Description                                               |
| ------------- | ----------------------------- | ------- | --------------------------------------------------------- |
| `value`       | `string`                      | `""`    | What `purr-select` reports. Defaults to the label.        |
| `type`        | `"" \| "checkbox" \| "radio"` | `""`    | `checkbox` or `radio`. Empty for a plain command.         |
| `checked`     | `boolean`                     | `false` | Checked, for a checkbox or radio item.                    |
| `disabled`    | `boolean`                     | `false` | Skipped by the keyboard and cannot be activated.          |
| `destructive` | `boolean`                     | `false` | The command deletes or discards something.                |
| `detail`      | `string`                      | `""`    | Trailing text such as a shortcut. The `detail` slot wins. |
| `indent`      | `boolean`                     | `false` | Reserves the check column. The menu sets it.              |
| `hasSubmenu`  | `boolean`                     | `false` |                                                           |

**Slots**

- default: The label.
- `icon`: A leading svg.
- `detail`: Trailing content, such as a shortcut.
- `submenu`: A nested `purr-menu`.

**Parts**

- `check`: The check mark.
- `label`: The label wrapper.
- `detail`: The trailing text wrapper.
- `chevron`: The submenu arrow.

### `<purr-menu-separator>`

A thin rule between groups of items.

### `<purr-menu-label>`

A section header inside a `purr-menu`. Its text is the heading.

### `<purr-menu>`

A menu: a list of commands that opens from a trigger (the menu button pattern), at a point (a context menu, see `showAt`) or from a parent item (a submenu, `slot="submenu"`). The items are the light-DOM children, so focus moves to them while the menu is open and returns to the trigger on close. Arrow keys move with wrap, Home and End jump, typing jumps to a label, Enter and Space activate, Escape closes one level, Tab closes all of them. Activating an item closes every level and fires `purr-select`.

| Attribute | Type      | Default | Description                      |
| --------- | --------- | ------- | -------------------------------- |
| `label`   | `string`  | `""`    | The accessible name of the menu. |
| `open`    | `boolean` | `false` | The menu is showing.             |

**Slots**

- `trigger`: A focusable control that opens the menu. It gets `aria-haspopup` and `aria-expanded`.
- default: The `purr-menu-item`, `purr-menu-separator` and `purr-menu-label` children.

**Parts**

- `menu`: The popup.

**Events**

- `purr-select`: An item was activated. `detail.value` holds its value.

## Number field

```ts
import "purrlucent/number-field";
```

### `<purr-number-field>`

A numeric field with up and down stepper buttons, following the WAI-ARIA spinbutton pattern. ArrowUp and ArrowDown step, PageUp and PageDown step ten times, Home and End go to `min` and `max` when they are set. A typed number is clamped to the range and snapped to the step grid when it is committed (blur or Enter). The stepper buttons are not tab stops, repeat while held and disable at the limits. The slotted text is a visible label; without it, `label` becomes the accessible name, and without both a native `<label for>` names it. It takes part in forms like a native input: it submits `name` with its value, a reset returns it to its `value` attribute and a disabled fieldset disables it.

| Attribute        | Type                    | Default      | Description                                                                                       |
| ---------------- | ----------------------- | ------------ | ------------------------------------------------------------------------------------------------- |
| `value`          | `number \| null`        | `null`       | The starting value; empty means no value. The `value` property holds the current number, or null. |
| `min`            | `number \| null`        | `null`       | Smallest value.                                                                                   |
| `max`            | `number \| null`        | `null`       | Largest value.                                                                                    |
| `step`           | `number`                | `1`          | The step, 1 by default. Values snap to the grid that starts at `min` (or 0).                      |
| `label`          | `string \| undefined`   |              | The accessible name when there is no slotted label.                                               |
| `name`           | `string`                | `""`         | The name submitted with a form.                                                                   |
| `size`           | `"md" \| "lg" \| "xl"`  | `"md"`       | `md` (default), `lg` or `xl`.                                                                     |
| `stepper`        | `"inside" \| "outside"` | `"inside"`   | `inside` (default) puts the stepper in the field, `outside` beside it.                            |
| `required`       | `boolean`               | `false`      | The form is invalid while the field is empty.                                                     |
| `readonly`       | `boolean`               | `false`      | The value can be selected but not changed.                                                        |
| `disabled`       | `boolean`               | `false`      | No focus, nothing submitted.                                                                      |
| `increase-label` | `string`                | `"Increase"` | The up button's accessible name. Defaults to "Increase".                                          |
| `decrease-label` | `string`                | `"Decrease"` | The down button's accessible name. Defaults to "Decrease".                                        |
| `_labelled`      | `boolean`               | `false`      |                                                                                                   |

**Slots**

- default: The visible label.

**Parts**

- `label`: The visible label.
- `group`: The field and the outside stepper.
- `field`: The shell around the input.
- `control`: The native input.
- `stepper`: The two stepper buttons.
- `increment`: The up button.
- `decrement`: The down button.
- `message`: The icon and validation message below the field while it is invalid.

**Events**

- `name`:
- `purr-input`: The value changed through typing, keys or the buttons. `detail.value` holds the number, or null while the field is empty.
- `purr-change`: The value was committed (blur, Enter, keys or buttons). `detail.value` holds it.

## Popover

```ts
import "purrlucent/popover";
```

### `<purr-popover>`

A non-modal floating panel anchored to a trigger. The trigger is any focusable control in the `trigger` slot; the element sets `aria-haspopup` and `aria-expanded` on it. The panel is a dialog named by `label`: it opens on a press of the trigger, takes focus to its first focusable content (or to itself), and closes on Escape (focus returns to the trigger), on a press outside and when focus leaves it. An arrow points at the trigger.

| Attribute   | Type                                    | Default    | Description                                                                                             |
| ----------- | --------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------- |
| `label`     | `string`                                | `""`       | The panel's accessible name. Required.                                                                  |
| `placement` | `"top" \| "bottom" \| "start" \| "end"` | `"bottom"` | Where the panel opens: `bottom` (default), `top`, `start` or `end`. It flips when the side has no room. |
| `open`      | `boolean`                               | `false`    | The panel is showing.                                                                                   |

**Slots**

- default: The panel's content.
- `trigger`: The control that opens the panel.

**Parts**

- `panel`: The floating panel.
- `arrow`: The arrow pointing at the trigger.

**Events**

- `purr-toggle`: The panel opened or closed. `detail.open` says which.

## Progress

```ts
import "purrlucent/progress";
```

### `<purr-progress>`

A progress bar. With a `value` it shows how far along the work is; without one it shows that work is going on. Name it with `label`.

| Attribute | Type                  | Default | Description                                                        |
| --------- | --------------------- | ------- | ------------------------------------------------------------------ |
| `value`   | `number \| undefined` |         | How much is done, from 0 to `max`. Leave it out for indeterminate. |
| `max`     | `number`              | `100`   | The value that means done. Defaults to 100.                        |
| `label`   | `string`              | `""`    | The accessible name.                                               |

**Parts**

- `fill`: The done part of the bar, or the moving segment when indeterminate.

## Radio group

```ts
import "purrlucent/radio-group";
```

### `<purr-radio>`

One choice in a `purr-radio-group`. The slotted text is its label and accessible name.

| Attribute  | Type                   | Default | Description                                                                              |
| ---------- | ---------------------- | ------- | ---------------------------------------------------------------------------------------- |
| `value`    | `string`               | `""`    | The value the group reports when this radio is chosen.                                   |
| `checked`  | `boolean`              | `false` | Marks the starting choice. After that the group owns it, and a form reset returns to it. |
| `disabled` | `boolean`              | `false` | This radio takes no focus and cannot be chosen. A disabled group disables all.           |
| `size`     | `"md" \| "lg" \| "xl"` | `"md"`  | `md` (default), `lg` or `xl`.                                                            |

**Slots**

- default: The label.

**Parts**

- `box`: The drawn circle.
- `label`: The wrapper around the label.

### `<purr-radio-group>`

A set of radios that offers one choice, as a native radio group does. Tab enters on the chosen radio, else on the first enabled one. Arrow keys move focus and choose, wrap, and follow the visual direction under `dir="rtl"`; Space chooses the focused radio. The group is the form control: it submits `name` with the chosen `value`, a form reset returns to the radio marked `checked`, and a disabled fieldset disables it. Always set `label`: without it the group has no accessible name.

| Attribute     | Type                         | Default      | Description                                                     |
| ------------- | ---------------------------- | ------------ | --------------------------------------------------------------- |
| `value`       | `string`                     | `""`         | The value of the chosen radio. Empty when none is.              |
| `label`       | `string`                     | `""`         | The accessible name of the group. Required.                     |
| `name`        | `string`                     | `""`         | The name submitted with a form.                                 |
| `orientation` | `"vertical" \| "horizontal"` | `"vertical"` | `vertical` (default) or `horizontal`.                           |
| `required`    | `boolean`                    | `false`      | The form is invalid while no radio is chosen.                   |
| `disabled`    | `boolean`                    | `false`      | Disables every radio: no focus, no feedback, nothing submitted. |

**Slots**

- default: `purr-radio` elements.

**Events**

- `purr-change`: The user chose a radio. `detail.selected` is a one-item array of its value.

## Select

```ts
import "purrlucent/select";
```

### `<purr-option>`

One choice in a `purr-select`. Its text is the label. The select marks the chosen option with `aria-selected`; this element does nothing alone.

| Attribute  | Type      | Default | Description                                                                |
| ---------- | --------- | ------- | -------------------------------------------------------------------------- |
| `value`    | `string`  | `""`    | What the select submits when this option is chosen. Defaults to the label. |
| `selected` | `boolean` | `false` | The select's starting choice.                                              |
| `disabled` | `boolean` | `false` | Cannot be chosen.                                                          |
| `chosen`   | `boolean` | `false` |                                                                            |

**Slots**

- default: The label.

**Parts**

- `check`: The check mark shown on the chosen option.

### `<purr-select>`

A pop-up button: shows the chosen option and opens a list to choose another. It follows the select-only combobox pattern: the trigger is a combobox and the options are real light-DOM children, so focus moves to the options while the list is open and returns to the trigger on close. It takes part in forms: it submits `name` with the chosen value, a form reset returns it to the option marked `selected`, and a disabled fieldset disables it. A `slot="label"` element is a visible label that names the trigger; without it, `label` becomes the accessible name, and without both a native `<label for>` names it.

| Attribute     | Type                   | Default | Description                                              |
| ------------- | ---------------------- | ------- | -------------------------------------------------------- |
| `value`       | `string`               | `""`    | The chosen option's value. Empty when nothing is chosen. |
| `name`        | `string`               | `""`    | The name submitted with a form.                          |
| `label`       | `string`               | `""`    | The accessible name when there is no slotted label.      |
| `placeholder` | `string`               | `""`    | Shown while nothing is chosen.                           |
| `required`    | `boolean`              | `false` | The form is invalid while nothing is chosen.             |
| `disabled`    | `boolean`              | `false` | No focus, no list, nothing submitted.                    |
| `size`        | `"md" \| "lg" \| "xl"` | `"md"`  | `md` (default), `lg` or `xl`.                            |
| `open`        | `boolean`              | `false` | The list is showing.                                     |
| `_labelled`   | `boolean`              | `false` |                                                          |

**Slots**

- default: The `purr-option` children.
- `label`: The visible label.

**Parts**

- `label`: The visible label.
- `trigger`: The combobox that shows the choice.
- `value`: The chosen label or the placeholder.
- `glyph`: The up-down arrows.
- `listbox`: The popup.

**Events**

- `purr-change`: The user chose another option. `detail.value` holds its value.

## Sidebar

```ts
import "purrlucent/sidebar";
```

### `<purr-sidebar-item>`

One entry of a `purr-sidebar`. It renders a link, or, when `expandable` is set by the sidebar because level 2 items follow it, a disclosure button. Without an `href` it renders a plain button, so an app can handle the click itself.

| Attribute    | Type                  | Default | Description                                            |
| ------------ | --------------------- | ------- | ------------------------------------------------------ |
| `href`       | `string \| undefined` |         |                                                        |
| `selected`   | `boolean`             | `false` |                                                        |
| `level`      | `SidebarLevel`        |         | 1 or 2. Any other value throws in development.         |
| `expandable` | `boolean`             | `false` | Set by the sidebar when level 2 items follow this one. |
| `expanded`   | `boolean`             | `false` |                                                        |

**Slots**

- default: The item label.
- `icon`: A leading svg icon, tinted with the accent text color.
- `detail`: Trailing muted text, such as a count.

**Parts**

- `control`: The link or disclosure button.
- `chevron`: The disclosure arrow.

**Events**

- `purr-toggle`: A disclosure button opened or closed. `detail.expanded` holds the new state.

### `<purr-sidebar-section>`

A titled group of `purr-sidebar-item` children inside a `purr-sidebar`. The group is exposed to assistive technology under its `label`, so the visible heading is not read a second time.

| Attribute | Type     | Default | Description                                       |
| --------- | -------- | ------- | ------------------------------------------------- |
| `label`   | `string` | `""`    | The heading and the accessible name of the group. |

**Slots**

- default: `purr-sidebar-item` children.

**Parts**

- `heading`: The visible heading.

### `<purr-sidebar>`

A navigation sidebar: a `nav` landmark holding `purr-sidebar-item` children, loose or grouped under `purr-sidebar-section` headings (at most two levels, and a group never reaches into the next section). A level 1 item followed by level 2 items becomes a disclosure button that shows and hides them. Every button and visible link is a tab stop. As an extra, Up and Down arrows, Home and End move among all visible items (Left and Right are not used). Space or Enter on a link selects it; Escape on a group button or inside its group closes it and focuses the button. On a narrow screen (600px or less) the sidebar collapses on its own; shown again, it fills the width. A collapse it made itself is undone when the screen widens; read the first state from `collapsed`, because `purr-collapse` can fire before a listener is attached.

| Attribute      | Type           | Default        | Description                                                                                                      |
| -------------- | -------------- | -------------- | ---------------------------------------------------------------------------------------------------------------- |
| `toggle-label` | `string`       | `TOGGLE_LABEL` | The toggle button's accessible name. Defaults to "Sidebar", which becomes "<label> sidebar" when `label` is set. |
| `label`        | `string`       | `""`           | Accessible name of the navigation landmark.                                                                      |
| `collapsed`    | `boolean`      | `false`        |                                                                                                                  |
| `size`         | `"md" \| "lg"` | `"md"`         | `md` (default) or `lg`, the larger rows.                                                                         |

**Slots**

- default: `purr-sidebar-item` and `purr-sidebar-section` children.

**Parts**

- `toggle`: The button that hides and shows the sidebar.
- `nav`: The navigation landmark.

**Events**

- `purr-collapse`: The sidebar was hidden or shown. `detail.collapsed` holds the new state.
- `purr-change`: The selected item changed. `detail.selected` is an array holding the new item.

## Slider

```ts
import "purrlucent/slider";
```

### `<purr-slider>`

A slider: one value chosen on a track, following the WAI-ARIA slider pattern. The host is the slider and its hit region. Name it with `label`. It takes part in forms: it submits `name` with its value, a form reset returns it to its `value` attribute (0 without one), and a disabled fieldset disables it.

| Attribute  | Type                   | Default | Description                                                     |
| ---------- | ---------------------- | ------- | --------------------------------------------------------------- |
| `value`    | `number`               | `0`     | The starting value. The `value` property holds the current one. |
| `min`      | `number`               | `0`     | The lowest value. Defaults to 0.                                |
| `max`      | `number`               | `100`   | The highest value. Defaults to 100.                             |
| `step`     | `number`               | `1`     | The distance between values. Defaults to 1.                     |
| `ticks`    | `number`               | `0`     | How many tick marks to draw, spread along the track.            |
| `label`    | `string`               | `""`    | The accessible name.                                            |
| `name`     | `string`               | `""`    | The name submitted with a form.                                 |
| `size`     | `"md" \| "lg" \| "xl"` | `"md"`  | `md` (default), `lg` or `xl`.                                   |
| `disabled` | `boolean`              | `false` | No focus, no input, nothing submitted.                          |

**Parts**

- `track`: The groove.
- `fill`: The part of the groove up to the thumb.
- `ticks`: The tick marks.
- `thumb`: The knob.

**Events**

- `name`:
- `purr-input`: The value changed while dragging or on a key. `detail.value` holds it.
- `purr-change`: The user committed a changed value, on release or on a key. `detail.value` holds it.

## Spinner

```ts
import "purrlucent/spinner";
```

### `<purr-spinner>`

A spinner: work is going on, with no way to tell how far along. Always give it a `label` so it has an accessible name.

| Attribute | Type                           | Default | Description                                 |
| --------- | ------------------------------ | ------- | ------------------------------------------- |
| `label`   | `string`                       | `""`    | The accessible name, for example "Loading". |
| `size`    | `"sm" \| "md" \| "lg" \| "xl"` | `"md"`  | `sm`, `md` (default), `lg` or `xl`.         |

**Parts**

- `ring`: The drawing.

## Switch

```ts
import "purrlucent/switch";
```

### `<purr-switch>`

A switch: an on/off setting that takes effect at once. The slotted text is its label and accessible name; without it, set `aria-label`. It takes part in forms like a checkbox: when on it submits `name` with `value`, a form reset returns it to its `checked` attribute, and a disabled fieldset disables it.

| Attribute  | Type                   | Default | Description                                                       |
| ---------- | ---------------------- | ------- | ----------------------------------------------------------------- |
| `checked`  | `boolean`              | `false` | The starting state. The `checked` property holds the current one. |
| `name`     | `string`               | `""`    | The name submitted with a form.                                   |
| `value`    | `string`               | `"on"`  | The value submitted when on. Defaults to `on`.                    |
| `size`     | `"md" \| "lg" \| "xl"` | `"md"`  | `md` (default), `lg` or `xl`.                                     |
| `required` | `boolean`              | `false` | The form is invalid while the switch is off.                      |
| `disabled` | `boolean`              | `false` | No focus, no feedback, nothing submitted.                         |

**Slots**

- default: The label.

**Parts**

- `track`: The groove.
- `thumb`: The knob.
- `label`: The wrapper around the label.

**Events**

- `purr-change`: The user turned the switch on or off. `detail.checked` holds the new state.

## Textarea

```ts
import "purrlucent/textarea";
```

### `<purr-textarea>`

A multi-line text field. A native textarea inside does the editing, so typing, selection, IME and mobile keyboards behave as usual. The slotted text is a visible label; without it, `label` becomes the textarea's accessible name, and without both a native `<label for>` names it. It takes part in forms like a native textarea: it submits `name` with its value, a reset returns it to its `value` attribute, a disabled fieldset disables it, and the native validity (`required`, `minlength`, `maxlength`) is the element's validity.

| Attribute     | Type                   | Default      | Description                                                                      |
| ------------- | ---------------------- | ------------ | -------------------------------------------------------------------------------- |
| `value`       | `string`               | `""`         | The starting value. The `value` property holds the current one.                  |
| `label`       | `string \| undefined`  |              | The accessible name when there is no slotted label.                              |
| `name`        | `string`               | `""`         | The name submitted with a form.                                                  |
| `placeholder` | `string \| undefined`  |              | Hint shown while empty.                                                          |
| `rows`        | `string \| undefined`  |              | The number of visible lines; without it the field is a fixed comfortable height. |
| `resize`      | `"vertical" \| "none"` | `"vertical"` | `vertical` (default) or `none`.                                                  |
| `size`        | `"md" \| "lg" \| "xl"` | `"md"`       | `md` (default), `lg` or `xl`; sets the minimum height and the inline padding.    |
| `required`    | `boolean`              | `false`      | The form is invalid while the field is empty.                                    |
| `readonly`    | `boolean`              | `false`      | The value can be selected but not edited.                                        |
| `disabled`    | `boolean`              | `false`      | No focus, nothing submitted.                                                     |
| `minlength`   | `string \| undefined`  |              | Shortest valid value.                                                            |
| `maxlength`   | `string \| undefined`  |              | Longest allowed value.                                                           |
| `_labelled`   | `boolean`              | `false`      |                                                                                  |

**Slots**

- default: The visible label.

**Parts**

- `label`: The visible label.
- `field`: The shell around the textarea.
- `control`: The native textarea.
- `message`: The icon and validation message below the field while it is invalid.

**Events**

- `name`:
- `purr-input`: The value changed through editing. `detail.value` holds it.
- `purr-change`: The value was committed (blur after an edit). `detail.value` holds it.

## Toggle

```ts
import "purrlucent/toggle";
```

### `<purr-toggle>`

A button that holds an on or off state, announced as `aria-pressed`. It is a `purr-button`, so size, `icon`, `disabled`, the slotted label and the leading svg icon work the same; an `icon` toggle needs an `aria-label`. The button's `variant`, `type` and `destructive` have no use here.

| Attribute     | Type                              | Default       | Description                                                                                              |
| ------------- | --------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------- |
| `pressed`     | `boolean`                         | `false`       |                                                                                                          |
| `default`     | `boolean`                         | `false`       | The dialog's default button: Return activates it, it draws as primary and it takes initial focus.        |
| `cancel`      | `boolean`                         | `false`       | The dialog's cancel button: Escape and Command-Period activate it.                                       |
| `busy`        | `boolean`                         | `false`       | The action is running: a spinner shows before the label, the button ignores presses and stays focusable. |
| `variant`     | `PurrButtonVariant`               | `"secondary"` |                                                                                                          |
| `type`        | `"button" \| "submit" \| "reset"` | `"button"`    |                                                                                                          |
| `size`        | `PurrButtonSize`                  | `"md"`        |                                                                                                          |
| `icon`        | `boolean`                         | `false`       |                                                                                                          |
| `destructive` | `boolean`                         | `false`       |                                                                                                          |
| `disabled`    | `boolean`                         | `false`       |                                                                                                          |

**Slots**

- default: The label, with an optional leading svg icon (filled while on).

**Parts**

- `label`: The wrapper around the label.

**Events**

- `purr-change`: A press changed the state. `detail.pressed` holds the new one.
- `purr-press`: When the button is activated by pointer, Enter or Space.

## Toggle group

```ts
import "purrlucent/toggle-group";
```

### `<purr-toggle-group-item>`

One choice in a `purr-toggle-group`. The slot holds its text label.

| Attribute  | Type      | Default | Description                                                                     |
| ---------- | --------- | ------- | ------------------------------------------------------------------------------- |
| `value`    | `string`  | `""`    | The value the group reports when this item is selected.                         |
| `selected` | `boolean` | `false` | Marks the starting selection. After that the group owns it.                     |
| `disabled` | `boolean` | `false` | This item takes no focus and cannot be selected. A disabled group disables all. |

**Slots**

- default: The item's text label.

**Parts**

- `label`: The wrapper around the label.

### `<purr-toggle-group>`

A row of equal-width items that offers one required choice, as a radio group. Arrow keys, Home and End move focus and select; they follow the visual direction under `dir="rtl"`. Space, Tab and the arrows follow the APG radio group pattern; Home and End are extras. Enter does not select, as with a native radio. Always set `label` (or `aria-label`): without either the group has no accessible name. It takes part in forms like a radio group: it submits `name` with the selected value, a form reset returns it to its starting selection, and a disabled fieldset disables it.

| Attribute  | Type                   | Default | Description                                                                                                                                   |
| ---------- | ---------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`    | `string`               | `""`    | The value of the selected item. Defaults to the item marked `selected`, else the first.                                                       |
| `name`     | `string`               | `""`    | The name submitted with a form.                                                                                                               |
| `label`    | `string`               | `""`    | The accessible name of the group.                                                                                                             |
| `size`     | `"md" \| "lg" \| "xl"` | `"md"`  | `md` (default), `lg` or `xl`.                                                                                                                 |
| `disabled` | `boolean`              | `false` | Disables the whole group: no focus, no feedback, nothing submitted. To disable one item, set `disabled` on that item; arrows and Tab skip it. |

**Slots**

- default: `purr-toggle-group-item` elements.

**Events**

- `purr-change`: The selection changed by the user. `detail.selected` is a one-item array.

## Toolbar

```ts
import "purrlucent/toolbar";
```

### `<purr-toolbar-separator>`

A thin rule between related controls. It is not a tab stop.

### `<purr-toolbar-title>`

The title of the window or document a toolbar belongs to, with an optional subtitle. It is text, not a control, and not a tab stop.

| Attribute    | Type      | Default | Description |
| ------------ | --------- | ------- | ----------- |
| `_subtitled` | `boolean` | `false` |             |

**Slots**

- default: The title.
- `subtitle`: Secondary text under the title; beside it in a compact toolbar.

### `<purr-toolbar-group>`

Related symbol items, such as icon-only buttons with an `aria-label`, on one shared face.

**Slots**

- default: The items.

### `<purr-toolbar>`

A bar of controls with one tab stop and arrow-key navigation. A `<purr-input type="search">` takes the toolbar's material; give it the `size` of the toolbar. Inside it the caret keys edit the text, and an arrow at the edge of the text moves on to the next item.

| Attribute  | Type           | Default | Description                                                            |
| ---------- | -------------- | ------- | ---------------------------------------------------------------------- |
| `label`    | `string`       | `""`    | Accessible name. Required.                                             |
| `scrolled` | `boolean`      | `false` | Set while content is scrolled beneath the bar; shows the scroll edge.  |
| `size`     | `"md" \| "xl"` | `"xl"`  | `xl` (default) or the compact `md`. Give the controls the same `size`. |

**Slots**

- default: Controls, `purr-toolbar-group`s, `purr-toolbar-separator`s and a `purr-toolbar-title`. At most one control may be prominent (`variant="primary"`), and it goes last.

**Parts**

- `items`: The row that lays out the slotted controls.

## Tooltip

```ts
import "purrlucent/tooltip";
```

### `<purr-tooltip>`

Shows `text` in a small bubble beside its content (the target): after a delay on hover, at once on keyboard focus. It hides on pointer leave, blur, Escape and a press, and the pointer can move onto the bubble without hiding it. It never shows for touch, so a tap always reaches the target. The bubble is a `role="tooltip"` element that the tooltip adds to its own children, so the target can name it in `aria-describedby`: an id reference cannot reach into a shadow root.

| Attribute   | Type                                    | Default    | Description                                                                      |
| ----------- | --------------------------------------- | ---------- | -------------------------------------------------------------------------------- |
| `text`      | `string`                                | `""`       | What the bubble says. Required.                                                  |
| `placement` | `"top" \| "bottom" \| "start" \| "end"` | `"bottom"` | `bottom` (default), `top`, `start` or `end`. It flips when the side has no room. |
| `shown`     | `boolean`                               | `false`    |                                                                                  |

**Slots**

- default: The target: a control, or anything the pointer or focus can reach.

**Parts**

- `bubble`: The floating box. Invisible: its padding is the gap to the target.
- `face`: The visible bubble.
