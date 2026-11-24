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

Glass shows what is behind it, blurred. Over a page of one flat color there is nothing to blur, so a glass bar looks almost solid. It shows over varied content: a photo, a gradient, a scrolling list passing under a bar or sidebar. For a page with little of that, give the background some variation, and keep text on glass at 4.5:1 where the background is strongest:

```css
body {
  background:
    radial-gradient(
      at 10% 0%,
      color-mix(in srgb, var(--pl-color-hot-pink) 24%, transparent),
      transparent 60%
    ),
    radial-gradient(
      at 90% 100%,
      color-mix(in srgb, var(--pl-color-saffron) 20%, transparent),
      transparent 60%
    ),
    var(--pl-color-background);
  background-attachment: fixed;
}
```

Each glass fill is as clear as the text on it allows over any backdrop, black to white, at 4.5:1. There are two tiers, as Apple's small glass is clearer than its large glass:

- Bars, capsules and controls with primary text take the thin fill, `--pl-material-glass-thin`, under a small blur and a strong color boost, so the shapes and colors behind it show through. A text-only button in a glass bar takes the primary text color for the same reason. On glass the focus ring and the selection are a deeper pink in light and a lighter one in dark, so they hold 3:1 on the thin fill.
- Sidebars, panels, sheets, and controls that show grey, pink or red text (tabs, breadcrumbs, pagination, the select, tinted and destructive buttons) take the thick fill, `--pl-material-glass`.

If you control what sits behind your glass, you may set clearer fills on the `pl-material="glass"` element, and then check text contrast over your own backdrop. Put only primary text on the thin tier.

### Clear glass

For controls over photos and video, such as a player's bar, set `pl-glass="clear"` on their container inside glass. Clear glass is a dark film over a dimmed backdrop, with light text in both color schemes, as Apple's clear variant is. Use it only over media; for everything else the regular glass reads better.

```html
<div pl-glass="clear">
  <pl-button>Play</pl-button>
</div>
```

### Tint

`--pl-material-tint` mixes a color into the glass fill, by `--pl-material-tint-strength` (0% by default). Set both on the `pl-material="glass"` element. Apple tints glass sparingly, to mark a primary action, so keep the strength low and check text contrast:

```css
:root {
  --pl-material-tint: var(--pl-color-hot-pink);
  --pl-material-tint-strength: 18%;
}
```

If glass looks solid everywhere, check the system's transparency setting first: macOS **Reduce transparency** (System Settings, Accessibility, Display), iOS **Reduce Transparency**, or Windows **Transparency effects** off. Each sets `prefers-reduced-transparency: reduce`, and the elements then stay solid on purpose. `matchMedia("(prefers-reduced-transparency: reduce)").matches` in the browser console tells you which it is.

## Theming

You change the look in three ways. Use them in this order.

### Tokens

Every color, size and duration is a custom property with the `--pl-` prefix. Override them on `:root` or on any element:

```css
:root {
  --pl-color-accent: oklch(51% 0.17 250deg);
  --pl-color-accent-foreground: #fff;
  --pl-radius-control: 6px;
}
```

The default accent is hot pink, a light color, so its fill takes ink text. A darker accent needs white text: set `--pl-color-accent-foreground` with it.

Radii follow role and pointer. `--pl-radius-control` (8px, 12px for a coarse pointer) rounds buttons, fields and groups; `--pl-radius-panel` (16px) rounds dialogs, popovers, menus, sheets and sidebars. Two follow from them, so nested curves stay parallel: `--pl-radius-control-inner` is the control radius minus the 2px a face sits inside it, and `--pl-radius-row` is the panel radius minus a panel's padding, for menu and list rows. `--pl-radius-full` makes a pill.

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
