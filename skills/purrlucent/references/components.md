# Components

This page is generated from the code by `bun scripts/component-docs.ts`. Each component has its own import path; `import "purrlucent"` loads all of them. Examples for every component are in Storybook.

## Accordion

```ts
import "purrlucent/accordion";
```

### `<pl-accordion-item>`

One section of a `pl-accordion`: a heading that holds a disclosure button, and a panel the button shows and hides. The default slot is the panel content. Give every item a `heading` (or a `heading` slot) and a `value`. A closed panel is hidden from sight and from assistive technology.

| Attribute  | Type      | Default | Description                                                                                    |
| ---------- | --------- | ------- | ---------------------------------------------------------------------------------------------- |
| `heading`  | `string`  | `""`    | The text of the disclosure button. For richer content use the `heading` slot.                  |
| `value`    | `string`  | `""`    | Identifies the item in `pl-toggle`.                                                            |
| `open`     | `boolean` | `false` | The panel is shown. The person's click changes it; set it to open or close the item from code. |
| `disabled` | `boolean` | `false` | The button takes no focus and the panel cannot be toggled. Arrow keys skip it.                 |

**Slots**

- default: The panel content.
- `heading`: Rich content for the disclosure button, instead of `heading`.

**Parts**

- `heading`: The heading element that wraps the button.
- `trigger`: The disclosure button.
- `chevron`: The disclosure arrow.
- `label`: The wrapper around the button text.
- `panel`: The region that holds the content.
- `content`: The padded content box inside the panel.

**Events**

- `pl-toggle`: The person opened or closed this item. `detail.value` is the item's value and `detail.open` the new state. It bubbles, so the accordion can listen for it.

### `<pl-accordion>`

A stack of disclosure sections: each `pl-accordion-item` is a heading with a button that shows and hides its panel. By default opening one closes the others; `multiple` lets several stay open. Enter and Space toggle the focused button. Every button is a tab stop, and, as the APG's optional extras, Up and Down move among the buttons (wrapping), Home and End go to the first and last. `level` sets the heading level of every item so the page outline stays correct.

| Attribute  | Type      | Default | Description                                                        |
| ---------- | --------- | ------- | ------------------------------------------------------------------ |
| `multiple` | `boolean` | `false` | Several items may be open at once.                                 |
| `level`    | `number`  | `3`     | The heading level, 1 to 6, of every item's heading. Defaults to 3. |

**Slots**

- default: `pl-accordion-item` elements.

**Events**

- `pl-toggle`: The person opened or closed an item. It bubbles from the item; `detail.value` is the item's value and `detail.open` the new state. In single mode the items it closes fire nothing.

## Aspect ratio

```ts
import "purrlucent/aspect-ratio";
```

### `<pl-aspect-ratio>`

A box that keeps its content at a fixed width-to-height ratio. Slotted media fills the box and is cropped to fit, never stretched.

| Attribute | Type     | Default | Description                                                                                    |
| --------- | -------- | ------- | ---------------------------------------------------------------------------------------------- |
| `ratio`   | `string` | `"1"`   | Width to height, such as `16/9` or `1.5`. Defaults to `1`. An invalid value falls back to `1`. |

**Slots**

- default: The media, such as an image, a video or a map.

## Avatar

```ts
import "purrlucent/avatar";
```

### `<pl-avatar>`

A round picture of a person. When there is no `src`, or the image fails to load, it shows the initials of `name`. With a `name` the host is an image named by it, and the picture and the initials are hidden from assistive technology so the name is read once. Without a `name` the avatar is decorative and has no role.

| Attribute | Type                               | Default     | Description                                                       |
| --------- | ---------------------------------- | ----------- | ----------------------------------------------------------------- |
| `src`     | `string`                           | `""`        | The image address.                                                |
| `name`    | `string`                           | `""`        | The person's name. It gives the accessible name and the initials. |
| `size`    | `"sm" \| "md" \| "lg" \| "xl"`     | `"md"`      | `sm`, `md` (default), `lg` or `xl`.                               |
| `_status` | `"loading" \| "loaded" \| "error"` | `"loading"` |                                                                   |

**Parts**

- `image`: The picture.
- `initials`: The fallback initials.

## Badge

```ts
import "purrlucent/badge";
```

### `<pl-badge>`

A small label for a count or a status. It is presentational and takes no focus. The text always carries the meaning, so a status badge says its status in words; the variant only adds color. Put a count in context in the surrounding text, for example "Inbox" before a badge reading "3".

| Attribute | Type                                     | Default     | Description                                     |
| --------- | ---------------------------------------- | ----------- | ----------------------------------------------- |
| `variant` | `"neutral" \| "accent" \| "destructive"` | `"neutral"` | `neutral` (default), `accent` or `destructive`. |

**Slots**

- default: The badge text.

**Parts**

- `label`: The text.

## Banner

```ts
import "purrlucent/banner";
```

### `<pl-banner>`

A notification banner: an icon, a title, a message, optional actions and a close button. It is a live region (`status`, or `alert` for the destructive tone) and never takes focus when it appears. The close button hides the banner and fires `pl-close`.

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

- `pl-close`: The user closed the banner.

## Breadcrumb

```ts
import "purrlucent/breadcrumb";
```

### `<pl-breadcrumb-item>`

One step of the trail. With an `href` it is a link; without, it is plain text. The parent `pl-breadcrumb` marks the last one `current`. A name wider than the room ends in an ellipsis and its full text becomes the title.

| Attribute | Type                  | Default | Description                                                          |
| --------- | --------------------- | ------- | -------------------------------------------------------------------- |
| `href`    | `string \| undefined` |         | Where the step leads. Without it the step is text.                   |
| `target`  | `string \| undefined` |         | Where to open the link, such as `_blank`.                            |
| `rel`     | `string \| undefined` |         | The link relationship.                                               |
| `current` | `boolean`             | `false` | The page the trail ends on. Set by `pl-breadcrumb` on the last step. |
| `_full`   | `string \| undefined` |         |                                                                      |

**Slots**

- default: The name of the step.

**Parts**

- `link`: The link, or the text of a step with no `href`.
- `separator`: The decorative chevron after the step.

### `<pl-breadcrumb>`

The path to the current page: a navigation landmark holding an ordered list of `pl-breadcrumb-item`s. The last item is the current page and carries `aria-current="page"`. The chevrons between items are decorative and hidden from assistive technology. Long trails shrink their items to ellipses, each offering its full text. Put it in the window body, not in a toolbar or status bar.

| Attribute | Type     | Default        | Description                                   |
| --------- | -------- | -------------- | --------------------------------------------- |
| `label`   | `string` | `"Breadcrumb"` | Accessible name of the landmark. Localize it. |

**Slots**

- default: The `pl-breadcrumb-item`s, the root first and the current page last.

**Parts**

- `list`: The ordered list.

## Button

```ts
import "purrlucent/button";
```

### `<pl-button>`

A button. The label is the slotted text and is required for an accessible name; an `icon` button takes an `aria-label` instead. A destructive button never takes the filled primary look. With `type="submit"` or `type="reset"` it submits or resets the form it is in; the default `button` does neither. In a dialog, `default` marks the button Return activates (not from a multi-line text field) and `cancel` the one Escape or Command-Period activates. The default button draws as primary unless it has another variant. A destructive button cannot be the default; the dialog warns.

| Attribute     | Type                              | Default       | Description                                                                                              |
| ------------- | --------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------- |
| `default`     | `boolean`                         | `false`       | The dialog's default button: Return activates it, it draws as primary and it takes initial focus.        |
| `cancel`      | `boolean`                         | `false`       | The dialog's cancel button: Escape and Command-Period activate it.                                       |
| `busy`        | `boolean`                         | `false`       | The action is running: a spinner shows before the label, the button ignores presses and stays focusable. |
| `variant`     | `PlButtonVariant`                 | `"secondary"` |                                                                                                          |
| `type`        | `"button" \| "submit" \| "reset"` | `"button"`    |                                                                                                          |
| `size`        | `PlButtonSize`                    | `"md"`        |                                                                                                          |
| `icon`        | `boolean`                         | `false`       |                                                                                                          |
| `destructive` | `boolean`                         | `false`       |                                                                                                          |
| `disabled`    | `boolean`                         | `false`       |                                                                                                          |

**Slots**

- default: The button label, with an optional leading svg icon.

**Parts**

- `label`: The wrapper around the label.

**Events**

- `pl-press`: When the button is activated by pointer, Enter or Space.

## Card

```ts
import "purrlucent/card";
```

### `<pl-card>`

A card: a grouped content surface with an optional header, content and footer. It is solid, never glass, and not interactive itself. Put controls in the `actions` or `footer` slots. A section with nothing in it is hidden.

**Slots**

- `title`: The heading of the header.
- `description`: Secondary text under the title.
- `actions`: Controls at the trailing edge of the header.
- default: The content.
- `footer`: Controls or notes below the content.

**Parts**

- `header`: The header section.
- `content`: The content section.
- `footer`: The footer section.

## Checkbox

```ts
import "purrlucent/checkbox";
```

### `<pl-checkbox>`

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

- `pl-change`: The user changed the box. `detail.checked` holds the new state.
- `input`: After pl-change, as a native checkbox fires it.
- `change`: After input, as a native checkbox fires it.

## Collapsible

```ts
import "purrlucent/collapsible";
```

### `<pl-collapsible>`

A single disclosure: a trigger that shows and hides a block of content. The trigger is a button named by the text in the `trigger` slot; it carries `aria-expanded` and `aria-controls`. Space and Enter toggle it, as on any button. The content grows and shrinks in height with `--pl-duration`; under reduced motion it shows and hides at once. Closed content is hidden from focus and assistive technology. For several disclosures that open one at a time, handle `pl-toggle` in the app.

| Attribute | Type      | Default | Description                                                                 |
| --------- | --------- | ------- | --------------------------------------------------------------------------- |
| `open`    | `boolean` | `false` | The content is showing. It reflects, so it also follows the user's presses. |

**Slots**

- default: The content the trigger shows and hides.
- `trigger`: The trigger's label: short text, optionally with an svg. Required: without it the button has no name.

**Parts**

- `trigger`: The button.
- `chevron`: The disclosure arrow.
- `content`: The wrapper around the content.

**Events**

- `pl-toggle`: The content opened or closed, by the user or by setting `open`. `detail.open` says which. It does not fire for the starting state.

## Combobox

```ts
import "purrlucent/combobox";
```

### `<pl-combobox>`

A text field with a list of suggestions. It follows the editable combobox pattern with list autocomplete: a native input inside does the editing and keeps focus, the `pl-option` children are the choices, and the list shows the ones whose label matches the typed text (starting with it first, then containing it). It takes part in forms like `pl-input`: it submits `name` with `value`, a form reset returns it to the option marked `selected`, and a disabled fieldset disables it. A `slot="label"` element is a visible label that names the field; without it, `label` becomes the accessible name, and without both a native `<label for>` names it. Leaving the field with text that matches no option restores the last chosen option's label, or keeps the text as the value when `allow-custom` is set. Empty text means no value. Return with the list closed presses the form's default button, as in a text field. Once the field has been left, a required field with no value shows the validation message below it. The list is as wide as the field: a long option wraps, and a long value ends in an ellipsis.

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
| `_active`      | `PlOption \| null`     | `null`         |                                                                                                                                     |
| `_labelled`    | `boolean`              | `false`        |                                                                                                                                     |

**Slots**

- default: The `pl-option` children.
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
- `pl-input`: The text changed through typing or Escape. `detail.text` holds it.
- `pl-change`: The value changed. `detail.value` holds it.
- `input`: After each pl-input, as a native input fires it.
- `change`: After each pl-change.

## Dialog

```ts
import "purrlucent/dialog";
```

### `<pl-dialog>`

A modal dialog. A native `<dialog>` inside opened with `showModal()` gives the top layer, the inert page, the focus trap and Escape. The `alert` variant is a compact, urgent question with an `alertdialog` role; the `sheet` variant is a larger panel with a title area, a scrolling body and a row of actions. The accessible name is the slotted title, or `label` when there is none. The description is the default slot of an alert and the `description` slot of a sheet, so a sheet's form is not read out as a description. Initial focus goes to the element with `autofocus`, otherwise the default action (a `pl-button` with `default`, unless destructive), the cancel action (`cancel`) or the first action. Return clicks the default action, except in a multi-line text field or on a focused button; Escape and Command-Period click the cancel action, and without one Escape closes the dialog. A destructive default is ignored and warned about. An alert with more than three actions is warned about and still shows them all. A sheet opened while another sheet is open is warned about and still shows; an alert over a sheet is not. Focus returns to the element that had it before opening. An element inside with `data-close="value"` closes the dialog with that return value. The page cannot scroll while a dialog is open.

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
- `actions`: `pl-button` elements, in the order they are shown.

**Parts**

- `dialog`: The native dialog.
- `surface`: The padded panel inside it.
- `header`: The icon and title.
- `body`: The scrolling content.
- `actions`: The row or column of actions.

**CSS properties**

- `--pl-dialog-width`: The width of a sheet. Defaults to 390px (97.5 spacing units) and is capped at the viewport width minus the page margin. An alert ignores it.

**Events**

- `name`:
- `pl-cancel`: Escape, or the backdrop of a dismissible sheet, asked to close. Cancelable: `preventDefault()` keeps the dialog open.
- `pl-close`: The dialog closed. `detail.returnValue` holds the value it closed with.

## Empty

```ts
import "purrlucent/empty";
```

### `<pl-empty>`

An empty state: an optional icon, a title, a description and an action. Say what is missing and offer one clear next step. It is plain content, not a live region. For work in progress use `pl-spinner`, not this.

**Slots**

- `icon`: An `svg` shown above the title. Mark it `aria-hidden="true"`.
- `title`: What is missing, for example "No projects".
- `description`: Why, or what the person can do about it.
- `action`: A button or link for the next step.

**Parts**

- `icon`: The icon tile.
- `text`: The title and description.
- `action`: The action row.

## Input

```ts
import "purrlucent/input";
```

### `<pl-input>`

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
- `pl-input`: The value changed through editing or the clear button. `detail.value` holds it.
- `pl-change`: The value was committed (blur or Enter after an edit) or cleared. `detail.value` holds it.
- `input`: After each pl-input, as a native input fires it.
- `change`: After each pl-change, as a native input fires it.

## Input group

```ts
import "purrlucent/input-group";
```

### `<pl-input-group>`

One field border and focus ring around a `pl-input` or `pl-textarea` and the addons beside it: text, an svg icon or a `pl-button`. The field keeps its own label, accessible name, value, validation and events; the group only draws the shared edge. Slot an addon as `slot="start"` or `slot="end"`; they follow the text direction. Text and icons are not focusable; a button is a tab stop before or after the field. Mark an svg icon `aria-hidden="true"`. To describe the field with addon text, give the addon an `id` and list it in the field's `aria-describedby`; the group passes that text on to the control.

**Slots**

- default: The `pl-input` or `pl-textarea`.
- `start`: An addon before the field.
- `end`: An addon after the field.

**Parts**

- `shell`: The box behind the field and addons that draws the edge, fill and ring.

## Item

```ts
import "purrlucent/item";
```

### `<pl-item>`

A list row: leading media, a title with a description, and trailing actions. With an `href` the whole row is one link and the title is its name. The row is a single tab stop; buttons in the `actions` slot stay reachable and separate.

| Attribute | Type             | Default | Description                           |
| --------- | ---------------- | ------- | ------------------------------------- |
| `href`    | `string \| null` | `null`  | Makes the row a link to this address. |
| `target`  | `string \| null` | `null`  | Where the link opens, as on `a`.      |
| `rel`     | `string \| null` | `null`  | The link's relationship, as on `a`.   |

**Slots**

- `media`: A leading icon or image. Give an image `alt=""` when the title says the same.
- `title`: The row's name. It names the link when there is an `href`.
- `description`: Secondary text under the title.
- `actions`: Trailing controls. They stay separate from the link.

**Parts**

- `link`: The link, when there is an `href`.
- `text`: The title and description.

## Kbd

```ts
import "purrlucent/kbd";
```

### `<pl-kbd>`

A key or a shortcut, shown in a keycap style. It is presentational: it takes no focus and does nothing when pressed. Write a shortcut as symbols with the modifiers in the order Control, Option, Shift, Command and the key last, for example `⌃⌥⇧⌘K`, or use one element for each key.

**Slots**

- default: The key text, for example `⌘K` or `Esc`.

**Parts**

- `key`: The `kbd` element.

## Menu

```ts
import "purrlucent/menu";
```

### `<pl-menu-item>`

One command in a `pl-menu`. Its text is the label. With `type` it becomes a checkbox or radio item; radio items in a run (no separator, label or other kind of item between them) are a group. A nested `pl-menu` in the `submenu` slot makes it open a submenu.

| Attribute     | Type                          | Default | Description                                               |
| ------------- | ----------------------------- | ------- | --------------------------------------------------------- |
| `value`       | `string`                      | `""`    | What `pl-select` reports. Defaults to the label.          |
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
- `submenu`: A nested `pl-menu`.

**Parts**

- `check`: The check mark.
- `label`: The label wrapper.
- `detail`: The trailing text wrapper.
- `chevron`: The submenu arrow.

### `<pl-menu-separator>`

A thin rule between groups of items.

### `<pl-menu-label>`

A section header inside a `pl-menu`. Its text is the heading.

### `<pl-menu>`

A menu: a list of commands that opens from a trigger (the menu button pattern), at a point (a context menu, see `showAt`) or from a parent item (a submenu, `slot="submenu"`). The items are the light-DOM children, so focus moves to them while the menu is open and returns to the trigger on close. Arrow keys move with wrap, Home and End jump, typing jumps to a label, Enter and Space activate, Escape closes one level, Tab closes all of them. Activating an item closes every level and fires `pl-select`.

| Attribute | Type      | Default | Description                      |
| --------- | --------- | ------- | -------------------------------- |
| `label`   | `string`  | `""`    | The accessible name of the menu. |
| `open`    | `boolean` | `false` | The menu is showing.             |

**Slots**

- `trigger`: A focusable control that opens the menu. It gets `aria-haspopup` and `aria-expanded`.
- default: The `pl-menu-item`, `pl-menu-separator` and `pl-menu-label` children.

**Parts**

- `menu`: The popup.

**Events**

- `pl-select`: An item was activated. `detail.value` holds its value.

## Menubar

```ts
import "purrlucent/menubar";
```

### `<pl-menubar>`

A row of menus, as at the top of an app window: each `pl-menu` child keeps its own `trigger`, items and submenus. The bar has one tab stop. Left and Right move between the triggers with wrap, and Down, Up, Enter and Space open a menu through `pl-menu`. While a menu is open, Left and Right close it and open the neighboring menu, and Escape closes it and returns to its trigger. Arrows follow the text direction. Items activate as in `pl-menu`. Each trigger is a focusable control with text, such as a `pl-button`. The bar sets `role="menuitem"` on it.

| Attribute | Type     | Default | Description                               |
| --------- | -------- | ------- | ----------------------------------------- |
| `label`   | `string` | `""`    | The accessible name of the bar. Required. |

**Slots**

- default: The `pl-menu` elements, each with a `trigger`.

**Events**

- `pl-select`: An item of one of the menus was activated. `detail.value` holds its value.

## Navigation menu

```ts
import "purrlucent/navigation-menu";
```

### `<pl-navigation-item>`

One entry of a `pl-navigation-menu`. With an `href` it is a link. With children in the `panel` slot (usually `<a slot="panel">` links) it is a disclosure button that shows and hides a panel of those links, per the disclosure navigation pattern: it is not an ARIA menu, so the links are reached with Tab and the arrow keys are not used. Escape closes the panel and returns focus to the button, as does a press outside it; Tab out of the panel closes it. A panel opens below the button, flips above it when there is no room, and never goes beyond the viewport.

| Attribute | Type                  | Default | Description                                                                                                                                                        |
| --------- | --------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `href`    | `string \| undefined` |         | The destination of a link item. Ignored when the item has a panel.                                                                                                 |
| `current` | `boolean`             | `false` | This item is, or holds, the current page: `aria-current="page"` on a link, `"true"` on a disclosure button. Mark a panel link yourself with `aria-current="page"`. |
| `open`    | `boolean`             | `false` | The panel is showing. Opening it closes the other panels in the same menu.                                                                                         |

**Slots**

- default: The item label.
- `panel`: The links of the panel. Giving the item any makes it a disclosure button.

**Parts**

- `control`: The link or the disclosure button.
- `label`: The label wrapper.
- `chevron`: The disclosure arrow.
- `panel`: The floating panel of links.

**Events**

- `pl-toggle`: The panel opened or closed. `detail.open` says which.

### `<pl-navigation-menu>`

Site navigation: a `nav` landmark holding `pl-navigation-item` children in a row. Each item is a link or a disclosure button that opens a panel of links (the APG disclosure navigation pattern, not a menu). Every link and button is a tab stop. One panel is open at a time: opening one closes the others.

| Attribute | Type     | Default | Description                                               |
| --------- | -------- | ------- | --------------------------------------------------------- |
| `label`   | `string` | `""`    | The accessible name of the navigation landmark. Required. |

**Slots**

- default: `pl-navigation-item` children.

**Parts**

- `nav`: The navigation landmark.
- `list`: The row that lays out the items.

## Number field

```ts
import "purrlucent/number-field";
```

### `<pl-number-field>`

A numeric field with up and down stepper buttons, following the WAI-ARIA spinbutton pattern. ArrowUp and ArrowDown step, PageUp and PageDown step ten times, Home and End go to `min` and `max` when they are set. Shift-click on a stepper button also steps ten times, held or not. A typed number is clamped to the range and snapped to the step grid when it is committed (blur or Enter). The stepper buttons are not tab stops, repeat while held and disable at the limits. The slotted text is a visible label; without it, `label` becomes the accessible name, and without both a native `<label for>` names it. It takes part in forms like a native input: it submits `name` with its value, a reset returns it to its `value` attribute and a disabled fieldset disables it. The field reads the locale from the closest `lang` attribute (else the document's, else the browser's). Its decimal separator is accepted when a number is typed or pasted and is shown in the committed value, so "1,5" under `lang="de"` is 1.5. Characters that cannot be part of a number there are not inserted: only digits, one separator and a leading minus. The form value and the `value` property stay plain numbers.

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
- `pl-input`: The value changed through typing, keys or the buttons. `detail.value` holds the number, or null while the field is empty.
- `pl-change`: The value was committed (blur, Enter, keys or buttons). `detail.value` holds it.
- `input`: After each pl-input, as a native input fires it.
- `change`: After each pl-change, as a native input fires it.

## Pagination

```ts
import "purrlucent/pagination";
```

### `<pl-pagination>`

Previous and next buttons and numbered pages for moving through an ordered list of pages. The first and last page always show; pages in between give way to an ellipsis, so a long range stays seven items wide. The current page is marked `aria-current="page"` and filled. The host is a `navigation` landmark named by `label`; give each pagination on a page its own `label`. Without `href-template` the items are buttons and the app reacts to `pl-change`. With it they are links, so each page has an address; `pl-change` still fires on a plain click, and a click with a modifier key (open in a new tab) changes nothing. At the first page Previous is disabled, and at the last page Next is. Use it only for pages in a sequence. For a few peer views use `pl-toggle-group`; for a large hierarchy use `pl-sidebar`.

| Attribute        | Type     | Default           | Description                                                                                 |
| ---------------- | -------- | ----------------- | ------------------------------------------------------------------------------------------- |
| `page`           | `number` | `1`               | The current page, from 1 to `total`. Defaults to 1; a value out of range is clamped.        |
| `total`          | `number` | `1`               | The number of pages. Defaults to 1.                                                         |
| `label`          | `string` | `"Pagination"`    | The accessible name of the landmark. Defaults to "Pagination".                              |
| `href-template`  | `string` | `""`              | Makes the pages links. `{page}` is replaced by the page number, as in `/posts?page={page}`. |
| `previous-label` | `string` | `"Previous page"` | The accessible name of the Previous button. Defaults to "Previous page".                    |
| `next-label`     | `string` | `"Next page"`     | The accessible name of the Next button. Defaults to "Next page".                            |

**Parts**

- `list`: The list of items.
- `previous`: The Previous button or link.
- `next`: The Next button or link.
- `page`: A page button or link.
- `current`: The current page, besides `page`.
- `gap`: An ellipsis.

**Events**

- `pl-change`: The user chose another page. `detail.page` holds it.
- `input`: After pl-change, as a native control fires it.
- `change`: After input, as a native control fires it.

## Popover

```ts
import "purrlucent/popover";
```

### `<pl-popover>`

A non-modal floating panel anchored to a trigger. The trigger is any focusable control in the `trigger` slot; the element sets `aria-haspopup` and `aria-expanded` on it. The panel is a dialog named by `label`: it opens on a press of the trigger, takes focus to its first focusable content (or to itself), and closes on Escape (focus returns to the trigger), on a press outside and when focus leaves it. An arrow points at the trigger. The panel is as wide as its content, from a minimum that keeps the arrow clear of the corners up to a maximum of `calc(var(--pl-spacing) * 45)`, and never wider than the viewport; longer content wraps.

| Attribute   | Type                                    | Default    | Description                                                                                                                                     |
| ----------- | --------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `label`     | `string`                                | `""`       | The panel's accessible name. Required.                                                                                                          |
| `placement` | `"top" \| "bottom" \| "start" \| "end"` | `"bottom"` | Where the panel opens: `bottom` (default), `top`, `start` or `end`. It flips when the side has no room.                                         |
| `open`      | `boolean`                               | `false`    | The panel is showing. Opening it closes any other open popover in the same document or shadow root, except one that holds it or sits inside it. |

**Slots**

- default: The panel's content.
- `trigger`: The control that opens the panel.

**Parts**

- `panel`: The floating panel.
- `arrow`: The arrow pointing at the trigger.

**Events**

- `pl-toggle`: The panel opened or closed. `detail.open` says which.

## Progress

```ts
import "purrlucent/progress";
```

### `<pl-progress>`

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

### `<pl-radio>`

One choice in a `pl-radio-group`. The slotted text is its label and accessible name.

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

### `<pl-radio-group>`

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

- default: `pl-radio` elements.

**Events**

- `pl-change`: The user chose a radio. `detail.selected` is a one-item array of its value.
- `input`: After pl-change, as a native radio fires it.
- `change`: After input, as a native radio fires it.

## Resizable

```ts
import "purrlucent/resizable";
```

### `<pl-resizable-handle>`

The divider between two panels of a `pl-resizable` group, following the WAI-ARIA window splitter pattern: a focusable `separator` whose value is the size of the panel before it. The group sets its `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-controls` and `aria-orientation`, and handles the pointer and the keys.

| Attribute     | Type                         | Default        | Description                                                        |
| ------------- | ---------------------------- | -------------- | ------------------------------------------------------------------ |
| `label`       | `string`                     | `""`           | The accessible name. Defaults to "Resize".                         |
| `disabled`    | `boolean`                    | `false`        | The divider cannot be moved, collapses nothing and takes no focus. |
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` |                                                                    |

### `<pl-resizable-panel>`

One pane of a `pl-resizable` group. Sizes are percentages of the group.

| Attribute     | Type                  | Default | Description                                                                                                                                                         |
| ------------- | --------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `size`        | `number \| undefined` |         | The starting size in percent. Panels without one share what the others leave. The `size` property then follows the layout, 0 while collapsed.                       |
| `min`         | `number`              | `10`    | The smallest size in percent. Defaults to 10.                                                                                                                       |
| `max`         | `number`              | `100`   | The largest size in percent. Defaults to 100.                                                                                                                       |
| `collapsible` | `boolean`             | `false` | The divider's Enter key collapses and restores the panel.                                                                                                           |
| `collapsed`   | `boolean`             | `false` | The panel is hidden and the others fill its space. Set it to collapse or restore the panel from your own button or shortcut. The last open panel does not collapse. |

**Slots**

- default: The panel's content.

### `<pl-resizable>`

Panels that people resize by dragging the dividers between them: a split view. Put `pl-resizable-panel` children in the group with a `pl-resizable-handle` between each two. Sizes are percentages that add up to 100, each held within its panel's `min` and `max`. Each divider is a window splitter (WAI-ARIA): arrow keys along the group's axis move it by one percent, Home and End move it to the smallest and largest size the panel before it may take, and Enter collapses a `collapsible` panel next to it or restores a collapsed one. A divider next to a collapsed panel moves nothing until that panel is restored. Give the group a definite size along its axis; it has none of its own.

| Attribute     | Type                         | Default        | Description                                                                  |
| ------------- | ---------------------------- | -------------- | ---------------------------------------------------------------------------- |
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | `horizontal` (default) puts the panels side by side, `vertical` stacks them. |

**Slots**

- default: `pl-resizable-panel` and `pl-resizable-handle` children.

**Events**

- `pl-resize`: A person moved a divider, or collapsed or restored a panel. `detail.sizes` holds every panel's new size in percent, in order, 0 for a collapsed panel. Setting `sizes`, `collapsed` or a panel's attributes from script fires nothing.

## Scroll area

```ts
import "purrlucent/scroll-area";
```

### `<pl-scroll-area>`

A region that scrolls its content with the browser's own scrolling: wheel, touch, trackpad and keyboard all work. The scrollbar is thin and drawn from tokens. Give it a size, such as `block-size` or `max-block-size`, so the content has something to overflow. When the content overflows and holds nothing focusable, the region takes focus so the keyboard can scroll it.

| Attribute     | Type                                   | Default      | Description                                   |
| ------------- | -------------------------------------- | ------------ | --------------------------------------------- |
| `label`       | `string`                               | `""`         | The accessible name of the region.            |
| `orientation` | `"vertical" \| "horizontal" \| "both"` | `"vertical"` | `vertical` (default), `horizontal` or `both`. |

**Slots**

- default: The content to scroll.

**Parts**

- `content`: The wrapper around the content.

## Select

```ts
import "purrlucent/select";
```

### `<pl-option>`

One choice in a `pl-select`. Its text is the label. The select marks the chosen option with `aria-selected`; this element does nothing alone.

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

### `<pl-select>`

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

- default: The `pl-option` children.
- `label`: The visible label.

**Parts**

- `label`: The visible label.
- `trigger`: The combobox that shows the choice.
- `value`: The chosen label or the placeholder.
- `glyph`: The up-down arrows.
- `listbox`: The popup.

**Events**

- `pl-change`: The user chose another option. `detail.value` holds its value.
- `input`: After pl-change, as a native select fires it.
- `change`: After input, as a native select fires it.

## Separator

```ts
import "purrlucent/separator";
```

### `<pl-separator>`

A hairline rule between groups of content. By default it is decoration and assistive technology skips it (`role="none"`). Set `semantic` when it divides content that a screen reader user should know is divided; it then has `role="separator"` and `aria-orientation`.

| Attribute     | Type                         | Default        | Description                                                                                   |
| ------------- | ---------------------------- | -------------- | --------------------------------------------------------------------------------------------- |
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | `horizontal` (default) or `vertical`. A vertical rule fills the height of a flex or grid row. |
| `semantic`    | `boolean`                    | `false`        | Expose it as a separator instead of hiding it from assistive technology.                      |

## Sidebar

```ts
import "purrlucent/sidebar";
```

### `<pl-sidebar-item>`

One entry of a `pl-sidebar`. It renders a link, or, when `expandable` is set by the sidebar because level 2 items follow it, a disclosure button. An expandable item with an `href` keeps its link, which selects like any other, and gets a separate disclosure button before it. Without an `href` an item renders a plain button; clicking it selects it, so an app can also handle the click itself.

| Attribute      | Type                  | Default | Description                                                                                                    |
| -------------- | --------------------- | ------- | -------------------------------------------------------------------------------------------------------------- |
| `toggle-label` | `string`              | `""`    | The disclosure button's accessible name when a link has one beside it. Defaults to "<item label>, show items". |
| `href`         | `string \| undefined` |         |                                                                                                                |
| `selected`     | `boolean`             | `false` |                                                                                                                |
| `level`        | `SidebarLevel`        |         | 1 or 2. Any other value throws in development.                                                                 |
| `expandable`   | `boolean`             | `false` | Set by the sidebar when level 2 items follow this one.                                                         |
| `expanded`     | `boolean`             | `false` |                                                                                                                |

**Slots**

- default: The item label.
- `icon`: A leading svg icon, tinted with the accent text color.
- `detail`: Trailing muted text, such as a count.

**Parts**

- `control`: The link or disclosure button.
- `disclosure`: The disclosure button beside a link.
- `chevron`: The disclosure arrow.

**Events**

- `pl-toggle`: A disclosure button opened or closed. `detail.expanded` holds the new state.

### `<pl-sidebar-section>`

A titled group of `pl-sidebar-item` children inside a `pl-sidebar`. The group is exposed to assistive technology under its `label`, so the visible heading is not read a second time.

| Attribute | Type     | Default | Description                                       |
| --------- | -------- | ------- | ------------------------------------------------- |
| `label`   | `string` | `""`    | The heading and the accessible name of the group. |

**Slots**

- default: `pl-sidebar-item` children.

**Parts**

- `heading`: The visible heading.

### `<pl-sidebar>`

A navigation sidebar: a `nav` landmark holding `pl-sidebar-item` children, loose or grouped under `pl-sidebar-section` headings (at most two levels, and a group never reaches into the next section). A level 1 item followed by level 2 items becomes a disclosure button that shows and hides them; with an `href` it stays a link that selects, and the disclosure button sits before it. Every button and visible link is a tab stop. As an extra, Up and Down arrows, Home and End move among all visible items (Left and Right are not used). Space or Enter on a link selects it; Escape on a group button or inside its group closes it and focuses the button. On a narrow screen (600px or less) the sidebar collapses on its own; shown again, it fills the width. A collapse it made itself is undone when the screen widens; read the first state from `collapsed`, because `pl-collapse` can fire before a listener is attached.

| Attribute      | Type           | Default        | Description                                                                                                      |
| -------------- | -------------- | -------------- | ---------------------------------------------------------------------------------------------------------------- |
| `toggle-label` | `string`       | `TOGGLE_LABEL` | The toggle button's accessible name. Defaults to "Sidebar", which becomes "<label> sidebar" when `label` is set. |
| `label`        | `string`       | `""`           | Accessible name of the navigation landmark.                                                                      |
| `collapsed`    | `boolean`      | `false`        |                                                                                                                  |
| `size`         | `"md" \| "lg"` | `"md"`         | `md` (default) or `lg`, the larger rows.                                                                         |

**Slots**

- default: `pl-sidebar-item` and `pl-sidebar-section` children.

**Parts**

- `toggle`: The button that hides and shows the sidebar.
- `nav`: The navigation landmark.

**Events**

- `pl-collapse`: The sidebar was hidden or shown. `detail.collapsed` holds the new state.
- `pl-change`: The selected item changed. `detail.selected` is an array holding the new item.

## Skeleton

```ts
import "purrlucent/skeleton";
```

### `<pl-skeleton>`

A placeholder shown in the place of content that is still loading. It is hidden from assistive technology by default, so mark the loading region itself with `aria-busy="true"` and clear it when the content arrives. Size it with `inline-size` and `block-size`. Replace it with the real content as soon as that is ready.

| Attribute | Type                 | Default  | Description                                                                 |
| --------- | -------------------- | -------- | --------------------------------------------------------------------------- |
| `shape`   | `"rect" \| "circle"` | `"rect"` | `rect` (default) or `circle`.                                               |
| `shimmer` | `boolean`            | `false`  | A light band sweeps across it. It stops when the user asks for less motion. |

## Slider

```ts
import "purrlucent/slider";
```

### `<pl-slider>`

A slider: one value chosen on a track, following the WAI-ARIA slider pattern. The host is the slider and its hit region. Name it with `label`. It takes part in forms: it submits `name` with its value, a form reset returns it to its `value` attribute (0 without one), and a disabled fieldset disables it.

| Attribute  | Type                   | Default | Description                                                                                                                                                       |
| ---------- | ---------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`    | `number`               | `0`     | The starting value. The `value` property holds the current one.                                                                                                   |
| `min`      | `number`               | `0`     | The lowest value. Defaults to 0.                                                                                                                                  |
| `max`      | `number`               | `100`   | The highest value. Defaults to 100.                                                                                                                               |
| `step`     | `number \| "any"`      | `1`     | The distance between values. Defaults to 1. `any` allows every value in the range; arrow keys then move by one hundredth of the range and Page keys by one tenth. |
| `ticks`    | `number`               | `0`     | How many tick marks to draw, spread along the track.                                                                                                              |
| `label`    | `string`               | `""`    | The accessible name.                                                                                                                                              |
| `name`     | `string`               | `""`    | The name submitted with a form.                                                                                                                                   |
| `size`     | `"md" \| "lg" \| "xl"` | `"md"`  | `md` (default), `lg` or `xl`.                                                                                                                                     |
| `disabled` | `boolean`              | `false` | No focus, no input, nothing submitted.                                                                                                                            |

**Parts**

- `track`: The groove.
- `fill`: The part of the groove up to the thumb.
- `ticks`: The tick marks.
- `thumb`: The knob.

**Events**

- `name`:
- `pl-input`: The value changed while dragging or on a key. `detail.value` holds it.
- `pl-change`: The user committed a changed value, on release or on a key. `detail.value` holds it.
- `input`: After each pl-input, as a native range input fires it.
- `change`: After each pl-change, as a native range input fires it.

## Spinner

```ts
import "purrlucent/spinner";
```

### `<pl-spinner>`

A spinner. Without a `value` it shows that work is going on, with no way to tell how far along. With a `value` it draws a clockwise arc for how much is done and stops turning. Always give it a `label` so it has an accessible name.

| Attribute | Type                           | Default | Description                                                        |
| --------- | ------------------------------ | ------- | ------------------------------------------------------------------ |
| `label`   | `string`                       | `""`    | The accessible name, for example "Loading".                        |
| `size`    | `"sm" \| "md" \| "lg" \| "xl"` | `"md"`  | `sm`, `md` (default), `lg` or `xl`.                                |
| `value`   | `number \| undefined`          |         | How much is done, from 0 to `max`. Leave it out for indeterminate. |
| `max`     | `number`                       | `100`   | The value that means done. Defaults to 100.                        |

**Parts**

- `ring`: The drawing.

## Switch

```ts
import "purrlucent/switch";
```

### `<pl-switch>`

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

- `pl-change`: The user turned the switch on or off. `detail.checked` holds the new state.
- `input`: After pl-change, as a native switch fires it.
- `change`: After input, as a native switch fires it.

## Tabs

```ts
import "purrlucent/tabs";
```

### `<pl-tab>`

One tab in a `pl-tabs`. The slot holds a short text label, optionally with an svg icon. The tab sets `slot="tab"` on itself, so it joins the tab list without the attribute. Its `value` names the `pl-tab-panel` it shows.

| Attribute  | Type      | Default | Description                                                                                     |
| ---------- | --------- | ------- | ----------------------------------------------------------------------------------------------- |
| `value`    | `string`  | `""`    | The value the tabs report when this tab is selected. Matches the `value` of one `pl-tab-panel`. |
| `disabled` | `boolean` | `false` | This tab takes no focus and cannot be selected; arrows and Tab skip it.                         |
| `selected` | `boolean` | `false` | Set by the tabs: the user chooses a tab, they do not set this.                                  |

**Slots**

- default: The tab's text label, optionally with an svg icon.

**Parts**

- `label`: The wrapper around the label.

### `<pl-tab-panel>`

The content one tab shows. It is visible only while the tab with the same `value` is selected. It is a tab stop, so a keyboard user can move from the tab into the content.

| Attribute | Type     | Default | Description                                      |
| --------- | -------- | ------- | ------------------------------------------------ |
| `value`   | `string` | `""`    | The value of the `pl-tab` that shows this panel. |

**Slots**

- default: The panel's content.

### `<pl-tabs>`

Tabs switch between panels of content in one place, as the APG tabs pattern with automatic activation: moving focus to a tab shows its panel. Tab enters on the selected tab, and the arrow keys, Home and End move between tabs and wrap. Horizontal tabs use Left and Right (mirrored under `dir="rtl"`); vertical tabs use Up and Down. Always set `label` (or `aria-label`): without either the tab list has no accessible name. Use tabs to switch between panels of one view; to pick a value, use a toggle group, and for the sections of an app use a sidebar.

| Attribute     | Type                         | Default        | Description                                                                                             |
| ------------- | ---------------------------- | -------------- | ------------------------------------------------------------------------------------------------------- |
| `value`       | `string`                     | `""`           | The value of the selected tab. Defaults to the first enabled tab; a value no tab has selects the first. |
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | `horizontal` (default) or `vertical`.                                                                   |
| `label`       | `string`                     | `""`           | The accessible name of the tab list.                                                                    |

**Slots**

- default: `pl-tab-panel` elements. `pl-tab` elements go in the tab list on their own.

**Parts**

- `list`: The tab list.
- `panels`: The wrapper around the panels.

**Events**

- `pl-change`: The user selected a tab. `detail.value` is the new value. A change to `value` from code does not fire it.
- `input`: After pl-change, as a native control fires it.
- `change`: After input, as a native control fires it.

## Textarea

```ts
import "purrlucent/textarea";
```

### `<pl-textarea>`

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
- `pl-input`: The value changed through editing. `detail.value` holds it.
- `pl-change`: The value was committed (blur after an edit). `detail.value` holds it.
- `input`: After each pl-input, as a native textarea fires it.
- `change`: After each pl-change, as a native textarea fires it.

## Toggle

```ts
import "purrlucent/toggle";
```

### `<pl-toggle>`

A button that holds an on or off state, announced as `aria-pressed`. It is a `pl-button`, so size, `icon`, `disabled`, the slotted label and the leading svg icon work the same; an `icon` toggle needs an `aria-label`. The button's `variant`, `type` and `destructive` have no use here.

| Attribute     | Type                              | Default       | Description                                                                                              |
| ------------- | --------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------- |
| `pressed`     | `boolean`                         | `false`       |                                                                                                          |
| `default`     | `boolean`                         | `false`       | The dialog's default button: Return activates it, it draws as primary and it takes initial focus.        |
| `cancel`      | `boolean`                         | `false`       | The dialog's cancel button: Escape and Command-Period activate it.                                       |
| `busy`        | `boolean`                         | `false`       | The action is running: a spinner shows before the label, the button ignores presses and stays focusable. |
| `variant`     | `PlButtonVariant`                 | `"secondary"` |                                                                                                          |
| `type`        | `"button" \| "submit" \| "reset"` | `"button"`    |                                                                                                          |
| `size`        | `PlButtonSize`                    | `"md"`        |                                                                                                          |
| `icon`        | `boolean`                         | `false`       |                                                                                                          |
| `destructive` | `boolean`                         | `false`       |                                                                                                          |
| `disabled`    | `boolean`                         | `false`       |                                                                                                          |

**Slots**

- default: The label, with an optional leading svg icon (filled while on).

**Parts**

- `label`: The wrapper around the label.

**Events**

- `pl-change`: A press changed the state. `detail.pressed` holds the new one.
- `pl-press`: When the button is activated by pointer, Enter or Space.

## Toggle group

```ts
import "purrlucent/toggle-group";
```

### `<pl-toggle-group-item>`

One choice in a `pl-toggle-group`. The slot holds a text label or an svg icon. An icon-only item needs an `aria-label` to be named; mark the svg `aria-hidden="true"`. Use text or icons in one control, not both.

| Attribute  | Type      | Default | Description                                                                     |
| ---------- | --------- | ------- | ------------------------------------------------------------------------------- |
| `value`    | `string`  | `""`    | The value the group reports when this item is selected.                         |
| `selected` | `boolean` | `false` | Marks the starting selection. After that the group owns it.                     |
| `disabled` | `boolean` | `false` | This item takes no focus and cannot be selected. A disabled group disables all. |

**Slots**

- default: The item's text label or svg icon.

**Parts**

- `label`: The wrapper around the label.

### `<pl-toggle-group>`

A row of equal-width items that offers one required choice, as a radio group. Arrow keys, Home and End move focus and select; they follow the visual direction under `dir="rtl"`. Space, Tab and the arrows follow the APG radio group pattern; Home and End are extras. Enter does not select, as with a native radio. Always set `label` (or `aria-label`): without either the group has no accessible name. It takes part in forms like a radio group: it submits `name` with the selected value, a form reset returns it to its starting selection, and a disabled fieldset disables it.

| Attribute  | Type                   | Default | Description                                                                                                                                   |
| ---------- | ---------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`    | `string`               | `""`    | The value of the selected item. Defaults to the item marked `selected`, else the first.                                                       |
| `name`     | `string`               | `""`    | The name submitted with a form.                                                                                                               |
| `label`    | `string`               | `""`    | The accessible name of the group.                                                                                                             |
| `size`     | `"md" \| "lg" \| "xl"` | `"md"`  | `md` (default), `lg` or `xl`.                                                                                                                 |
| `disabled` | `boolean`              | `false` | Disables the whole group: no focus, no feedback, nothing submitted. To disable one item, set `disabled` on that item; arrows and Tab skip it. |

**Slots**

- default: `pl-toggle-group-item` elements.

**Events**

- `pl-change`: The selection changed by the user. `detail.selected` is a one-item array.
- `input`: After pl-change, as a native radio fires it.
- `change`: After input, as a native radio fires it.

## Toolbar

```ts
import "purrlucent/toolbar";
```

### `<pl-toolbar-separator>`

A thin rule between related controls. It is not a tab stop.

### `<pl-toolbar-spacer>`

Free space between items. Items before it stay at the leading edge and items after it move to the trailing edge; two spacers leave a center area. It is not a tab stop and is hidden from assistive technology.

### `<pl-toolbar-title>`

The title of the window or document a toolbar belongs to, with an optional subtitle. It is text, not a control, and not a tab stop. A long title shrinks to at most half the bar and ends in an ellipsis; its full text is still the accessible name.

| Attribute    | Type      | Default | Description |
| ------------ | --------- | ------- | ----------- |
| `_subtitled` | `boolean` | `false` |             |

**Slots**

- default: The title.
- `subtitle`: Secondary text under the title; beside it in a compact toolbar.

### `<pl-toolbar-group>`

Related symbol items, such as icon-only buttons with an `aria-label`, on one shared face.

**Slots**

- default: The items.

### `<pl-toolbar>`

A bar of controls with one tab stop and arrow-key navigation. A `<pl-input type="search">` takes the toolbar's material; give it the `size` of the toolbar. Inside it the caret keys edit the text, and an arrow at the edge of the text moves on to the next item. For a Back or Close item, import `backGlyph` or `closeGlyph` from `purrlucent` and slot it into an icon `pl-button` with an `aria-label`. The Back chevron points left; mirror it with `scaleX(-1)` under right-to-left.

| Attribute  | Type           | Default | Description                                                            |
| ---------- | -------------- | ------- | ---------------------------------------------------------------------- |
| `label`    | `string`       | `""`    | Accessible name. Required.                                             |
| `scrolled` | `boolean`      | `false` | Set while content is scrolled beneath the bar; shows the scroll edge.  |
| `size`     | `"md" \| "xl"` | `"xl"`  | `xl` (default) or the compact `md`. Give the controls the same `size`. |

**Slots**

- default: Controls, `pl-toolbar-group`s, `pl-toolbar-separator`s, `pl-toolbar-spacer`s and a `pl-toolbar-title`. At most one control may be prominent (`variant="primary"`), and it goes last.

**Parts**

- `items`: The row that lays out the slotted controls.

## Tooltip

```ts
import "purrlucent/tooltip";
```

### `<pl-tooltip>`

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
