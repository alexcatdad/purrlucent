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

`purrlucent/react` adds every `pl-*` element to React's JSX types, with its props and its events. Load it once, for example in `src/vite-env.d.ts`:

```ts
import type {} from "purrlucent/react";
```

The types are generated from the components on every release, so they match the version you install.

## Use the elements

Write the elements as JSX tags. Props are set as properties, so booleans, numbers and strings all work:

```tsx
<pl-button variant="primary" disabled={saving}>
  Save
</pl-button>
```

Listen to an event with `on` followed by its exact name. The event's `detail` holds its data; the [component reference](./components.md) lists each element's events:

```tsx
const [fruit, setFruit] = useState("apple");

<pl-select value={fruit} onpl-change={(e) => setFruit(e.detail.value)}>
  <span slot="label">Fruit</span>
  <pl-option value="apple">Apple</pl-option>
  <pl-option value="pear">Pear</pl-option>
</pl-select>;
```

Call an element's methods through a ref:

```tsx
const dialog = useRef<PlDialog>(null);
// import type { PlDialog } from "purrlucent/dialog";

<pl-button onpl-press={() => dialog.current?.show()}>Delete…</pl-button>;
```

Use `className`, `slot`, `id` and the other usual attributes as on any element.

## Forms

The form controls take part in a native `<form>` like built-in inputs: they submit their `name` and value, reset with the form, and report validity. Read them with `FormData` in a submit handler, or keep them controlled with `value` and their `pl-change` event.

## Server rendering

The elements render in the browser only. A client-rendered app, such as a Vite single-page app, needs nothing more. With server rendering, render them on the client only.
