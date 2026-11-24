import { css } from "lit";

/*
 * The table stays a native <table> in the light DOM, so its rows, headers and
 * captions keep their semantics and a shadow root cannot style them. These
 * rules therefore ship as a constructable stylesheet that pl-table adopts into
 * the root its table lives in (the document or an enclosing shadow root).
 * Cell edges, row fills and the sticky header read tokens only.
 */
export const tableDocumentStyles = css`
  pl-table > table {
    inline-size: 100%;
    border-collapse: separate;
    border-spacing: 0;
    font: inherit;
    text-align: start;
  }

  pl-table caption {
    caption-side: block-start;
    padding: var(--pl-space-3) var(--pl-pad-panel);
    color: var(--pl-color-foreground);
    font-weight: 600;
    text-align: start;
  }

  pl-table :is(th, td) {
    padding: var(--pl-space-2) var(--pl-pad-panel);
    border-block-end: 1px solid var(--pl-color-border);
    text-align: start;
    vertical-align: middle;
    overflow-wrap: anywhere;
  }

  pl-table th {
    color: var(--pl-color-muted-foreground);
    font-weight: 600;
  }

  pl-table :is(td, th)[align="end"] {
    text-align: end;
    font-variant-numeric: tabular-nums;
  }

  pl-table > table > :last-child > tr:last-child > :is(th, td) {
    border-block-end: 0;
  }

  /*
   * Interactive rows: a row marked data-interactive, or one holding a stretched
   * link (a[data-stretched], whose hit area covers the row), tints on hover,
   * rings on keyboard focus and shows a pointer.
   */
  pl-table tr:is([data-interactive], :has(a[data-stretched])) {
    position: relative;
    cursor: pointer;
  }

  pl-table a[data-stretched]::after {
    content: "";
    position: absolute;
    inset: 0;
  }

  /* The row carries the ring instead of the link. */
  pl-table a[data-stretched]:focus-visible {
    outline: none;
  }

  @media (hover: hover) {
    pl-table
      tr:is([data-interactive], :has(a[data-stretched])):not(
        [data-selected]
      ):hover
      > :is(th, td) {
      background: color-mix(
        in srgb,
        var(--pl-color-foreground) 6%,
        transparent
      );
    }
  }

  pl-table
    tr:is([data-interactive], :has(a[data-stretched])):is(
      :focus-visible,
      :has(:focus-visible)
    ) {
    outline: var(--pl-ring-width) solid var(--pl-color-ring);
    outline-offset: calc(var(--pl-ring-width) * -1);
  }

  /* A sortable heading holds a button; the cell keeps its th role. The glyph
     follows aria-sort and is a mask, so it takes the text color. */
  pl-table th[aria-sort] > button {
    display: inline-flex;
    align-items: center;
    gap: var(--pl-gap-icon);
    min-block-size: var(--pl-size-hit-min);
    margin: 0;
    padding: 0;
    border: 0;
    border-radius: var(--pl-radius-control);
    background: none;
    color: inherit;
    font: inherit;
    text-align: inherit;
    cursor: pointer;
    transition: color var(--pl-duration-fast) var(--pl-ease-out);
  }

  pl-table th[aria-sort="ascending"] > button,
  pl-table th[aria-sort="descending"] > button {
    color: var(--pl-color-foreground);
  }

  @media (hover: hover) {
    pl-table th[aria-sort] > button:hover {
      color: var(--pl-color-foreground);
    }
  }

  pl-table th[aria-sort] > button:focus-visible {
    outline: var(--pl-ring-width) solid var(--pl-color-ring);
    outline-offset: var(--pl-ring-offset);
  }

  pl-table th[aria-sort] > button::after {
    content: "";
    flex: none;
    inline-size: var(--pl-icon-sm);
    block-size: var(--pl-icon-sm);
    background: currentColor;
    mask: var(--_sort-glyph) center / 100% 100% no-repeat;
    --_sort-glyph: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='gray' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M8 9l4-4l4 4M16 15l-4 4l-4-4'/%3E%3C/svg%3E");
  }

  pl-table th[aria-sort="ascending"] > button::after {
    --_sort-glyph: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='gray' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 15l6-6l6 6'/%3E%3C/svg%3E");
  }

  pl-table th[aria-sort="descending"] > button::after {
    --_sort-glyph: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='gray' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6l6-6'/%3E%3C/svg%3E");
  }

  pl-table tr[data-selected] > :is(th, td) {
    background: color-mix(in srgb, var(--pl-color-selected) 16%, transparent);
  }

  pl-table[sticky-header] thead th {
    position: sticky;
    inset-block-start: 0;
    z-index: 1;
    background: var(--pl-color-background);
  }

  /* The header floats over rows, so it keeps its own edge while it sticks. */
  pl-table[sticky-header] thead tr:last-child > th {
    border-block-end: 1px solid var(--pl-color-border);
  }

  @media (forced-colors: active) {
    pl-table :is(th, td) {
      border-block-end-color: CanvasText;
    }

    pl-table th {
      color: CanvasText;
    }

    pl-table[sticky-header] thead th {
      background: Canvas;
    }

    pl-table th[aria-sort] > button::after {
      forced-color-adjust: none;
      background: ButtonText;
    }

    pl-table
      tr:is([data-interactive], :has(a[data-stretched])):is(
        :focus-visible,
        :has(:focus-visible)
      ) {
      outline-color: Highlight;
    }

    pl-table tr[data-selected] > :is(th, td) {
      border-block-end-color: Highlight;
    }
  }
`;

export const tableStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    max-inline-size: 100%;
    color: var(--pl-color-foreground);
    font: 400 var(--pl-text-sm) / var(--pl-leading-normal) var(--pl-font-sans);
  }

  :host([hidden]) {
    display: none;
  }

  [part="scroller"] {
    overflow: auto;
    max-block-size: inherit;
    border: 1px solid var(--pl-color-frame);
    background: var(--pl-color-raised);
    border-radius: var(--pl-radius-control);
  }

  [part="scroller"]:focus-visible {
    outline: var(--pl-ring-width) solid var(--pl-color-ring);
    outline-offset: calc(var(--pl-ring-width) * -1);
  }

  @media (forced-colors: active) {
    [part="scroller"] {
      border-color: CanvasText;
    }

    [part="scroller"]:focus-visible {
      outline-color: Highlight;
    }
  }
`;
