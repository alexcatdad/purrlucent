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

Listen to an event with `on` followed by its exact name. The event's `detail` holds its data and is typed, so `e.detail.value` below is a `string`; the [component reference](./components.md) lists each element's events:

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

The form controls take part in a native `<form>` like built-in inputs: they submit their `name` and value, reset with the form, and report validity. Read them with `FormData` in a submit handler.

They also fire the native `input` and `change` events after their own `pl-input` and `pl-change`, so `onInput` and `onChange` work as on a built-in input. Read the new state from the element:

```tsx
<pl-switch checked={wifi} onChange={(e) => setWifi(e.currentTarget.checked)}>
  Wi-Fi
</pl-switch>
```

`onChange` fires when the user commits a change: when a text field loses focus after an edit, on Enter in a single-line field, and at once for a choice such as a switch, a select or a stepper button. `onInput` fires on each edit. While someone types in `pl-number-field` or `pl-combobox`, their `value` stays the last committed one; read the text being typed from the `pl-input` event's `detail`.

Changing `value` or `checked` from code fires no event, as with a built-in input.

### react-hook-form

Spread `register` onto a control as onto a built-in input. `pl-checkbox` and `pl-switch` have a `type` of `checkbox`, so their field is a boolean:

```tsx
const { register, handleSubmit } = useForm<{ name: string; news: boolean }>();

<form onSubmit={handleSubmit(save)}>
  <pl-input label="Name" {...register("name", { required: true })} />
  <pl-checkbox {...register("news")}>Newsletter</pl-checkbox>
  <pl-button type="submit" variant="primary">
    Save
  </pl-button>
</form>;
```

## Links and routing

A `pl-button` with an `href` is a link with the button's look: opening in a new tab, the context menu and copying the address work as on any link. Its `click` reaches the host, so a router can take a plain click and leave the others to the browser. This example uses TanStack Router's `useNavigate`; any router's navigate function works the same way:

```tsx
import { useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";

function ButtonLink({ to, children }: { to: string; children: ReactNode }) {
  const navigate = useNavigate();
  return (
    <pl-button
      href={to}
      onClick={(e) => {
        // Let the browser handle new-tab and download clicks.
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0)
          return;
        e.preventDefault();
        void navigate({ to });
      }}
    >
      {children}
    </pl-button>
  );
}
```

Without the handler the browser follows the link. A `disabled` link has no address and cannot be focused. An icon link takes its name from `aria-label`, as an icon button does.

## Account menu

A sidebar footer row that opens a menu is a `pl-sidebar-item` with `action` as the `trigger` of a `pl-menu` in the sidebar's `footer` slot. Language and Theme are submenus of radio items; the parent row's `detail` shows the current choice. Choosing an item fires `pl-select` with its `value`, and the radio group moves its own check:

```tsx
function AccountMenu({ language, theme, onLanguage, onTheme }: Props) {
  return (
    <pl-sidebar label="Workspace">
      <pl-sidebar-item href="/" selected>
        Home
      </pl-sidebar-item>
      <pl-menu
        slot="footer"
        label="Account"
        placement="top-start"
        onpl-select={(e) => {
          const { value, item } = e.detail;
          const group = item.parentElement?.label;
          if (group === "Language") onLanguage(value);
          if (group === "Theme") onTheme(value);
        }}
      >
        <pl-sidebar-item slot="trigger" action>
          <pl-avatar slot="icon" name="Ada Lovelace" />
          Ada Lovelace
        </pl-sidebar-item>
        <pl-menu-item href="/profile">Profile</pl-menu-item>
        <pl-menu-separator />
        <pl-menu-item detail={language === "sv" ? "Svenska" : "English"}>
          Language
          <pl-menu slot="submenu" label="Language">
            <pl-menu-item type="radio" value="en" checked={language === "en"}>
              English
            </pl-menu-item>
            <pl-menu-item type="radio" value="sv" checked={language === "sv"}>
              Svenska
            </pl-menu-item>
          </pl-menu>
        </pl-menu-item>
        <pl-menu-item detail={theme}>
          Theme
          <pl-menu slot="submenu" label="Theme">
            <pl-menu-item
              type="radio"
              value="system"
              checked={theme === "system"}
            >
              System
            </pl-menu-item>
            <pl-menu-item
              type="radio"
              value="light"
              checked={theme === "light"}
            >
              Light
            </pl-menu-item>
            <pl-menu-item type="radio" value="dark" checked={theme === "dark"}>
              Dark
            </pl-menu-item>
          </pl-menu>
        </pl-menu-item>
      </pl-menu>
    </pl-sidebar>
  );
}
```

The `AccountMenu` story under Sidebar shows the same markup.

## Language

Register each language's text once with `setMessages` from `purrlucent/locale`; the [install guide](./install.md#languages) lists the keys. To switch language while the app runs, set `lang` and leave the rest to the elements: they update their text and the messages the library writes without a re-render from React. The [install guide](./install.md#languages) lists what follows the language.

```tsx
function setLanguage(lang: "en" | "sv") {
  document.documentElement.lang = lang;
}
```

## Styling

Change the look with tokens first: every `--pl-*` custom property reaches inside the elements. Set them in your global CSS or on any element. For one part of an element, use `::part()`; the [component reference](./components.md) lists each element's parts:

```css
:root {
  --pl-color-accent: oklch(51% 0.17 250deg);
}

pl-button::part(label) {
  letter-spacing: 0.02em;
}
```

`className` and `style` set on an element style its host box, as on any element. The [install guide](./install.md#theming) covers theming in full.

## Testing

Test components that use purrlucent in a real browser, for example with [Vitest browser mode](https://vitest.dev/guide/browser/) and its Playwright provider. jsdom and happy-dom do not implement the parts of `ElementInternals` the form controls use, such as `setFormValue` and `setValidity`, so form values and validity do not work there.

In a test, wait for an element to render before reading it, and find its inner parts through its shadow root:

```ts
const select = document.querySelector("pl-select")!;
await select.updateComplete;
select.shadowRoot!.querySelector('[part="listbox"]');
```

## Server rendering

The elements render in the browser only. A client-rendered app, such as a Vite single-page app, needs nothing more. With server rendering, render them on the client only.
