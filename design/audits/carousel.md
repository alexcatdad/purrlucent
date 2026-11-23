# HIG audit: carousel

Source: [HIG Page controls](https://developer.apple.com/design/human-interface-guidelines/page-controls), read 2026-11-23. The HIG has no carousel page; page controls are the nearest, and the WAI-ARIA carousel pattern (without rotation) gives the roles. Code: `src/components/carousel/`, `hig/rules/page-controls.yaml`.

Each guideline is either **library** (the component decides it) or **usage** (the app author decides it, so it belongs in the docs). Verdicts: **met**, **gap**, **deviation** (deliberate, with a reason), or **needs eyes** (a visual judgement for the maintainer). Rows marked "not stated on the HIG page" are platform or web behavior the page implies.

## Library guidelines

| Guideline (HIG wording, shortened)                                                | Verdict    | Evidence                                                                                                                                                                     |
| --------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Page controls move through an ordered list of pages.                              | met        | One dot per `pl-carousel-item`, in order; the slides scroll with native scroll-snap (`carousel.css.ts`).                                                                     |
| The control sits where people can always find it, such as centered below.         | met        | The controls row is centered under the viewport (`carousel.css.ts`).                                                                                                         |
| The current page is clearly marked.                                               | met        | The current dot is darker and wider and carries `aria-current="true"`; under forced colors it paints `Highlight` (e2e "the current dot stays visible under forced colors").  |
| Keep the number of indicators small.                                              | deviation  | One dot per slide with no collapsing; the app keeps the slide count small. Noted in usage.                                                                                   |
| Dots are simple; they do not support text (HIG page controls).                    | met        | Each dot is a plain circle; its name comes from `page-label`.                                                                                                                |
| A dot is a button that jumps to its page (HIG: people can tap a dot, not stated). | met        | Each dot is a button that scrolls to its page (e2e "a dot scrolls to its page ...").                                                                                         |
| Support tapping (not stated on the HIG page for the web).                         | met        | Each button is at least the touch minimum under a coarse pointer; the dot is drawn small inside it (e2e "a coarse pointer keeps each control at 44 by 44").                  |
| Platform behavior (not stated): previous and next end at the ends, no wrapping.   | met        | Previous is disabled on the first page and Next on the last (e2e "Previous is disabled at the first page and Next at the last"); focus moves to the other button.            |
| Platform behavior (not stated): swipe, trackpad and keyboard scrolling work.      | met        | The viewport is a native scroller; arrow keys, Home and End also change the page when it has focus (e2e "the arrow keys, Home and End change the page").                     |
| Platform behavior (not stated): reduced motion.                                   | met        | Buttons, dots and keys scroll instantly under `prefers-reduced-motion` (e2e "reduced motion jumps to the page instead of gliding"); dot transitions use the duration tokens. |
| Platform behavior (not stated): right-to-left mirrors the row and arrows.         | met        | Flex direction follows `dir`; `:dir(rtl)` mirrors the chevrons; the arrow keys swap (e2e "under rtl ...").                                                                   |
| Platform behavior (not stated): roles and names (APG carousel).                   | met        | Host `region` / "carousel" named by `label`; each item `group` / "slide" named "n of m" (e2e "the host is a named carousel region of named slides").                         |
| The current-page mark must not depend on color alone (not stated; WCAG 1.4.1).    | met        | The current dot is also wider.                                                                                                                                               |
| Dot contrast against the surface (not stated; WCAG 1.4.11).                       | needs eyes | Inactive dots use `--pl-color-muted-foreground`; axe does not measure non-text contrast, so confirm on light, dark, glass and increased contrast.                            |

## Usage guidelines (for `docs/components.md`, not the component)

- Use it for peer content browsed in order, such as images or cards (page-controls/1). For a few labelled views use tabs.
- Always set `label`; give each carousel on a page its own.
- Keep the slide count small: each slide gets a dot (page-controls/3).
- Each item is one page wide; give the slide's content its own size.
- Handle `pl-change` (`detail.index`, from 0) only if the app must react to the page.

## Findings outside HIG

- There is no autoplay by design, so no pause control is needed.
- The scrolling area is a tab stop so the keyboard can scroll it even when no slide holds a focusable control.
- The component is not form-associated and fires only `pl-change`, not native `input` or `change`: the page is browsing state, not a value.
