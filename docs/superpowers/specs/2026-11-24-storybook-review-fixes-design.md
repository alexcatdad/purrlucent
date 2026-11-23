# Storybook review fixes

## Intent

Storybook is purrlucent's showcase. A screenshot review of all 559 stories found that the glass material is invisible, story text loses the system font, several pages do not show what their names promise, layouts overlap or spill, RTL and locale rendering breaks, and the sidebar is a flat list. This change makes every story an accurate, complete demonstration of the library, and adds the component work the showcase exposes as missing.

## Goals

- Glass mode looks like glass on every element of the controls and navigation layer.
- Every story renders in the library's fonts, with no overlap, clipping or spill at any width the story offers.
- Foundations pages (Typography, Tokens) document the whole system visually.
- Each component's stories show the variants a user expects: widths for form elements, every table feature, typical sign-in features, open states for overlays.
- The Storybook sidebar is organized by purpose.

## Non-goals

- The contrast global stays inert in Storybook (the tokens follow `prefers-contrast`).
- No new HIG text-style tokens; the Typography page documents prose.
- No brand marks (Apple, Google, GitHub logos) in the sign-in demo.

## Anti-goals

- Glass on content (cards, table rows, avatars, bubbles, badges, charts, calendar grids). HIG reserves Liquid Glass for the controls and navigation layer.
- Text that fails the contrast checks on glass.
- Writing TanStack Table's logic a second time inside purrlucent.

## Constraints

- Apple HIG overrides every other design choice, glass mode included.
- Dependent values derive from tokens via `calc()`, not typed-in numbers.
- Every new behavior gets unit and e2e coverage; e2e and browser tests run in GitHub Actions only.
- Glass mode is a shipped library feature (`pl-material="glass"` on any ancestor), so its new tokens and component styles live in `src/`. Storybook-only fixes (page font, sidebar order, backdrop) stay in `.storybook/` or the stories.
- Everything ships in one pull request, built as a series of focused commits.
- Existing public APIs stay; new data-table features are additive.

## Approaches

### Glass scope

1. **Controls and navigation (chosen).** Glass applies to navigation, overlays and controls; content stays solid. Matches HIG.
2. Every component. Rejected: puts content on glass, against HIG, and risks unreadable text.

### Table features

1. **Data table draws every feature; TanStack optionally runs the logic (chosen).** `pl-data-table` renders the UI for all of TanStack Table's features and keeps a small built-in engine for sort, global filter, selection and pagination. An optional entry point connects a TanStack table instance. Trade-off: two drivers to keep consistent.
2. All features built natively plus TanStack. Rejected: duplicates TanStack's logic.
3. TanStack always inside. Rejected: the integration must be optional.

## Design

### 1. Storybook foundation

- `.storybook/preview.ts` sets the page font (`--pl-font-sans`) and text color on `body`, so story text outside components renders in the system font.
- Story titles are regrouped and renamed to Title Case:

```
Foundations     Tokens · Typography · Surfaces · Interaction
Actions         Button · Button Group · Toggle · Toggle Group
Forms           Field · Input · Input Group · Input OTP · Text Area · Number Field ·
                Select · Combobox · Checkbox · Radio Group · Switch · Slider ·
                Date Picker · Calendar
Text            Badge · Kbd · Marker
Navigation      Sidebar · Toolbar · Navigation Menu · Tabs · Breadcrumb · Pagination
Menus           Menu · Context Menu · Menubar · Command
Dialogs         Dialog · Drawer · Popover · Hover Card · Tooltip
Feedback        Toast · Banner · Progress · Spinner · Skeleton · Empty
Cards & Lists   Card · Item · Avatar · Attachment
Containers      Accordion · Collapsible · Carousel · Separator · Scroll Area ·
                Resizable · Aspect Ratio
Data            Table · Data Table · Chart
AI & Chat       Prompt Input · Message · Bubble · Message Scroller
Patterns        Chat · Dashboard · Mail · Settings · Sign-in
```

- `parameters.options.storySort` orders the groups as listed.
- Retitling changes story ids, so every e2e `story()` helper and any docs link that names a story id moves to the new ids in the same change.
- Stories that force a light appearance set `theme: "light"` (toolbar and navigation-menu `GlassLight`, `GlassLightRtl`).

### 2. Glass

Glass applies, in glass mode, to:

- Navigation: sidebar, toolbar, menubar, navigation menu, tabs, pagination, breadcrumb.
- Overlays: dialog and alert, drawer and sheet, popover, hover card, tooltip, menu, context menu, command, toast, banner.
- Controls: button, button group, toggle, toggle group, switch, slider, checkbox, radio, input, text area, select, combobox, number field, date picker, input OTP, prompt input, the message-scroller jump button, carousel controls.

The material gains Liquid Glass cues on top of today's blur and tint: a brighter top edge, a soft inner highlight and a light shadow, as tokens beside `--pl-material-edge`. Controls get a control-sized material (fill, filter, edge) derived from the existing ones. Increased contrast and reduced transparency fall back to solid, as today. The existing axe and contrast e2e checks are the pass criterion for text on glass, run on the glass stories over the backdrop.

Every glass story renders over a shared CSS-drawn backdrop (gradient shapes plus content) so translucency is visible. Content components keep a glass story that shows them under glass bars, not on glass. `Tokens/Materials` switches glass on.

### 3. Foundations pages

- **Typography** becomes one long `pl-prose` article using every text-level HTML element: h1–h6, paragraph, lead, `small`, `strong`, `em`, both combined, `mark`, `del`, `ins`, `s`, `sub`, `sup`, `abbr`, `q`, `cite`, `kbd`, `time`, links (plain, visited, external), blockquote with caption, nested `ul` and `ol`, `dl`, inline `code`, a `pre` code block, `figure` with image and `figcaption`, a captioned table, `hr`, `address`, `details`/`summary`, and the text color roles. `pl-prose` gains rules for any element it does not style yet. The same article appears in the RTL, dark and glass stories.
- **Tokens** shows every token group visually: color swatches in light and dark side by side, the spacing scale as bars, radii as boxes, control sizes, text sizes and line heights, icon sizes, blur and materials over the glass backdrop, elevation shadows, and motion durations as a small animation.

### 4. Component showcases

- **Form widths.** Input, input group, text area, number field, select, combobox, date picker and input OTP each get a `Widths` story (small, medium, large, full) set by CSS `inline-size`. Default widths fit a typical placeholder.
- **Tables.**
  - `pl-table` stories add grouped headers and `colspan`/`rowspan` cells.
  - `pl-data-table` renders UI for all TanStack Table features: column and global filtering, faceting, sorting, row selection, pagination (with `pl-pagination`), expanding, row and column pinning, grouping and aggregation, column ordering, sizing, resizing and visibility, cell spanning and cell selection.
  - The built-in engine covers sort (exists today), global filter, row selection (exists today) and pagination with no dependency.
  - Every other feature is presentational in the component: it renders the state it is given and fires events for user actions, and does not compute the state itself. The TanStack adapter, or the host app, supplies that state.
  - `purrlucent/data-table/tanstack` is a new `exports` subpath that connects a TanStack table instance to `pl-data-table`; `@tanstack/table-core` is an optional peer dependency and a dev dependency for Storybook and tests. One story per feature uses the adapter.
  - Tests: unit and e2e tests for the built-in engine; for adapter-driven features, unit tests for the adapter's state mapping and e2e tests on the adapter stories.
- **Sign-in.** New stories add a logo header, "Continue with Apple / Google / GitHub" with neutral icons, "Sign in with SSO" (work email, then hand-off), passkey, magic link, remember me, forgot password, a create-account link and a terms footer. Code and error stories stay.
- **Open states.** Popover and tooltip placement stories open every placement; context-menu `Disabled` opens the menu; a context-menu submenu story opens it; date-picker `Range` shows a start and end; chat `Streaming` shows a partial reply; input-otp `States` shows invalid; slider stories show labels and values; prompt input gets a multiline story; collapsible gets a disabled story; checkbox shows invalid and read-only.
- **Wrong content.** Select `Default` shows a value or placeholder; banner `WithoutIcon` hides the icon; input-otp `Labelled` shows its label.

### 5. Bugs

- Overlap and clipping: mail sidebar and content, chat, drawer body behind actions, the message-scroller button over text, attachment groups, data-table sticky-header cut row, carousel keyboard label, message `Own` sender name, validation messages in narrow columns.
- Prompt input buttons get vertical padding inside the bar.
- Narrow pattern stories (dashboard, mail, chat, settings, sign-in) fit without spill.
- Visibility: the menu submenu surface and items, the disabled unchecked checkbox, data-table sort glyphs, disabled-fieldset labels.
- Locale and RTL: date-picker locale values and calendar day and weekday labels in the locales the stories already use; chart mirroring in RTL (the category axis runs right to left and the value axis sits on the right); `⌘K` order in RTL, and English text inside RTL stories isolated with `dir="ltr"` or `<bdi>`.
- Spacing: radio-group gaps, toolbar spacer title centering, attachment vertical layout.

## Left to the builder

- Exact backdrop artwork, highlight strengths and control material values, within HIG and the contrast gates.
- Which TanStack version and API to target, verified against its current docs and npm.
- The data-table attribute and event names for the new features, following existing component conventions.
- Order of work inside the pull request.
