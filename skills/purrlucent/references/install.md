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

### Languages

The built-in text, such as a close button's name or "No results", is English. Register another language once, at app start, and every component inside an element with that `lang` uses it, also inside other components:

```ts
import { setMessages, type PlMessages } from "purrlucent/locale";

const sv: PlMessages = {
  dismiss: "Stäng",
  noResults: "Inga resultat",
  showOptionsFor: "{label}, visa alternativ",
  // … every key: TypeScript reports a missing one
};

setMessages("sv", sv);
```

`purrlucent/locale` defines no elements, so it is safe to import where the elements are not wanted, such as unit tests. A key the table leaves out falls back to English. A tag such as `sv-FI` matches its own registration first, then `sv`. Messages that build on another name keep its `{label}`, `{page}`, `{total}` or `{count}` slot, so a language can put it where its word order needs it. An attribute on one element, such as `close-label`, wins over both.

The language can change while the page is open. When a `lang` attribute changes, on `<html>` or on any element, the components on the page update their text, their date and month names and the validation messages the library writes (a required checkbox, switch, radio group, select or combobox, and the date picker's own messages). They also update when `setMessages` registers text after they have rendered, or when the browser's language changes. A text field's own message, such as a required input's, comes from the browser and follows the browser's language. A `lang` set inside another component's shadow root is not watched, and an element out of the page while the language changes updates on its next render.

Dates, weekday and month names come from the browser's `Intl` for the same `lang` and need no registration.

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

Glass shows what is behind it, lightly frosted. Over a page of one flat color there is nothing to show, so a glass bar looks almost solid. It shows over varied content: a photo, a gradient, a scrolling list passing under a bar or sidebar. For a page with little of that, give the background some variation:

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

Glass is thin, as Apple's is: a pale film in light and an ink one in dark, `--pl-material-glass-thin`, under a 4px frost and a strong color boost, with a rim light and a soft shadow. Bars, controls, sidebars, panels, popups and sheets all take it. Over any backdrop, black to white, primary text on it holds 3.5:1 and the focus ring and selection 3:1; over mid-grey and lighter backdrops in light, and over any backdrop in dark, primary text reaches 4.5:1. Grey, pink and red text drop lower over dark backdrops, so keep them for text that is not essential, or give the area behind the glass a lighter tone. Tabs, breadcrumbs, pagination, the select and tinted and destructive buttons keep a thicker fill, `--pl-material-glass`, so their colored text holds 4.5:1.

A text-only button in a glass bar takes the primary text color. On glass the focus ring and the selection follow your accent: `--pl-material-ring` and `--pl-material-selected` are `--pl-color-accent` deepened in light and lifted in dark, so each holds 3:1 on the thin fill. With the default accent they are a deep pink in light and a light one in dark. Set `--pl-color-accent` and both follow; override either token to set it directly. Text on the selection reads `--pl-material-selected-foreground`: white on the deepened fill in light and ink on the lifted one in dark, so it holds 4.5:1 for any accent. Your `--pl-color-accent-foreground` stays for solid accent fills. A toolbar with `floating` becomes a capsule that floats over the content.

In Chromium, toolbars, menubars, navigation menus, buttons, segmented controls, popovers, menus, the select's list, dialogs and drawers also refract: each bends what is behind its rim through an SVG filter sized to it, which the component adds to its own tree. Safari and Firefox keep the frosted glass, as they cannot draw an SVG filter in `backdrop-filter`.

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

Editable text in fields is `--pl-text-field`: the small text size on a fine pointer, and at least 1rem on a coarse one, so iOS Safari does not zoom the page on focus.

Controls show the pointing hand, and disabled controls the not-allowed cursor. `--pl-cursor-interactive` (default `pointer`) and `--pl-cursor-disabled` (default `not-allowed`) set them; set either to `default` for the macOS arrow:

```css
:root {
  --pl-cursor-interactive: default;
  --pl-cursor-disabled: default;
}
```

The tokens are in the `pl.tokens` cascade layer, so your unlayered styles win without extra selectors. Keep your colors readable: the contrast checks apply to the defaults, not to your overrides.

### Surfaces

Four tokens name the page's layers, back to front. Components read them, so one override restyles a layer.

| Token                        | Layer                                                | Default                                            |
| ---------------------------- | ---------------------------------------------------- | -------------------------------------------------- |
| `--pl-color-surface-canvas`  | The page                                             | `--pl-color-background`                            |
| `--pl-color-surface-content` | Cards and table boxes                                | `--pl-color-raised`                                |
| `--pl-color-surface-chrome`  | Sidebars and toolbars, a step darker than the canvas | Ink toward paper in light, darker than ink in dark |
| `--pl-color-surface-overlay` | Popovers and menus                                   | `--pl-color-overlay`                               |

```css
:root {
  --pl-color-surface-chrome: oklch(94% 0.01 350deg);
}
```

### Density

Controls are compact by default. Set `data-pl-density="comfortable"` on `:root`, or on any ancestor, to raise the vertical metrics together:

| Metric                            | Compact          | Comfortable      |
| --------------------------------- | ---------------- | ---------------- |
| Control `sm`, `md`, `lg`, `xl`    | 24, 32, 36, 40px | 32, 38, 42, 46px |
| Menu and list row                 | 24px             | 36px             |
| Sidebar row                       | 32px             | 36px             |
| Line height, tight, normal, loose | 14, 16, 20px     | 18, 20, 24px     |
| Table cell vertical padding       | 8px              | 12px             |

Widths, font sizes and horizontal padding do not change, and a coarse pointer keeps its 44px minimum. `data-pl-density="compact"` is the default, so it can reset a region inside a comfortable one.

```html
<html data-pl-density="comfortable">
  ...
  <pl-table density="compact">...</pl-table>
</html>
```

A `pl-table` with its own `density` (`regular` or `compact`) keeps it; without one it follows the page.

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
