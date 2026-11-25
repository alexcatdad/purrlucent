import { css } from "lit";

/*
 * The viewport is the native scroller with scroll-snap, so swipe, trackpad and
 * keyboard scrolling are the browser's own. Each item is one page wide. The
 * controls sit centered below: Previous, a dot per page, Next. Under a coarse
 * pointer the size tokens already reach the touch minimum.
 */
export const carouselStyles = css`
  :host {
    --_size: max(var(--pl-size-md), var(--pl-size-hit-min));

    display: block;
    color: var(--pl-color-foreground);
    font: 400 var(--pl-text-base) / var(--pl-leading-normal) var(--pl-font-sans);
  }

  :host([hidden]) {
    display: none;
  }

  [part="viewport"] {
    display: flex;
    overflow-x: auto;
    overflow-y: hidden;
    overscroll-behavior-x: contain;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;
    border-radius: var(--pl-radius-control);
  }

  [part="viewport"]::-webkit-scrollbar {
    display: none;
  }

  [part="viewport"]:focus-visible {
    outline: var(--pl-ring-width) solid var(--pl-color-ring);
    outline-offset: calc(var(--pl-ring-width) * -1);
  }

  [part="controls"] {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--pl-space-1);
    margin-block-start: var(--pl-space-2);
  }

  [part="controls"][hidden] {
    display: none;
  }

  ul {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li {
    display: flex;
  }

  button {
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-inline-size: var(--_size);
    min-block-size: var(--_size);
    padding: 0;
    border: 0;
    background-color: transparent;
    color: inherit;
    font: inherit;
    cursor: var(--pl-cursor-interactive);
    user-select: none;
  }

  /* Under glass the arrows are capsules; solid leaves them without a fill. */
  [part="previous"],
  [part="next"] {
    border-radius: var(--pl-radius-control);
    background-color: var(--pl-material-capsule);
    backdrop-filter: var(--pl-material-control-filter);
    box-shadow: var(--pl-material-edge);
    transition: background-color var(--pl-duration-fast) var(--pl-ease-out);
  }

  button svg {
    flex: none;
    inline-size: var(--pl-icon-md);
    block-size: var(--pl-icon-md);
  }

  /* The arrows point left and right; the row reads the other way in RTL. */
  :host(:dir(rtl)) button svg {
    transform: scaleX(-1);
  }

  /* The dot is drawn small; the button around it is the touch target. */
  [part~="page"]::before {
    content: "";
    inline-size: calc(var(--pl-spacing) * 2);
    block-size: calc(var(--pl-spacing) * 2);
    border-radius: var(--pl-radius-full);
    background-color: var(--pl-color-muted-foreground);
    transition:
      inline-size var(--pl-duration-fast) var(--pl-ease-out),
      background-color var(--pl-duration-fast) var(--pl-ease-out);
  }

  /* The current page is wider as well as darker, so it does not rely on color. */
  [part~="page"][aria-current="true"]::before {
    inline-size: calc(var(--pl-spacing) * 5);
    background-color: var(--pl-color-foreground);
  }

  @media (hover: hover) {
    [part="previous"]:not(:disabled):hover,
    [part="next"]:not(:disabled):hover {
      background-color: var(--pl-color-muted-3);
    }
  }

  [part="previous"]:not(:disabled):active,
  [part="next"]:not(:disabled):active {
    background-color: var(--pl-color-muted-pressed);
  }

  button:focus-visible {
    outline: var(--pl-ring-width) solid var(--pl-color-ring);
    outline-offset: var(--pl-ring-offset);
  }

  button:disabled {
    cursor: var(--pl-cursor-disabled);
    color: var(--pl-color-disabled-foreground);
  }

  /* System colors replace ours: the current dot paints Highlight. */
  @media (forced-colors: active) {
    [part="previous"],
    [part="next"],
    [part~="page"]::before {
      transition: none;
    }

    button:focus-visible {
      outline-color: Highlight;
    }

    button:disabled {
      color: GrayText;
    }

    [part~="page"]::before {
      forced-color-adjust: none;
      background-color: CanvasText;
    }

    [part~="page"][aria-current="true"]::before {
      background-color: Highlight;
    }

    [part="viewport"]:focus-visible {
      outline-color: Highlight;
    }
  }
`;

export const carouselItemStyles = css`
  :host {
    box-sizing: border-box;
    display: block;
    flex: 0 0 100%;
    min-inline-size: 0;
    scroll-snap-align: start;
    scroll-snap-stop: always;
  }

  :host([hidden]) {
    display: none;
  }
`;
