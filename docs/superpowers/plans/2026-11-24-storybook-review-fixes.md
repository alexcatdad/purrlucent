# Storybook Review Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every Storybook story an accurate, complete demonstration of purrlucent, and add the glass, prose, data-table and TanStack work the showcase exposes as missing.

**Architecture:** Storybook-only fixes live in `.storybook/` and the stories. Glass is a shipped token feature in `src/tokens/tokens.css`, consumed by each controls-and-navigation component's CSS. `pl-data-table` gains a built-in engine for filter and pagination plus a presentational `model` mode; `purrlucent/data-table/tanstack` maps a TanStack table instance onto that model.

**Tech Stack:** Lit 3, Storybook 10 (web components, Vite), Playwright e2e (CI only), `bun test` for pure logic, `@tanstack/table-core` 9.3.1 (optional peer).

**Spec:** `docs/superpowers/specs/2026-11-24-storybook-review-fixes-design.md`

## Global Constraints

- Apple HIG overrides every other design choice, glass mode included.
- Glass applies only to the controls and navigation layer; content (card, table rows, item, avatar, badge, bubble, message, attachment, calendar grid, chart, accordion, collapsible, empty, skeleton, progress, spinner, kbd, marker, separator, scroll area, resizable, aspect ratio) stays solid.
- Dependent values derive from tokens via `calc()`, not typed-in numbers.
- Increased contrast, reduced transparency and forced colors fall back to solid.
- Existing public APIs stay; new data-table features are additive.
- `@tanstack/table-core` is an optional peer dependency (`^9.3.1`) and a dev dependency; it is external in the library build.
- No brand marks in the sign-in demo.
- Never run Playwright, vitest or `bun run test:*` locally. Local checks are: `bun run lint`, `bun run typecheck`, `bun run fmt:check`, `bun run hig:check -- --allow-pending`, `bun test <file>.test.ts`, `bun run build`, `bun run build-storybook`.
- e2e runs in GitHub Actions: push the branch, then `gh workflow run e2e-quick.yml --ref fix/storybook-review -f path=<file or folder> -f browser=<chromium|firefox|webkit>`. Check the run's result before the next task that depends on it.
- One pull request from branch `fix/storybook-review`, one focused commit per task. Each commit ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- A changeset (`.changeset/storybook-review.md`, minor) lists the shipped changes: glass on controls and navigation, prose elements, data-table filter, pagination, model mode, TanStack adapter, bug fixes.

## Review Focus

- Text on glass over the colorful backdrop, in light and dark: must pass the existing contrast check. Test in Task 3.
- Glass controls under `prefers-reduced-transparency: reduce` and `prefers-contrast: more`: must render solid. Test in Task 3.
- Data table filter that leaves fewer rows than the current page needs: page clamps to the last page, and zero matches shows the empty state. Test in Task 9.
- TanStack state changed by the app (not by a click): the component re-renders with it, and one click fires one state update. Test in Task 12.
- RTL with pinned columns and resizing: "start" pins to the right edge, and dragging a resize handle left widens the column. Test in Task 11.

---

### Task 1: Storybook foundation (font, sidebar, ids)

**Files:**
- Modify: `.storybook/preview.ts`
- Modify: every `src/**/*.stories.ts` `title`
- Modify: every `src/**/*.e2e.ts` story-id prefix (`const story = (name) => \`components-select--${name}\`` and literal ids)
- Modify: `docs/*.md*` links containing `?path=/story/` or `id=`
- Create: `.storybook/groups.ts` (no Node imports, so the preview can load it), `scripts/story-titles.test.ts`

**Interfaces:**
- Produces: `STORY_GROUPS: readonly string[]` from `.storybook/groups.ts`, in this order: `Foundations, Actions, Forms, Text, Navigation, Menus, Dialogs, Feedback, Cards & Lists, Containers, Data, AI & Chat, Patterns`. Later tasks add stories under these titles only.
- Produces: new story-id prefixes, e.g. `forms-select--`, `data-data-table--`, `foundations-typography--`, `patterns-sign-in--`.

- [ ] **Step 1: Write the failing test** `scripts/story-titles.test.ts`:
  - `every story title is "<group>/<Name>"`: for each `src/**/*.stories.ts`, the meta `title` splits into exactly two parts; part 0 is in `STORY_GROUPS`; part 1 matches `/^[A-Z0-9][\w&-]*( [A-Z0-9][\w&-]*)*$/` (Title Case, "Sign-in", "Input OTP" allowed).
  - `the component placement matches the design`: a map from title to group equal to the spec's sidebar block (e.g. `"Forms/Text Area"`, `"Data/Data Table"`, `"Foundations/Interaction"`, `"Cards & Lists/Item"`).
- [ ] **Step 2: Run** `bun test scripts/story-titles.test.ts`. Expected: FAIL (titles are `Components/...`).
- [ ] **Step 3: Implement.** Retitle every story per the spec block. In `preview.ts`, set `document.body.style.font = "var(--pl-text-base) / var(--pl-leading-normal) var(--pl-font-sans)"` and `document.body.style.color = "var(--pl-color-foreground)"` in the decorator, and `parameters.options.storySort = { order: [...STORY_GROUPS] }` (import the array from `.storybook/groups.ts`). Make `GlassLight` and `GlassLightRtl` in toolbar and navigation-menu set `theme: "light"`. Update every e2e story id and docs link to the new prefixes; `grep -rn "components-\|typography--\|tokens--\|surfaces--\|behaviors-" src e2e docs` returns nothing afterwards.
- [ ] **Step 4: Run** `bun test scripts/story-titles.test.ts`, `bun run lint`, `bun run typecheck`, `bun run build-storybook`. Expected: all pass.
- [ ] **Step 5: Push and run** e2e-quick with `path=src` on chromium. Expected: no failures from story ids that don't exist.
- [ ] **Step 6: Commit** `chore(storybook): group the sidebar and set the page font`.

### Task 2: Glass backdrop for stories

**Files:**
- Modify: `.storybook/preview.ts`
- Create: `.storybook/backdrop.css.ts`
- Create: `.storybook/under-glass.ts` (outside `src/`, so it never ships)
- Modify: the glass story of every content component (list in Global Constraints)
- Modify: `src/tokens/tokens.stories.ts` (`Materials` sets `globals: { material: "glass" }`)

**Interfaces:**
- Produces: when `globals.material === "glass"`, the decorator sets `document.body.dataset.backdrop = ""`, and `backdrop.css.ts` paints `body[data-backdrop]` with a fixed scene of three overlapping radial gradients in `--pl-color-cerulean`, `--pl-color-punch-red` and `--pl-color-honeydew` over `--pl-color-background`, plus a faint repeating line pattern. Otherwise the attribute is removed.
- Produces: `underGlass(content: TemplateResult): TemplateResult` in `.storybook/under-glass.ts`, which renders a `pl-toolbar` (title "Glass toolbar") above `content` inside a scrolling region, so content scrolls beneath the glass bar.

- [ ] **Step 1: Write the failing e2e** in `src/surfaces/surfaces.e2e.ts`: `glass stories paint the backdrop` opens `foundations-surfaces--glass` and asserts `getComputedStyle(document.body).backgroundImage` contains `radial-gradient`; `solid stories do not` opens `foundations-surfaces--default` and asserts it is `none`.
- [ ] **Step 2: Implement** the decorator, the scene and `underGlass`. Switch every content component's `Glass` story to `render: () => underGlass(<its default render>)`.
- [ ] **Step 3: Run** local checks and `bun run build-storybook`; push; run e2e-quick `path=src/surfaces`. Expected: PASS.
- [ ] **Step 4: Commit** `chore(storybook): draw a backdrop behind glass stories`.

### Task 3: Liquid Glass material tokens

**Files:**
- Modify: `src/tokens/tokens.css` (material section)
- Modify: `src/tokens/tokens.e2e.ts`

**Interfaces:**
- Produces tokens (solid values in `:root`, glass values under `[pl-material="glass"]`, solid again in the reduced-transparency/contrast/forced-colors block):
  - `--pl-material-highlight`: solid `transparent`; glass `color-mix(in srgb, #fff 45%, transparent)` (light) / `color-mix(in srgb, #fff 22%, transparent)` (dark), via `light-dark()`.
  - `--pl-material-edge`: glass becomes `inset 0 1px 0 0 var(--pl-material-highlight), inset 0 0 0 1px var(--pl-color-overlay-border)`.
  - `--pl-material-control`: solid `var(--pl-color-secondary)`; glass `var(--pl-color-overlay)`.
  - `--pl-material-control-filter`: solid `none`; glass `blur(var(--pl-blur-md)) saturate(125%)`.
  - `--pl-elevation-control`: solid `none`; glass `0 calc(var(--pl-spacing) / 4) calc(var(--pl-spacing) * 2) color-mix(in srgb, #000 18%, transparent)`.

- [ ] **Step 1: Write the failing e2e** in `tokens.e2e.ts`:
  - `glass controls get a material`: under `pl-material="glass"`, a probe element with `background: var(--pl-material-control); backdrop-filter: var(--pl-material-control-filter)` has a computed `backdrop-filter` containing `blur` and a background alpha below 1.
  - `glass edge carries a highlight`: the computed `box-shadow` of `var(--pl-material-edge)` lists two shadows.
  - `reduced transparency makes controls solid` and `more contrast makes controls solid`: with `page.emulateMedia({ reducedTransparency: "reduce" })` / `{ contrast: "more" }`, the probe's `backdrop-filter` is `none` and its background alpha is 1.
  - `text on glass meets contrast over the backdrop`: on `foundations-surfaces--glass` in light and dark, run the existing contrast helper from `e2e/helpers/color.ts` over every text node. Expected: no violations.
- [ ] **Step 2: Implement** the tokens. Update the section comment to name the controls and navigation layer.
- [ ] **Step 3: Run** local checks; push; e2e-quick `path=src/tokens` on chromium, firefox and webkit. Expected: PASS.
- [ ] **Step 4: Commit** `feat(tokens): Liquid Glass highlight and control material`.

### Task 4: Glass on navigation and overlays

**Files:**
- Modify CSS: `sidebar`, `menubar`, `tabs`, `pagination`, `breadcrumb`, `command`, `toast`, `banner`, `hover-card` (`src/components/<name>/<name>.css.ts`)
- Create: `src/glass.e2e.ts`

**Interfaces:**
- Consumes: Task 3 tokens. Bars (sidebar, menubar, tabs list, pagination, breadcrumb) use `--pl-material-bar` (sidebar uses `--pl-material-sidebar`) with the matching `-filter` and `box-shadow: var(--pl-material-edge)`. Floating surfaces (command, toast, banner, hover-card) use `--pl-material-panel`, `--pl-material-panel-filter`, `box-shadow: var(--pl-material-edge), var(--pl-elevation-panel)`.
- Produces: `src/glass.e2e.ts` exports nothing; it holds a table `GLASS: { story: string; surface: (root: Locator) => Locator }[]` that Tasks 4 and 5 both extend.

- [ ] **Step 1: Write the failing e2e** `src/glass.e2e.ts`: for each entry, open the story with globals `material:glass`, and assert the surface's computed `backdrop-filter` contains `blur`; open it with `material:solid` and assert `none`. Entries for this task: the nine components above, using each one's glass story id from Task 1.
- [ ] **Step 2: Implement** the CSS per component.
- [ ] **Step 3: Run** local checks; push; e2e-quick `path=src/glass.e2e.ts` and `path=src/components` (chromium). Expected: PASS, including the existing a11y and contrast checks.
- [ ] **Step 4: Commit** `feat: glass on navigation and floating surfaces`.

### Task 5: Glass on controls

**Files:**
- Modify CSS: `button`, `button-group`, `toggle`, `toggle-group`, `switch`, `slider`, `checkbox`, `radio-group`, `input`, `textarea`, `select` (trigger), `combobox`, `number-field`, `date-picker`, `input-otp`, `prompt-input`, `message-scroller` (jump button), `carousel` (controls)
- Modify: `src/glass.e2e.ts`

**Interfaces:**
- Consumes: `--pl-material-control`, `--pl-material-control-filter`, `--pl-material-edge`, `--pl-elevation-control`. Filled accent and destructive buttons keep their tint as the fill and add only the edge and filter; neutral faces switch from `--pl-color-secondary` to `--pl-material-control`.

- [ ] **Step 1: Extend** the `GLASS` table with these 18 components (surface = the shadow part that paints the control face). Run e2e-quick `path=src/glass.e2e.ts`. Expected: the new rows FAIL.
- [ ] **Step 2: Implement** the CSS.
- [ ] **Step 3: Run** local checks; push; e2e-quick `path=src/glass.e2e.ts` then `path=src/components` on all three browsers. Expected: PASS.
- [ ] **Step 4: Commit** `feat: glass on controls`.

### Task 6: Tokens page

**Files:**
- Modify: `src/tokens/tokens.stories.ts`, `src/tokens/tokens.e2e.ts`

**Interfaces:**
- Produces stories: `Colors` (every `--pl-color-*` token as a swatch with its name; light and dark side by side via two containers with inline `color-scheme`), `Spacing` (each `--pl-space-*` as a bar of that inline size), `Radii`, `Sizes` (`--pl-size-*`, `--pl-touch-min`, `--pl-size-hit-min`), `Text` (`--pl-text-*` × `--pl-leading-*`), `Icons` (`--pl-icon-*`), `Materials` (bar, sidebar, panel, sheet, control over the Task 2 backdrop), `Blur` (one `backdrop-filter: blur(var(--pl-blur-*))` panel per token, glass material), `Elevation`, `Motion` (a dot animating with each `--pl-duration-*` and `--pl-ease-out`, paused under `prefers-reduced-motion`). The token lists are read at runtime from `document.styleSheets` (rules whose selector is `:root`), so new tokens appear without editing the story.

- [ ] **Step 1: Write the failing e2e**: `every color token has a swatch` counts `--pl-color-*` custom properties on `:root` and asserts the `Colors` story renders twice that many swatches (light + dark); `motion stops under reduced motion` asserts the animation's `animation-play-state` is `paused` with `reducedMotion: "reduce"`.
- [ ] **Step 2: Implement** the stories; remove `Palette`.
- [ ] **Step 3: Run** local checks; push; e2e-quick `path=src/tokens`. Expected: PASS.
- [ ] **Step 4: Commit** `docs(storybook): a visual tokens page`.

### Task 7: Typography prose showcase

**Files:**
- Modify: `src/typography/typography.css.ts`, `src/typography/typography.stories.ts`, `src/typography/typography.e2e.ts`

**Interfaces:**
- Produces: `.pl-prose` rules for every element listed in the spec's Typography bullet that it does not style today. Values come from existing tokens (`--pl-text-*`, `--pl-leading-*`, `--pl-space-*`, `--pl-color-*`, `--pl-radius`). `kbd` matches `pl-kbd`'s look; `mark` uses `--pl-color-selected`; `details` uses the disclosure chevron from `pl-collapsible`.

- [ ] **Step 1: Write the failing e2e** `every prose element is styled`: for each selector in `["mark","del","ins","s","sub","sup","abbr[title]","q","cite","kbd","time","dl","dt","dd","figure","figcaption","hr","address","details","summary","pre","small",".lead"]`, the element inside `#prose` differs from a reference `<div>` of the same text in at least one of `font-size`, `font-style`, `font-weight`, `color`, `background-color`, `text-decoration-line`, `margin-block-start`. Also `the article uses every listed element` asserts each selector matches inside `#prose`.
- [ ] **Step 2: Implement** the article (cat-care theme, as today) and the missing rules.
- [ ] **Step 3: Run** local checks; push; e2e-quick `path=src/typography`. Expected: PASS.
- [ ] **Step 4: Commit** `feat(typography): prose styles for every text element`.

### Task 8: Form widths and pl-table spans

**Files:**
- Modify stories: `input`, `input-group`, `textarea`, `number-field`, `select`, `combobox`, `date-picker`, `input-otp`, `table`
- Modify CSS (default width): `select`, `combobox`, `input`, `input-group`
- Modify e2e: the same components' `.e2e.ts`

**Interfaces:**
- Produces: a `Widths` story per form component rendering four instances with `style="inline-size: calc(var(--pl-spacing) * N)"` for N = 24, 40, 60, and one at `inline-size: 100%`. Default `inline-size` for select, combobox and input becomes `calc(var(--pl-spacing) * 40)` (fits "Search varieties" and "Choose a value").
- Produces: `pl-table` stories `GroupedHeaders` (a two-row `thead` with `colspan`) and `MergedCells` (`rowspan` in `tbody`).

- [ ] **Step 1: Write the failing e2e** per component: `widths story sizes the control` asserts the four controls' bounding widths are strictly increasing; `placeholder fits by default` (select, combobox) asserts the placeholder's `scrollWidth <= clientWidth`. For table: `merged cells keep their spans` asserts the cells' `colSpan`/`rowSpan` and that axe passes.
- [ ] **Step 2: Implement.**
- [ ] **Step 3: Run** local checks; push; e2e-quick on each touched folder. Expected: PASS.
- [ ] **Step 4: Commit** `feat: form widths and table spans in stories`.

### Task 9: Data table built-in filter and pagination

**Files:**
- Create: `src/components/data-table/data-table-model.ts`, `src/components/data-table/data-table-model.test.ts`
- Modify: `src/components/data-table/data-table.ts`, `.css.ts`, `.stories.ts`, `.e2e.ts`

**Interfaces:**
- Produces in `data-table-model.ts`:
  - `filterRows(rows: PlDataTableRow[], columns: PlDataTableColumn[], query: string): PlDataTableRow[]`: case- and accent-insensitive substring match on any column's string value; empty query returns `rows`.
  - `pageCount(total: number, pageSize: number): number`: at least 1.
  - `pageRows<T>(rows: T[], page: number, pageSize: number): T[]`: `page` is 1-based and clamped to `1..pageCount`; `pageSize <= 0` returns all rows.
- Produces on `pl-data-table` (additive):
  - `filterable` (boolean attr): shows a search `pl-input` above the table, labelled by `filter-label` (default "Filter").
  - `filter` (string property and attr): the global query.
  - `page-size` (number attr, default 0 = no paging) and `page` (number attr, default 1): with `page-size > 0`, renders `pl-pagination` below the table.
  - `manual-filter`, `manual-pagination` (boolean attrs): like `manual-sort`, the component shows state but leaves rows to the app.
  - Events: `pl-filter` `{ value: string }`; `pl-page` `{ page: number }`.

- [ ] **Step 1: Write failing unit tests** `data-table-model.test.ts`: `filterRows matches any column ignoring case and accents` ("cafe" finds "Café"); `filterRows with empty query returns all rows`; `pageRows clamps a page past the end to the last page` (10 rows, size 4, page 9 → rows 9–10); `pageCount of zero rows is 1`; `pageRows with size 0 returns everything`.
- [ ] **Step 2: Run** `bun test src/components/data-table/data-table-model.test.ts`. Expected: FAIL (module missing).
- [ ] **Step 3: Implement** the model, then wire it into `pl-data-table` (filter before sort, then page). Typing in the field updates `filter`, resets `page` to 1, fires `pl-filter`. Selection's select-all applies to the filtered rows.
- [ ] **Step 4: Run** the unit tests. Expected: PASS.
- [ ] **Step 5: Write e2e** `filter narrows rows and resets the page`, `no matches shows the empty state`, `pagination moves through rows`, `filter then page past the end clamps`, plus stories `Filterable` and `Paginated`. Push; e2e-quick `path=src/components/data-table` on all three browsers. Expected: PASS.
- [ ] **Step 6: Commit** `feat(data-table): built-in filter and pagination`.

### Task 10: Data table model mode (rendering)

**Files:**
- Create: `src/components/data-table/data-table-types.ts`
- Modify: `src/components/data-table/data-table.ts`, `.css.ts`, `.e2e.ts`, `.stories.ts`

**Interfaces:**
- Produces in `data-table-types.ts` (exported from `data-table.ts` too):
  ```ts
  export type PlPin = "start" | "end";
  export interface PlModelColumn { key: string; label: string; visible: boolean; canHide: boolean; pinned?: PlPin; grouped?: boolean; width?: number; resizable?: boolean }
  export interface PlModelHeader { id: string; column?: string; label: string; colSpan: number; rowSpan?: number; placeholder?: boolean; sortable?: boolean; sort?: "ascending" | "descending"; filter?: { value: string; facets?: string[] }; pinned?: PlPin; width?: number; resizable?: boolean }
  export interface PlModelCell { id: string; column: string; value: unknown; colSpan?: number; rowSpan?: number; aggregate?: boolean; selected?: boolean; pinned?: PlPin }
  export interface PlModelRow { id: string; depth: number; cells: PlModelCell[]; pinned?: "top" | "bottom"; selected?: boolean; expandable?: boolean; expanded?: boolean; group?: { column: string; value: string; count: number } }
  export interface PlDataTableModel { columns: PlModelColumn[]; headerGroups: PlModelHeader[][]; rows: PlModelRow[]; footer?: PlModelCell[]; page?: { page: number; total: number }; filter?: string }
  ```
- Produces on `pl-data-table`: `model: PlDataTableModel | undefined` (property). When set, the component renders exactly the model (header rows, cells with spans, group rows with value and count, indented expandable rows with a disclosure button, aggregate footer, pinned rows and columns as sticky with `inset-inline-start/end`, column widths) and ignores `columns`, `rows`, sort, filter and paging logic. Header sort buttons, the filter field and pagination fire the Task 9 events and `pl-sort`.
- Produces event `pl-expand` `{ row: string; expanded: boolean }`.

- [ ] **Step 1: Write failing e2e** on a new story `ModelGrouped` (hand-written model with grouping, aggregates, spans, a pinned row and two pinned columns): `renders header groups with colspan`, `group rows show value and count`, `expand button toggles aria-expanded and fires pl-expand`, `pinned column stays visible while scrolling horizontally` (RTL variant: it sits at the right edge), `footer shows aggregates`, axe passes.
- [ ] **Step 2: Implement.** Expand buttons are `<button aria-expanded>` in the first cell; grouped table keeps native table semantics (no `role=grid`).
- [ ] **Step 3: Run** local checks; push; e2e-quick `path=src/components/data-table` on all three browsers. Expected: PASS.
- [ ] **Step 4: Commit** `feat(data-table): render a supplied table model`.

### Task 11: Data table column and cell interactions

**Files:**
- Modify: `src/components/data-table/data-table.ts`, `.css.ts`, `.e2e.ts`, `.stories.ts`

**Interfaces:**
- Consumes: Task 10 model.
- Produces, in model mode:
  - A column menu button per header (a `pl-menu`) with: Sort ascending/descending, Hide (when `canHide`), Move earlier/Move later, Pin to start/Pin to end/Unpin, Group by/Ungroup.
  - A "Columns" `pl-menu` above the table with a checkbox item per column (`visible`).
  - Per-column filter: when a header has `filter`, a `pl-combobox` under the label with `facets` as options.
  - Resize handle: a `role="separator"` with `aria-orientation="vertical"`, `aria-valuenow` = width, draggable with the pointer and moved with arrow keys by `var(--pl-spacing)` steps; in RTL a leftward drag widens.
  - Cell selection: shift-click or shift-arrow extends a rectangular range from the focused cell.
- Produces events: `pl-column-visibility` `{ column, visible }`, `pl-column-order` `{ column, index }`, `pl-column-pin` `{ column, side: PlPin | null }`, `pl-column-resize` `{ column, width }`, `pl-column-group` `{ column, grouped }`, `pl-filter` gains optional `column`, `pl-row-pin` `{ row, side: "top" | "bottom" | null }` (row menu), `pl-cell-select` `{ cells: string[] }`.

- [ ] **Step 1: Write failing e2e** on story `ModelInteractive`: each menu action fires its event with the expected detail; `arrow keys on a resize handle fire pl-column-resize`; `RTL: dragging the handle left fires a larger width`; `shift-click selects a rectangle` (2×3 → six ids); keyboard reachability for every control; axe passes.
- [ ] **Step 2: Implement.**
- [ ] **Step 3: Run** local checks; push; e2e-quick `path=src/components/data-table` on all three browsers. Expected: PASS.
- [ ] **Step 4: Commit** `feat(data-table): column, row and cell controls`.

### Task 12: TanStack adapter

**Files:**
- Create: `src/components/data-table/tanstack.ts`, `src/components/data-table/tanstack.test.ts`
- Modify: `package.json` (`exports["./data-table/tanstack"]`, `peerDependencies["@tanstack/table-core"]: "^9.3.1"`, `peerDependenciesMeta` optional, `devDependencies["@tanstack/table-core"]: "9.3.1"`), `vite.config.ts` (entry `data-table-tanstack` and `external` `/^@tanstack\/table-core(\/|$)/`), `THIRD_PARTY_NOTICES` via `bun run notices`

**Interfaces:**
- Consumes: Task 10 model and Task 9–11 events.
- Produces:
  - `toModel(table: Table<any>): PlDataTableModel`: maps header groups (with placeholders and spans), visible leaf columns, row model (grouped, expanded, pinned, selected), cell spanning, aggregated footer, pagination and global filter from the TanStack instance.
  - `connectTanStack(el: PlDataTable, table: Table<any>): () => void`: sets `el.model = toModel(table)` now and on every table state change (subscribe through the table's store), maps each `pl-*` event to the matching TanStack API (`column.toggleSorting`, `setGlobalFilter`, `column.setFilterValue`, `setPageIndex(page - 1)`, `row.toggleExpanded`, `column.toggleVisibility`, `setColumnOrder`, `column.pin`, `setColumnSizing`, `column.toggleGrouping`, `row.pin`, `row.toggleSelected`), and returns a disconnect function that removes listeners and the subscription.
  - Verify the v9 names (features registration, store subscription, `pin("left" | "right")`) against the 9.3.1 docs before writing; `start`/`end` map to `left`/`right` in LTR and to `right`/`left` in RTL (`el.matches(":dir(rtl)")`).

- [ ] **Step 1: Write failing unit tests** `tanstack.test.ts` with a real table-core table over a 6-row fixture: `toModel mirrors sorting`, `toModel emits header placeholders for grouped columns`, `toModel marks grouped rows with value and count`, `connect re-renders when the app changes state` (call `table.setSorting(...)` and assert `el.model` changed; `el` is a plain `EventTarget` with a `model` field), `one pl-sort event toggles sorting once`, `disconnect stops updates`.
- [ ] **Step 2: Run** `bun test src/components/data-table/tanstack.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement**; install the dev dependency with `bun add -d @tanstack/table-core@9.3.1`.
- [ ] **Step 4: Run** the unit tests and `bun run build`; check `dist/data-table-tanstack.js` exists and `grep -c "createTable" dist/data-table-tanstack.js` finds only the import, not an inlined copy. Expected: PASS. (`scripts/pack-check.test.ts` opens Chromium, so it runs in CI's unit job, not locally.)
- [ ] **Step 5: Commit** `feat(data-table): optional TanStack Table adapter`.

### Task 13: TanStack feature stories

**Files:**
- Create: `src/components/data-table/data-table-tanstack.stories.ts` (title `Data/Data Table TanStack`), `src/components/data-table/data-table-tanstack.e2e.ts`

**Interfaces:**
- Consumes: `connectTanStack`. Stories, one per feature: `Sorting`, `GlobalFiltering`, `ColumnFiltering`, `Faceting`, `RowSelection`, `Pagination`, `Expanding`, `Grouping`, `Aggregation`, `RowPinning`, `ColumnPinning`, `ColumnOrdering`, `ColumnSizing`, `ColumnResizing`, `ColumnVisibility`, `CellSpanning`, `CellSelection`, plus `KitchenSink` with all of them. Fixture: 40 synthetic rows of cat-adoption data (name, breed, age, shelter, status, adopted date).

- [ ] **Step 1: Write e2e**, one test per story, that performs the feature's user action and asserts the visible result (e.g. `Grouping: group by shelter shows one group row per shelter`).
- [ ] **Step 2: Implement** the stories.
- [ ] **Step 3: Run** local checks; push; e2e-quick `path=src/components/data-table` on all three browsers. Expected: PASS.
- [ ] **Step 4: Commit** `docs(storybook): one story per TanStack Table feature`.

### Task 14: Sign-in variants

**Files:**
- Modify: `src/patterns/sign-in.stories.ts`, `src/patterns/sign-in.e2e.ts`

**Interfaces:**
- Produces stories: `WithLogo`, `Providers` (buttons "Continue with Apple", "Continue with Google", "Continue with GitHub" with neutral glyphs), `Sso` (work email → "Continue" → status "Redirecting to your company's sign-in"), `Passkey`, `MagicLink` (email → "Check your email" state), `Complete` (logo, providers, divider "or", email and password, remember me, forgot password link, create-account link, terms footer). Existing `Default`, `Code`, `ErrorStates`, `Rtl`, `Glass` stay.

- [ ] **Step 1: Write failing e2e**: each story's key flow (SSO hand-off status appears; magic link shows the sent state; passkey button exists and is labelled; every provider button has an accessible name), and axe passes.
- [ ] **Step 2: Implement.**
- [ ] **Step 3: Run** local checks; push; e2e-quick `path=src/patterns/sign-in.e2e.ts`. Expected: PASS.
- [ ] **Step 4: Commit** `docs(storybook): sign-in variants`.

### Task 15: Open states and wrong content

**Files:**
- Modify stories and e2e: `popover`, `tooltip`, `context-menu`, `date-picker`, `chat` (pattern), `input-otp`, `slider`, `prompt-input`, `collapsible`, `checkbox`, `select`, `banner`

**Interfaces:**
- Produces: `Placements` stories in popover and tooltip open all four placements (each anchored to its own trigger, `open` set); context-menu `Disabled` opens the menu; new context-menu `Submenu` story opens the Share submenu; date-picker `Range` shows a start and end date; chat `Streaming` shows a partial reply with the streaming indicator; input-otp `States` includes an invalid row; slider stories render a `pl-field` label and the value; prompt-input `Multiline` holds four lines; collapsible `Disabled`; checkbox `States` includes invalid and read-only; select `Default` shows a placeholder; banner `WithoutIcon` hides the icon (fix in `banner.ts` if the attribute does not hide it); input-otp `Labelled` shows its label (fix in the component if the label is not rendered).

- [ ] **Step 1: Write failing e2e** per item asserting the visible state (e.g. `placements: four popovers are visible`, `without icon: the icon part is not rendered`).
- [ ] **Step 2: Implement.**
- [ ] **Step 3: Run** local checks; push; e2e-quick per folder. Expected: PASS.
- [ ] **Step 4: Commit** `docs(storybook): show the states the stories name`.

### Task 16: Layout and overlap bugs

**Files:**
- Modify (CSS and stories as needed): `src/patterns/mail.stories.ts`, `chat.stories.ts`, `dashboard.stories.ts`, `settings.stories.ts`, `sign-in.stories.ts`; components `drawer`, `message-scroller`, `prompt-input`, `attachment`, `data-table`, `carousel`, `message`, `input`, `input-group`, `radio-group`, `toolbar`
- Modify: matching `.e2e.ts`; `src/quality.e2e.ts`

**Interfaces:**
- Produces: `src/quality.e2e.ts` test `no story element overflows its parent at 320px and 768px` over every pattern story, using `e2e/helpers/rendered.ts`, which asserts no element's bounding box exceeds the story root and the root has no horizontal scrollbar.

- [ ] **Step 1: Write failing e2e**, one per finding:
  - `mail: sidebar fits its column` (no horizontal scroll)
  - `drawer: body ends above the actions`
  - `message-scroller: jump button does not cover text`, with scroll padding equal to the button's block size
  - `prompt input: buttons are inset by --pl-pad-control from the bar's top and bottom`
  - `attachment group: no card is clipped at rest`
  - `sticky header: the scroll area shows whole rows`
  - `carousel keyboard: the slide label is one line, centered`
  - `message own: name aligns with the bubble`
  - `validation message spans the field width`
  - `radio horizontal: equal gaps`
  - `toolbar spacers: title centered within ±1px`
- [ ] **Step 2: Implement** each fix in the component CSS (not story-only, unless the bug is the story's own layout).
- [ ] **Step 3: Run** local checks; push; e2e-quick `path=src` on all three browsers. Expected: PASS.
- [ ] **Step 4: Commit** `fix: overlap, clipping and spacing found in the story review`.

### Task 17: Visibility, locale and RTL bugs

**Files:**
- Modify: `menu.css.ts` (submenu surface), `checkbox.css.ts` (disabled unchecked border), `data-table.css.ts` (inactive sort glyph color), `field.css.ts` (disabled fieldset labels), `date-picker.ts`, `calendar.ts` + `.css.ts`, `chart.ts`, `kbd.css.ts` (or `kbd.ts`), RTL stories with English text (dialog, message, chat, banner, card, drawer, empty, field, hover-card, context-menu, tabs, menu, menubar, settings, sign-in, typography, mail)
- Modify: matching `.e2e.ts`

**Interfaces:**
- Produces: submenu uses the same `--pl-material-panel` and item colors as the parent menu; disabled unchecked checkbox border uses `--pl-color-disabled-foreground`; sort glyph uses `--pl-color-muted-foreground`; date-picker formats with `Intl.DateTimeFormat` and wraps the value in `<bdi>`; calendar day cells use `{ day: "numeric" }` without the suffix when the cell width can't fit it, and weekday headers use `weekday: "narrow"` for locales whose short names collide; chart reverses the category axis and moves the value axis to the end side in RTL; `pl-kbd` sets `direction: ltr` on the key sequence; English content in RTL stories sits in elements with `dir="ltr"` (blocks) or `<bdi>` (inline).

- [ ] **Step 1: Write failing e2e**: `submenu text meets contrast`; `disabled unchecked checkbox border meets 3:1 non-text contrast`; `date-picker ar locale shows a well-ordered value` (text equals `new Intl.DateTimeFormat(locale).format(date)`); `calendar ja: day labels are one line`; `chart rtl: January is rightmost`; `kbd rtl reads ⌘K`; `rtl stories: English sentences end with their period` (text of `[dir=ltr]` / `bdi` elements is unchanged and visually LTR).
- [ ] **Step 2: Implement.**
- [ ] **Step 3: Run** local checks; push; e2e-quick `path=src` on all three browsers. Expected: PASS.
- [ ] **Step 4: Commit** `fix: visibility, locale and RTL issues from the story review`.

### Task 18: Changeset, review and PR

**Files:**
- Create: `.changeset/storybook-review.md` (minor)

- [ ] **Step 1: Write the changeset** listing the shipped changes from Global Constraints.
- [ ] **Step 2: Rerun the screenshot review**: start Storybook with `up`, capture every story in NEO, run the Codex review script with the corrected prompt, and confirm every finding from the spec is gone; fix anything new before continuing.
- [ ] **Step 3: Run** every local check plus `bun run build` and `bun run build-storybook`; grep for CI-only suites touched (`git diff --name-only origin/main | grep e2e`) and confirm each passed in an e2e-quick run.
- [ ] **Step 4: Self-review the diff, then get a second-model review**; fix findings.
- [ ] **Step 5: Commit, push, open the PR** (body ends with `🤖 Generated with [Claude Code](https://claude.com/claude-code)`), turn on Auto-fix and squash auto-merge.
