---
name: purrlucent
description: Use purrlucent's pl-* web components in an app. Use when installing, adding, migrating to, styling, testing or upgrading pl-* elements, or when a task touches a purrlucent import.
---

FOR EACH element you use: grep references/components.md for `<pl-name>` and read the whole `## ` section around it; take its import path, child elements, attributes, events, slots, parts, methods and accessible name from there; icon-only: aria-label
IF the package is missing or upgrading: read references/install.md; purrlucent is not on the npm registry
IF npm 12 or later: add allow-remote=root to the project's .npmrc first
IF React: read references/react.md; React 19 or later only; IF React 18 or earlier: stop, tell the owner
IF React: write pl-* tags directly in JSX
DO import purrlucent/tokens.css once and each component's path once, in the app entry; child elements come with their parent (pl-option with purrlucent/select)
DO paint body with --pl-color-background, --pl-color-foreground and --pl-font-sans; no font ships, load Inter or get the system font
IF styling: --pl-* tokens first, ::part() second; NEVER style shadow DOM internals another way
IF overriding a color token: keep text contrast at least as high as the defaults; the contrast checks cover only the defaults
IF glass is wanted: pl-material="glass" on <html>
IF migrating existing UI: one element type per change
IF purrlucent has no element for a need: keep the native element or the existing component; NEVER build a pl-* lookalike
IF testing pl-* elements: run in a real browser (Vitest browser mode, Playwright); jsdom and happy-dom break the form controls
IF a test reads an element right after creating it: await el.updateComplete
IF server rendering: render pl-* elements on the client only
IF an element misbehaves: report it on the purrlucent repo's issues
