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

## Attachment

```ts
import "purrlucent/attachment";
```

### `<pl-attachment>`

A file or other item attached to a message or a draft: media, a title, a description and actions. With an `href` or `clickable` the whole card is one target, named by the title; buttons in the `actions` slot stay separate. While `uploading` or `processing` the title shimmers (still under reduced motion), and in `error` the card uses the destructive colors; keep the reason in the description text, since color alone does not say it. A hidden status word is added to the title's name for the states that need one.

| Attribute      | Type                         | Default        | Description                                                                                                                        |
| -------------- | ---------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `state`        | `PlAttachmentState`          | `"done"`       | `idle`, `uploading`, `processing`, `error` or `done` (default). Idle looks like done.                                              |
| `media`        | `"icon" \| "image"`          | `"icon"`       | What the `media` slot holds: `icon` (default) in a tile, or `image`, which fills it.                                               |
| `size`         | `PlAttachmentSize`           | `"default"`    | `default`, `sm` or `xs`.                                                                                                           |
| `orientation`  | `"horizontal" \| "vertical"` | `"horizontal"` | `horizontal` (default) or `vertical`, with the media above the text.                                                               |
| `href`         | `string \| null`             | `null`         | Makes the card a link to this address.                                                                                             |
| `target`       | `string \| null`             | `null`         | Where the link opens, as on `a`.                                                                                                   |
| `rel`          | `string \| null`             | `null`         | The link's relationship, as on `a`.                                                                                                |
| `clickable`    | `boolean`                    | `false`        | Makes the card a button that fires `pl-press`. Ignored when there is an `href`.                                                    |
| `status-label` | `string \| null`             | `null`         | The hidden word added to the name while the state is `uploading`, `processing` or `error`. Set it when the page is not in English. |

**Slots**

- `media`: An svg icon, or an image when `media="image"`. Give an image `alt=""` when the title says the same.
- `title`: The attachment's name. It names the link or button when the card is one.
- `description`: Secondary text, such as the size or, in `error`, the reason.
- `actions`: Icon buttons, each with an `aria-label` that names the action and the attachment. They stay separate from the card's own target.

**Parts**

- `trigger`: The link or button, when the card is one.
- `text`: The title and description.

**Events**

- `pl-press`: When a `clickable` card is activated by pointer, Enter or Space. Presses of buttons in the `actions` slot do not reach the card.

### `<pl-attachment-group>`

A row of attachments that scrolls sideways and snaps each card to the start. A fade marks each edge that has more to scroll to. Give it a `label`. When it overflows and nothing in it takes focus (no link, button or action), the row takes a tab stop so the keyboard can scroll it.

| Attribute | Type     | Default | Description                       |
| --------- | -------- | ------- | --------------------------------- |
| `label`   | `string` | `""`    | The accessible name of the group. |

**Slots**

- default: The attachments.

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

## Bubble

```ts
import "purrlucent/bubble";
```

### `<pl-bubble>`

A chat message bubble. It sizes to its content up to 80% of its container (`--pl-bubble-max-inline-size`); `ghost` is unframed and full width, for assistant text, markdown and code. The bubble never parses markdown: slot the rendered content. An `href` makes the body a link, `interactive` a button; reactions stay outside both, so no control nests in another. The `destructive` variant draws an error mark beside the text; the message itself must say what went wrong, as color is not the only cue.

| Attribute     | Type                                                                                          | Default     | Description                                                                                                                    |
| ------------- | --------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `variant`     | `\| "default" \| "secondary" \| "muted" \| "tinted" \| "outline" \| "ghost" \| "destructive"` | `"default"` | `default` (strong accent, for the person's own messages), `secondary`, `muted`, `tinted`, `outline`, `ghost` or `destructive`. |
| `align`       | `"start" \| "end"`                                                                            | `"start"`   | `start` (default) or `end`.                                                                                                    |
| `href`        | `string \| null`                                                                              | `null`      | Makes the body a link to this address.                                                                                         |
| `target`      | `string \| null`                                                                              | `null`      | Where the link opens, as on `a`.                                                                                               |
| `rel`         | `string \| null`                                                                              | `null`      | The link's relationship, as on `a`.                                                                                            |
| `interactive` | `boolean`                                                                                     | `false`     | Makes the body a button. Listen for `click`.                                                                                   |

**Slots**

- default: The message content.
- `reactions`: A `pl-bubble-reactions` over the bubble's edge.

**Parts**

- `body`: The filled shape: a link, a button or a div.
- `content`: The slotted content.

**CSS properties**

- `--pl-bubble-max-inline-size`: The widest the bubble grows.

### `<pl-bubble-reactions>`

The reactions on a bubble, a pill that overlaps the bubble's top or bottom edge. Alone it is one image named by `label` (or, without one, by its text), so a screen reader hears "3 likes" and not each emoji. With `interactive` it is a group, and each slotted `button` is a real control with its own name.

| Attribute     | Type                | Default    | Description                                                                                       |
| ------------- | ------------------- | ---------- | ------------------------------------------------------------------------------------------------- |
| `side`        | `"top" \| "bottom"` | `"bottom"` | `bottom` (default) or `top`: the bubble edge it overlaps.                                         |
| `align`       | `"start" \| "end"`  | `"end"`    | `end` (default) or `start`: where along that edge.                                                |
| `label`       | `string \| null`    | `null`     | The summary read out, such as "2 likes, 1 laugh". Without `interactive`, give emoji or icons one. |
| `interactive` | `boolean`           | `false`    | The children are buttons.                                                                         |

**Slots**

- default: The reactions: text or icons, or `button` elements when interactive.

### `<pl-bubble-group>`

A run of consecutive bubbles from one sender. The neighbors' touching corners are tight, and the gap between them is small. Name the group with `label` when it needs one, such as the sender.

| Attribute | Type             | Default | Description                  |
| --------- | ---------------- | ------- | ---------------------------- |
| `label`   | `string \| null` | `null`  | The group's accessible name. |

**Slots**

- default: `pl-bubble` elements.

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

## Button group

```ts
import "purrlucent/button-group";
```

### `<pl-button-group>`

A set of related `pl-button` elements joined into one shape: the borders meet and only the outer corners are round. It is layout and a label only. It holds no selection and fires no events; each button keeps its own press, tab stop and form behavior. For one choice from a set use `pl-toggle-group`. Always set `label` (or `aria-label`): without either the group has no accessible name. Give the buttons in a group equal weight: one size, one variant.

| Attribute     | Type                         | Default        | Description                           |
| ------------- | ---------------------------- | -------------- | ------------------------------------- |
| `label`       | `string`                     | `""`           | The accessible name of the group.     |
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | `horizontal` (default) or `vertical`. |

**Slots**

- default: `pl-button` elements.

## Calendar

```ts
import "purrlucent/calendar";
```

### `<pl-calendar>`

A month calendar for choosing one day, as the WAI-ARIA date grid: the days are a `grid` with one tab stop, and the arrow keys, Home, End, Page Up and Page Down move through them (Shift with Page Up or Down moves a year), Enter or Space selects. Buttons above the grid show the previous and next month. The value is an ISO day, `yyyy-mm-dd`. Month and weekday names, the first day of the week and the writing direction follow the locale. It takes part in forms like a native input: it submits `name` with its value and a reset returns it to its `value` attribute.

| Attribute        | Type                      | Default            | Description                                                                                                                                               |
| ---------------- | ------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`          | `string`                  | `""`               | The selected day, `yyyy-mm-dd`, or empty. The `value` property holds the current one.                                                                     |
| `min`            | `string \| undefined`     |                    | The earliest day that can be selected, `yyyy-mm-dd`.                                                                                                      |
| `max`            | `string \| undefined`     |                    | The latest day that can be selected, `yyyy-mm-dd`.                                                                                                        |
| `disabled-dates` | `PlCalendarDisabledDates` | `[]`               | Days that cannot be selected, as ISO days separated by commas or spaces. The `disabledDates` property also takes a function from an ISO day to a boolean. |
| `locale`         | `string \| undefined`     |                    | A BCP 47 tag for names, the first weekday and the direction of the numbers. Defaults to the closest `lang`, else the document's, else the browser's.      |
| `first-day`      | `number \| undefined`     |                    | The first day of the week, 1 (Monday) to 7 (Sunday). Defaults to the locale's.                                                                            |
| `name`           | `string`                  | `""`               | The name submitted with a form.                                                                                                                           |
| `prev-label`     | `string`                  | `"Previous month"` | The previous month button's accessible name. Defaults to "Previous month".                                                                                |
| `next-label`     | `string`                  | `"Next month"`     | The next month button's accessible name. Defaults to "Next month".                                                                                        |
| `_focus`         | `string`                  | `""`               | The day that holds the tab stop, and with it the month on show. Empty until a day is chosen or focused.                                                   |

**Parts**

- `header`: The row with the month buttons and the title.
- `title`: The month and year.
- `nav`: A month button.
- `grid`: The table of days.
- `weekday`: A weekday heading.
- `day`: A day cell.

**Events**

- `pl-change`: A day was selected. `detail.value` holds it. Selecting the day that is already selected fires nothing.
- `input`: After each pl-change, as a native input fires it.
- `change`: After each pl-change, as a native input fires it.

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

## Carousel

```ts
import "purrlucent/carousel";
```

### `<pl-carousel-item>`

One slide of a `pl-carousel`, one page wide. The carousel gives it its "n of m" name.

**Slots**

- default: The slide's content.

### `<pl-carousel>`

A row of slides that scrolls with the browser's own scrolling and CSS scroll-snap: swipe, trackpad and keyboard scrolling all work. Previous and Next buttons and a dot for each page sit centered below. It does not autoplay and does not wrap: Previous is disabled on the first page and Next on the last. The current page's dot is marked `aria-current="true"`. It follows the WAI-ARIA carousel pattern without rotation. The host is a `region` described as a "carousel" and named by `label`; each `pl-carousel-item` is a `group` described as a "slide" and named "n of m". Under reduced motion the buttons and dots jump instead of gliding. With the focus on the scrolling area, the arrow keys, Home and End change the page. Each item is one page wide. Use it for peer content browsed in order, such as images or cards; for a few labelled views use `pl-tabs`.

| Attribute        | Type     | Default                | Description                                                                                              |
| ---------------- | -------- | ---------------------- | -------------------------------------------------------------------------------------------------------- |
| `label`          | `string` | `""`                   | The accessible name of the carousel. Always set one.                                                     |
| `previous-label` | `string` | `"Previous slide"`     | The accessible name of the Previous button. Defaults to "Previous slide".                                |
| `next-label`     | `string` | `"Next slide"`         | The accessible name of the Next button. Defaults to "Next slide".                                        |
| `page-label`     | `string` | `"Go to slide {page}"` | The accessible name of a page's dot; `{page}` is its number. Defaults to "Go to slide {page}".           |
| `slide-label`    | `string` | `"{page} of {total}"`  | The name of each slide; `{page}` is its number and `{total}` the count. Defaults to "{page} of {total}". |
| `index`          | `number` | `0`                    | The current page, from 0. Change it with `goTo`.                                                         |
| `count`          | `number` | `0`                    |                                                                                                          |

**Slots**

- default: The `pl-carousel-item` slides.

**Parts**

- `viewport`: The scrolling area.
- `controls`: The row of Previous, dots and Next.
- `previous`: The Previous button.
- `next`: The Next button.
- `pages`: The list of dots.
- `page`: A page's dot.
- `current`: The current page's dot, besides `page`.

**Events**

- `pl-change`: The current page changed after a scroll settled. `detail.index` is the zero-based page.

## Chart

```ts
import "purrlucent/chart";
```

### `<pl-chart>`

A chart that is named, themed and keyboard-operable by default, drawn by TanStack Charts (an optional peer dependency: install `@tanstack/charts`). It is not part of `import "purrlucent"`; import `purrlucent/chart`. For the common cases give it a `type`, `data` and the keys to read: `<pl-chart label="Visits by month" type="line" x="month" y="visits">` with `chart.data = [...]`. For anything else pass a TanStack `definition`; it is drawn with the same palette, fonts and tooltip. Either way a native table of the same values is in the page for assistive technology; `show-table` shows it. The tooltip and the arrow keys (the chart is one tab stop) are on by default. Series colors come from `--pl-chart-1` to `--pl-chart-6`, which you can set on the element. `label` is required: it is the chart's accessible name. Say what is measured, for whom, over which period and in which unit.

| Attribute      | Type                     | Default | Description                                                                                                                              |
| -------------- | ------------------------ | ------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `label`        | `string \| undefined`    |         | The accessible name. Required; without it the chart warns in the console.                                                                |
| `description`  | `string \| undefined`    |         | Context a reader needs that is not already nearby, such as how gaps are drawn. It becomes the chart's accessible description.            |
| `type`         | `ChartType \| undefined` |         | `bar`, `line`, `area` or `donut`. Not needed when `definition` is set.                                                                   |
| `x`            | `string \| undefined`    |         | The key of the category in each row.                                                                                                     |
| `y`            | `string \| undefined`    |         | The key of the value in each row. A comma-separated list (`desktop,mobile`) draws one series per key, for rows that hold several values. |
| `series`       | `string \| undefined`    |         | The key that names the series, for rows with one value each.                                                                             |
| `x-label`      | `string \| undefined`    |         | The name of the categories: an axis title and the table's first column heading.                                                          |
| `y-label`      | `string \| undefined`    |         | The name and unit of the values: an axis title and the heading of a single series.                                                       |
| `aspect-ratio` | `number \| undefined`    |         | Width over height. Defaults to 16/9, and 1 for a donut.                                                                                  |
| `legend`       | `boolean`                | `false` | Lists the series, or a donut's slices, with their colors under the chart.                                                                |
| `show-table`   | `boolean`                | `false` | Shows the table of values under the chart. It is always in the page for assistive technology.                                            |

**Parts**

- `legend`: The list of series.
- `swatch`: A series' color chip in the legend.
- `data`: The wrapper of the table of values.

**CSS properties**

- `--pl-chart-1`: The first series color. Up to `--pl-chart-6`.

**Events**

- `pl-select`: A point was activated with a click, Enter or Space. `detail.datum` is the row it came from.

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

## Command

```ts
import "purrlucent/command";
```

### `<pl-command-item>`

One command in a `pl-command`. Its text is the label, and the search matches against it. The command marks the active item with `data-active`; this element does nothing alone.

| Attribute  | Type      | Default | Description                                               |
| ---------- | --------- | ------- | --------------------------------------------------------- |
| `value`    | `string`  | `""`    | What `pl-select` reports. Defaults to the label.          |
| `disabled` | `boolean` | `false` | Skipped by the keyboard and cannot be activated.          |
| `detail`   | `string`  | `""`    | Trailing text such as a shortcut. The `detail` slot wins. |

**Slots**

- default: The label.
- `icon`: A leading svg.
- `detail`: Trailing content, such as a shortcut.

**Parts**

- `label`: The label wrapper.
- `detail`: The trailing text wrapper.

### `<pl-command-group>`

A labelled run of `pl-command-item` children. The group hides while the search leaves none of its items showing.

| Attribute | Type     | Default | Description                                   |
| --------- | -------- | ------- | --------------------------------------------- |
| `label`   | `string` | `""`    | The heading, and the group's accessible name. |

**Slots**

- default: The `pl-command-item` children.

**Parts**

- `heading`: The visible heading.

### `<pl-command>`

A command palette: a search field above a list of commands that is always showing. It follows the editable combobox pattern with list autocomplete: a native input does the editing and keeps focus, the `pl-command-item` children (loose or inside `pl-command-group`) are the options, and the active one is the input's active descendant. Typing hides the items whose label does not contain the text, case-insensitively, and groups left empty; the first item that remains becomes active, and a "No results" row shows when none does. Down and Up move the active item with wrap and skip disabled ones, Home and End jump to the first and last, Enter activates it, and Escape clears the text. Escape with no text is left to the page, so inside a `pl-dialog` it closes the dialog. Activating an item, with Enter or a click, fires `pl-select`. It does not close or reset anything itself. Put `autofocus` on it to focus the search field when a dialog opens.

| Attribute     | Type                    | Default        | Description                                                            |
| ------------- | ----------------------- | -------------- | ---------------------------------------------------------------------- |
| `label`       | `string`                | `"Commands"`   | The accessible name of the field and the list. Defaults to "Commands". |
| `placeholder` | `string`                | `"Search"`     | Hint shown while the field is empty. Defaults to "Search".             |
| `query`       | `string`                | `""`           | The text in the search field.                                          |
| `empty-label` | `string`                | `"No results"` | The text shown when no item matches. Defaults to "No results".         |
| `clear-label` | `string`                | `"Clear"`      | The clear button's accessible name. Defaults to "Clear".               |
| `_active`     | `PlCommandItem \| null` | `null`         |                                                                        |

**Slots**

- default: The `pl-command-item` and `pl-command-group` children.

**Parts**

- `field`: The shell around the search input.
- `glyph`: The magnifier.
- `control`: The native input.
- `clear`: The clear button.
- `list`: The list of items.
- `empty`: The "no results" row.

**Events**

- `name`:
- `pl-input`: The search text changed through typing, Escape or the clear button. `detail.query` holds it.
- `pl-select`: An item was activated. `detail.value` holds its value.
- `input`: After each pl-input, as a native input fires it.

## Data table

```ts
import "purrlucent/data-table";
```

### `<pl-data-table>`

A native table drawn from `columns` and `rows`, with sortable headings and optional row selection. A sortable heading is a button inside its `<th>`, and the sorted column carries `aria-sort`. A click sorts ascending; a click on the sorted column reverses it. The rows are sorted here unless `manual-sort` is set, which leaves the order to the app (which then answers `pl-sort`). With `selectable`, each row has a checkbox and the header has a select-all checkbox that shows mixed when some rows are selected. Every row is rendered; there is no virtualization. With no rows, the `empty` slot (or `empty-label`) shows in place of the body.

| Attribute          | Type                  | Default        | Description                                                                                                                                    |
| ------------------ | --------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `caption`          | `string \| undefined` |                | A visible caption that also names the table.                                                                                                   |
| `sticky-header`    | `boolean`             | `false`        | The headings stay at the top while the rows scroll; give the element a `max-block-size`.                                                       |
| `selectable`       | `boolean`             | `false`        | Adds a checkbox column.                                                                                                                        |
| `row-key`          | `string`              | `"id"`         | The row property that identifies a row in `selected` and `pl-selection-change`. Defaults to `id`; a row without it is identified by its index. |
| `sort-column`      | `string \| undefined` |                | The `key` of the sorted column.                                                                                                                |
| `sort-direction`   | `PlSortDirection`     | `"ascending"`  | `ascending` (default) or `descending`.                                                                                                         |
| `manual-sort`      | `boolean`             | `false`        | Do not reorder the rows; the app does it on `pl-sort`.                                                                                         |
| `empty-label`      | `string`              | `"No results"` | The text shown when there are no rows and the `empty` slot is unused. Defaults to "No results".                                                |
| `select-all-label` | `string`              | `"Select all"` | The select-all checkbox's accessible name. Defaults to "Select all".                                                                           |
| `select-row-label` | `string`              | `"Select"`     | Prefix of each row checkbox's accessible name, followed by the row's first cell. Defaults to "Select".                                         |

**Slots**

- `empty`: Content shown instead of the rows when there are none.

**Events**

- `name`:
- `pl-sort`: A heading was activated. `detail.column` is the column key and `detail.direction` the new direction.
- `pl-selection-change`: The selection changed through a checkbox. `detail.keys` holds the selected row keys, in row order.

## Date picker

```ts
import "purrlucent/date-picker";
```

### `<pl-date-picker>`

A field for one day. The text entry takes the day as the locale writes it (`11/22/2026`, `22.11.2026`) or as an ISO day (`2026-11-22`); the button beside it opens a `pl-calendar` in a popover, and choosing a day there fills the field, closes the popover and returns focus to the button. The slotted text is a visible label; without it, `label` becomes the entry's accessible name, and without both a native `<label for>` names it. The `value` is the ISO day, `yyyy-mm-dd`, or empty while the text is not a day that can be chosen. It takes part in forms like a native input: it submits `name` with its value, a reset returns it to its `value` attribute, a disabled fieldset disables it, and a day that is not real, or is outside `min` and `max` or one of the disabled days, makes the form invalid. Alt and Down Arrow in the entry open the calendar.

| Attribute         | Type                      | Default                       | Description                                                                                                                                             |
| ----------------- | ------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`           | `string`                  | `""`                          | The starting day, `yyyy-mm-dd`. The `value` property holds the current one.                                                                             |
| `label`           | `string \| undefined`     |                               | The accessible name when there is no slotted label.                                                                                                     |
| `size`            | `"md" \| "lg" \| "xl"`    | `"md"`                        | `md` (default), `lg` or `xl`.                                                                                                                           |
| `name`            | `string`                  | `""`                          | The name submitted with a form.                                                                                                                         |
| `placeholder`     | `string \| undefined`     |                               | Hint shown while the entry is empty, for example the format the locale expects.                                                                         |
| `min`             | `string \| undefined`     |                               | The earliest day that can be chosen, `yyyy-mm-dd`.                                                                                                      |
| `max`             | `string \| undefined`     |                               | The latest day that can be chosen, `yyyy-mm-dd`.                                                                                                        |
| `disabled-dates`  | `PlCalendarDisabledDates` | `[]`                          | Days that cannot be chosen, as ISO days separated by commas or spaces. The `disabledDates` property also takes a function from an ISO day to a boolean. |
| `locale`          | `string \| undefined`     |                               | A BCP 47 tag for the day format, names and first weekday. Defaults to the closest `lang`, else the document's, else the browser's.                      |
| `first-day`       | `number \| undefined`     |                               | The calendar's first day of the week, 1 (Monday) to 7 (Sunday). Defaults to the locale's.                                                               |
| `required`        | `boolean`                 | `false`                       | The form is invalid while the field is empty.                                                                                                           |
| `readonly`        | `boolean`                 | `false`                       | The text can be selected but not edited and the calendar does not open.                                                                                 |
| `disabled`        | `boolean`                 | `false`                       | No focus, nothing submitted.                                                                                                                            |
| `calendar-label`  | `string`                  | `"Choose date"`               | The calendar button's and the popover's accessible name. Defaults to "Choose date".                                                                     |
| `invalid-message` | `string`                  | `"Enter a valid date."`       | The message for text that is not a day. Defaults to "Enter a valid date."                                                                               |
| `range-message`   | `string`                  | `"Choose an available date."` | The message for a day outside `min` and `max` or one of the disabled days. Defaults to "Choose an available date."                                      |
| `_text`           | `string`                  | `""`                          | What the entry shows. It follows `value`, except while the typed text is not a day.                                                                     |
| `_labelled`       | `boolean`                 | `false`                       |                                                                                                                                                         |

**Slots**

- default: The visible label.

**Parts**

- `label`: The visible label.
- `field`: The shell around the entry and the button.
- `control`: The native text entry.
- `trigger`: The button that opens the calendar.
- `calendar`: The calendar in the popover.
- `message`: The icon and validation message below the field while it is invalid.

**Events**

- `name`:
- `pl-input`: The value changed through typing or the calendar. `detail.value` holds the ISO day, or an empty string while the text is not a day that can be chosen.
- `pl-change`: The value was committed (blur or Enter after typing, or a day chosen in the calendar). `detail.value` holds it.
- `input`: After each edit, as a native input fires it.
- `change`: After each pl-change, as a native input fires it.

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

## Hover card

```ts
import "purrlucent/hover-card";
```

### `<pl-hover-card>`

Supplementary content that previews what its trigger points at: a floating card anchored to the trigger. It opens after a short delay when the pointer rests on the trigger or keyboard focus reaches it, and at once on a press. On a touch screen a first tap on the trigger opens it instead of activating the trigger; a tap while it is open activates the trigger as usual. It stays open while the pointer or focus is on the trigger or inside the card, and closes after a short delay when both have left, on Escape (focus that was in the card returns to the trigger) and on a press outside. Nothing is reachable only by hover, but the card is supplementary: what it says must also be available without it, and it never holds the only way to do something. The element sets `aria-expanded` on the trigger. The card is a group, named by `label` when you give one, in the reading order right after the trigger: an id reference cannot reach into a shadow root, so the trigger is not given `aria-describedby`.

| Attribute   | Type                                    | Default    | Description                                                                                                                                       |
| ----------- | --------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `label`     | `string`                                | `""`       | The card's accessible name. Optional.                                                                                                             |
| `placement` | `"top" \| "bottom" \| "start" \| "end"` | `"bottom"` | Where the card opens: `bottom` (default), `top`, `start` or `end`. It flips when the side has no room.                                            |
| `open`      | `boolean`                               | `false`    | The card is showing. Opening it closes any other open hover card in the same document or shadow root, except one that holds it or sits inside it. |

**Slots**

- default: The card's content.
- `trigger`: The control or link the card is about.

**Parts**

- `panel`: The floating card.
- `arrow`: The arrow pointing at the trigger.

**CSS properties**

- `--pl-hover-card-open-delay`: How long the pointer or focus must rest on the trigger before the card opens. Default `700ms`.
- `--pl-hover-card-close-delay`: How long the card waits after the pointer and focus have both left before it closes. Default `300ms`.

**Events**

- `pl-toggle`: The card opened or closed. `detail.open` says which.

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

## Input otp

```ts
import "purrlucent/input-otp";
```

### `<pl-input-otp>`

A one-time code field. One native input does the editing, so typing, paste, the arrow keys, Backspace, IME and the system's one-time-code autofill (an SMS code offered above the keyboard) work as in any text field; the code is drawn as one box per character. It takes part in forms like `pl-input`: it submits `name` with its value, a reset returns it to its `value` attribute, a disabled fieldset disables it, and `required` and `pattern` set its validity. A code that is started but shorter than `length` is invalid, with a message once the field is left. Spaces and dashes are dropped, so a pasted "123 456" fills all boxes.

| Attribute            | Type                   | Default     | Description                                                                               |
| -------------------- | ---------------------- | ----------- | ----------------------------------------------------------------------------------------- |
| `length`             | `number`               | `6`         | How many characters the code has. Defaults to 6.                                          |
| `value`              | `string`               | `""`        | The starting value. The `value` property holds the current one.                           |
| `label`              | `string \| undefined`  |             | The accessible name when there is no slotted label.                                       |
| `inputmode`          | `string`               | `"numeric"` | `numeric` (default) accepts digits only; `text` accepts letters and digits.               |
| `size`               | `"md" \| "lg" \| "xl"` | `"md"`      | `md` (default), `lg` or `xl`.                                                             |
| `name`               | `string`               | `""`        | The name submitted with a form.                                                           |
| `required`           | `boolean`              | `false`     | The form is invalid while the field is empty.                                             |
| `readonly`           | `boolean`              | `false`     | The value can be selected but not edited.                                                 |
| `disabled`           | `boolean`              | `false`     | No focus, nothing submitted.                                                              |
| `pattern`            | `string \| undefined`  |             | A regular expression the whole value must match.                                          |
| `incomplete-message` | `string \| undefined`  |             | The message shown for a code shorter than `length`. Defaults to "Enter all N characters." |
| `_labelled`          | `boolean`              | `false`     |                                                                                           |
| `_focused`           | `boolean`              | `false`     |                                                                                           |
| `_start`             | `number`               | `0`         |                                                                                           |
| `_end`               | `number`               | `0`         |                                                                                           |

**Slots**

- default: The visible label.

**Parts**

- `label`: The visible label.
- `field`: The row of boxes.
- `box`: One character box.
- `control`: The native input, stretched over the boxes.
- `message`: The icon and validation message below the field while it is invalid.

**Events**

- `name`:
- `pl-input`: The value changed through editing. `detail.value` holds it.
- `pl-change`: The value was committed (blur or Enter after an edit). `detail.value` holds it.
- `pl-complete`: An edit left the code at `length` characters. `detail.value` holds it.
- `input`: The native input event of the inner input, which crosses the shadow root.
- `change`: After each pl-change, as a native input fires it.

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

## Marker

```ts
import "purrlucent/marker";
```

### `<pl-marker>`

A row in a conversation that is not a message: a status such as "Thinking…" or "Explored 4 files", a system note, or a labelled separator such as "Today". It has no role of its own. Set `role="status"` on a row that reports live progress so assistive technology announces it. Do not set `role="separator"` on the separator variant: that role would hide the label from screen readers. The icon is decorative and hidden from them. With an `href` the row is a link; with `interactive` it is a button. Listen for `click` on the element. The icon and the label are then one control.

| Attribute     | Type              | Default     | Description                                                                                                                                                                  |
| ------------- | ----------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `variant`     | `PlMarkerVariant` | `"default"` | `default`, `border` (a rule under the row) or `separator` (the label centered between two rules).                                                                            |
| `shimmer`     | `boolean`         | `false`     | A dimmer band sweeps across the text, in reading direction. It is plain text under reduced motion and forced colors, and where the browser cannot clip a background to text. |
| `href`        | `string \| null`  | `null`      | Makes the row a link to this address.                                                                                                                                        |
| `target`      | `string \| null`  | `null`      | Where the link opens, as on `a`.                                                                                                                                             |
| `rel`         | `string \| null`  | `null`      | The link's relationship, as on `a`.                                                                                                                                          |
| `interactive` | `boolean`         | `false`     | Makes the row a button. Ignored when there is an `href`.                                                                                                                     |

**Slots**

- `icon`: A decorative icon. A `pl-spinner` marks work in progress.
- default: The text.

**Parts**

- `icon`: The wrapper around the icon.
- `label`: The wrapper around the text.
- `control`: The link or button, when the row is one.

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

Site navigation: the host is the `navigation` landmark, holding `pl-navigation-item` children in a row. Each item is a link or a disclosure button that opens a panel of links (the APG disclosure navigation pattern, not a menu). Every link and button is a tab stop. One panel is open at a time: opening one closes the others.

| Attribute | Type     | Default | Description                                               |
| --------- | -------- | ------- | --------------------------------------------------------- |
| `label`   | `string` | `""`    | The accessible name of the navigation landmark. Required. |

**Slots**

- default: `pl-navigation-item` children.

**Parts**

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

## Table

```ts
import "purrlucent/table";
```

### `<pl-table>`

Styles a native table. Slot one `<table>` (with `<caption>`, `<thead>`, `<tbody>`, `<th scope>`) and it keeps its table semantics: a custom element cannot sit inside `<table>`, so this one wraps it instead of replacing it. The rules are adopted as a stylesheet into the root the element is in. The wrapper scrolls when the table is wider or taller than the space it gets, and then takes a tab stop so the keyboard can scroll it. It is named by `label`, or else by the table's caption; without either, the scroll area has no accessible name. Set a `max-block-size` on the element to make `sticky-header` useful. A static table is not a grid: do not add `role=grid`.

| Attribute       | Type                  | Default | Description                                                              |
| --------------- | --------------------- | ------- | ------------------------------------------------------------------------ |
| `label`         | `string \| undefined` |         | The accessible name of the scroll area. Defaults to the table's caption. |
| `sticky-header` | `boolean`             | `false` | The header cells stay at the top while the rows scroll.                  |
| `_scrollable`   | `boolean`             | `false` |                                                                          |
| `_caption`      | `string`              | `""`    |                                                                          |

**Slots**

- default: A native `<table>`.

**Parts**

- `scroller`: The scroll container.

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

## Toast

```ts
import "purrlucent/toast";
```

### `<pl-toast>`

A non-blocking status message: a title, an optional description, an optional action and a close button. It never takes focus when it appears. Inside a `pl-toaster` the toaster's live region announces it, and a destructive toast is a `role="alert"` of its own; outside one it is a `status` (or `alert`) itself. A toast without an action dismisses itself after `duration` milliseconds. The countdown pauses while the pointer is over the toast or focus is inside it, and resumes with what is left. It does not depend on any animation, so reduced motion changes nothing about it. A toast with an action stays until it is closed, because the action may be the only way to act on it. Escape closes the toast that has focus and returns focus to where it was. A closed toast stays closed; show a new one.

| Attribute     | Type             | Default     | Description                                                                                             |
| ------------- | ---------------- | ----------- | ------------------------------------------------------------------------------------------------------- |
| `variant`     | `PlToastVariant` | `"neutral"` | `neutral` (default) or `destructive`.                                                                   |
| `duration`    | `number`         | `6000`      | Milliseconds before it dismisses itself. Defaults to 6000. 0 keeps it. Ignored when there is an action. |
| `close-label` | `string`         | `"Dismiss"` | The close button's accessible name. Defaults to "Dismiss".                                              |

**Slots**

- `title`: The heading.
- default: The description.
- `action`: A `pl-button`. Pressing it closes the toast, unless its click is prevented.

**Parts**

- `text`: The title and description.
- `close`: The close button.

**Events**

- `pl-close`: The toast closed: the close button, Escape, its time ran out, or its action was pressed.

### `<pl-toaster>`

The region toasts appear in: a stack at the inline-end bottom edge of the viewport (the left under right-to-left), in the top layer, newest last. Place one per page, early, and leave it in the document: a live region announces what is added to it, so it must exist before the first toast. It is a polite `status` that announces each addition on its own. Show a toast from script. `toaster.show()` adds one to that toaster; `PlToaster.show()` uses the page's first `pl-toaster`, and makes one when there is none (that first toast then waits a moment so it is announced). Both return the `pl-toast`, which is removed when it closes. `js PlToaster.show({ title: "Message deleted", description: "It is gone from every device.", action: { label: "Undo", onClick: () => restore() }, }); PlToaster.show({ title: "Not saved", variant: "destructive" }); ` Or write `pl-toast` elements inside it.

**Slots**

- default: The toasts.

**Events**

- `pl-close`: A toast in it closed. Bubbles from the toast.

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
