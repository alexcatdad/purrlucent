# Purrlucent visual spec (final)

Self-contained. Scope: the look of button, segmented control, toolbar bar and sidebar, plus the tokens they use. Dimensions are CSS pixels at default text size; express type, line heights and spacing in rem.

Marks: **HIG** = Apple Human Interface Guidelines fact. **TASTE** = project decision. All colors, dimensions, shadows and timings are TASTE unless marked.

Out of scope, do not build: toolbar zones, overflow menu, toolbar-item component, title slot; sidebar icon slot, group titles, toggle move; button icon, sizes, progress state.

## 1. Palette

`design/palette.json`, `roles.<row>.<column>`. Each cell is the argument list of `oklch()`. Opaque unless an alpha is given. Every value is inside sRGB.

| Role                  | `light`                | `dark`                 | `lightMoreContrast` | `darkMoreContrast` |
| --------------------- | ---------------------- | ---------------------- | ------------------- | ------------------ |
| `background`          | `0.975 0.007 35`       | `0.18 0.010 35`        | `0.995 0.002 35`    | `0.12 0.006 35`    |
| `secondaryBackground` | `0.95 0.009 35`        | `0.23 0.012 35`        | `0.97 0.005 35`     | `0.16 0.008 35`    |
| `label`               | `0.22 0.014 35`        | `0.96 0.006 35`        | `0.14 0.010 35`     | `0.99 0.002 35`    |
| `secondaryLabel`      | `0.34 0.012 35`        | `0.88 0.010 35`        | `0.24 0.010 35`     | `0.95 0.004 35`    |
| `tertiaryLabel`       | `0.42 0.012 35`        | `0.82 0.012 35`        | `0.32 0.010 35`     | `0.89 0.008 35`    |
| `disabledLabel`       | `0.55 0.012 35`        | `0.62 0.012 35`        | `0.32 0.010 35`     | `0.89 0.008 35`    |
| `accentText`          | `0.44 0.17 325`        | `0.82 0.12 325`        | `0.34 0.15 325`     | `0.90 0.07 325`    |
| `accentFill`          | `0.51 0.17 325`        | `0.76 0.14 325`        | `0.40 0.14 325`     | `0.87 0.09 325`    |
| `onAccent`            | `1 0 0`                | `0.16 0.025 325`       | `1 0 0`             | `0.10 0.015 325`   |
| `selection`           | `0.50 0.12 325`        | `0.74 0.11 325`        | `0.38 0.11 325`     | `0.86 0.07 325`    |
| `focus`               | `0.44 0.17 325`        | `0.82 0.12 325`        | `0.34 0.15 325`     | `0.90 0.07 325`    |
| `destructiveText`     | `0.44 0.16 25`         | `0.82 0.10 24`         | `0.34 0.13 25`      | `0.92 0.04 24`     |
| `destructiveFill`     | `0.88 0.045 24`        | `0.37 0.065 24`        | `0.85 0.05 24`      | `0.35 0.06 24`     |
| `divider`             | `0.22 0.014 35 / 0.13` | `0.96 0.006 35 / 0.16` | `0.42 0.012 35`     | `0.75 0.012 35`    |
| `controlBoundary`     | `0.45 0.014 35`        | `0.78 0.012 35`        | `0.32 0.012 35`     | `0.90 0.008 35`    |
| `fillHover`           | `0.935 0.008 35`       | `0.27 0.012 35`        | `0.92 0.006 35`     | `0.24 0.010 35`    |
| `fillControl`         | `0.905 0.010 35`       | `0.31 0.013 35`        | `0.88 0.008 35`     | `0.29 0.010 35`    |
| `fillControlHover`    | `0.875 0.012 35`       | `0.35 0.014 35`        | `0.84 0.009 35`     | `0.34 0.012 35`    |
| `fillPressed`         | `0.84 0.014 35`        | `0.39 0.015 35`        | `0.80 0.010 35`     | `0.39 0.014 35`    |
| `success`             | `0.435 0.075 166`      | `0.76 0.095 166`       | `0.325 0.057 166`   | `0.86 0.093 166`   |
| `warning`             | `0.46 0.09 68`         | `0.79 0.115 72`        | `0.345 0.067 68`    | `0.885 0.087 76`   |
| `glassBarTint`        | `0.99 0.004 35 / 0.79` | `0.20 0.010 35 / 0.79` | `0.97 0.005 35`     | `0.16 0.008 35`    |
| `glassSidebarTint`    | `0.99 0.004 35 / 0.86` | `0.23 0.012 35 / 0.86` | `0.97 0.005 35`     | `0.16 0.008 35`    |
| `glassPanelTint`      | `0.98 0.006 35 / 0.89` | `0.24 0.012 35 / 0.89` | `0.97 0.005 35`     | `0.16 0.008 35`    |
| `glassSheetTint`      | `0.99 0.004 35 / 0.94` | `0.26 0.012 35 / 0.94` | `0.97 0.005 35`     | `0.16 0.008 35`    |
| `edgeHighlight`       | `1 0 0 / 0.58`         | `1 0 0 / 0.13`         | `1 0 0 / 0`         | `1 0 0 / 0`        |
| `shadowColor`         | `0.19 0.018 35`        | `0.06 0.008 35`        | `0.14 0.010 35`     | `0.04 0.004 35`    |

Role use:

- `accentText`: Plain button label. `accentFill` + `onAccent`: Prominent button. `selection` + `onAccent`: selected segment and sidebar row. `focus`: keyboard ring.
- `destructiveText`: destructive labels. `destructiveFill`: destructive hover face.
- `divider`: separates adjacent content where spacing is not enough. `controlBoundary`: 1px edge of a field shell, and the increased-contrast outline. Buttons, tracks, bars and panels carry no stroke in default contrast.
- Neutral ladder, in order: `fillHover`, `fillControl`, `fillControlHover`, `fillPressed`. All opaque, also on glass.
- `disabledLabel`: text and symbols of disabled controls. `success` and `warning` stay on opaque ground.

Derived tones (mixed in sRGB, full opacity):

- Hover tone of `accentFill` or `selection`: base mixed with 6% black in light schemes, 6% white in dark schemes.
- Pressed tone: same with 12%.
- Destructive pressed tone: `destructiveFill` mixed with 12% `destructiveText`.

Hover rule: a hover face is one ladder step past the surface it sits on.

| Element sits on                                     | Hover              | Pressed       |
| --------------------------------------------------- | ------------------ | ------------- |
| `background`                                        | `fillHover`        | `fillPressed` |
| `secondaryBackground` or glass                      | `fillControl`      | `fillPressed` |
| `fillControl` (Bordered face, track, toolbar group) | `fillControlHover` | `fillPressed` |

## 2. Contrast

Targets: text 4.5:1; essential symbols, selected faces against adjacent faces, focus rings and control boundaries 3:1. Disabled controls are exempt (WCAG 1.4.11, inactive components). A filled button needs no 3:1 boundary when its label identifies it (WCAG 2.2 Understanding Non-text Contrast).

Computed with `contrast-final.ts` in this folder (`bun contrast-final.ts none`): oklch to sRGB, alpha composited source-over in gamma-encoded sRGB, WCAG 2.x luminance, ratios truncated. Glass tints are composited over black, #808080, white and the page.

**Result: 560 required pairs across four schemes, 0 fail. All values in sRGB.**

Pairs covered per scheme: each label role and `accentText`, `destructiveText`, `focus` on ground, each glass composite and each fill used beneath it; `onAccent` on `accentFill`, `selection` and their tones; `selection` and its tones against every neutral fill and sidebar surface; `controlBoundary` and `divider` edges; `success` and `warning` on ground; `disabledLabel` at 4.5:1 in the two increased-contrast schemes.

Tightest pairs:

| Scheme            | Pair                                          | Ratio | Need |
| ----------------- | --------------------------------------------- | ----: | ---: |
| light             | `destructiveText` on destructive pressed tone |  4.79 |  4.5 |
| light             | `destructiveText` on bar glass over black     |  4.97 |  4.5 |
| light             | `tertiaryLabel` on bar glass over black       |  5.01 |  4.5 |
| light             | `accentText` on bar glass over black          |  5.03 |  4.5 |
| light             | `destructiveText` on `fillPressed`            |  5.14 |  4.5 |
| light             | `accentText` on `fillPressed`                 |  5.20 |  4.5 |
| light             | `selection` face next to `fillPressed`        |  3.89 |    3 |
| dark              | `destructiveText` on destructive pressed tone |  4.64 |  4.5 |
| dark              | `accentText` on bar glass over white          |  5.10 |  4.5 |
| dark              | `destructiveText` on bar glass over white     |  5.14 |  4.5 |
| dark              | `accentText` on `fillPressed`                 |  5.27 |  4.5 |
| dark              | `tertiaryLabel` on bar glass over white       |  5.32 |  4.5 |
| dark              | `selection` face next to `fillPressed`        |  3.99 |    3 |
| lightMoreContrast | `destructiveText` on destructive pressed tone |  6.26 |  4.5 |
| lightMoreContrast | `accentText` on `fillPressed`                 |  6.77 |  4.5 |
| lightMoreContrast | `selection` face next to `fillPressed`        |  5.65 |    3 |
| lightMoreContrast | `disabledLabel` on `fillControl`              |  8.84 |  4.5 |
| darkMoreContrast  | `destructiveText` on destructive pressed tone |  6.62 |  4.5 |
| darkMoreContrast  | `accentText` on `fillPressed`                 |  6.98 |  4.5 |
| darkMoreContrast  | `selection` face next to `fillPressed`        |  6.14 |    3 |

Glass alpha floors (lowest whole-percent alpha at which every text role, the focus ring and the selection face pass over black, grey and white):

| Surface | Light floor / specified | Dark floor / specified |
| ------- | ----------------------- | ---------------------- |
| Bar     | 76% / 79%               | 76% / 79%              |
| Sidebar | 76% / 86%               | 78% / 86%              |
| Panel   | 77% / 89%               | 79% / 89%              |
| Sheet   | 76% / 94%               | 81% / 94%              |

Do not lower a tint alpha below its floor.

`disabledLabel` in default contrast (exempt, recorded for reference):

| Background                              |              Light |               Dark |
| --------------------------------------- | -----------------: | -----------------: |
| `fillControl`                           |               3.66 |               3.61 |
| `background` / `secondaryBackground`    |        4.52 / 4.20 |        5.14 / 4.63 |
| Bar glass over black / grey / white     | 2.87 / 3.74 / 4.76 | 5.15 / 3.81 / 2.55 |
| Sidebar glass over black / grey / white | 3.43 / 4.06 / 4.75 | 4.82 / 3.90 / 3.00 |
| Panel glass over black / grey / white   | 3.58 / 4.08 / 4.62 | 4.68 / 3.94 / 3.23 |
| Sheet glass over black / grey / white   | 4.14 / 4.43 / 4.74 | 4.37 / 3.96 / 3.56 |

Ladder steps (no threshold): light 1.09-1.14, dark 1.14-1.28, lightMoreContrast 1.11-1.31, darkMoreContrast 1.16-1.37. `destructiveFill` vs `fillControl`: 1.09 / 1.22 / 1.11 / 1.21.

## 3. Tokens

### Pointer classes and hit regions

- Fine pointer (`pointer: fine`) follows macOS. Coarse pointer (`pointer: coarse`) follows iPadOS.
- **HIG:** default / minimum control size is 28x28 / 20x20 pt on macOS and 44x44 / 28x28 pt on iOS and iPadOS. About 12 pt of padding around bezeled elements, about 24 pt around elements without a bezel. Source: https://developer.apple.com/design/human-interface-guidelines/accessibility

|                                                          |    Fine |  Coarse |
| -------------------------------------------------------- | ------: | ------: |
| Minimum hit region                                       | 28 x 28 | 44 x 44 |
| Absolute minimum (never smaller)                         | 20 x 20 | 28 x 28 |
| Gap between bezeled controls                             |      12 |      16 |
| Space between the visible content of bezel-less controls |      24 |      24 |

- Project rule `accessibility/5` (44 on coarse pointers) is unchanged.
- Adjacent hit regions may touch. Each pixel belongs to one target.
- Two adjacent Plain buttons need no extra gap: their 12px inline paddings supply the 24px.
- Hit region and face grow together when text wraps or scales.

### Type

Font: `system-ui, sans-serif`, native tracking. Values are size / weight / line height. **HIG** for sizes, weights and line heights (macOS and iPadOS text style tables); `action` weight is TASTE.

| Style            | Fine          | Coarse        | Use                               |
| ---------------- | ------------- | ------------- | --------------------------------- |
| `caption`        | 10 / 400 / 13 | 12 / 400 / 16 |                                   |
| `footnote`       | 10 / 400 / 13 | 13 / 400 / 18 |                                   |
| `body`           | 13 / 400 / 16 | 17 / 400 / 22 | Sidebar rows, unselected segments |
| `action`         | 13 / 500 / 16 | 17 / 500 / 22 | Every text button                 |
| `bodyEmphasized` | 13 / 600 / 16 | 17 / 600 / 22 | Selected row or segment           |
| `headline`       | 13 / 700 / 16 | 17 / 600 / 22 |                                   |
| `title3`         | 15 / 400 / 20 | 20 / 400 / 25 |                                   |
| `title2`         | 17 / 400 / 22 | 22 / 400 / 28 |                                   |
| `title1`         | 22 / 400 / 26 | 28 / 400 / 34 |                                   |

### Radii

Nesting rule: inner radius = outer radius minus the visible inset between painted faces, down to 0.

| Token          | Fine | Coarse | Use                                                 |
| -------------- | ---: | -----: | --------------------------------------------------- |
| `control`      |    8 |     12 | Button, segmented track, toolbar group, field shell |
| `controlInner` |    6 |     10 | Segmented pill, toolbar item face (inset 2)         |
| `panel`        |   16 |     16 | Floating panel, sidebar, sheet                      |
| `row`          |    8 |      8 | Sidebar row (panel 16 minus padding 8)              |

An edge-attached bar and the full-width stacked sidebar have square outer corners.

### Elevation

`box-shadow` values. `S(a)` = `shadowColor` at alpha `a`.

| Level   | Value                                  | Use                                        |
| ------- | -------------------------------------- | ------------------------------------------ |
| Flat    | `none`                                 | Buttons, toolbar groups, tracks, rows, bar |
| Control | `0 1px 2px S(.18), 0 2px 5px S(.10)`   | Selected segment pill                      |
| Panel   | `0 1px 3px S(.15), 0 6px 18px S(.12)`  | Floating sidebar or panel                  |
| Sheet   | `0 2px 6px S(.18), 0 16px 48px S(.18)` | Sheet                                      |

In light schemes elevation carries the separation of glass from a flat page.

### Glass

Glass only on bar, sidebar, floating panel and sheet. Rows, field shells and content never take it. **HIG** (Materials).

| Material       | Tint               | Backdrop blur | Saturation | Edge                          | Solid fallback        |
| -------------- | ------------------ | ------------: | ---------: | ----------------------------- | --------------------- |
| Bar            | `glassBarTint`     |          24px |       125% | `inset 0 1px 0 edgeHighlight` | `secondaryBackground` |
| Sidebar        | `glassSidebarTint` |          28px |       118% | same                          | `secondaryBackground` |
| Floating panel | `glassPanelTint`   |          32px |       115% | same                          | `secondaryBackground` |
| Sheet          | `glassSheetTint`   |          36px |       108% | same                          | `secondaryBackground` |

- Controls on glass keep their opaque fills. The parent supplies the material; controls never apply their own.
- The solid fallback, with no blur, saturation or edge and with elevation kept, applies under reduced transparency, increased contrast, and when `backdrop-filter` is unsupported.

### Motion

| Token             | Value                           | Use                       |
| ----------------- | ------------------------------- | ------------------------- |
| `easeStandard`    | `cubic-bezier(.2, 0, 0, 1)`     | Tone changes              |
| `easeSpring`      | `cubic-bezier(.3, 1.15, .5, 1)` | Pill slide, press release |
| `durationPress`   | 60ms                            | Press in                  |
| `durationHover`   | 100ms                           | Hover in                  |
| `durationRelease` | 120ms                           | Hover out, press release  |
| `durationSlide`   | 200ms                           | Segmented pill            |

- Hover and press change the face tone only; the label keeps its color. No host opacity or brightness filter.
- Press: scale the visible face to 0.98 with `easeStandard`; release with `easeSpring`. The hit region does not scale.
- Reduced motion: all durations 0ms, no scale, pill placed directly.
- Animations never block input and can be interrupted.

### Focus ring

- Color `focus`, width 2px, shown on `:focus-visible`.
- Freestanding control (button): ring outside the face with a 2px gap (`outline-offset: 2px`).
- Control inside a track, toolbar group or sidebar (segment, toolbar item, sidebar row, sidebar toggle): ring inside the face (`outline-offset: -2px`).
- On a `selection` face the inside ring uses `onAccent`.
- The ring follows the face radius.

### Global modes

- **Increased contrast** (`prefers-contrast: more`): use the `MoreContrast` columns; solid surfaces; elevation replaced by a 1px `controlBoundary` outline, drawn inside the geometry, on neutral faces only: Bordered buttons, segmented track, toolbar group, floating panel, sheet. No outline on `accentFill` or `selection` faces. The bar gets a 1px `controlBoundary` content-facing edge.
- **Reduced transparency** (`prefers-reduced-transparency: reduce`): solid fallbacks; all control colors unchanged.
- **Forced colors** (`forced-colors: active`): surfaces `Canvas` / `CanvasText`; buttons `ButtonFace` / `ButtonText` with a 1px `ButtonText` border, Plain included; selected segment and row `Highlight` / `HighlightText`; disabled `GrayText`; focus ring `Highlight`, on a selected face `HighlightText`. No glass, fades or shadows.

## 4. Components

### Button

| Geometry               |     Fine |   Coarse |
| ---------------------- | -------: | -------: |
| Face height (minimum)  |       28 |       44 |
| Padding block / inline |   6 / 12 |  11 / 16 |
| Radius                 |        8 |       12 |
| Hit region (minimum)   |  28 x 28 |  44 x 44 |
| Type                   | `action` | `action` |

| Variant                          | Rest                               | Hover                                   | Pressed                   | Disabled                       |
| -------------------------------- | ---------------------------------- | --------------------------------------- | ------------------------- | ------------------------------ |
| Plain                            | `accentText` on transparent        | hover fill for its surface (hover rule) | `fillPressed`             | `disabledLabel` on transparent |
| Bordered                         | `label` on `fillControl`           | `fillControlHover`                      | `fillPressed`             | `disabledLabel` on transparent |
| Prominent                        | `onAccent` on `accentFill`         | `accentFill` hover tone                 | `accentFill` pressed tone | `disabledLabel` on transparent |
| Destructive Plain                | `destructiveText` on transparent   | `destructiveFill`                       | destructive pressed tone  | `disabledLabel` on transparent |
| Destructive Bordered / Prominent | `destructiveText` on `fillControl` | `destructiveFill`                       | destructive pressed tone  | `disabledLabel` on transparent |

- All variants share dimensions and weight. Label color does not change on hover or press.
- Focus: outside ring on the current face.
- Disabled: no face, `body` weight (400) instead of `action` (500), no hover, press or scale. Shape and weight carry the state, not color alone.
- Increased contrast: outline on Bordered, Destructive Bordered / Prominent. Disabled buttons have no face and no outline. Reduced transparency: no change. Forced colors and reduced motion: global rules.
- **HIG:** the preferred nondestructive action takes the accent fill; a destructive action never does.

### Segmented control

| Geometry                       |              Fine |            Coarse |
| ------------------------------ | ----------------: | ----------------: |
| Track height                   |                28 |                44 |
| Track radius / inset           |             8 / 2 |            12 / 2 |
| Segment face height / radius   |            24 / 6 |           40 / 10 |
| Segment padding block / inline |            4 / 12 |            9 / 14 |
| Column minimum width           |                28 |                44 |
| Hit region per segment         | column width x 28 | column width x 44 |

- Equal-width columns sized to the widest label at weight 600, so selection never shifts the track. No gap between hit regions.
- Track: `fillControl`, flat.

| State                      | Segment                                                                                                            |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Rest                       | `body` in `label` on the track                                                                                     |
| Hover (unselected)         | face `fillControlHover`                                                                                            |
| Pressed (unselected)       | face `fillPressed`                                                                                                 |
| Selected                   | pill `selection`, text `onAccent`, `bodyEmphasized`, Control elevation                                             |
| Selected + hover / pressed | `selection` hover tone / pressed tone                                                                              |
| Focus                      | inside ring on the focused segment; `onAccent` ring when it is the selected one                                    |
| Disabled (whole control)   | `disabledLabel` on neutral faces; selected pill `fillControlHover` with `disabledLabel` at weight 600; no feedback |

- One pill moves beneath stationary labels to the chosen cell's bounds, also in RTL. `durationSlide`, `easeSpring`, clipped to the track. A change during travel retargets from the current position. Initial selection appears in place. Labels stay readable during travel (clip an `onAccent` copy of the label layer to the pill).
- Increased contrast: outline on the track only. Reduced transparency: no change. Reduced motion: pill snaps. Forced colors: global rules.
- **HIG:** segments are equal in width and show selection clearly.

### Toolbar bar

| Geometry                                |        Fine |       Coarse |
| --------------------------------------- | ----------: | -----------: |
| Bar minimum height                      |          52 |           60 |
| Bar padding block / inline              |     12 / 12 |       8 / 16 |
| Group face height / radius              |      28 / 8 |      44 / 12 |
| Item cell (hit region)                  |     28 x 28 |      44 x 44 |
| Item face / radius                      | 24 x 24 / 6 | 40 x 40 / 10 |
| Gap between groups and bezeled controls |          12 |           16 |

- Bar surface: `secondaryBackground` solid, Bar material on glass. Square corners, flat, no border.
- Related symbol items share one `fillControl` group face, no dividers, no gap between cells. Each item face is inset 2px in its cell.
- Buttons and segmented controls in the bar use their own geometry; all are the same height as the group.

| State    | Item in a group                        |
| -------- | -------------------------------------- |
| Rest     | symbol in `label` on the group face    |
| Hover    | item face `fillControlHover`           |
| Pressed  | item face `fillPressed`                |
| Focus    | inside ring on the item face           |
| Disabled | symbol in `disabledLabel`, no feedback |

- Scroll edge: while content is scrolled beneath the bar, an 8px fade from the bar surface to transparent on the content-facing edge, outside hit regions. No fade at the resting scroll position.
- Reduced transparency: solid bar, 1px `divider` on the content-facing edge while scrolled, no fade. Increased contrast: solid bar, 1px `controlBoundary` edge, outline on the group face. Forced colors and reduced motion: global rules.
- **HIG:** borderless symbols share a group container; a scroll edge effect, not a line, separates bar and content; one trailing primary action carries the accent.

### Sidebar

| Geometry                       |           Fine |         Coarse |
| ------------------------------ | -------------: | -------------: |
| Panel width / radius / padding | 17rem / 16 / 8 | 17rem / 16 / 8 |
| Row face height / radius       |         28 / 8 |         44 / 8 |
| Row padding block / inline     |         6 / 12 |        11 / 12 |
| Gap between rows               |              2 |              0 |
| Row pitch (hit region height)  |             30 |             44 |
| Chevron width / gap after      |         14 / 6 |         16 / 8 |
| Chevron stroke                 |            1.5 |              2 |
| Level-1 label start            |             32 |             36 |
| Level-2 label start            |             52 |             60 |
| Toggle hit region              |        28 x 28 |        44 x 44 |

- Label starts are measured from the row's inline-start edge and mirror in RTL. A leaf row reserves the empty chevron slot so all level-1 labels align. The chevron starts at 12.
- Floating: Sidebar material (glass) or `secondaryBackground` (solid), Panel elevation. Full-width stacked presentation: square corners, flat.
- The toggle stays where it is, with row colors and states.
- The chevron uses `secondaryLabel` and rotates toward block-end when expanded.

| State                      | Row                                                                                                          |
| -------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Rest                       | transparent face, `body` in `label`, chevron `secondaryLabel`                                                |
| Hover                      | face `fillControl`                                                                                           |
| Pressed                    | face `fillPressed`                                                                                           |
| Selected                   | one full-width rounded `selection` face, text and chevron `onAccent`, `bodyEmphasized`, flat; no leading bar |
| Selected + hover / pressed | `selection` hover tone / pressed tone                                                                        |
| Focus                      | inside ring; `onAccent` ring on the selected row                                                             |
| Disabled                   | not part of the sidebar's model; no styling                                                                  |

- Reserve width for the weight-600 label.
- Increased contrast: outline on the floating panel only. Reduced transparency: solid panel, same row colors. Forced colors: global rules. Reduced motion: chevron rotation 0ms.
- **HIG:** a sidebar floats above content; indentation shows hierarchy; at most two levels.

## 5. Old to new tokens

Remove every old token listed and update its users.

| Old                                                                                                   | New                                                                                                                                                |
| ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `roles.accent`                                                                                        | `accentText` (text), `accentFill` (fills), `selection` (selected faces)                                                                            |
| `roles.separator`                                                                                     | `divider` (content separation), `controlBoundary` (field shell edge, increased-contrast outline), nothing on bars, panels, sheets, buttons, tracks |
| `roles.fill`                                                                                          | `fillControl`; hover and pressed from the ladder                                                                                                   |
| `roles.destructive`                                                                                   | `destructiveText`, `destructiveFill`                                                                                                               |
| `roles.focus`                                                                                         | `focus` (new values)                                                                                                                               |
| `roles.label`, `secondaryLabel`, `tertiaryLabel`, `background`, `secondaryBackground`                 | same names, new values                                                                                                                             |
| `roles.success`, `roles.warning`                                                                      | unchanged                                                                                                                                          |
| none                                                                                                  | `disabledLabel`, `onAccent`, `edgeHighlight`, `shadowColor`                                                                                        |
| `glassTint` (light, dark)                                                                             | `glassBarTint`, `glassSidebarTint`, `glassPanelTint`, `glassSheetTint` as roles with four columns                                                  |
| `glassBlur` (16)                                                                                      | per material: 24 / 28 / 32 / 36px, plus saturation                                                                                                 |
| `--purr-material-bar`, `-panel`, `-sheet`                                                             | kept, fed by the new tints; add a sidebar material; solid fallback `secondaryBackground` for all                                                   |
| `--purr-material-filter`                                                                              | per material blur and saturation                                                                                                                   |
| `--purr-font-size-*` (caption 12, footnote 13, body 16, headline 17, title3 20, title2 22, title1 28) | type styles per pointer from section 3 (size, weight, line height); add `action`, `bodyEmphasized`                                                 |
| `--purr-radius-small` (6)                                                                             | `controlInner` (6 fine / 10 coarse)                                                                                                                |
| `--purr-radius-medium` (10)                                                                           | `control` (8 fine / 12 coarse)                                                                                                                     |
| `--purr-radius-large` (16)                                                                            | `panel` (16); add `row` (8)                                                                                                                        |
| `--purr-duration-fast` (120ms)                                                                        | `durationRelease` (120ms); add `durationPress` 60ms, `durationHover` 100ms                                                                         |
| `--purr-duration-base` (240ms)                                                                        | `durationSlide` (200ms)                                                                                                                            |
| none                                                                                                  | `easeStandard`, `easeSpring`, elevation levels Control / Panel / Sheet                                                                             |
| Sidebar selected: `fill` + 3px accent bar                                                             | `selection` face, no bar                                                                                                                           |
| Sidebar level-2 padding (`space-3` + `space-5`)                                                       | label starts from section 4                                                                                                                        |
| Host opacity / brightness for hover, press, disabled                                                  | face tones and `disabledLabel`                                                                                                                     |

## 6. Verify at implementation

- Extend the e2e contrast tests to every role in section 1, in all four schemes, including glass over black, grey and white.
- Regenerate screenshot baselines (darwin locally, linux from the CI artifact).
- Check in the browser: backdrop blur and saturation, label contrast during pill travel, forced colors, hit-region sizes per pointer.
