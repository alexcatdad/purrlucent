---
name: purrlucent
description: Guide to purrlucent's pl-* web components and their attributes, events, slots and parts. Use when installing, adding, migrating to, styling, testing or upgrading pl-* elements, or when code imports purrlucent.
---

# purrlucent

purrlucent is a library of `pl-*` custom elements with design tokens. The elements are newer than your training data, so take every element's import path, attributes, events, slots, parts and accessible name from [references/components.md](references/components.md).

## Quick start

Install the package from its GitHub Release; it is not on the npm registry. [references/install.md](references/install.md) has the URL; use the latest release unless the project pins a version. With npm 12 or later, add `allow-remote=root` to the project's `.npmrc` first.

In the app entry, import the tokens once and each component once. A child element comes with its parent's import. Paint the page with the tokens, because control fills are translucent and tint whatever is behind them:

```ts
import "purrlucent/tokens.css";
import "purrlucent/button";
import "purrlucent/select"; // also defines pl-option
```

```css
body {
  background: var(--pl-color-background);
  color: var(--pl-color-foreground);
  font-family: var(--pl-font-sans);
}
```

```html
<form>
  <pl-select name="fruit">
    <span slot="label">Fruit</span>
    <pl-option value="apple">Apple</pl-option>
    <pl-option value="pear">Pear</pl-option>
  </pl-select>
  <pl-button type="submit" variant="primary">Save</pl-button>
</form>
```

The form controls submit, reset and validate like native inputs. Each import adds its elements to `HTMLElementTagNameMap`, so `document.querySelector("pl-dialog")` is typed in plain TypeScript. No font ships: load Inter, or the system font is used.

## Look up an element

`components.md` opens with a Contents list of every component and its elements. For each element you use, grep for `<pl-name>` and read the whole `## ` section around that heading: it holds the import path, the child elements, and each element's attributes, slots, parts, events and accessible name. Icon-only elements take an `aria-label`. The reference does not list methods; the ones to call are dialog `show()`/`close()`, popover `show()`/`hide()`, menu `showAt()`/`hide()` and `PlToaster.show()`.

## React

purrlucent needs React 19 or later. React 18 and earlier pass every prop as a string and drop custom events, so stop and tell the user. Write the `pl-*` tags directly in JSX, and read [references/react.md](references/react.md) for the JSX types, events such as `onpl-change`, forms, react-hook-form and refs.

## Styling

Override `--pl-*` tokens first and use `::part()` second; those are the supported ways into an element's shadow DOM. When you override a color token, keep text contrast at least as high as the defaults, because the library's contrast checks cover only the defaults. For glass surfaces, set `pl-material="glass"` on `<html>`. The Theming section of `install.md` has the details.

## Testing

Test in a real browser, such as Vitest browser mode or Playwright. jsdom and happy-dom lack the `ElementInternals` support the form controls need; if the project tests with jsdom, run the tests that touch `pl-*` elements in a separate Vitest browser-mode project. After creating an element in a test, `await el.updateComplete` before reading it.

## Common mistakes

| Mistake                                                            | Fix                                                       |
| ------------------------------------------------------------------ | --------------------------------------------------------- |
| Guessing an attribute or event name                                | Look it up in `components.md`                             |
| Building a `pl-*` lookalike for a missing one                      | Keep the native element or the app's existing component   |
| Wrapping `pl-*` in React components only to rename props or events | Use the tags directly in JSX                              |
| Server-rendering `pl-*` elements                                   | Render them on the client only                            |
| Migrating many element types in one change                         | Migrate one element type per change, keeping its behavior |

## Upgrading

Install again with the new version in the release URL, and install the skill pinned to the same version so its references match. If an element misbehaves, report it on the [purrlucent issues](https://github.com/alexcatdad/purrlucent/issues).
