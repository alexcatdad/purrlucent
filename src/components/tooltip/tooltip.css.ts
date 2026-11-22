import { css } from "lit";

/*
 * The bubble is an invisible box whose padding is the gap to the target, with
 * the visible face inside it: the pointer never leaves the tooltip on its way
 * from the target to the face (WCAG 1.4.13, hoverable).
 */
export const tooltipStyles = css`
  :host {
    --_gap: var(--purr-space-1-5);

    display: inline-block;
    /* Read by the element, not used: its computed value is the hover delay. A fixed time, not a motion token: the delay is behaviour and must survive reduced motion. */
    transition-delay: 560ms;
  }

  :host([hidden]) {
    display: none;
  }

  [part="bubble"] {
    box-sizing: border-box;
    max-inline-size: calc(100vw - var(--purr-space-4));
    inset: auto;
    margin: 0;
    border: 0;
    padding: var(--_gap);
    overflow: visible;
    background: none;
    color: inherit;
    transition: opacity var(--purr-duration-slow) var(--purr-ease-out);
  }

  /* Entry only: nothing waits for an exit animation to end. */
  @starting-style {
    [part="bubble"]:popover-open {
      opacity: 0;
    }
  }

  [part="face"] {
    inline-size: max-content;
    max-inline-size: 100%;
    border-radius: var(--purr-radius);
    padding: var(--purr-space-1) var(--purr-space-1-5);
    background: var(--purr-material-panel);
    backdrop-filter: var(--purr-material-panel-filter);
    overflow-wrap: anywhere;
    box-shadow:
      inset 0 0 0 1px var(--purr-color-edge),
      var(--purr-elevation-panel);
    color: var(--purr-color-foreground);
    font: 400 var(--purr-text-xs) / var(--purr-leading-tight)
      var(--purr-font-sans);
  }

  /* A block, not the inline span it is made as: Firefox reports an inline box's text as overflow. */
  ::slotted([role="tooltip"]) {
    display: block;
  }

  /* On a touch screen the bubble must never take a tap meant for what is under it. */
  @media (hover: none) {
    [part="bubble"] {
      pointer-events: none;
    }
  }

  @media (forced-colors: active) {
    [part="bubble"] {
      transition: none;
    }

    [part="face"] {
      border: 1px solid CanvasText;
      background: Canvas;
      color: CanvasText;
    }
  }
`;
