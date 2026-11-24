# Install purrlucent

purrlucent is published as a GitHub Release. It is not on the npm registry or GitHub Packages. Each release has one package file, `purrlucent-<version>.tgz`, and you install it from its URL. No token is needed.

The URL has this form:

```text
https://github.com/alexcatdad/purrlucent/releases/download/v<version>/purrlucent-<version>.tgz
```

Replace `<version>` with a version from the [releases page](https://github.com/alexcatdad/purrlucent/releases).

## Install with Bun

```sh
bun add purrlucent@https://github.com/alexcatdad/purrlucent/releases/download/v<version>/purrlucent-<version>.tgz
```

## Install with npm 12 or later

From npm 12, `allow-remote` defaults to `none`, so npm refuses to install from a URL. Set it to `root` in your project's `.npmrc`. This allows only the URLs listed in your own `package.json`:

```ini
allow-remote=root
```

Then install:

```sh
npm install purrlucent@https://github.com/alexcatdad/purrlucent/releases/download/v<version>/purrlucent-<version>.tgz
```

## Use it

Import the tokens once, then import the components you use. Each component has its own import path:

```ts
import "purrlucent/tokens.css";
import "purrlucent/button";
```

```html
<pl-button>Save</pl-button>
```

`import "purrlucent"` loads every component at once. The [component reference](./components.md) lists each element with its attributes, slots, parts and events. For a React app, see [Use with React](./react.md).

### Page background and text

Control fills are translucent and tint whatever is behind them, so paint the page with the background token. Set the text color and font the same way:

```css
body {
  background: var(--pl-color-background);
  color: var(--pl-color-foreground);
  font-family: var(--pl-font-sans);
}
```

### Font

The font token is `"Inter", system-ui, sans-serif`. The package ships no font file. Load Inter in your app to get it, or leave it out and the system font is used.

### Light and dark

Colors follow the page's `color-scheme`, which the tokens set to `light dark`, so the components follow the system setting. To force one, set it yourself:

```css
:root {
  color-scheme: dark;
}
```

### Tailwind CSS

Tailwind's preflight sets `margin`, `padding` and `border` to zero on every element, and a rule from the page outranks a component's own styles, so the elements lose their spacing and edges. Import `purrlucent/tailwind.css` after Tailwind; it hands those three back to every purrlucent element:

```css
@import "tailwindcss";
@import "purrlucent/tailwind.css";
```

### Forms

`pl-button` with `type="submit"` or `type="reset"` acts on the form it is in. The input controls, such as `pl-switch`, submit their `name` and `value` with the form, return to their starting state on reset, and are disabled by a disabled `fieldset`.

```html
<form>
  <pl-switch name="wifi" checked>Wi-Fi</pl-switch>
  <pl-button type="submit" variant="primary">Save</pl-button>
</form>
```

### TypeScript

The package ships type declarations. Each import adds its elements to `HTMLElementTagNameMap`, so `document.querySelector("pl-button")` is typed.

The package also ships `purrlucent/custom-elements.json`, the Custom Elements Manifest. Editors and frameworks can use it for typings and completion.

### Coding agents

Install the agent skill with the GitHub CLI or with `npx skills`. Replace `<version>` with the installed package version:

```sh
gh skill install alexcatdad/purrlucent purrlucent@v<version> --agent claude-code
npx skills add alexcatdad/purrlucent@v<version> --skill purrlucent -a claude-code
```

Pin the skill to the installed version so its references match the elements in your app.

The package also ships the skill in `node_modules/purrlucent/dist/skills/purrlucent/` for offline use.

## Upgrade

The version is part of the URL. To upgrade, install again with the new version in the URL.

## Glass mode

Surfaces are solid by default. To turn on glass, set `pl-material="glass"` on any ancestor, usually `<html>`:

```html
<html pl-material="glass"></html>
```

Glass applies only to controls and navigation. Content stays plain in both modes. A surface falls back to solid when the browser has no `backdrop-filter`, or when the user asks for reduced transparency or more contrast.

## Theming

You change the look in three ways. Use them in this order.

### Tokens

Every color, size and duration is a custom property with the `--pl-` prefix. Override them on `:root` or on any element:

```css
:root {
  --pl-color-accent: oklch(51% 0.17 250deg);
  --pl-radius: 6px;
}
```

The tokens are in the `pl.tokens` cascade layer, so your unlayered styles win without extra selectors. Keep your colors readable: the contrast checks apply to the defaults, not to your overrides.

### Parts

Elements expose named parts for styling from outside. For example, `<pl-button>` exposes `label`:

```css
pl-button::part(label) {
  letter-spacing: 0.02em;
}
```

### Slots

Content goes into slots. The default slot of `<pl-button>` holds its label, and the label is required for an accessible name.

The Custom Elements Manifest lists the parts, slots, events and properties of every component.
