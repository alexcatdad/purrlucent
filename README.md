# Purrlucent

Web components for apps: buttons, form controls, menus, dialogs and navigation, built with Lit and plain CSS custom properties. They work in any framework or none, follow Apple's Human Interface Guidelines as guidance, and have their own look.

- **Framework-agnostic.** Standard custom elements with shadow DOM. Each one has its own import path.
- **Accessible.** Every component follows the matching WAI-ARIA pattern, works with a keyboard, supports right-to-left text, increased contrast, forced colors and reduced motion, and has 44 by 44 px targets with a coarse pointer.
- **Themeable.** Five palette colors and one spacing base; every other color and size is calculated from them. Light and dark follow the page's `color-scheme`.
- **Forms.** The input controls take part in forms like native ones: value, reset, validation and disabled fieldsets.
- **Typed.** The package ships type declarations, a Custom Elements Manifest and React 19 JSX types with typed events.

## Components

Accordion, aspect ratio, attachment, avatar, badge, banner, breadcrumb, bubble, button, button group, calendar, card, carousel, chart, checkbox, collapsible, combobox, command palette, context menu, data table, date picker, dialog, drawer, empty, hover card, input, input group, item, kbd, marker, menu, menubar, message, message scroller, navigation menu, number field, one-time code input, pagination, popover, progress, prompt input, radio group, resizable panels, scroll area, select, separator, sidebar, skeleton, slider, spinner, switch, table, tabs, textarea, toast, toggle, toggle group, toolbar and tooltip.

The [component reference](docs/components.md) lists every element with its attributes, slots, parts and events. Storybook has an example of each state. The chart is not part of `import "purrlucent"`: import `purrlucent/chart` and install its optional peer, `@tanstack/charts`.

## Use

```ts
import "purrlucent/tokens.css";
import "purrlucent/button";
import "purrlucent/switch";
```

```html
<form>
  <pl-switch name="wifi" checked>Wi-Fi</pl-switch>
  <pl-button type="submit" variant="primary">Save</pl-button>
</form>
```

Purrlucent is published as a GitHub Release, not on the npm registry. The [install guide](docs/install.md) covers installing, the page background, fonts, light and dark, glass mode and theming. For a React app, see [Use with React](docs/react.md).

## Security

See [SECURITY.md](SECURITY.md) to report a vulnerability.

## Browser support

The last two versions of Chrome, Edge, Firefox and Safari (desktop and iOS).

## Develop

Requires [Bun](https://bun.sh).

- `bun install` installs the dependencies.
- `bun run storybook` starts Storybook on port 6006.
- `bun run build` builds `dist/`, the type declarations and `dist/custom-elements.json`.
- `bun run lint` runs ESLint, Stylelint and the style check (no typed-in lengths or raw colors in component styles).
- `bun run fmt:check` checks formatting.
- `bun run typecheck` type-checks the project.
- `bun test` runs the unit tests and the package check (its browser case runs in CI only).
- Browser tests run in CI only, because they start Playwright: `bun run test:unit` (story tests) and `bun run test:e2e` (against the built Storybook) refuse to start outside CI. Push the branch and read the `unit` and `e2e` jobs.
- `bun scripts/component-docs.ts` regenerates `docs/components.md` after a change to an element's API.

Contributor notes:

- No decorators: components use `static properties` and `customElements.define`.
- Component styles use tokens from `src/tokens/tokens.css` or values calculated from them.
- `typescript` is an alias of `@typescript/typescript6`, which typescript-eslint needs. `tsc` comes from `@typescript/native` (TypeScript 7).

## License

Apache-2.0. See `LICENSE`, `NOTICE` and `THIRD_PARTY_NOTICES`.
