import { css } from "lit";

/*
 * A year is a table of three columns of months, each two size tokens wide, so
 * the months share the calendar's cell height and grow to the 44 point touch
 * target on a coarse pointer. The ends of the range are filled; the months
 * between them are tinted with the same color, so the range reads as one span.
 * Chosen, current and disabled months differ by more than colour: the ends
 * are filled, this month is bold, a disabled month is dimmed.
 */
export const monthRangePickerStyles = css`
  :host {
    --_cell: var(--pl-size-lg);
    --_column: calc(var(--_cell) * 2);

    display: inline-block;
    color: var(--pl-color-foreground);
    font: 400 var(--pl-text-sm) / var(--pl-leading-normal) var(--pl-font-sans);
  }

  :host([hidden]) {
    display: none;
  }

  [part="panel"] {
    display: grid;
    justify-items: end;
    gap: var(--pl-space-2);
    inline-size: calc(var(--_column) * 3);
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
    cursor: default;
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
    cursor: default;
    text-align: center;
    white-space: nowrap;
    user-select: none;
    transition: background-color var(--pl-duration-fast) var(--pl-ease-out);
  }

  @media (hover: hover) {
    [part~="month"]:not([aria-disabled="true"], [aria-selected="true"]):hover {
      background: var(--pl-color-muted-3);
    }
  }

  [part~="month"]:not([aria-disabled="true"], [aria-selected="true"]):active {
    background: var(--pl-color-muted-pressed);
  }

  /* The full month and year, for assistive technology; the short name is what shows. */
  .name {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  pl-popover::part(panel) {
    max-inline-size: min(
      calc(var(--_column) * 3 + var(--pl-pad-panel) * 2),
      calc(100vw - var(--pl-space-4))
    );
  }

  [part~="month"][aria-current="date"] {
    color: var(--pl-color-accent-text);
    font-weight: 600;
  }

  /* The months between the ends join them into one band. */
  [part~="between"] {
    border-radius: 0;
    background: color-mix(in srgb, var(--pl-color-selected) 18%, transparent);
  }

  [part~="start"]:not([part~="end"]) {
    border-start-end-radius: 0;
    border-end-end-radius: 0;
  }

  [part~="end"]:not([part~="start"]) {
    border-start-start-radius: 0;
    border-end-start-radius: 0;
  }

  [part~="start"],
  [part~="end"] {
    background: var(--pl-color-selected);
    color: var(--pl-color-selected-foreground);
  }

  [part~="month"][aria-disabled="true"] {
    color: var(--pl-color-disabled-foreground);
  }

  @media (prefers-reduced-motion: reduce) {
    [part="nav"],
    [part~="month"] {
      transition: none;
    }
  }

  @media (forced-colors: active) {
    [part="nav"] {
      color: ButtonText;
    }

    [part="nav"][aria-disabled="true"],
    [part~="month"][aria-disabled="true"] {
      color: GrayText;
    }

    [part~="start"],
    [part~="end"] {
      background: Highlight;
      color: HighlightText;
      forced-color-adjust: none;
    }

    [part~="between"] {
      outline: 1px solid Highlight;
      outline-offset: -1px;
    }

    [part~="month"][aria-current="date"] {
      text-decoration: underline;
    }

    [part="nav"]:focus-visible,
    [part~="month"]:focus-visible {
      outline-color: Highlight;
    }
  }
`;
