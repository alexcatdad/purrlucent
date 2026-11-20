# Purrlucent Foundation Implementation Plan (Plan 1 of N)

> **Execution method:** one Claude Code Workflow per wave. Tasks in a wave run in parallel on Sonnet subagents, each in its own git worktree, and each gets a fresh reviewer as soon as it finishes. Codex (`codex exec`, run outside Claude's sandbox) does the work assigned to it. Fable advises on conflicts. Each wave is merged before the next starts, and work stops at every maintainer OK point. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Take Purrlucent from an empty repository to its first 0.x GitHub Release: every quality gate running locally and in CI, the tokens, behaviors and surfaces layers, and four components.

**Architecture:** Lit custom elements in shadow DOM, styled with plain CSS custom properties. Four layers: tokens → behaviors (Lit reactive controllers plus shared CSS) → surfaces → components. Gates: ESLint (with `eslint-plugin-lit`) and Stylelint, Vitest browser tests through Storybook, Playwright accessibility-tree, axe, screenshot and screen reader tests, an HIG rules catalog, and an AI rubric review.

**Tech Stack:** Bun 1.4.5, Lit 3.3.3, TypeScript 7.0.2, Vite 8.3.8, Storybook 10.6.8, Vitest 5.1.1, Playwright Test 1.65.1, axe-core 4.14, Guidepup 0.40 / `@guidepup/playwright` 0.21 / `@guidepup/virtual-screen-reader` 0.33, ESLint 10.15, typescript-eslint 8.73 with `@typescript/typescript6`, eslint-plugin-lit 2.3.1, Stylelint 18.1, Custom Elements Manifest analyzer 0.11, Changesets 3.0.3, Gitleaks 8.30.1, OSV-Scanner 2.7.1, CodeQL.

**Spec:** `docs/superpowers/specs/2026-11-20-purrlucent-design.md`

## Global Constraints

- The HIG is the highest authority. A conflict between a request and an HIG rule is reported, never resolved with an exception.
- Browsers: the last two versions of Chrome, Edge, Firefox and Safari. No CSS anchor positioning.
- Never ship Apple fonts, SF Symbols, Apple Design Resources or Apple trademarks ("Liquid Glass", "Aqua", "Cupertino", "SF", "Human Interface").
- HIG rules are written in our own words with a link to the source page. Apple's site is never scraped.
- Glass only on the control and navigation layer. Content stays plain in both modes.
- License Apache-2.0. Third-party notices in `NOTICE` and `THIRD_PARTY_NOTICES`.
- American English in code and docs. Plain-language docs.
- No tool, library or version is used from memory: implementers check current docs in the BrowserOS neo browser before writing configuration.
- Installing anything new on the maintainer's machine (Gitleaks, Playwright browsers, Codex secrets) and any change to GitHub settings (rulesets, secrets, Pages) needs the maintainer's explicit OK at execution time.
- No secrets in code, logs or artifacts.
- Parallelization is a requirement: tasks in the same wave run at the same time, each in its own worktree or subagent. Sonnet 5.5 subagents and side sessions, Codex, and advice from Fable 5.2 are encouraged.

## Naming used across tasks

- Element tag prefix: `purr-`. Class prefix: `Purr`. Custom property prefix: `--purr-`.
- Glass mode: attribute `purr-material="glass"` on any ancestor, usually `<html>`. Default is solid.
- Source layout: `src/tokens/`, `src/behaviors/`, `src/surfaces/`, `src/components/<name>/`, each component folder holding `<name>.ts`, `<name>.css.ts`, `<name>.stories.ts`, `<name>.test.ts`, `<name>.e2e.ts`.
- HIG catalog: `hig/rules/<hig-page-slug>.yaml`, one file per HIG page.

## Review Focus

1. **Glass fallback:** with no `backdrop-filter` support, `prefers-reduced-transparency: reduce` or `prefers-contrast: more`, every glass surface renders solid and still meets contrast. Test owned by Task 7.
2. **Right-to-left:** with `dir="rtl"`, layouts mirror, and arrow keys in roving groups move in the visual direction. Tests owned by Tasks 8b and 11.
3. **Forced colors (Windows High Contrast):** focus rings, control borders and the selected segment stay visible. Test owned by Task 8a.
4. **Text zoom at 200%:** components grow without clipping or overlapping. Test owned by Task 3, run for every component.
5. **Coarse pointer on a wide screen** (tablet in landscape): hit targets stay at least 44 by 44 even at desktop widths. Test owned by Task 8a.

---

## Wave 0 (one task)

### Task 1: Repository scaffold

**Files:**
- Create: `package.json`, `bun.lock`, `tsconfig.json`, `vite.config.ts`, `bunfig.toml` (lint config), `.stylelintrc.json`, `.gitignore`, `LICENSE` (Apache-2.0 text), `NOTICE`, `THIRD_PARTY_NOTICES`, `README.md`, `src/index.ts`, `src/components/probe/probe.ts`, `src/components/probe/probe.test.ts`

**Interfaces:**
- Produces: scripts `bun run build`, `bun run lint`, `bun run fmt:check`, `bun run typecheck`. `build` writes `dist/` with one entry per folder under `src/components/`, plus `dist/custom-elements.json` from the Custom Elements Manifest analyzer 0.11, referenced by the `customElements` field in `package.json`. Package name `purrlucent`, `"type": "module"`, `exports` with `./<component>` subpaths.

- [ ] **Step 1:** Add `lit@3.3.3` as a dependency, and the TypeScript, Vite and Stylelint versions from the Tech Stack as dev dependencies, with `bun add`.
- [ ] **Step 2:** Write `src/components/probe/probe.ts`: `PurrProbe extends LitElement`, tag `purr-probe`, renders `<slot></slot>`. It exists only to prove the toolchain and is deleted in Task 10.
- [ ] **Step 3:** Configure Vite library mode with multiple entries (check the Vite 8 docs in neo), TypeScript 7 with `experimentalDecorators: false` and standard decorators (check Lit's TS 7 guidance in neo), Stylelint standard config.
- [ ] **Step 4:** Add `eslint-plugin-lit` to `bunfig.toml` lint plugins. Put a deliberate template error in a scratch file and run `bun run lint`.
  Expected: the plugin reports the error. If it does not load in `bun lint`, stop and report to the maintainer (spec fallback: browser gates).
- [ ] **Step 5:** Run `bun run build`, `bun run lint`, `bun run fmt:check` and `bun run typecheck`. Expected: all exit 0, `dist/probe.js` exists, and `dist/custom-elements.json` lists `purr-probe`.
- [ ] **Step 6:** Commit: `chore: scaffold purrlucent with bun, lit, vite and typescript`.

---

### Task 1b: Lint switch and scaffold fixes (added after Wave 0)

Wave 0 found that `bun lint` is not in Bun 1.4.5 and that Vite 8 does not compile standard decorators.

**Files:** `eslint.config.js`, `package.json`, `bunfig.toml`, `README.md`, `tsconfig.json`

- [ ] **Step 1:** Add ESLint 10.15, typescript-eslint 8.73, eslint-plugin-lit 2.3.1 and `typescript6` as `npm:@typescript/typescript6` (an alias, per Microsoft's TypeScript 7.0 notes, checked in neo), with exact versions. Make `bun run lint` run ESLint on `src/**/*.ts` and then Stylelint. Remove the unused `[lint]` section from `bunfig.toml`.
- [ ] **Step 2:** Put a deliberate Lit template error in a scratch file. Expected: `bun run lint` fails with an `eslint-plugin-lit` rule. Remove the file. Expected: `bun run lint` exits 0.
- [ ] **Step 3:** Pin every dev dependency exactly. Add `NOTICE` and `THIRD_PARTY_NOTICES` to `files`. Record "no decorators: `static properties` + `customElements.define`" in `README.md`'s contributor notes. Make sure `experimentalDecorators` is not enabled.
- [ ] **Step 4:** Run build, lint, fmt:check, typecheck and test. Expected: all exit 0. Commit: `chore: switch lint to eslint with lit plugin, pin dev dependencies`.

**All later tasks:** no decorators. Use `static properties` and `customElements.define`.

## Wave 1 (Tasks 2–6 run in parallel)

### Task 2: Storybook and browser component tests

**Files:** `.storybook/main.ts`, `.storybook/preview.ts`, `vitest.config.ts`, `src/components/probe/probe.stories.ts`, `src/components/probe/probe.test.ts`

**Interfaces:**
- Consumes: Task 1 scripts.
- Produces: `bun run storybook`, `bun run build-storybook` (output `storybook-static/`), and `bun run test:unit`, which runs every `*.stories.ts` as a Vitest browser test with the accessibility addon set to fail on violations, in Chromium, Firefox and WebKit. Storybook globals `material` (`solid`|`glass`), `theme` (`light`|`dark`), `contrast` (`normal`|`more`), `dir` (`ltr`|`rtl`).

- [ ] **Step 1:** Write `probe.stories.ts` with a `Default` story, and a failing story `MissingLabel` that renders `<button></button>` inside the probe.
- [ ] **Step 2:** Run `bun run test:unit`. Expected: `MissingLabel` FAILS on the accessibility check (button has no accessible name) in all three engines.
- [ ] **Step 3:** Delete `MissingLabel`, wire the four globals through `preview.ts` decorators as attributes on the story root, and run again. Expected: PASS in all three engines.
- [ ] **Step 4:** Commit: `test: add storybook with vitest and a11y gates`.

### Task 3: Playwright accessibility, screenshot and virtual screen reader gates

**Files:** `playwright.config.ts`, `e2e/helpers/story.ts`, `e2e/helpers/matrix.ts`, `src/components/probe/probe.e2e.ts`

**Interfaces:**
- Consumes: `bun run build-storybook` from Task 2.
- Produces:
  - `gotoStory(page, storyId: string): Promise<Locator>` in `e2e/helpers/story.ts`.
  - `forEachViewport(fn)` in `e2e/helpers/matrix.ts`, covering `desktop` 1440×900 with a fine pointer, `tablet` 1024×1366 with a coarse pointer, and `phone` 390×844 with a coarse pointer.
  - `expectAccessible(locator)`, which runs axe with WCAG 2.2 AA tags and fails on any violation.
  - `bun run test:e2e`.
- Every component's `*.e2e.ts` calls these.

- [ ] **Step 1:** Write `probe.e2e.ts` with these tests:
  - `toMatchAriaSnapshot()` for `probe--default`.
  - A screenshot per viewport.
  - `expectAccessible`.
  - **Zoom 200%:** at 200% text zoom, no element's scroll width exceeds its client width (Review Focus 4).
  - A virtual screen reader test asserting the spoken phrase log for the default story.
- [ ] **Step 2:** Run `bun run test:e2e`. Expected: FAIL on the first run because no baselines exist.
- [ ] **Step 3:** Run `bun run test:e2e -- --update-snapshots`, then `bun run test:e2e`. Expected: PASS.
- [ ] **Step 4:** Commit: `test: add playwright aria, axe, screenshot and virtual screen reader gates`.

### Task 4: Security, repository rules and CI

**Files:** `.github/workflows/ci.yml`, `.github/workflows/codeql.yml`, `.github/dependabot.yml`, `.github/pull_request_template.md`, `.github/rulesets/main.json`, `.gitleaks.toml`, `lefthook.yml` or an equivalent pre-commit hook config (choose after checking current docs in neo)

**Interfaces:**
- Produces CI job names that the ruleset requires: `lint`, `typecheck`, `build`, `unit`, `e2e`, `audit`, `secrets`, `codeql`. Tasks 9 and 12 add `screen-readers` and `rubric`.

- [ ] **Step 1:** Write `ci.yml`:
  - Bun setup and `bun install --frozen-lockfile`.
  - One job per required name.
  - `audit` runs `bun audit --audit-level=low` and OSV-Scanner 2.7.1.
  - `secrets` runs Gitleaks 8.30.1.
- [ ] **Step 2:** Write `dependabot.yml` with version updates for `bun` and `github-actions`. Write `codeql.yml` for JavaScript and TypeScript.
- [ ] **Step 3:** Set up the pre-commit hook to run Gitleaks, `bun run lint` and `bun run fmt:check`. Commit a file containing a fake key matching a Gitleaks rule. Expected: the hook blocks the commit. Remove the file.
- [ ] **Step 4:** Write the PR template:
  - Manual keyboard walkthrough checklist.
  - Manual screen reader walkthrough checklist.
  - The HIG rubric items touched.
  - A changeset reminder.
- [ ] **Step 5:** Write `.github/rulesets/main.json`:
  - Target `main`. PR required.
  - Required checks: every job name above, plus `screen-readers` and `rubric`.
  - Linear history. Signed commits.
  - Secret-scanning and code-scanning alerts resolved.
  - No force-push. No deletion.
  - Bot PRs get no bypass.
- [ ] **Step 6:** Ask the maintainer before applying the ruleset with `gh api` and enabling secret scanning and push protection. After their OK, apply it and confirm with `gh api repos/alexcatdad/purrlucent/rulesets --jq '.[].name'`.
- [ ] **Step 7:** Commit: `ci: add security, lint, test jobs and main ruleset`.

### Task 5: HIG rules catalog and its validator

**Files:** `hig/schema.json`, `hig/rules/*.yaml`, `hig/out-of-scope.yaml`, `scripts/hig-check.ts`, `scripts/hig-check.test.ts`

**Interfaces:**
- Produces:
  - **Rule entry:** `{ id: string /* <page-slug>/<n> */, source: url, rule: string /* own words */, check: "automated" | "rubric", test?: string /* test file and name */, layer: "tokens" | "behaviors" | "surfaces" | "components" }`.
  - **`bun run hig:check`:** validates the schema. Fails when an `automated` rule names a test that does not exist. No HIG page text is stored in the repository or cached (the spec forbids scraping). The task's reviewer reads the source pages in neo and confirms each rule is in our own words.
  - **`bun run hig:rubric -- <files...>`:** prints the rubric rules for the layers and components touched. Task 12 uses it.

- [ ] **Step 1:** Write tests in `hig-check.test.ts`:
  - A valid entry passes.
  - An `automated` entry with a missing test fails with `missing test`.
- [ ] **Step 2:** Run `bun test scripts/hig-check.test.ts`. Expected: FAIL (`hig-check` not found).
- [ ] **Step 3:** Implement `scripts/hig-check.ts`.
- [ ] **Step 4:** Write `out-of-scope.yaml` with a reason per excluded section. Write rule files for the HIG pages this plan touches: accessibility, color, dark-mode, layout, materials, motion, typography, writing, icons, right-to-left, buttons, segmented-controls, toolbars, sidebars, pointing-devices, keyboards, gestures.
- [ ] **Step 5:** Run `bun run hig:check`. Expected: PASS. Rules whose tests come in later tasks are marked `check: automated` with `test` filled in by the owning task. Until then, `hig:check` reports them as `pending`, which it allows only when the `--allow-pending` flag is set. CI uses the flag until Task 10 lands.
- [ ] **Step 6:** Commit: `feat: add hig rules catalog and validator`.

### Task 6: Visual identity: palette and icons

**Files:** `design/palette.json`, `design/icons/*.svg`, `design/REVIEW.md`

**Interfaces:**
- Produces:
  - **`design/palette.json`:** `{ roles: { [role: string]: { light: oklch, dark: oklch, lightMoreContrast: oklch, darkMoreContrast: oklch } } }`. Roles: `accent`, `label`, `secondaryLabel`, `tertiaryLabel`, `background`, `secondaryBackground`, `separator`, `fill`, `destructive`, `success`, `warning`, `focus`.
  - **Glass tints:** `glassTint.light|dark` and `glassBlur` in px.
  - **Icons:** 24×24 SVG icons named by meaning. The first set: `sidebar`, `chevron-left`, `chevron-right`, `chevron-down`, `close`, `search`, `plus`, `more`, `checkmark`.

- [ ] **Step 1:** Run Codex to generate a fun, playful, original palette and icon set that meets the HIG rules in `hig/rules/color.yaml` and `icons.yaml`:
  `codex exec -m gpt-6.2-astra -c model_reasoning_effort="medium" -C design "<prompt from hig rules and the roles list above>"`
- [ ] **Step 2:** Run Codex to review the output for originality, HIG fit, and contrast of at least 4.5:1 for text roles and 3:1 for `separator` and `focus` against their backgrounds. Write the findings to `design/REVIEW.md`:
  `codex exec -m gpt-6.1-terra -C design "<review prompt>"`
- [ ] **Step 3:** Fix the issues it found, then repeat Step 2 until `REVIEW.md` lists none.
- [ ] **Step 4:** Commit: `feat: add generated palette and icon set`.

---

## Wave 2 (Task 7 first; then 8a, 8b, 8c and 9 run in parallel)

### Task 7: Tokens layer and glass mode

**Files:** `src/tokens/tokens.css`, `src/tokens/materials.css`, `src/tokens/generate.ts`, `src/tokens/tokens.stories.ts`, `src/tokens/tokens.e2e.ts`

**Interfaces:**
- Consumes: `design/palette.json`.
- Produces:
  - **Color:** `--purr-color-<role>` for every palette role, using `light-dark()`, with `@media (prefers-contrast: more)` overrides.
  - **Type and spacing:** `--purr-font-family` (system stack), `--purr-font-size-{caption,footnote,body,headline,title3,title2,title1}`, `--purr-space-{1..8}` on a 4px step, `--purr-radius-{small,medium,large}`, `--purr-duration-{fast,base}`, which become 0ms under `prefers-reduced-motion: reduce`.
  - **Materials:** `--purr-material-bar`, `--purr-material-panel`, `--purr-material-sheet` (background value), `--purr-material-filter` (`backdrop-filter` value).
  - **Delivery:** all of it in `@layer purr.tokens`, shipped as `purrlucent/tokens.css`.

- [ ] **Step 1:** Write `tokens.e2e.ts` tests:
  - In solid mode, `--purr-material-filter` computes to `none`.
  - Under `purr-material="glass"` it computes to a blur.
  - **Glass fallback (Review Focus 1):** under emulated `prefers-reduced-transparency: reduce`, under `prefers-contrast: more`, and when `CSS.supports('backdrop-filter','blur(1px)')` is false (simulated with a stylesheet override), the computed filter is `none` and the bar background is opaque.
  - Each text role meets 4.5:1 contrast against `background` in all four color schemes.
- [ ] **Step 2:** Run `bun run test:e2e -- tokens`. Expected: FAIL.
- [ ] **Step 3:** Implement `generate.ts` (palette.json → `tokens.css`) and `materials.css`.
- [ ] **Step 4:** Run the tests again. Expected: PASS. Fill in the `test` fields of the matching `color`, `dark-mode` and `materials` rules in `hig/rules`.
- [ ] **Step 5:** Commit: `feat: add tokens layer and glass mode`.

### Task 8a: Behaviors: pressable, focus ring, hit area

**Files:** `src/behaviors/pressable.ts`, `src/behaviors/interaction.css.ts`, `src/behaviors/pressable.test.ts`, `src/behaviors/interaction.e2e.ts`

**Interfaces:**
- Produces:
  - **`PressableController`** (`implements ReactiveController`, `constructor(host: ReactiveControllerHost & HTMLElement, opts: { disabled: () => boolean })`) with getter `pressed: boolean`. It sets the custom state `:state(pressed)` via `ElementInternals`, and fires a `purr-press` event on pointer-up inside the element, or on Enter or Space.
  - **`interactionStyles: CSSResult`:** the focus ring on `:focus-visible` using `--purr-color-focus` (2px outline, 2px offset), a hit area of at least 44×44 under `@media (pointer: coarse)`, and hover styles only under `@media (hover: hover)`.

- [ ] **Step 1:** Write `pressable.test.ts`:
  - Space or Enter fires `purr-press` once.
  - Disabled hosts fire nothing.
  - Pointer-down then pointer-up outside the element fires nothing.
  - `:state(pressed)` is set only while the pointer is down.
- [ ] **Step 2:** Write `interaction.e2e.ts`:
  - **Coarse pointer on a wide screen (Review Focus 5):** at 1440 px wide with a coarse pointer, a test host is at least 44×44.
  - **Forced colors (Review Focus 3):** under `forced-colors: active`, the focus ring's outline style is not `none`.
- [ ] **Step 3:** Run both. Expected: FAIL. Implement. Run again. Expected: PASS.
- [ ] **Step 4:** Commit: `feat: add pressable, focus ring and hit area behaviors`.

### Task 8b: Behaviors: roving focus and selection

**Files:** `src/behaviors/roving-focus.ts`, `src/behaviors/selection.ts`, matching `*.test.ts`

**Interfaces:**
- Produces:
  - **`RovingFocusController`** (`constructor(host, opts: { items: () => HTMLElement[]; orientation: "horizontal" | "vertical"; wrap: boolean })`): Arrow keys, Home and End move focus, and only the active item has `tabindex=0`. In horizontal mode, Left and Right are swapped when the host's `:dir(rtl)` matches.
  - **`SelectionController<T>`** (`constructor(host, opts: { mode: "single" | "multiple"; required: boolean })`) with `selected: ReadonlySet<T>`, `select(v: T)`, `toggle(v: T)`. It fires `purr-change` with `detail: { selected: T[] }`.
- [ ] **Step 1:** Write the tests:
  - Arrow movement, Home and End.
  - Wrap on and off.
  - **RTL (Review Focus 2):** under `dir="rtl"`, ArrowRight moves to the previous item.
  - Single selection replaces the previous value.
  - `required: true` refuses to empty the selection.
  - `purr-change` fires once per change.
- [ ] **Step 2:** Run. Expected: FAIL. Implement. Run again. Expected: PASS.
- [ ] **Step 3:** Commit: `feat: add roving focus and selection behaviors`.

### Task 8c: Behaviors: dismiss and overlay positioning

**Files:** `src/behaviors/dismiss.ts`, `src/behaviors/position.ts`, matching `*.test.ts`

**Interfaces:**
- Produces:
  - **`DismissController`** (`constructor(host, opts: { onDismiss: (reason: "escape" | "outside") => void; enabled: () => boolean })`).
  - **`position(anchor: Element, overlay: HTMLElement, placement: "bottom-start" | "bottom-end" | "top-start" | "top-end"): void`:** sets `top` and `left` in fixed coordinates, flips vertically when there's no room, and shifts to stay within an 8px viewport inset. It stands in for CSS anchor positioning until Firefox supports it.
- [ ] **Step 1:** Write the tests:
  - Escape calls `onDismiss("escape")`.
  - A pointer-down outside calls `onDismiss("outside")`, and inside does not.
  - Nothing fires when disabled.
  - `position` flips to the top near the bottom edge.
  - `position` stays at least 8px inside every edge.
- [ ] **Step 2:** Run. Expected: FAIL. Implement. Run again. Expected: PASS.
- [ ] **Step 3:** Commit: `feat: add dismiss and positioning behaviors`.

### Task 9: Real screen readers in CI

**Files:** `.github/workflows/screen-readers.yml`, `e2e/screen-reader/probe.sr.ts`

**Interfaces:**
- Produces the CI job `screen-readers`, which runs `*.sr.ts` files with `@guidepup/playwright` under VoiceOver on a macOS runner and NVDA on a Windows runner, after `npx @guidepup/setup setup --ci`. Never run on developer machines.
- [ ] **Step 1:** Write `probe.sr.ts`, which asserts the spoken phrase for the probe's default story contains its slotted text.
- [ ] **Step 2:** Push a branch and open a draft PR. Expected: `screen-readers` passes on both runners. If setup fails, attach the `--macos-record` output and report it.
- [ ] **Step 3:** Commit: `ci: add voiceover and nvda screen reader job`.

---

## Wave 3 (Task 10 first; then 11a–11d run in parallel)

### Task 10: Surfaces layer

**Files:** `src/surfaces/surfaces.css.ts`, `src/surfaces/surfaces.stories.ts`, `src/surfaces/surfaces.e2e.ts`. Delete `src/components/probe/` and move the probe-based tests to surfaces.

**Interfaces:**
- Produces `CSSResult`s: `barSurface`, `panelSurface`, `sheetSurface` (these use `--purr-material-*`, so glass can apply), `listRowSurface`, `fieldShell` (never glass). Each is used as `static styles = [barSurface, ...]`.
- [ ] **Step 1:** Write `surfaces.e2e.ts`:
  - Under `purr-material="glass"`, bar, panel and sheet have a non-`none` backdrop filter.
  - List row and field shell are always `none` (glass only on controls).
  - Aria and screenshot baselines.
- [ ] **Step 2:** Run. Expected: FAIL. Implement. Run again. Expected: PASS. Then run `bun run hig:check` without `--allow-pending` and remove the flag from CI.
- [ ] **Step 3:** Commit: `feat: add surfaces layer`.

### Tasks 11a–11d: First components

Each component task has the same shape:
- **Files:** `src/components/<name>/{<name>.ts, <name>.css.ts, <name>.stories.ts, <name>.test.ts, <name>.e2e.ts}` and `e2e/screen-reader/<name>.sr.ts`.
- **Interfaces:** the Lit element named below, built only from Tasks 7–10. Documented `::part()` names. Events `purr-press` and `purr-change` from Task 8.
- **Steps:**
  1. Write the tests from the matching APG pattern (roles, states, every key in its keyboard table) and the component's HIG rules.
  2. Run them and see them fail.
  3. Implement.
  4. Run them and see them pass. Fill in the `test` fields in `hig/rules/<page>.yaml`.
  5. Add a changeset.
  6. Commit.
- **Stories:** every state, in both materials, both themes, both contrasts and both directions.

| Task | Element | APG pattern | Tests beyond the APG keyboard table |
|---|---|---|---|
| 11a | `purr-button` (`variant: "plain" \| "bordered" \| "prominent"`, `destructive: boolean`, `disabled`) | Button | A destructive button is never the default action. Label text required (axe). Pressed state visible. |
| 11b | `purr-segmented-control` with `purr-segment` children (`value`, `selected`) | Radio Group | Single selection is required. **RTL arrows (Review Focus 2).** The selected segment is visible under forced colors. |
| 11c | `purr-toolbar` (`label` required) | Toolbar | One `prominent` button at most, placed at the trailing end. Glass surface only in glass mode. |
| 11d | `purr-sidebar` (`label`, `collapsed`), items as `purr-sidebar-item` (`href`, `selected`, `level: 1 \| 2`) | Disclosure navigation, plus the Landmarks navigation landmark | At most two levels (a level-3 item throws in development). At phone width with a coarse pointer it becomes stacked navigation. Selection stays highlighted. |

---

## Wave 4 (Tasks 12–14 run in parallel)

### Task 12: AI rubric review in CI

**Files:** `.github/workflows/rubric.yml`, `scripts/rubric-prompt.ts`

**Interfaces:**
- Consumes `bun run hig:rubric`.
- Produces the CI job `rubric`. It runs `codex exec -m gpt-6.1-terra` with the touched rubric rules and the PR diff, posts one PR comment with pass or fail per rule, and exits non-zero on any fail.

- [ ] **Step 1:** Ask the maintainer to add the Codex API credential as a repository secret. Give the exact secret name, and confirm the current Codex CI auth method in neo first.
- [ ] **Step 2:** Open a test PR that adds two `prominent` buttons to one toolbar story. Expected: `rubric` fails on the toolbar rule. Close the PR.
- [ ] **Step 3:** Commit: `ci: add ai rubric review`.

### Task 13: Docs site on GitHub Pages

**Files:** `.github/workflows/pages.yml`, `docs/install.md` (also rendered in Storybook)

- [ ] **Step 1:** Workflow: on push to `main`, `bun run build-storybook`, `actions/upload-pages-artifact@v5`, `actions/deploy-pages@v5`.
- [ ] **Step 2:** Write `install.md`:
  - The Bun install with the release URL.
  - npm 12's `allow-remote=root` in `.npmrc`.
  - Upgrading by changing the URL.
  - Glass mode and theming through tokens, `::part()` and slots.
- [ ] **Step 3:** Ask the maintainer before enabling Pages with GitHub Actions as the source. After the merge, confirm the site loads in neo.
- [ ] **Step 4:** Commit: `docs: publish storybook to github pages`.

### Task 14: Release workflow and v0.1.0

**Files:** `.changeset/config.json`, `.github/workflows/release.yml`, `scripts/third-party-notices.ts`

**Interfaces:**
- Produces, on merge to `main` with pending changesets, a version PR. Merging it creates a tag `v<version>` and a GitHub Release with `purrlucent-<version>.tgz` attached, and the changelog as release notes, using the workflow's `GITHUB_TOKEN`. Nothing goes to npm.

- [ ] **Step 1:** Write `third-party-notices.ts`, which regenerates `THIRD_PARTY_NOTICES` from production dependencies. Its test fails if Lit's BSD-3 notice is missing.
- [ ] **Step 2:** Write `release.yml`.
- [ ] **Step 3:** In a scratch project, run `bun add purrlucent@<release tgz URL>`, then import `purrlucent/button` and `purrlucent/tokens.css`. Expected: install succeeds and `<purr-button>` renders. Repeat with npm 12 and `allow-remote=root`.
- [ ] **Step 4:** Commit: `ci: add changesets release to github releases`.

---

## Later plans

The remaining in-scope HIG components and patterns, one plan per HIG component group (navigation and search, menus and actions, presentation, selection and input, status, content, layout and organization) plus Patterns. Each is written once this plan lands and reuses its layers, gates and task shape.
