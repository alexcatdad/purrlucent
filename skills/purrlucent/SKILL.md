---
name: purrlucent
description: Use purrlucent's pl-* web components in an app. Use when adding, migrating to, styling, testing or upgrading pl-* elements, or when a task touches a purrlucent import.
---

ALWAYS read references/components.md, references/react.md and references/install.md before using an element
NEVER guess an attribute, event, slot, part or method: look it up in references/components.md
IF the package is missing: install from the GitHub Release URL in references/install.md; it is not on the npm registry
IF npm 12 or later: add allow-remote=root to the project's .npmrc first
IF upgrading: change the version in the URL
DO import purrlucent/tokens.css once and each component's path (purrlucent/button) once, in the app entry; child elements come with their parent (pl-option with purrlucent/select)
DO paint body with --pl-color-background, --pl-color-foreground and --pl-font-sans; no font ships, load Inter or get the system font
IF React: React 19 or later only; IF React 18 or earlier: stop, tell the owner
IF React with TypeScript: add import type {} from "purrlucent/react" once, in a file the tsconfig includes (vite-env.d.ts)
IF React: write pl-* tags as JSX; props are set as properties
IF listening to a pl-* event in React: on + exact event name (onpl-change); read the typed e.detail
IF a form value changes: onChange/onInput work as on a native input; read e.currentTarget.value/checked
IF react-hook-form: spread register() on the element as on a native input; pl-checkbox/pl-switch give booleans
IF setting value/checked from code: no event fires; update app state yourself
IF calling a method (dialog show/close, popover show/hide, menu showAt/hide): use a ref to the element
NEVER wrap pl-* elements in React components only to rename props or events
FOR EACH element: give it the accessible name references/components.md asks for: slotted text (button, checkbox, switch, radio, toggle, input, textarea, number-field), slot="label" (select, combobox), label attribute (radio-group, toggle-group, slider, progress, spinner, popover, toolbar, sidebar, dialog); icon-only: aria-label
IF forms: put controls in a native <form>; they submit name and value, reset and validate like native inputs
IF styling: --pl-* tokens first, ::part() second; NEVER style shadow DOM internals another way
NEVER lower text contrast with a token override; the contrast checks cover only the defaults
IF glass is wanted: pl-material="glass" on <html>
IF migrating existing UI: one element type per change; keep the existing behavior and tests passing
IF purrlucent has no element for a need: keep the native element or the existing component; NEVER build a pl-* lookalike
IF testing pl-* elements: run in a real browser (Vitest browser mode, Playwright); NEVER jsdom/happy-dom for form controls
IF a test reads an element right after creating it: await el.updateComplete
IF server rendering: render pl-* elements on the client only
IF an element misbehaves: check references/components.md first; then report it on the purrlucent repo's issues
