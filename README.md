# Purrlucent

Lit web components that follow Apple's Human Interface Guidelines, built with
plain CSS custom properties and shadow DOM.

This repository is at the scaffold stage. The only element is `purr-probe`,
which exists to prove the toolchain and will be removed.

## Commands

- `bun run build` builds `dist/` and `dist/custom-elements.json`.
- `bun run lint` lints TypeScript (ESLint with the Lit plugin) and CSS (Stylelint).
- `bun run fmt:check` checks formatting.
- `bun run typecheck` type checks the project.

## Contributor notes

- No decorators: components use `static properties` and `customElements.define`.
- `typescript` is an alias of `@typescript/typescript6`, which typescript-eslint needs. `tsc` comes from `@typescript/native` (TypeScript 7).

## License

Apache-2.0. See `LICENSE`, `NOTICE` and `THIRD_PARTY_NOTICES`.
