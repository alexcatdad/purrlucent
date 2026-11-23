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
    border: 1px solid var(--pl-color-border);
    border-radius: var(--pl-radius-lg);
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
