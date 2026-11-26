# Purrlucent

[purrlucent on npm](https://www.npmjs.com/package/purrlucent) ·
[CI workflow runs](https://github.com/alexcatdad/purrlucent/actions/workflows/ci.yml) ·
[Apache-2.0 license](LICENSE) ·
[Bundle size on Bundlephobia](https://bundlephobia.com/package/purrlucent)

Purrlucent provides web components for apps, including buttons, form controls, menus, dialogs and navigation. The components use Lit and CSS custom properties, work with any framework, and draw on Apple's Human Interface Guidelines.

## Use

```sh
npm install purrlucent
```

In your app's JavaScript or TypeScript entry point, import the tokens and the components you use.

```ts
import "purrlucent/tokens.css";
import "purrlucent/button";
```

Add the registered element to your page.

```html
<pl-button>Save</pl-button>
```

The guides cover package verification, page styles, light and dark modes, glass, theming and React integration. [Install guide](https://github.com/alexcatdad/purrlucent/blob/v0.31.0/docs/install.md) · [Use with React](https://github.com/alexcatdad/purrlucent/blob/v0.31.0/docs/react.md)

From 0.27.1, every version is published from GitHub Actions with a provenance statement.

- **Framework-agnostic.** Standard custom elements with shadow DOM and a separate import path for each component.
- **Accessible.** Components support keyboard use, right-to-left text, increased contrast, forced colors and reduced motion. Touch controls use a 44 px target token. Calendar days fit seven columns and can be narrower in small containers.
- **Themeable.** The tokens derive the rest of the colors and sizes from three palette colors, three tone colors and one spacing base. Light and dark follow the page's `color-scheme`.
- **Forms.** Input controls participate in native forms, including submission, reset, validation and disabled fieldsets.
- **Typed.** The package ships type declarations, a Custom Elements Manifest and React 19 JSX types with typed events.

## Components

Use a date range to validate a start and end day, a combobox to search and select several values, or a data table to sort, filter and page through records. The catalog also includes navigation, dialogs, layout and feedback components.

The reference lists each element’s import, attributes, properties, methods, slots, parts and events. Copies of the guides ship in the package’s `docs/` directory. [Component reference](https://github.com/alexcatdad/purrlucent/blob/v0.31.0/docs/components.md) · [Storybook examples](https://alexcatdad.github.io/purrlucent/?path=/story/actions-button--default)

The chart uses its own import, `purrlucent/chart`, and requires the optional peer dependency `@tanstack/charts`. The root import loads the other components.

## Security

See [SECURITY.md](https://github.com/alexcatdad/purrlucent/blob/v0.31.0/SECURITY.md) to report a vulnerability.

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
