# Purrlucent design

Date: 2026-11-20

## Intent

Purrlucent is an open-source library of web components and CSS for building web apps that feel like Apple's own apps: simple, calm and consistent, with Apple-style layout, behavior and restraint.

It is the shared starting point for client projects that ask for an app that works "like Apple", so each project does not start from scratch.

## Goals

- Every component and pattern needed for web apps on desktop, tablet and phone, built on Apple's Human Interface Guidelines (HIG).
- Works in any framework, or none.
- Strict, automated quality, usability and accessibility gates that run locally and in CI.
- An optional glass look, switched on for a whole app with one flag.

## Non-goals

- A replica of Apple's visual design. Purrlucent follows Apple's behavior and layout rules with its own visual identity.
- Framework-specific packages (React, Vue and so on).
- Server-side rendering. Lit's SSR package is still in Lit Labs.
- Support for browsers older than the last two versions of Chrome, Edge, Firefox and Safari.
- HIG guidance for hardware or Apple-only technologies (see Gate scope).

## Must never happen

- Shipping Apple assets: San Francisco or New York fonts, SF Symbols, Apple Design Resources templates, or anything derived from them.
- Copying Apple's guideline text, images or code. Rules are written in our own words with a link to the source page.
- Apple trademarks in names, docs or marketing, including "Liquid Glass", "Aqua", "Cupertino", "SF" and "Human Interface", and anything suggesting Apple endorsement.
- Glass on content surfaces. Glass is for the control and navigation layer only (see Glass mode).
- A merge to `main` that has not passed every gate.

## Constraints

- **The HIG is the highest authority.** When a style, variant or request conflicts with an HIG rule, the HIG rule wins and the conflict is reported. No exceptions are added.
- **No framework lock-in.** Components are standard custom elements.
- **Browsers:** the last two versions of Chrome, Edge, Firefox and Safari. Any platform feature used must be available in all four, checked against webstatus.dev before use.
  - Available and used: `popover`, invoker commands (`commandfor`), `@scope`, `light-dark()`, `backdrop-filter`.
  - Not available in Firefox, so not used: CSS anchor positioning. A small positioning building block replaces it until all four support it.
- **License:** Apache-2.0. Third-party code keeps its own license. Notices are kept in `THIRD_PARTY_NOTICES` and `NOTICE`.
- **Language:** American English in code and docs.
- **Docs and copy** follow plain-language rules: start with what the reader needs, one idea per sentence, concrete words, active verbs.

## Visual identity

- **Tone:** fun and playful, within the HIG rules and every gate (contrast, restraint, glass only on controls).
- **Process:** the palette, other visual tokens and icons are generated with Codex using `gpt-6.2-astra` at `medium` reasoning effort, then reviewed with Codex using `gpt-6.1-terra`. Generated work then passes the same gates as everything else.
- System font stack. No bundled fonts.
- Original icons, drawn for Purrlucent.
- Original color palette, defined by purpose, with light, dark and increased-contrast values.
- Glass uses blur and tint (`backdrop-filter`). It does not imitate Apple's refraction effect.

## Architecture

Four layers. Each layer is built only from the layers below it, so a rule fixed in a building block is fixed everywhere it is used.

1. **Tokens:** color by purpose (light, dark, increased contrast), type scale, spacing, corner radius, motion, and both materials (solid and glass). Plain CSS custom properties.
2. **Behaviors:** pressable states (hover, pressed, disabled), focus ring, hit area, keyboard navigation within a group, selection model, dismiss and Escape handling, overlay positioning, reduced motion and reduced transparency.
3. **Surfaces and shapes:** bar, panel, sheet surface, list row, field shell, label and value pairs.
4. **Components:** every component in the HIG Components section that applies to the web (sidebar, toolbar, segmented control, sheet, menu, table and the rest), plus the HIG Patterns built from them.

Styling:

- Plain CSS: custom properties, nesting, `color-mix()`, `light-dark()`, `@layer`, `@scope`, container queries. No preprocessor.
- Components render into shadow DOM (Lit's default). Page styles do not reach inside a shadow root, so app authors customize components only through:
  - **custom properties**, which inherit into shadow roots: all tokens, and the glass mode switch;
  - **`::part()`**, for the internal elements each component documents as parts;
  - **slots**, for their own content.
- Page-level styles that Purrlucent ships (tokens, base styles) sit in a cascade layer, so app styles override them.

## Device adaptation

Components follow the HIG guidance for the kind of device in use:

- **Input:** when the primary pointer is coarse (`pointer: coarse`), components use touch-sized targets and touch patterns (for example popovers and action sheets instead of hover menus). With a fine pointer they use desktop sizes and patterns, including hover.
- **Width:** layouts respond to the space available (container and viewport width). Narrow widths follow phone guidance, such as a sidebar becoming a stacked navigation.
- Adaptation lives in the behaviors and surfaces layers, so components inherit it.
- Screenshot and behavior tests run at desktop, tablet and phone sizes, with fine and coarse pointers.

## Glass mode

- One attribute on the app root (for example `material="glass"`) switches the material. The default is solid.
- Components and tokens are shared. Only the surface material changes.
- Glass follows the HIG rule: control and navigation layer only (sidebars, toolbars, sheets, menus). Content stays plain in both modes.
- Glass falls back to solid when the browser lacks `backdrop-filter`, or when the user asks for reduced transparency or increased contrast.

## Quality gates

Every gate blocks: locally before commit or push, and in CI before merge.

### HIG rules

- **In scope:** all of Foundations, Patterns and Components, plus the pointer, keyboard and touch-gesture parts of Inputs, read as rules for macOS- and iPadOS-style web apps.
- **Out of scope,** each listed with its reason in the rules catalog: the Technologies section, hardware inputs (Digital Crown, Apple Pencil, game controls, eyes and similar), and guidance only for visionOS, watchOS or tvOS.
- Each rule is written in our own words, linked to its HIG page, and tagged with how it is checked:
  - **Automated:** a lint rule, unit test, browser test or screenshot test.
  - **Rubric:** a written checklist item, reviewed in two steps on every PR:
    1. **AI review, locally on push:** a pre-push hook runs Codex with `gpt-6.1-terra` through the developer's own logged-in CLI on each rubric item the pushed changes touch, and blocks the push if any item fails. No API key is ever stored in GitHub Actions.
    2. **Maintainer:** the maintainer reviews the AI results and merges. GitHub does not let authors approve their own PRs, and PRs are opened from the maintainer's account, so the maintainer's merge is the final approval rather than a required approving review. Only the maintainer has write access.
- The catalog is maintained by hand. It is never scraped or synced automatically from Apple's site.

### Accessibility

- **Floor:** WCAG 2.2 Level AA.
- **Component behavior:** the matching W3C ARIA Authoring Practices Guide (APG) pattern for roles, states and keyboard interaction, tested in Chromium, Firefox and WebKit.
- **Automated checks:** axe-core on every story, accessibility-tree snapshots (`toMatchAriaSnapshot()`), and a virtual screen reader (`@guidepup/virtual-screen-reader`).
- **Real screen readers, CI only:** VoiceOver on a macOS runner and NVDA on a Windows runner, through Guidepup. Not run on developer machines, because they need operating-system changes.
- **Manual check:** every PR that changes an interactive component includes a keyboard and screen reader walkthrough in the PR template.

### Code and security

- Lint and format: ESLint with `typescript-eslint` and `eslint-plugin-lit` (TypeScript and Lit templates), Stylelint (CSS), `bun fmt`. typescript-eslint needs the TypeScript 6 API, so `@typescript/typescript6` is installed side by side with TypeScript 7 until TypeScript 7.1 ships its API. HIG and token rules that can be checked statically become custom ESLint and Stylelint rules. (`bun lint` is described in Bun's docs but is not in Bun 1.4.5.)
- No decorators: components declare `static properties` and register with `customElements.define`. Vite 8 does not compile standard decorators.
- Types: TypeScript 7.
- Secret leaks: Gitleaks as a pre-commit hook and in CI, plus GitHub secret scanning and push protection.
- Vulnerable dependencies: `bun audit` and OSV-Scanner block CI. Dependabot version updates for Bun and GitHub Actions.
- Code scanning: CodeQL.

### Repository rules

A GitHub ruleset on `main`:

- Pull request required.
- All status checks pass.
- Linear history.
- Signed commits.
- Secret-scanning and code-scanning alerts resolved.
- No force-push. No deletion.

## Tooling

Versions as published on 2026-11-20.

| Job | Tool |
|---|---|
| Package manager and scripts | Bun 1.4.5 |
| Components | Lit 3.3.3 |
| Build | Vite 8.3.8, library mode, one entry point per component |
| Types | TypeScript 7.0.2 |
| Workshop, docs, component tests | Storybook 10.6.8 (`web-components-vite`) with the Vitest and accessibility addons |
| Browser test runner | Vitest 5.1.1, browser mode, Playwright provider |
| Accessibility tree, screenshot and screen reader tests | Playwright Test 1.65.1, axe-core 4.14, Guidepup 0.40 with `@guidepup/playwright` 0.21 |
| Lint and format | ESLint 10.15, typescript-eslint 8.73 (with `@typescript/typescript6`), eslint-plugin-lit 2.3.1, Stylelint 18.1, `bun fmt` |
| Framework typings | Custom Elements Manifest analyzer 0.11 |
| Releases | Changesets 3.0.3 |
| Secrets | Gitleaks 8.30.1, GitHub secret scanning |
| Vulnerabilities | `bun audit`, OSV-Scanner 2.7.1, Dependabot |
| Code scanning | CodeQL |
| Docs site | GitHub Pages via `actions/upload-pages-artifact` v5 and `actions/deploy-pages` v5 |

## Distribution

- **Release timing:** the first 0.x release ships once the building blocks and the first components pass every gate. Further 0.x releases follow as components land. 1.0 ships when every in-scope HIG component and pattern exists.
- Published as **GitHub Releases** only. Not published to the npm registry or GitHub Packages.
- Each release attaches one packed package file (`.tgz`) named `purrlucent`, with an import path per component and the Custom Elements Manifest for framework and editor typings.
- Releases are created by CI from `main`, using the workflow's own token. Changesets sets versions and writes the changelog, which becomes the release notes.
- Install docs cover:
  - **Bun:** `bun add purrlucent@<release .tgz URL>`.
  - **npm 12 and later:** `allow-remote` defaults to `none`, so the client project sets `allow-remote=root` in its `.npmrc` before installing from the URL.
  - **Upgrading:** the version is part of the URL, so clients upgrade by changing it.
- Storybook published to GitHub Pages from `main`.
- Bot PRs (Dependabot, release) meet the same ruleset as any other PR.

## Alternatives considered

| Area | Chosen | Not chosen |
|---|---|---|
| Component base | Lit: small, standard custom elements, one pattern for all components | Plain custom elements: a hand-written base class that duplicates Lit. FAST: its token system works best adopted whole. Stencil: its framework wrappers matter less now that React 19 supports custom elements |
| Visual closeness | Apple's behavior with an original look | A close replica of Apple's visuals, which carries trade-dress risk for the project and its users |
| Linter | ESLint + `eslint-plugin-lit` + Stylelint: the only verified Lit template linting | `bun lint`, which is not in Bun 1.4.5. Biome, which does not lint Lit `html` templates |
| Package manager | Bun with a blocking audit | npm or pnpm, which get Dependabot security-fix PRs |
| Distribution | GitHub Releases: no token needed to install | GitHub Packages, which needs a personal access token even for public installs. The npm registry |
| Real screen readers | CI only | On developer machines, which needs operating-system security changes |
| License | Apache-2.0, with an explicit patent grant | MIT, which has no patent grant. Source-available licenses (PolyForm, Fair Source), which restrict use |

## Implementation guidelines

- Parallelization is a requirement. Work does not run in a single sequence or a single file.
- Advising with Claude Fable 5.2 (`claude-fable-5-2`) is encouraged.
- Subagents or side sessions with Claude Sonnet 5.5 (`claude-sonnet-5-5`) are encouraged.
- Codex usage is encouraged.

## Left to the builder

- Component order within each layer.
- Token names and values, within the HIG rules.
- File and folder layout.
- Exact CI job layout, caching and runner choice.
- Wording of the PR template and rubric items.
