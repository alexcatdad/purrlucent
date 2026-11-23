import { css } from "lit";

/*
 * The panel and its arrow are one shape: the arrow takes the panel's fill and
 * edge and sits one hairline inside the panel so no seam shows between them.
 * It is placed by its centre, from the trigger's measured position, so it is
 * right on all four sides and under either text direction.
 */
export const popoverStyles = css`
  :host {
    --_arrow-w: calc(var(--pl-spacing) * 5);
    --_arrow-h: calc(var(--pl-spacing) * 2.5);
    /* The arrow stays this far from a corner, so it never rides the rounding. */
    --_corner: calc(var(--pl-radius-lg) + var(--_arrow-w) / 2);

    display: inline-block;
  }

  :host([hidden]) {
    display: none;
  }

  [part="panel"] {
    box-sizing: border-box;
    /* As wide as the content, no narrower than the arrow needs between the corners, no wider than the cap or the viewport. */
    inline-size: fit-content;
    min-inline-size: calc(var(--_corner) * 2);
    max-inline-size: min(
      calc(var(--pl-spacing) * 45),
      calc(100vw - var(--pl-space-4))
    );
    inset: auto;
    margin: calc(var(--_arrow-h) + var(--pl-space-1));
    border: 0;
    border-radius: var(--pl-radius-lg);
    padding: var(--pl-pad-panel);
    overflow: visible;
    background: var(--pl-material-panel);
    backdrop-filter: var(--pl-material-panel-filter);
    overflow-wrap: anywhere;
    box-shadow:
      inset 0 0 0 1px var(--pl-color-edge),
      var(--pl-elevation-panel);
    color: var(--pl-color-foreground);
    font: 400 var(--pl-text-sm) / var(--pl-leading-normal) var(--pl-font-sans);
    transition: opacity var(--pl-duration-slow) var(--pl-ease-out);
  }

  /* Entry only: nothing waits for an exit animation to end. */
  @starting-style {
    [part="panel"]:popover-open {
      opacity: 0;
    }
  }

  [part="panel"]:focus-visible {
    outline: var(--pl-ring-width) solid var(--pl-color-ring);
    outline-offset: var(--pl-ring-offset);
  }

  [part="arrow"] {
    position: absolute;
    inline-size: var(--_arrow-w);
    block-size: var(--_arrow-h);
    fill: var(--pl-material-panel);
    stroke: var(--pl-color-edge);
    overflow: visible;
    stroke-width: 1px;
    stroke-linejoin: round;
    transform: translate(-50%, -50%) rotate(var(--_turn));
    pointer-events: none;
  }

  [part="arrow"] path {
    vector-effect: non-scaling-stroke;
  }

  /* The side names where the panel sits: its arrow is on the edge facing the trigger. */
  [data-side="bottom"] [part="arrow"] {
    --_turn: 0deg;

    top: calc(var(--_arrow-h) / -2 + 1px);
    left: clamp(var(--_corner), var(--_along), 100% - var(--_corner));
  }

  [data-side="top"] [part="arrow"] {
    --_turn: 180deg;

    top: calc(100% + var(--_arrow-h) / 2 - 1px);
    left: clamp(var(--_corner), var(--_along), 100% - var(--_corner));
  }

  [data-side="right"] [part="arrow"] {
    --_turn: -90deg;

    left: calc(var(--_arrow-h) / -2 + 1px);
    top: clamp(var(--_corner), var(--_along), 100% - var(--_corner));
  }

  [data-side="left"] [part="arrow"] {
    --_turn: 90deg;

    left: calc(100% + var(--_arrow-h) / 2 - 1px);
    top: clamp(var(--_corner), var(--_along), 100% - var(--_corner));
  }

  @media (forced-colors: active) {
    [part="panel"] {
      border: 1px solid CanvasText;
      background: Canvas;
      color: CanvasText;
      transition: none;
    }

    [part="arrow"] {
      fill: Canvas;
      stroke: CanvasText;
    }

    [part="panel"]:focus-visible {
      outline-color: Highlight;
    }
  }
`;
