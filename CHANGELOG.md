# purrlucent

## 0.26.0

### Minor Changes

- 0e60094: Add eight opt-in page and card background textures with optional drift, configurable fades and accessibility preferences.
- f975ad5: Apply a size-aware bevel and gentle magnification to glass controls and navigation surfaces on browsers with SVG backdrop refraction.

## 0.25.1

### Patch Changes

- abe3a86: pl-badge with text gets 8px of padding before its rounded ends; a count such as "3" or "99+" keeps the narrow, round badge.

## 0.25.0

### Minor Changes

- 5f42e28: `pl-menu` takes the placements `start-start`, `start-end`, `end-start` and `end-end`: beside the trigger, with the menu's top or bottom level with the trigger's. From a `pl-sidebar-item`, a side placement opens past the sidebar's edge.

### Patch Changes

- 5f42e28: Add `--pl-material-selected-foreground`. On glass, text over the selection fill reads it, so it holds 4.5:1 in light and dark whatever the app sets for `--pl-color-accent-foreground`.
- 5577c67: pl-select no longer schedules a second update when its list opens, which Lit's dev mode reported as a change-in-update warning.

## 0.24.1

### Patch Changes

- 3c6b13d: The React JSX types include property-only props, such as `presets` on pl-month-range-picker, `columns` and `rows` on pl-data-table, and `data` on pl-chart.

## 0.24.0

### Minor Changes

- 0cd3e39: Body text is 16px, the web default (`--pl-text-base`), with a 24px `--pl-leading-body`; large text is 18px (`--pl-text-lg`).
- 0cd3e39: Controls show the pointing hand and disabled controls show `not-allowed`; set `--pl-cursor-interactive` or `--pl-cursor-disabled` to `default` for the arrow.
- 0cd3e39: Add a `data-pl-density` setting. `comfortable` on `:root` or any ancestor raises control, row and line heights and table cell padding together; `compact` is the default. A `pl-table` without a `density` attribute now follows it. Add the `--pl-color-surface-canvas`, `--pl-color-surface-content`, `--pl-color-surface-chrome` and `--pl-color-surface-overlay` tokens, and document the default width of each text field.
- 0cd3e39: `pl-month-range-picker` has a new look. Its trigger is a field like `pl-select`, with a calendar icon, a chevron, a placeholder and a `slot="label"` label. The chosen range shows as one band with filled end caps, a preview of the range follows the pointer and keyboard focus after the first month, and this month is marked with a dot. The new `presets` property adds buttons that choose ready-made ranges.
- 0cd3e39: `pl-sidebar-item` labels and descriptions truncate with an ellipsis on one line, and the full text shows as the control's title only when truncated. The reorder grip has a fixed width independent of the row height and no longer takes room from the label while hidden.

  The disclosure chevron of a group now sits at the trailing end of the row, after the label and the detail, so icons and labels of group and plain rows line up. The new `chevron` attribute on `pl-sidebar` (`end`, the default, or `start`) restores the leading position. Beside a link, the disclosure button now follows the link in the tab order when the chevron is at the end.

- 0cd3e39: Text fields render editable text at least 16px on coarse pointers, so iOS Safari does not zoom on focus; `--pl-text-field` sets the size.
  Toggle-group overflow keeps a thin themed scrollbar.
  Plain links in table cells are underlined at rest.
  Select, combobox, checkbox, radio group and toggle group restore their value when the browser restores form state.
  A disabled button takes no focus on click or Tab.
  A disabled menu item shows the `not-allowed` cursor and still cannot be activated.
  The label text of a checkbox and a switch can be selected.

### Patch Changes

- 0cd3e39: Form controls re-render when `disabled` is set back to false through the property, so inner fields and buttons are enabled again.
- 0cd3e39: Menu item icons are 16px with the icon gap before the label, also under page resets that zero margins. On glass, the focus ring and selection follow the accent color.

## 0.23.2

### Patch Changes

- 7388080: Form controls re-render when `disabled` is set back to false through the property, so inner fields and buttons are enabled again.

## 0.23.1

### Patch Changes

- 5d6bf08: pl-table cells keep their words whole: a column is never narrower than its longest word, and only a word too long for the space breaks. Overflow scrolls inside the table.

## 0.23.0

### Minor Changes

- 9d6c639: Forms: `pl-combobox` has a `busy` attribute that hides the "No results" row while an app's lookup runs, and fires `pl-input` when leaving the field clears or restores the text. `pl-file-input` forwards `aria-required`, `aria-invalid`, `aria-describedby` and `aria-errormessage` to its button and works inside `pl-field`. `pl-dialog` accepts a secondary `pl-button` in the `actions-start` slot.
- 9d6c639: `pl-sidebar` and `pl-sidebar-item` changes for app integration:

  - The narrow-screen state is applied in the same task as the width change, before the next frame, so a narrow screen never shows the inline sidebar or overflows horizontally.
  - Hiding and showing animates the width with the motion tokens, and not under `prefers-reduced-motion: reduce`. A collapse caused by the screen width is not animated.
  - With `no-toggle`, a collapsed sidebar takes no space. The host of the narrow-screen panel takes no place in the page flow.
  - Reorder grips show on hover and focus within the row, and always on touch screens.
  - The gap between an item's icon and its label uses `--pl-gap-icon` and is not affected by page CSS that resets margins.
  - A `pl-sidebar-item` with `action` passes `aria-haspopup`, `aria-expanded` and, where the browser supports element references, `aria-controls` from the host to its button, so a `pl-menu` trigger exposes its state on the focused control.
  - After the narrow-screen panel closes, focus returns to the toggle in every browser (#166).

- 9d6c639: Table: `striped` and `density` (`regular`, `compact`) attributes; rows with `aria-selected="true"` take the selection tint; `data-numeric` aligns cells like `align="end"`; plain links in cells use the accent colour; header cells use the small text size with a hairline under the header. Visually hidden content in a table no longer widens the page.

## 0.22.0

### Minor Changes

- bbc0ce5: `pl-button` takes `href`, `target`, `rel` and `download`: it then renders a real link with the button's look, so opening in a new tab and copying the address work. The `click` reaches the host and can be cancelled for client-side routing. A disabled link has no address and cannot be focused, and an icon link's `aria-label` names the inner link. A link button takes part in `pl-toolbar`'s arrow-key focus like any other item.
- bbc0ce5: `pl-button` takes `size="sm"`, a 24px control for dense tables, toolbars and pagination, with a new `--pl-size-sm` token; a coarse pointer keeps the 44px hit region. A `type="submit"` button now submits on Enter in a native text input of its form, also with several fields. `pl-button` gains `form`, `name` and `value`: a submit button outside its `<form>` submits the form named by `form`, and its `name` and `value` are submitted when it submits, as a native submit button's are. The React types include the three.
- bbc0ce5: `pl-combobox` can leave filtering to the app and offer action rows. The `manual-filter` attribute stops the field from narrowing or reordering the list, so an app that searches on a server can replace the options on each `pl-input`. A `pl-option` with the `action` attribute, or the `action-label` attribute (in English "Add {query}"), adds a row that fires `pl-action` with `detail.query` instead of choosing a value.
- bbc0ce5: `pl-data-table` has a `renderCell(row, column)` property. It returns a string, a `Node` or a Lit template that a cell shows in place of its text, in both the plain and the model table, so cells can hold links, markers, checkboxes and buttons. Keyboard cell navigation still works, and controls in a cell stay reachable with Tab.
- bbc0ce5: `pl-dialog` gains `closable` (a close button in the sheet header that cancels like Escape, named by `close-label`), an `actions-start` slot for status text in the actions row, a `nonmodal` mode that leaves the page interactive, and a `description` attribute. `pl-close` now reports `detail.reason` (`user` or `programmatic`). `pl-drawer` gains the `description` attribute. A `data-close` element inside a dialog in a drawer now closes only that dialog.
- bbc0ce5: `pl-collapsible` accepts a slotted `button`, `a[href]` or `[role="button"]` as `slot="trigger"`: it replaces the built-in button and gets `aria-expanded`, `aria-controls` and toggling on click, Enter and Space. A new `current` attribute marks and fills the row like a current sidebar row. `pl-tabs` has a `hide-scrollbar` attribute that hides the scrollbar of an overflowing tab list while it stays scrollable.
- bbc0ce5: Add `pl-file-input`, a form-associated file picker with a choose button, the chosen file names, drag and drop, `accept`, `multiple` and `required`.
- bbc0ce5: `pl-input`, `pl-textarea` and `pl-date-picker` forward `aria-required`, `aria-invalid`, `aria-describedby` and `aria-errormessage` set on the host to their native control, copying the referenced text to its `aria-description`, so forms that validate themselves with `novalidate` stay accessible. Return in a field of a form without a submit button and with several text fields, inside a `pl-dialog`, now presses the dialog's `default` action.
- bbc0ce5: `pl-menu` and `pl-menu-item` gain several options. A `pl-menu-item` with `href`, `target` and `rel` renders a real link, so middle-click, open in a new tab and copy link work; choosing it closes the menu. A `description` attribute or slot adds a second, muted line to an item. A `header` slot on `pl-menu` holds non-interactive content above the items. `placement` (`bottom-start`, `bottom-end`, `top-start`, `top-end`, `start`, `end`) sets where the menu opens, and it still flips when there is no room. `pl-menu` fires `pl-toggle` with `detail.open` when it opens and closes, and has a `show()` method that opens it with the first item focused, like `open` and `hide()`. `pl-select` now also reports the item element in `detail.item`, and the docs state that choosing an item dispatches `click` on it.
- bbc0ce5: Tooltip and popover: `pl-tooltip` takes rich, non-interactive content in a `content` slot (still `role="tooltip"`, still named by the target's `aria-describedby`). Both take `align` (`center`, `start`, `end`) for a panel above or below its trigger, mirrored under right-to-left text. New tokens `--pl-popover-max-inline-size` and `--pl-tooltip-max-inline-size` set the widest panel before its content wraps, so a long tooltip wraps instead of running on in one line. `--pl-tooltip-open-delay` sets the hover delay of a tooltip.
- bbc0ce5: `pl-sidebar` gains `header` and `footer` slots outside the navigation landmark; a narrow screen now shows the open sidebar as a modal panel with a scrim (Escape or the scrim closes it, focus moves in and returns to the toggle) instead of a full-width bar; `collapse-below` sets the width in px for the automatic collapse (`0` turns it off, the default stays 600); `no-toggle`, `toggle()`, `show()` and `hide()` let an app control it, and `shortcut` (such as `mod+b`) toggles it from anywhere in the page; `pl-collapse` also fires for the first automatic collapse; and `reorderable` adds a grip and Alt with the Up and Down arrows to level 1 items, which fire `pl-reorder` with `{ from, to }` without moving anything themselves. `pl-sidebar-item` gains `action` (a button that never takes the selection), a per-item `size`, a `description` slot, correct sizing for a `pl-avatar` in the icon slot, and a cancelable `pl-navigate` event with `detail.href` before a plain left click on a link navigates.
- bbc0ce5: `pl-table` styles interactive rows (a `data-interactive` row or one with an `a[data-stretched]` link gets a hover tint, a focus ring and a pointer) and sortable column headers (a `th[aria-sort]` holding a button shows a sort glyph that follows `aria-sort`). `pl-badge` gains an `appearance` attribute: `solid` (default), `soft` or `outline`.
- bbc0ce5: Toast: `success` and `warning` variants with an icon and tone color. `PlToaster.show()` takes a node as the description (for example a collapsed `details` element) and an `id`, so showing a toast with the id of one still on screen replaces it in place. A string description keeps its line breaks, and a long description scrolls instead of growing the toast.
- bbc0ce5: `pl-toggle` and `pl-toggle-group` fire `pl-change` as a cancelable event before the new state is applied. Calling `preventDefault()` keeps the previous `pressed` or `value`, and a group then fires no `input` or `change`.

## 0.21.0

### Minor Changes

- db410b9: Glass looks like Apple's: thin and lit.

  - Bars, controls, sidebars, panels, popups and sheets take one thin fill, `--pl-material-glass-thin`: a pale film in light and an ink one in dark, under a 4px frost (`--pl-blur-sm`) and a 180% color boost.
  - The rim catches light: a bright top edge, a faint rim around the other edges and a glow inside the top. Glass controls and panels cast a deep soft shadow, `--pl-material-drop`.
  - In Chromium, popovers, menus, the select's list, navigation menu panels, dialogs and drawers refract too. The lens can target an element in a component's shadow root.
  - A toolbar with `floating` is a capsule that floats over the content.
  - The legibility floor on glass over any backdrop is now 3.5:1 for primary text and 3:1 for the focus ring and selection. Over mid-grey and lighter backdrops in light, and over any backdrop in dark, primary text reaches 4.5:1. Tabs, breadcrumbs, pagination, the select and tinted and destructive buttons keep the thicker fill and 4.5:1 for their colored text.
  - On glass the focus ring and selection are a deeper pink in light, so they hold 3:1 on the thin fill.

## 0.20.0

### Minor Changes

- 4c308d4: `pl-button` takes `href`, `target`, `rel` and `download`: it then renders a real link with the button's look, so opening in a new tab and copying the address work. The `click` reaches the host and can be cancelled for client-side routing. A disabled link has no address and cannot be focused, and an icon link's `aria-label` names the inner link. A link button takes part in `pl-toolbar`'s arrow-key focus like any other item.

## 0.19.0

### Minor Changes

- 2ead4b8: Components follow a change of language while the page is open: when a `lang` attribute changes, `setMessages` registers text later or the browser's language changes, the elements on the page update their built-in text, their date and month names and the validation messages the library writes. A date picker writes its day again in the new language's format. A text field's own required message still comes from the browser.

## 0.18.0

### Minor Changes

- 22540c2: New `pl-month-range-picker`: chooses a range of whole months, one year at a time in a three-column grid, as a button with a popover or `inline`. The first month starts the range and the second ends it, in either order; leaving after one month chooses that month alone. The value is `yyyy-mm/yyyy-mm`, it takes part in forms, and month names follow the locale. New message keys: `chooseMonths`, `previousYear`, `nextYear` and `labelValue`.

### Patch Changes

- d92d450: The published package no longer carries a `prepare` script, so package managers no longer record an install script for it.

## 0.17.0

### Minor Changes

- 55ef5f5: Built-in text follows the page language. `setMessages(lang, messages)` registers an app's text for a language once, and every component inside an element with that `lang` uses it, also inside other components; English is built in. The data-table column and row menus, the prompt-input Send and Stop buttons, the carousel's role words and the sidebar item's disclosure name are now translatable too, and prompt-input gains `send-label` and `stop-label`. Label attributes now default to empty and still win over the registered text. Breadcrumb and pagination always have a name.

## 0.16.1

### Patch Changes

- 9314e8d: A toolbar that holds only a title centers it vertically; it sat at the top of the bar. The calendar's weekday names lose the browser's dotted underline and keep their full names as titles.

## 0.16.0

### Minor Changes

- 7ada970: Glass refracts in Chromium. Toolbars, menubars, navigation menus, buttons and segmented controls on glass bend what is behind their rim, as Apple's glass does: each gets an SVG displacement filter sized to its box, read through the new non-inheriting `--pl-lens` property ahead of the blur. Safari and Firefox cannot draw an SVG filter in `backdrop-filter`, so they keep the plain frosted glass. Refraction only moves the backdrop, so text contrast on glass is unchanged, and reduced transparency, increased contrast and forced colors still make glass solid.

## 0.15.0

### Minor Changes

- 724588a: Clearer glass on small chrome. Glass now has two tiers, as Apple's small glass is clearer than its large glass:

  - Bars, capsules and controls take a thin fill, `--pl-material-glass-thin`, under a 10px blur (`--pl-blur-sm`): a 60% pale film in light and a 66% ink film in dark. Only primary text goes on them. A text-only button in a glass bar takes the primary text color, handed down by the bar. Pressed, a thin control thickens halfway to the thick fill.
  - Sidebars, panels and sheets keep the thick fill, `--pl-material-glass`. Controls that show grey, pink or red text read the new `--pl-material-capsule-strong` and `--pl-material-control-strong` tokens, which stay thick under glass: tabs, breadcrumbs, pagination, the select trigger, and tinted and destructive buttons. On glass a tinted or destructive button mixes 8% of its tone into its face, not 21%, and pressing lightens it, set by the new `--pl-material-tone-rest` and `--pl-material-tone-pressed`.
  - The color boost rises to 180%, and the rim light and inner glow are brighter.
  - On glass, the focus ring and the selection take `--pl-material-ring` and `--pl-material-selected`: the pink deepened in light and lifted in dark, so they hold 3:1 on the thin fill over any backdrop.

  Every fill still holds its text at 4.5:1 over any backdrop, black to white, and reduced transparency, increased contrast and forced colors still make glass solid.

## 0.14.1

### Patch Changes

- 48b0877: Glass catches light. Every glass surface draws a brighter specular line along its top rim, a faint catch light along its bottom rim and a narrow glow inside the top edge, through `--pl-material-edge` and the new `--pl-material-glow` and `--pl-material-rim-low` tokens. Glass buttons cast a contact shadow and a softer lifting one. The fills are unchanged.

## 0.14.0

### Minor Changes

- 76c7882: Taller controls. The default control height is 32px, up from 24px, and `lg` and `xl` are 36px and 40px, up from 28px and 36px. Buttons, fields, selects, segmented controls, tabs and the other controls follow, as does the fine-pointer hit size. Bars and toolbars grow by 4px with `xl`. A coarse pointer still gets at least 44px.

  Rows in menus and list popups (menu, select, combobox, command) stay compact at 24px with a fine pointer and 44px with a coarse one, through a new `--pl-size-row` token.

  The switch keeps its own track heights (24, 28 and 36px) and is now always 2.25 times as wide as it is tall, so its thumb has room to travel at any size.

## 0.13.0

### Minor Changes

- eab9e24: Hot pink accent on a near-neutral base. The accent is `--pl-color-hot-pink` (#ff69b4); its fill takes ink text, and pink text, focus rings and selection use a deeper pink of the same hue on a light page. Page, text and fills mix from `--pl-color-ink` and `--pl-color-paper` instead of navy and honeydew, and the destructive red, `--pl-color-red`, leans to orange, away from the pink.

  Cards and table boxes are raised off the page with `--pl-color-raised`. Their edge, `--pl-color-frame`, is a hairline in light and clear in dark, where the fill alone separates them; increased contrast and forced colors keep the edge.

  Rename in your own styles: `--pl-color-oxford-navy` to `--pl-color-ink`, `--pl-color-honeydew` to `--pl-color-paper`, `--pl-color-punch-red` to `--pl-color-red`. `--pl-color-cerulean` and `--pl-color-frosted-blue` are gone; use `--pl-color-hot-pink` or the role tokens. A custom dark accent needs `--pl-color-accent-foreground: #fff`.

## 0.12.0

### Minor Changes

- 18cc4c9: Radii by role and pointer. `--pl-radius` and `--pl-radius-lg` are replaced by `--pl-radius-control` (8px, 12px for a coarse pointer) for buttons, fields and groups, and `--pl-radius-panel` (16px) for dialogs, popovers, menus, sheets and sidebars. Two follow from them so nested curves stay parallel: `--pl-radius-control-inner` (control minus 2px) and `--pl-radius-row` (panel minus its padding) for menu and list rows. Rename `--pl-radius` to `--pl-radius-control` and `--pl-radius-lg` to `--pl-radius-panel` in your own styles.

## 0.11.0

### Minor Changes

- 8978d1b: Clear glass and tint. `pl-glass="clear"` on a container inside glass gives its controls Apple's clear variant for photos and video: a dark film over a dimmed backdrop, with light text in both color schemes, solid again under reduced transparency or more contrast. `--pl-material-tint` and `--pl-material-tint-strength` mix a color into the glass fill. The Surfaces stories show both, plus a prototype of edge lensing through an SVG filter, which only Chromium renders.

### Patch Changes

- 8978d1b: Glass picks up more color from what is behind it: `--pl-material-saturate` raises the boost from 125% to 160%. Glass surfaces read their fill from a new `--pl-material-glass` token, which stays as opaque as text on glass needs over any backdrop; an app that controls what sits behind its glass may set it clearer. The install guide says glass needs varied content behind it, shows a background that gives it some, and how to tell when the system's reduced-transparency setting is keeping it solid.

## 0.10.2

### Patch Changes

- 6e2ada2: A `fit-content` `pl-toggle-group` that scrolls shows no scrollbar. Where scrollbars always show, it drew a line under the labels; the edge fade already says there is more, and touch, a trackpad and the arrow keys still scroll it.

## 0.10.1

### Patch Changes

- fe8bbb5: Fixes found in a consumer app:

  - `pl-progress` is a block as wide as its container, so it fills cards and rows and leaves no line-box space below it. Set `inline-size` for a shorter bar.
  - A `fit-content` `pl-toggle-group` that scrolls fades the edges with more items past them.
  - A sheet's title is a step larger, and the gap under it no longer depends on the description element's own margin, which page resets such as Tailwind's preflight removed.
  - Opening a dialog on a page with a classic scrollbar keeps the page's width instead of shifting it sideways.

## 0.10.0

### Minor Changes

- 8497f00: Success and warning tones for status interfaces. New tokens: `--pl-color-success`, `--pl-color-success-foreground`, `--pl-color-success-text` and the same three for `warning`. `pl-badge` gains `success` and `warning` variants and a `dot` attribute for status pills. `pl-progress` gains `tone` (`success`, `warning`, `destructive`). `pl-banner` gains `success` and `warning` tones and `no-close`. `pl-toggle-group` gains `fit-content`, for items as wide as their text in a group that scrolls sideways when it overflows.
- 8497f00: Glass mode now covers the whole controls and navigation layer. Buttons, toggles, switches, sliders, checkboxes, radios, text fields, selects, comboboxes, number fields, date pickers, code inputs, prompt inputs, menubars, tabs, pagination, breadcrumbs, command palettes, toasts, banners and hover cards take the glass material, with a highlighted edge and a soft shadow. New tokens: `--pl-material-highlight`, `--pl-material-control`, `--pl-material-control-pressed`, `--pl-material-control-filter`, `--pl-material-capsule`, `--pl-material-field`, `--pl-material-float` and `--pl-elevation-control`. Content stays solid, and increased contrast, reduced transparency and forced colors still fall back to solid.

  `pl-data-table` gains a built-in filter field (`filterable`, `filter`, `pl-filter`) and pagination (`page-size`, `page`, `pl-page`), plus a `model` property that renders a supplied table model: grouped headers, merged cells, group and expandable rows, aggregate footers, pinned rows and columns, column menus, per-column filters, resizing and cell selection.

  The prose styles cover every text-level element. `pl-checkbox` gains `readonly`, `pl-collapsible` gains `disabled`, and `pl-banner` gains `no-icon`.

  Fixes: the submenu surface and disabled checkbox border are visible, sort glyphs are easier to see, the toolbar centres its title, prompt input buttons sit inside the bar, message-scroller content stays clear of the jump button, date and calendar labels follow their locale, charts mirror in right-to-left layouts, and keyboard shortcuts keep their order in right-to-left text.

- 8497f00: New `purrlucent/tailwind.css` export. Tailwind's preflight zeroes `margin`, `padding` and `border` on every element, which outranks the components' own styles; imported after Tailwind, this file hands them back to every purrlucent element.

### Patch Changes

- ddd9f8c: The agent skill is a guide with a quick start, a worked example and sections for looking up elements, React, styling, testing and common mistakes. It reads the component reference section for each element in use, and the React and install guides only when the task needs them. The component reference opens with a contents list of every component and its elements.

## 0.9.1

### Patch Changes

- 9227bdd: `pl-message-scroller` no longer pulls the view back to its `default-scroll-position` when a script or the reader scrolls while it is still settling after the first render.

## 0.9.0

### Minor Changes

- 58baddb: Adds `pl-attachment`, a card for a file or other attachment with media, a title, a description and actions. It can be a link or a button, shows uploading, processing and error states, and comes in three sizes and two orientations. Adds `pl-attachment-group`, a row of attachments that scrolls sideways, snaps and fades at the edges.
- 9f25acc: Adds `pl-bubble`, a chat message that sizes to its content with seven variants, optional link or button behavior and reactions over its edge, `pl-bubble-reactions` for those reactions, and `pl-bubble-group` for a run of messages from one sender.
- 94df6d2: Adds `pl-carousel` and `pl-carousel-item`, a row of slides that scrolls natively with CSS scroll-snap, with Previous and Next buttons and a dot for each page. It does not autoplay and does not wrap.
- f77a2fe: Adds `pl-chart`, a named, themed chart drawn by TanStack Charts (an optional peer dependency). Give it a `type` (`bar`, `line`, `area` or `donut`), `data` and the keys to read, or a TanStack `definition`. It has a required `label`, a tooltip and arrow-key navigation by default, series colors from `--pl-chart-1` to `--pl-chart-6`, an optional legend, and a native table of the same values for assistive technology that `show-table` makes visible.
- b74438e: Adds `pl-context-menu`, which wraps a region and opens a slotted `pl-menu` at the pointer on a right-click or Control-click, at the finger after a long press, and from the keyboard with Shift+F10 or the Context Menu key. It reports `pl-open` and `pl-close`, and a `disabled` region leaves the browser's own menu alone.
- e1a1202: New `pl-drawer`, a modal panel anchored to an edge: the counterpart of shadcn's Drawer and Sheet. `side="bottom"` (default) is an iOS-style sheet with a grabber button that can be dragged down to dismiss, and with `detents="medium large"` dragged between a half-screen and a large height; the grabber and the arrow keys do the same without a pointer. `side="start"` and `side="end"` are logical side panels that mirror in right-to-left. It takes `title`, `description`, default and `footer` slots, a `dismissible` backdrop, `data-close` on any element, and fires cancelable `pl-cancel`, `pl-open`, `pl-close` and `pl-resize`.
- 2f2b682: Adds `pl-field`, which lays out a label, a control, a description and an error message and links them for the control (vertical, horizontal or responsive), and `pl-fieldset`, which groups fields under a legend and disables the controls inside when `disabled`.
- 62a4cd8: Adds `pl-hover-card`, a popover-styled card anchored to a trigger that opens after a short delay on pointer hover and keyboard focus, at once on a press, and on a first tap on touch. It stays open while the pointer or focus is on the trigger or in the card, closes after a delay when both leave, and closes on Escape.
- a5c3e27: Adds `pl-input-otp`, a one-time code field: one native input with `autocomplete="one-time-code"` drawn as one box per character, so typing, paste and SMS autofill fill every box. It is form-associated, validates that the code is complete, and fires `pl-input`, `pl-change` and `pl-complete`.
- 49fe25b: Adds `pl-marker`, a non-message row for a conversation: a status, a system note or a labelled separator, with an optional icon, a link or button form, and a text shimmer for work in progress. The shimmer is also exported as `shimmerStyles` with the class `pl-shimmer`.
- 0967d91: Adds `pl-message-scroller`, `pl-message-scroller-item` and `pl-message-scroller-button`, a scrolling transcript for chat. It is a named, focusable region that holds a live log of rows. A new row marked `scroll-anchor` scrolls near the top with a peek of the row before it, `auto-scroll` follows streamed content while the reader is at the end, `default-scroll-position` picks where it opens, and older rows added before the first keep the visible rows in place. It offers `scrollToMessage`, `scrollToEnd` and `scrollToStart`, `data-scrollable` edge state, edge fades, and a scroll-to-end button.
- 3b3e4ad: Adds `pl-message`, one conversation row with `avatar`, `header`, content and `footer` slots and an `align` of `start` or `end` that mirrors in right-to-left, and `pl-message-group`, which stacks consecutive messages from one sender tightly and shows only the last avatar.
- 1f5a058: Adds `pl-prompt-input`, the chat composer: a form-associated text field that grows from one line to about eight, with a send button, `start` and `end` slots for tools, Enter to send, Shift+Enter for a newline, and a Stop button while `busy`. It fires `pl-submit` with the trimmed text and `pl-stop`.
- 36581e4: Add `pl-toast` and `pl-toaster`: non-blocking status messages in a polite live region at the inline-end bottom edge. A toast has a title, an optional description and action, and a close button; one without an action dismisses itself after `duration` (6s by default, 0 keeps it), pausing while hovered or focused, and Escape closes the focused toast. Show toasts from script with `PlToaster.show({ title, description, variant, action, duration })`. `pl-close` reports the `reason`.

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
