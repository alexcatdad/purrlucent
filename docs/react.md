# Use with React

purrlucent's elements are standard custom elements, which React 19 supports directly: it sets props as properties and listens to custom events. React 18 and earlier pass every prop as a string attribute and do not listen to custom events; use React 19.

## Set up

Install the package as the [install guide](./install.md) describes. Then, in your entry file (for example `src/main.tsx` in a Vite app), load the tokens and the components you use. Each import defines its elements once:

```ts
import "purrlucent/tokens.css";
import "purrlucent/button";
import "purrlucent/select";
```

Add the page background, text color and font from the install guide to your global CSS.

## Types

`purrlucent/react` adds every `purr-*` element to React's JSX types, with its props and its events. Load it once, for example in `src/vite-env.d.ts`:

```ts
import type {} from "purrlucent/react";
```

The types are generated from the components on every release, so they match the version you install.

## Use the elements

Write the elements as JSX tags. Props are set as properties, so booleans, numbers and strings all work:

```tsx
<purr-button variant="primary" disabled={saving}>
  Save
</purr-button>
```

Listen to an event with `on` followed by its exact name. The event's `detail` holds its data and is typed, so `e.detail.value` below is a `string`; the [component reference](./components.md) lists each element's events:

```tsx
const [fruit, setFruit] = useState("apple");

<purr-select value={fruit} onpurr-change={(e) => setFruit(e.detail.value)}>
  <span slot="label">Fruit</span>
  <purr-option value="apple">Apple</purr-option>
  <purr-option value="pear">Pear</purr-option>
</purr-select>;
```

Call an element's methods through a ref:

```tsx
const dialog = useRef<PurrDialog>(null);
// import type { PurrDialog } from "purrlucent/dialog";

<purr-button onpurr-press={() => dialog.current?.show()}>Delete…</purr-button>;
```

Use `className`, `slot`, `id` and the other usual attributes as on any element.

## Forms

The form controls take part in a native `<form>` like built-in inputs: they submit their `name` and value, reset with the form, and report validity. Read them with `FormData` in a submit handler.

They also fire the native `input` and `change` events after their own `purr-input` and `purr-change`, so `onInput` and `onChange` work as on a built-in input. Read the new state from the element:

```tsx
<purr-switch checked={wifi} onChange={(e) => setWifi(e.currentTarget.checked)}>
  Wi-Fi
</purr-switch>
```

`onChange` fires when the user commits a change: when a text field loses focus after an edit, on Enter in a single-line field, and at once for a choice such as a switch, a select or a stepper button. `onInput` fires on each edit. While someone types in `purr-number-field` or `purr-combobox`, their `value` stays the last committed one; read the text being typed from the `purr-input` event's `detail`.

Changing `value` or `checked` from code fires no event, as with a built-in input.

### react-hook-form

Spread `register` onto a control as onto a built-in input. `purr-checkbox` and `purr-switch` have a `type` of `checkbox`, so their field is a boolean:

```tsx
const { register, handleSubmit } = useForm<{ name: string; news: boolean }>();

<form onSubmit={handleSubmit(save)}>
  <purr-input label="Name" {...register("name", { required: true })} />
  <purr-checkbox {...register("news")}>Newsletter</purr-checkbox>
  <purr-button type="submit" variant="primary">
    Save
  </purr-button>
</form>;
```

## Styling

Change the look with tokens first: every `--purr-*` custom property reaches inside the elements. Set them in your global CSS or on any element. For one part of an element, use `::part()`; the [component reference](./components.md) lists each element's parts:

```css
:root {
  --purr-color-accent: oklch(51% 0.17 250deg);
}

purr-button::part(label) {
  letter-spacing: 0.02em;
}
```

`className` and `style` set on an element style its host box, as on any element. The [install guide](./install.md#theming) covers theming in full.

## Testing

Test components that use purrlucent in a real browser, for example with [Vitest browser mode](https://vitest.dev/guide/browser/) and its Playwright provider. jsdom and happy-dom do not implement the parts of `ElementInternals` the form controls use, such as `setFormValue` and `setValidity`, so form values and validity do not work there.

In a test, wait for an element to render before reading it, and find its inner parts through its shadow root:

```ts
const select = document.querySelector("purr-select")!;
await select.updateComplete;
select.shadowRoot!.querySelector('[part="listbox"]');
```

## Server rendering

The elements render in the browser only. A client-rendered app, such as a Vite single-page app, needs nothing more. With server rendering, render them on the client only.
