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
<purr-button>Save</purr-button>
```

The package also ships `purrlucent/custom-elements.json`, the Custom Elements Manifest. Editors and frameworks can use it for typings and completion.

## Upgrade

The version is part of the URL. To upgrade, install again with the new version in the URL.

## Glass mode

Surfaces are solid by default. To turn on glass, set `purr-material="glass"` on any ancestor, usually `<html>`:

```html
<html purr-material="glass"></html>
```

Glass applies only to controls and navigation. Content stays plain in both modes. A surface falls back to solid when the browser has no `backdrop-filter`, or when the user asks for reduced transparency or more contrast.

## Theming

You change the look in three ways. Use them in this order.

### Tokens

Every color, size and duration is a custom property with the `--purr-` prefix. Override them on `:root` or on any element:

```css
:root {
  --purr-color-accent: oklch(46% 0.15 250deg);
  --purr-radius-medium: 0.5rem;
}
```

The tokens are in the `purr.tokens` cascade layer, so your unlayered styles win without extra selectors. Keep your colors readable: the contrast checks apply to the defaults, not to your overrides.

### Parts

Elements expose named parts for styling from outside. For example, `<purr-button>` exposes `label`:

```css
purr-button::part(label) {
  letter-spacing: 0.02em;
}
```

### Slots

Content goes into slots. The default slot of `<purr-button>` holds its label, and the label is required for an accessible name.

The Custom Elements Manifest lists the parts, slots, events and properties of every component.
