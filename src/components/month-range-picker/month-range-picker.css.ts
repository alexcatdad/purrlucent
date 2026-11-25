import { css } from "lit";

/*
 * The trigger is a field, laid out like the select's: a label above a control
 * of the same height. A year is a table of three columns of months, each two
 * size tokens wide, so the months share the calendar's cell height and grow to
 * the 44 point touch target on a coarse pointer. The range is one band: the
 * months between the ends are tinted and join across cells, the ends are
 * filled caps, and the band rounds where a row ends. Chosen, current and
 * disabled months differ by more than colour: the ends are filled, this month
 * has a dot, a disabled month is dimmed.
 */
export const monthRangePickerStyles = css`
  :host {
    --_cell: var(--pl-size-lg);
    --_column: calc(var(--_cell) * 2);
    --_size: var(--pl-size-md);
    --_pad: var(--pl-pad-control);
    --_glyph: var(--pl-icon-md);
    --_presets: calc(var(--pl-spacing) * 36);

    display: inline-block;
    color: var(--pl-color-foreground);
    font: 400 var(--pl-text-sm) / var(--pl-leading-normal) var(--pl-font-sans);
  }

  :host([hidden]) {
    display: none;
  }

  :host(:not([inline])) {
    display: inline-grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--pl-gap-form);
    inline-size: calc(var(--pl-spacing) * 56);
    vertical-align: middle;
  }

  [part="label"] {
    overflow-wrap: anywhere;
  }

  :host(:not(:state(labelled))) [part="label"] {
    display: none;
  }

  pl-popover {
    display: block;
  }

  [part="trigger"] {
    user-select: none;
    display: flex;
    align-items: center;
    gap: var(--pl-gap-icon);
    box-sizing: border-box;
    inline-size: 100%;
    block-size: var(--_size);
    margin: 0;
    border: 0;
    border-radius: var(--pl-radius-control);
    padding: 0;
    padding-inline-start: var(--_pad);
    background: var(--pl-material-field);
    backdrop-filter: var(--pl-lens,) var(--pl-material-control-filter);
    box-shadow:
      var(--pl-material-edge),
      0 0 0 1px var(--pl-color-input-border);
    color: var(--pl-color-foreground);
    font: 400 var(--pl-text-sm) / var(--pl-leading-normal) var(--pl-font-sans);
    text-align: start;
    cursor: var(--pl-cursor-interactive);
    transition:
      background-color var(--pl-duration-fast) var(--pl-ease-out),
      color var(--pl-duration-fast) var(--pl-ease-out);
  }

  [part="trigger"]:focus-visible {
    outline: var(--pl-ring-width) solid var(--pl-color-ring);
    outline-offset: var(--pl-ring-offset);
  }

  [part="trigger"]:disabled {
    cursor: var(--pl-cursor-disabled);
    background: var(--pl-color-muted-disabled);
    box-shadow: 0 0 0 1px var(--pl-color-border);
    color: var(--pl-color-disabled-foreground);
  }

  [part="value"] {
    flex: 1;
    min-inline-size: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  [part="value"].placeholder {
    color: var(--pl-color-muted-foreground);
  }

  [part="trigger"]:disabled [part="value"].placeholder {
    color: inherit;
  }

  [part="icon"],
  [part="glyph"] {
    flex: none;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  [part="icon"] {
    inline-size: var(--_glyph);
    block-size: var(--_glyph);
  }

  [part="glyph"] {
    box-sizing: border-box;
    inline-size: var(--_size);
    block-size: var(--_size);
    padding: calc((var(--_size) - var(--_glyph)) / 2);
  }

  /* The months and, beside them, the presets; the presets stack under the months when the panel is narrow. */
  [part="panel"] {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: var(--pl-space-4);
  }

  [part="months"] {
    display: grid;
    justify-items: end;
    gap: var(--pl-space-2);
    inline-size: calc(var(--_column) * 3);
    max-inline-size: 100%;
  }

  [part="presets"] {
    display: grid;
    flex: 1 1 calc(var(--_presets) / 2);
    gap: var(--pl-space-1);
    min-inline-size: 0;
  }

  [part="preset"] {
    box-sizing: border-box;
    min-block-size: var(--pl-size-row);
    margin: 0;
    padding-block: 0;
    padding-inline: var(--pl-pad-item);
    border: 0;
    border-radius: var(--pl-radius-row);
    background: none;
    color: var(--pl-color-foreground);
    font: inherit;
    text-align: start;
    cursor: var(--pl-cursor-interactive);
    transition: background-color var(--pl-duration-fast) var(--pl-ease-out);
  }

  @media (hover: hover) {
    [part="preset"]:not(:disabled):hover {
      background: var(--pl-color-muted-3);
    }
  }

  [part="preset"]:not(:disabled):active {
    background: var(--pl-color-muted-pressed);
  }

  [part="preset"]:disabled {
    cursor: var(--pl-cursor-disabled);
    color: var(--pl-color-disabled-foreground);
  }

  [part="preset"]:focus-visible {
    outline: var(--pl-ring-width) solid var(--pl-color-ring);
    outline-offset: var(--pl-ring-offset);
  }

  [part="header"] {
    display: flex;
    align-items: center;
    gap: var(--pl-gap-controls);
    inline-size: 100%;
  }

  [part="title"] {
    flex: 1;
    min-inline-size: 0;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    text-align: center;
  }

  [part="nav"] {
    flex: none;
    display: grid;
    place-items: center;
    box-sizing: border-box;
    inline-size: var(--pl-size-hit-min);
    block-size: var(--pl-size-hit-min);
    margin: 0;
    padding: 0;
    border: 0;
    border-radius: var(--pl-radius-full);
    background: none;
    color: var(--pl-color-accent-text);
    cursor: var(--pl-cursor-interactive);
    transition: background-color var(--pl-duration-fast) var(--pl-ease-out);
  }

  [part="nav"] svg {
    inline-size: var(--pl-icon-md);
    block-size: var(--pl-icon-md);
  }

  /* The glyphs point left and right; the start side mirrors under rtl. */
  :host(:dir(rtl)) [part="nav"] svg {
    transform: scaleX(-1);
  }

  @media (hover: hover) {
    [part="nav"]:not([aria-disabled="true"]):hover {
      background: var(--pl-color-muted-3);
    }
  }

  [part="nav"]:not([aria-disabled="true"]):active {
    background: var(--pl-color-muted-pressed);
  }

  [part="nav"][aria-disabled="true"] {
    cursor: var(--pl-cursor-disabled);
    color: var(--pl-color-disabled-foreground);
  }

  [part="nav"]:focus-visible,
  [part~="month"]:focus-visible {
    outline: var(--pl-ring-width) solid var(--pl-color-ring);
    outline-offset: var(--pl-ring-offset);
  }

  [part="grid"] {
    border-collapse: separate;
    border-spacing: 0 var(--pl-space-1);
    table-layout: fixed;
    inline-size: 100%;
  }

  [part~="month"] {
    position: relative;
    box-sizing: border-box;
    block-size: var(--_cell);
    padding: 0;
    border-radius: var(--pl-radius-full);
    cursor: var(--pl-cursor-interactive);
    text-align: center;
    white-space: nowrap;
    user-select: none;
    transition: background-color var(--pl-duration-fast) var(--pl-ease-out);
  }

  @media (hover: hover) {
    [part~="month"]:not(
        [aria-disabled="true"],
        [part~="start"],
        [part~="end"],
        [part~="between"]
      ):hover {
      background: var(--pl-color-muted-3);
    }
  }

  [part~="month"]:not(
      [aria-disabled="true"],
      [part~="start"],
      [part~="end"],
      [part~="between"]
    ):active {
    background: var(--pl-color-muted-pressed);
  }

  /* The full month and year, for assistive technology; the short name is what shows. The text sits in a child, so the strip clips it as an ancestor. */
  .name {
    position: absolute;
    inset-block-start: 0;
    inset-inline: 0;
    block-size: 1px;
    overflow: clip;
    clip-path: inset(50%);
  }

  pl-popover::part(panel) {
    max-inline-size: min(
      calc(var(--_column) * 3 + var(--pl-pad-panel) * 2),
      calc(100vw - var(--pl-space-4))
    );
  }

  pl-popover[data-presets]::part(panel) {
    max-inline-size: min(
      calc(
        var(--_column) * 3 + var(--_presets) + var(--pl-space-4) +
          var(--pl-pad-panel) * 2
      ),
      calc(100vw - var(--pl-space-4))
    );
  }

  /* This month: a dot under the name, so the text keeps its weight. */
  [part~="month"][aria-current="date"]::after {
    content: "";
    position: absolute;
    inset-block-end: var(--pl-space-1);
    inset-inline-start: calc(50% - var(--pl-spacing) / 2);
    inline-size: var(--pl-spacing);
    block-size: var(--pl-spacing);
    border-radius: var(--pl-radius-full);
    background: var(--pl-color-accent-text);
  }

  /* The band, chosen or being previewed: square where cells join, round where a row or the range ends. */
  [part~="month"]:is([part~="start"], [part~="end"], [part~="between"]) {
    border-radius: 0;
    background: color-mix(in srgb, var(--pl-color-selected) 18%, transparent);
  }

  [part~="month"]:is([part~="start"], [part~="end"], [part~="between"]):is(
      :first-child,
      [part~="start"]
    ) {
    border-start-start-radius: var(--pl-radius-full);
    border-end-start-radius: var(--pl-radius-full);
  }

  [part~="month"]:is([part~="start"], [part~="end"], [part~="between"]):is(
      :last-child,
      [part~="end"]
    ) {
    border-start-end-radius: var(--pl-radius-full);
    border-end-end-radius: var(--pl-radius-full);
  }

  [part~="month"]:is([part~="start"], [part~="end"]) {
    background: var(--pl-color-selected);
    color: var(--pl-color-selected-foreground);
  }

  [part~="month"]:is(
      [part~="start"],
      [part~="end"]
    )[aria-current="date"]::after {
    background: var(--pl-color-selected-foreground);
  }

  [part~="month"][aria-disabled="true"] {
    cursor: var(--pl-cursor-disabled);
    color: var(--pl-color-disabled-foreground);
  }

  @media (prefers-reduced-motion: reduce) {
    [part="trigger"],
    [part="preset"],
    [part="nav"],
    [part~="month"] {
      transition: none;
    }
  }

  /* Increased contrast outlines the trigger instead of lighting its edge. */
  @media (prefers-contrast: more) {
    [part="trigger"] {
      box-shadow: var(--pl-boundary);
    }
  }

  @media (forced-colors: active) {
    [part="trigger"] {
      border: 1px solid ButtonText;
      background: Field;
      box-shadow: none;
      color: FieldText;
      forced-color-adjust: none;
    }

    [part="trigger"][aria-expanded="true"] {
      border-color: Highlight;
    }

    [part="trigger"]:disabled {
      border-color: GrayText;
      color: GrayText;
    }

    [part="value"].placeholder,
    [part="preset"]:disabled {
      color: GrayText;
    }

    [part="preset"],
    [part="nav"] {
      color: ButtonText;
    }

    [part="nav"][aria-disabled="true"],
    [part~="month"][aria-disabled="true"] {
      color: GrayText;
    }

    [part~="month"]:is([part~="start"], [part~="end"]) {
      background: Highlight;
      color: HighlightText;
      forced-color-adjust: none;
    }

    [part~="month"][part~="between"] {
      outline: 1px solid Highlight;
      outline-offset: -1px;
    }

    [part~="month"][aria-current="date"]::after {
      background: currentColor;
    }

    [part="trigger"]:focus-visible,
    [part="preset"]:focus-visible,
    [part="nav"]:focus-visible,
    [part~="month"]:focus-visible {
      outline-color: Highlight;
    }
  }
`;
