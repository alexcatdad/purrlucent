import { css } from "lit";

/*
 * A month is a table of seven columns, each one cell wide. The cell is a size
 * token, so it grows to the 44 point touch target on a coarse pointer, and the
 * header and the grid take their width from it. Selected, today and disabled
 * days are told apart by more than colour: the selected day is filled, today is
 * bold, a disabled day is dimmed and not pressable.
 */
export const calendarStyles = css`
  :host {
    --_cell: var(--pl-size-lg);

    display: inline-block;
    color: var(--pl-color-foreground);
    font: 400 var(--pl-text-sm) / var(--pl-leading-normal) var(--pl-font-sans);
  }

  :host([hidden]) {
    display: none;
  }

  [part="header"] {
    display: flex;
    align-items: center;
    gap: var(--pl-gap-controls);
    inline-size: calc(var(--_cell) * 7);
    margin-block-end: var(--pl-space-2);
  }

  [part="title"] {
    flex: 1;
    min-inline-size: 0;
    font-weight: 600;
    text-align: center;
    overflow-wrap: anywhere;
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
  [part="day"]:focus-visible {
    outline: var(--pl-ring-width) solid var(--pl-color-ring);
    outline-offset: var(--pl-ring-offset);
  }

  [part="grid"] {
    border-collapse: separate;
    border-spacing: 0;
    table-layout: fixed;
    inline-size: calc(var(--_cell) * 7);
  }

  [part="weekday"] {
    padding: 0 0 var(--pl-space-1);
    color: var(--pl-color-muted-foreground);
    font-size: var(--pl-text-xs);
    font-weight: 400;
    text-align: center;
  }

  /* The full name stays in the title; the browser's dotted underline goes. */
  [part="weekday"] abbr {
    text-decoration: none;
  }

  [part="day"] {
    box-sizing: border-box;
    block-size: var(--_cell);
    padding: 0;
    border-radius: var(--pl-radius-full);
    cursor: default;
    font-variant-numeric: tabular-nums;
    text-align: center;
    white-space: nowrap;
    user-select: none;
    transition: background-color var(--pl-duration-fast) var(--pl-ease-out);
  }

  @media (hover: hover) {
    [part="day"]:not([aria-disabled="true"], [aria-selected="true"]):hover {
      background: var(--pl-color-muted-3);
    }
  }

  [part="day"]:not([aria-disabled="true"], [aria-selected="true"]):active {
    background: var(--pl-color-muted-pressed);
  }

  [part="day"][aria-current="date"] {
    color: var(--pl-color-accent-text);
    font-weight: 600;
  }

  [part="day"][aria-selected="true"] {
    background: var(--pl-color-selected);
    color: var(--pl-color-selected-foreground);
  }

  [part="day"][aria-disabled="true"] {
    color: var(--pl-color-disabled-foreground);
  }

  @media (prefers-reduced-motion: reduce) {
    [part="nav"],
    [part="day"] {
      transition: none;
    }
  }

  @media (forced-colors: active) {
    [part="nav"] {
      color: ButtonText;
    }

    [part="nav"][aria-disabled="true"],
    [part="day"][aria-disabled="true"] {
      color: GrayText;
    }

    [part="day"][aria-selected="true"] {
      background: Highlight;
      color: HighlightText;
      forced-color-adjust: none;
    }

    [part="day"][aria-current="date"] {
      text-decoration: underline;
    }

    [part="nav"]:focus-visible,
    [part="day"]:focus-visible {
      outline-color: Highlight;
    }
  }
`;
