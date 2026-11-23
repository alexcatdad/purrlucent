# purrlucent

## 0.8.0

### Minor Changes

- 660370d: New `pl-accordion` and `pl-accordion-item`: stacked disclosure sections, each a heading with a button that shows and hides its panel. One section is open at a time unless `multiple` is set. Enter and Space toggle a section, and Up, Down, Home and End move between headers. `level` sets the heading level, and `pl-toggle` reports `{ value, open }`.
- 8fff177: The package ships an agent skill in `dist/skills/purrlucent/`, with the install guide, the React guide and the component reference beside it, so a coding agent in your app uses the elements as documented for the installed version. The install guide shows how to load it.
- 1cc6b94: `pl-avatar` shows a round picture of a person, with their initials from `name` when there is no `src` or the image fails to load. It comes in `sm`, `md`, `lg` and `xl`.

  `pl-skeleton` is a placeholder for content that is still loading, in a rectangle or a circle, with an optional shimmer that stops under reduced motion. It is hidden from assistive technology; put `aria-busy` on the loading region.

- b6ff2bf: Add `pl-breadcrumb` and `pl-breadcrumb-item`: a navigation landmark with an ordered list of steps. The last step is the current page, the separators are hidden from assistive technology, and long names shrink to an ellipsis with their full text as the title.
- 750b9fe: Add `pl-button-group`: related `pl-button` elements joined into one shape, with a `label` for its accessible name and a horizontal or vertical `orientation`. It holds no selection; use `pl-toggle-group` for one choice from a set.
- 07f6811: New `pl-calendar`, a month calendar for choosing one day, as an accessible date grid. Arrow keys, Home, End, Page Up and Page Down move through the days, and Enter or Space selects. `min`, `max` and `disabled-dates` (or a `disabledDates` function) limit the choice. Month and weekday names, the first weekday and the direction follow the locale. The value is an ISO day, `yyyy-mm-dd`, and a change fires `pl-change` with `{ value }`.
- af949a1: Add `pl-collapsible`, a single disclosure: a trigger button with `aria-expanded` and `aria-controls` shows and hides its content, which animates in height and shows at once under reduced motion. `open` reflects and `pl-toggle` reports `{ open }`.
- 1c01e73: New `pl-command`, `pl-command-item` and `pl-command-group`: a command palette with a search field above an always-visible list. Typing hides the items that do not match, and groups left empty; Down, Up, Home and End move the active item, Enter or a click fires `pl-select` with `{ value }`, and Escape clears the text. It works inside `pl-dialog`.
- 07f6811: New `pl-date-picker`, a form field for one day. The text entry reads the day as the locale writes it or as an ISO day, and a button opens a `pl-calendar` in a popover; choosing a day fills the field and returns focus to the button. The value is an ISO day, `yyyy-mm-dd`. The field takes `min`, `max`, `disabled-dates` and `required`, reports an invalid entry below itself, and fires `pl-input` and `pl-change` with the native `input` and `change`.
- b93d7e8: Adds `pl-aspect-ratio`, which keeps slotted media at a `ratio` such as `16/9`.

  Adds `pl-scroll-area`, a natively scrolling region with a thin scrollbar, a `label`, and keyboard focus when it overflows and holds nothing focusable.

  Adds the `purrlucent/typography` export with `proseStyles`, which styles headings, paragraphs, lists, quotes, inline code and tables inside a `.pl-prose` container.

- 10f7b77: Add `pl-card`, a grouped content surface with header, content and footer slots. It stays solid and is not interactive.

  Add `pl-item`, a list row with media, title, description and actions slots. An `href` makes the whole row a link while buttons in the row stay separate.

  Add `pl-empty`, an empty state with icon, title, description and action slots.

- 2d2e315: New `pl-input-group` wraps a `pl-input` or `pl-textarea` with addons before and after it, as `slot="start"` and `slot="end"`: text, an svg icon or a `pl-button`. The field and its addons share one border and one focus ring, and the field keeps its own label, name, value, validation and events. Text in an addon can describe the field when the field's `aria-describedby` names the addon's `id`.
- 28bb666: Add `pl-menubar`, a row of `pl-menu` elements with one tab stop. Left and Right move between the triggers, Down, Enter and Space open a menu, and with a menu open Left and Right switch to the neighboring menu.
- 2cc24a7: Add `pl-navigation-menu` and `pl-navigation-item`: site navigation with links and disclosure buttons that open panels of links, following the disclosure navigation pattern. Escape and a press outside close a panel and return focus to its button.
- f74506b: Add `pl-pagination`: a navigation landmark with Previous and Next, numbered pages and ellipses for the pages left out. Set `page` and `total`; `href-template` turns the pages into links; `pl-change` reports `{ page }`.
- 3654ed9: New `pl-resizable` split view with `pl-resizable-panel` and `pl-resizable-handle`. Panels sit side by side or stacked, with sizes in percent held within each panel's `min` and `max`. People drag the dividers, or use the arrow, Home, End and Enter keys on them, following the window splitter pattern. Enter collapses a `collapsible` panel and restores it, and the `collapsed` attribute does the same from your own controls. `pl-resize` reports the sizes.
- 48d19bb: Adds `pl-separator`, a horizontal or vertical hairline that is decoration by default and a `separator` role with `semantic`.

  Adds `pl-kbd`, a keycap for a key or shortcut, and `pl-badge`, a small label for a count or status with `neutral`, `accent` and `destructive` variants.

- de11d04: The agent skill installs with `gh skill install alexcatdad/purrlucent purrlucent@v<version>` or `npx skills add alexcatdad/purrlucent@v<version> --skill purrlucent`. The skill folder is self-contained: the component reference, the React guide and the install guide are in its `references/` folder. The package still ships the skill in `dist/skills/purrlucent/`.
- a468e09: Adds `pl-table`, which styles a native `<table>` you slot into it and scrolls it, with a tab stop, when it overflows, and `pl-data-table`, which draws a native table from `columns` and `rows` with sortable headings and row selection.
- 630371f: Add `pl-tabs`, `pl-tab` and `pl-tab-panel`: tabs that switch between panels of content, horizontal or vertical. Arrow keys move and select, `value` selects a tab, and `pl-change` reports the user's choice as `{ value }`.

## 0.7.0

### Minor Changes

- 0bb465d: Form controls fire the native `input` and `change` events after their own `pl-input` and `pl-change`, so React's `onInput` and `onChange` and form libraries such as react-hook-form work with them. `pl-checkbox` and `pl-switch` have a `type` of `checkbox`, so form libraries read `checked`.
- 5a40099: Breaking: the prefix is now `pl-` instead of `purr-`. Rename in your code:

  - Elements: `<purr-button>` is `<pl-button>`, and so on for every element.
  - Events: `purr-change` is `pl-change`; in React, `onpurr-change` is `onpl-change`.
  - Tokens: `--purr-color-accent` is `--pl-color-accent`, and so on for every token.
  - The glass attribute: `purr-material="glass"` is `pl-material="glass"`.
  - The cascade layer: `purr.tokens` is `pl.tokens`.
  - Classes and types: `PurrButton` is `PlButton`, and so on.

  The package name and its import paths stay `purrlucent`.

- a4cd223: `purrlucent/react` adds every element to React 19's JSX types, generated from the components on each release, and a new guide covers using purrlucent in a React app.
- e4df323: Event details are typed. The element manifest gives each `pl-*` event its `CustomEvent<…>` type, and in React the `on<event-name>` props receive it, so `e.detail.value` of a `pl-select` is a `string`.

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
