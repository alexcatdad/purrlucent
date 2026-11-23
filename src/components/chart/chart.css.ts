import { css } from "lit";

/*
 * The chart draws into the light DOM of a <tanstack-chart> that lives inside
 * this shadow root, so these rules reach its SVG and its tooltip. TanStack
 * reads color from CSS variables (--ts-chart-1..6, currentColor and the
 * --ts-chart-tooltip-* set), so the whole theme is the block below: the
 * palette is mixed from the library's own color tokens, and light, dark and
 * increased contrast follow them. Series and slices take their color from the
 * palette in order, so the legend and the drawing agree.
 */
export const chartStyles = css`
  :host {
    /* How far each series color moves toward the text color: more of it on a
       light page makes it darker, on a dark page lighter. Increased contrast
       moves it further. */
    --_lift: 22%;
    --_red: light-dark(var(--pl-color-destructive), var(--pl-color-punch-red));
    --_slice-edge: var(--pl-color-background);

    /* A categorical palette, one hue per series: the accent blue, then
       mixes of the red and the blues around the hue wheel (amber, green,
       violet), then the red, then a neutral. */
    --pl-chart-1: color-mix(
      in oklch,
      var(--pl-color-selected),
      var(--pl-color-foreground) var(--_lift)
    );
    --pl-chart-2: color-mix(
      in oklch,
      color-mix(in oklch, var(--_red) 62%, var(--pl-color-frosted-blue)),
      var(--pl-color-foreground) var(--_lift)
    );
    --pl-chart-3: color-mix(
      in oklch,
      color-mix(in oklch longer hue, var(--_red), var(--pl-color-cerulean)),
      var(--pl-color-foreground) var(--_lift)
    );
    --pl-chart-4: color-mix(
      in oklch,
      color-mix(in oklch, var(--_red) 40%, var(--pl-color-cerulean)),
      var(--pl-color-foreground) var(--_lift)
    );
    --pl-chart-5: color-mix(
      in oklch,
      var(--_red),
      var(--pl-color-foreground) var(--_lift)
    );
    --pl-chart-6: color-mix(
      in oklch,
      var(--pl-color-foreground),
      var(--pl-color-background) 45%
    );

    /* What TanStack reads. */
    --ts-chart-1: var(--pl-chart-1);
    --ts-chart-2: var(--pl-chart-2);
    --ts-chart-3: var(--pl-chart-3);
    --ts-chart-4: var(--pl-chart-4);
    --ts-chart-5: var(--pl-chart-5);
    --ts-chart-6: var(--pl-chart-6);
    --ts-chart-focus-fill: var(--pl-color-background);
    --ts-chart-tooltip-background: var(--pl-material-panel);
    --ts-chart-tooltip-color: var(--pl-color-foreground);
    --ts-chart-tooltip-border: 1px solid var(--pl-color-edge);
    --ts-chart-tooltip-border-radius: var(--pl-radius);
    --ts-chart-tooltip-padding: var(--pl-space-1-5) var(--pl-space-2);
    --ts-chart-tooltip-max-width: calc(var(--pl-spacing) * 60);
    --ts-chart-tooltip-shadow:
      var(--pl-material-edge), var(--pl-elevation-panel);
    --ts-chart-tooltip-font: 400 var(--pl-text-xs) / var(--pl-leading-tight)
      var(--pl-font-sans);
    --ts-chart-tooltip-active-row-background: var(--pl-color-muted-1);
    --ts-chart-tooltip-active-row-shadow: none;

    display: block;
    position: relative;
    box-sizing: border-box;
    padding: var(--pl-space-2);
    color: var(--pl-color-foreground);
    font: 400 var(--pl-text-xs) / var(--pl-leading-tight) var(--pl-font-sans);
  }

  :host([hidden]) {
    display: none;
  }

  @media (prefers-contrast: more) {
    :host {
      --_lift: 45%;
    }
  }

  /* TanStack's element is the host of the drawing; it only needs to be a box. */
  tanstack-chart {
    display: block;
  }

  :host([type="donut"]) tanstack-chart {
    max-inline-size: calc(var(--pl-spacing) * 80);
    margin-inline: auto;
  }

  /* The drawing is a single tab stop, and its focus ring is ours. */
  tanstack-chart svg {
    outline: none;
  }

  tanstack-chart svg:focus-visible {
    outline: var(--pl-ring-width) solid var(--pl-color-ring);
    outline-offset: var(--pl-ring-offset);
  }

  [part="legend"] {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--pl-space-1) var(--pl-space-4);
    margin: var(--pl-space-2) 0 0;
    padding: 0;
    list-style: none;
  }

  [part="legend"] li {
    display: flex;
    align-items: center;
    gap: var(--pl-space-1-5);
    min-inline-size: 0;
    overflow-wrap: anywhere;
  }

  [part="swatch"] {
    flex: none;
    inline-size: var(--pl-space-3);
    block-size: var(--pl-space-3);
    border-radius: var(--pl-radius-full);
    background: var(--_swatch, var(--pl-chart-1));
  }

  [part="legend"] li:nth-child(6n + 2) {
    --_swatch: var(--pl-chart-2);
  }

  [part="legend"] li:nth-child(6n + 3) {
    --_swatch: var(--pl-chart-3);
  }

  [part="legend"] li:nth-child(6n + 4) {
    --_swatch: var(--pl-chart-4);
  }

  [part="legend"] li:nth-child(6n + 5) {
    --_swatch: var(--pl-chart-5);
  }

  [part="legend"] li:nth-child(6n) {
    --_swatch: var(--pl-chart-6);
  }

  /* The table is the chart's other form, for assistive technology and for
     anyone who wants the numbers. Without show-table it is only clipped, not
     removed: a 1px box that clips, so nothing in it can overflow. */
  :host(:not([show-table])) [part="data"] {
    position: absolute;
    inset-block-start: 0;
    inset-inline-start: 0;
    inline-size: 1px;
    block-size: 1px;
    overflow: clip;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  :host([show-table]) [part="data"] {
    margin-block-start: var(--pl-space-4);
  }

  table {
    inline-size: 100%;
    border-collapse: separate;
    border-spacing: 0;
    font: 400 var(--pl-text-sm) / var(--pl-leading-normal) var(--pl-font-sans);
    text-align: start;
  }

  caption {
    padding: var(--pl-space-2) 0;
    color: var(--pl-color-foreground);
    font-weight: 600;
    text-align: start;
  }

  :is(th, td) {
    padding: var(--pl-space-2) var(--pl-space-3);
    border-block-end: 1px solid var(--pl-color-border);
    text-align: start;
    vertical-align: middle;
    overflow-wrap: anywhere;
  }

  thead th {
    color: var(--pl-color-muted-foreground);
    font-weight: 600;
  }

  td {
    font-variant-numeric: tabular-nums;
  }

  @media (forced-colors: active) {
    /* System colors, so a series is never the page's text color. Hues differ
       in every high contrast theme; the markers and the legend carry the rest. */
    :host {
      --pl-chart-1: Highlight;
      --pl-chart-2: LinkText;
      --pl-chart-3: VisitedText;
      --pl-chart-4: ActiveText;
      --pl-chart-5: ButtonText;
      --pl-chart-6: GrayText;
      --_slice-edge: Canvas;
      --ts-chart-tooltip-border: 1px solid CanvasText;
      --ts-chart-tooltip-background: Canvas;
      --ts-chart-tooltip-color: CanvasText;
    }

    tanstack-chart svg,
    [part="swatch"] {
      forced-color-adjust: none;
    }

    tanstack-chart svg:focus-visible {
      outline-color: Highlight;
    }

    :is(th, td) {
      border-block-end-color: CanvasText;
    }

    thead th {
      color: CanvasText;
    }
  }
`;
