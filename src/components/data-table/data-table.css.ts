import { css } from "lit";

export const dataTableStyles = css`
  :host {
    display: block;
    color: var(--pl-color-foreground);
    font: 400 var(--pl-text-sm) / var(--pl-leading-normal) var(--pl-font-sans);
  }

  :host([hidden]) {
    display: none;
  }

  /* The element's own max-block-size bounds the scroll area. */
  pl-table {
    max-block-size: inherit;
  }

  .filter {
    display: grid;
    margin-block-end: var(--pl-space-3);
  }

  /* Pagination sits at the trailing edge, below the table. */
  .pages {
    inline-size: fit-content;
    max-inline-size: 100%;
    margin-block-start: var(--pl-space-3);
    margin-inline-start: auto;
  }

  /* A sortable heading is a button in the cell; the cell keeps its th role. */
  th button {
    display: inline-flex;
    align-items: center;
    gap: var(--pl-gap-icon);
    min-block-size: var(--pl-size-hit-min);
    margin: 0;
    padding: 0;
    border: 0;
    border-radius: var(--pl-radius);
    background: none;
    color: inherit;
    font: inherit;
    text-align: inherit;
    cursor: default;
    transition: color var(--pl-duration-fast) var(--pl-ease-out);
  }

  th[aria-sort] button {
    color: var(--pl-color-foreground);
  }

  @media (hover: hover) {
    th button:hover {
      color: var(--pl-color-foreground);
    }
  }

  th button:focus-visible {
    outline: var(--pl-ring-width) solid var(--pl-color-ring);
    outline-offset: var(--pl-ring-offset);
  }

  th svg {
    flex: none;
    inline-size: var(--pl-icon-sm);
    block-size: var(--pl-icon-sm);
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  th:not([aria-sort]) svg {
    color: var(--pl-color-muted-foreground);
  }

  /* The selection column holds only a checkbox. */
  .select {
    inline-size: var(--pl-size-hit-min);
    padding-inline-end: 0;
  }

  .select pl-checkbox {
    vertical-align: middle;
  }

  .empty {
    padding-block: var(--pl-space-8);
    color: var(--pl-color-muted-foreground);
    text-align: center;
  }

  /*
   * Model mode. Widths come from the model, so the layout is fixed; a pinned
   * cell sticks to a logical edge at the offset the component computed and
   * paints solid so the cells scrolling under it do not show through.
   */
  table.model {
    table-layout: fixed;
  }

  table.model [data-pin] {
    position: sticky;
    z-index: 1;
    background-color: var(--pl-color-background);
  }

  table.model [data-pin="start"] {
    inset-inline-start: var(--pin, 0px);
  }

  table.model [data-pin="end"] {
    inset-inline-end: var(--pin, 0px);
  }

  /* A pinned row sticks below the heading rows, or to the bottom edge. */
  table.model tr[data-row-pin] > :is(td, th) {
    position: sticky;
    z-index: 1;
    background-color: var(--pl-color-background);
  }

  table.model tr[data-row-pin="top"] > :is(td, th) {
    inset-block-start: var(--row-pin, 0px);
  }

  table.model tr[data-row-pin="bottom"] > :is(td, th) {
    inset-block-end: var(--row-pin, 0px);
  }

  table.model tr[data-row-pin] > [data-pin] {
    z-index: 2;
  }

  table.model thead :is(th, td) {
    background-color: var(--pl-color-background);
  }

  pl-table[sticky-header] table.model thead :is(th, td) {
    position: sticky;
    inset-block-start: var(--head-pin, 0px);
    z-index: 3;
  }

  table.model thead [data-pin],
  pl-table[sticky-header] table.model thead [data-pin] {
    z-index: 4;
  }

  /* A group row and a selected row are opaque too, for the pinned cells in them. */
  table.model tr.group > :is(td, th) {
    background-color: color-mix(
      in srgb,
      var(--pl-color-foreground) 6%,
      var(--pl-color-background)
    );
    font-weight: 600;
  }

  table.model tr[data-selected] > :is(td, th),
  table.model td[data-selected] {
    background-color: color-mix(
      in srgb,
      var(--pl-color-selected) 16%,
      var(--pl-color-background)
    );
  }

  table.model td.aggregate {
    font-variant-numeric: tabular-nums;
  }

  table.model tfoot td {
    border-block-start: 1px solid var(--pl-color-border);
    border-block-end: 0;
    font-weight: 600;
  }

  /* The first cell holds the indent, the disclosure button and the text. */
  .lead {
    display: flex;
    align-items: center;
    gap: var(--pl-gap-icon);
    padding-inline-start: calc(var(--depth, 0) * var(--pl-space-4));
  }

  .expand {
    display: inline-grid;
    flex: none;
    place-items: center;
    inline-size: var(--pl-size-hit-min);
    block-size: var(--pl-size-hit-min);
    margin: 0;
    padding: 0;
    border: 0;
    border-radius: var(--pl-radius);
    background: none;
    color: inherit;
    cursor: default;
  }

  button.expand:focus-visible {
    outline: var(--pl-ring-width) solid var(--pl-color-ring);
    outline-offset: var(--pl-ring-offset);
  }

  .expand svg {
    inline-size: var(--pl-icon-sm);
    block-size: var(--pl-icon-sm);
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  /* A collapsed disclosure points toward the row's text, so it mirrors. */
  button.expand[aria-expanded="false"]:dir(rtl) svg {
    transform: scaleX(-1);
  }

  .count {
    margin-inline-start: var(--pl-space-2);
    font-weight: 400;
    font-variant-numeric: tabular-nums;
  }

  /* The filter and the Columns menu share a row above the table. */
  .toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    gap: var(--pl-space-3);
    margin-block-end: var(--pl-space-3);
  }

  .toolbar .filter {
    flex: 1 1 calc(var(--pl-spacing) * 40);
    margin-block-end: 0;
  }

  /* A heading holds its label and its menu; a filter and the resize handle follow. */
  table.model th {
    position: relative;
  }

  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--pl-gap-icon);
  }

  /* The heading and row menus are icon buttons. */
  .menu-button {
    display: inline-grid;
    flex: none;
    place-items: center;
    inline-size: var(--pl-size-hit-min);
    block-size: var(--pl-size-hit-min);
    margin: 0;
    padding: 0;
    border: 0;
    border-radius: var(--pl-radius);
    background: none;
    color: var(--pl-color-muted-foreground);
    cursor: default;
  }

  .menu-button svg {
    inline-size: var(--pl-icon-sm);
    block-size: var(--pl-icon-sm);
    fill: none;
    stroke: currentColor;
    stroke-width: 3;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  /* An unsorted heading dims its glyph; the menu icon is not that glyph. */
  th .menu-button svg {
    opacity: 1;
  }

  @media (hover: hover) {
    .menu-button:hover {
      color: var(--pl-color-foreground);
    }
  }

  .menu-button:focus-visible {
    outline: var(--pl-ring-width) solid var(--pl-color-ring);
    outline-offset: var(--pl-ring-offset);
  }

  .row-menu {
    margin-inline-start: auto;
  }

  .column-filter {
    display: block;
    inline-size: 100%;
    min-inline-size: 0;
    margin-block-start: var(--pl-space-1);
    font-weight: 400;
  }

  /* The handle has the strip at the heading's trailing edge to itself, wide enough to grab. */
  table.model th[data-resizable] {
    padding-inline-end: var(--pl-size-hit-min);
  }

  .resize {
    position: absolute;
    inset-block: 0;
    inset-inline-end: 0;
    inline-size: var(--pl-size-hit-min);
    cursor: col-resize;
    touch-action: none;
  }

  .resize::after {
    content: "";
    position: absolute;
    inset-block: var(--pl-space-2);
    inset-inline-end: calc(var(--pl-spacing) / 2);
    inline-size: 1px;
    background: var(--pl-color-border);
  }

  .resize:hover::after,
  .resize:focus-visible::after {
    inline-size: calc(var(--pl-spacing) / 2);
    background: var(--pl-color-ring);
  }

  .resize:focus-visible {
    outline: var(--pl-ring-width) solid var(--pl-color-ring);
    outline-offset: calc(var(--pl-ring-width) * -1);
  }

  /* Selecting a range with shift must not also select text. */
  td[data-cell] {
    user-select: none;
  }

  td[data-cell]:focus-visible {
    outline: var(--pl-ring-width) solid var(--pl-color-ring);
    outline-offset: calc(var(--pl-ring-width) * -1);
  }

  @media (forced-colors: active) {
    table.model [data-pin],
    table.model tr[data-row-pin] > :is(td, th),
    table.model thead :is(th, td),
    table.model tr.group > :is(td, th),
    table.model tr[data-selected] > :is(td, th),
    table.model td[data-selected] {
      background-color: Canvas;
    }

    button.expand:focus-visible,
    .menu-button:focus-visible,
    .resize:focus-visible,
    td[data-cell]:focus-visible {
      outline-color: Highlight;
    }

    .menu-button {
      color: ButtonText;
    }

    .resize::after {
      background: CanvasText;
    }

    .resize:hover::after,
    .resize:focus-visible::after {
      background: Highlight;
    }

    th button {
      transition: none;
    }

    th button:focus-visible {
      outline-color: Highlight;
    }

    th:not([aria-sort]) svg {
      color: ButtonText;
    }
  }
`;
