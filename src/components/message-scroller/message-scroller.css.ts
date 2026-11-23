import { css } from "lit";

/*
 * The host is the native scroller, as in pl-scroll-area: wheel, touch, keys,
 * momentum and scroll chaining are the browser's own.
 *
 * Edge fades are a mask on the host. Where scroll-driven animations exist, two
 * registered lengths follow the scroll offset (see CSS.registerProperty in
 * message-scroller.ts), so a fade grows over the first and last --_fade of
 * scrolling. Elsewhere, and under reduced motion, the data-scrollable
 * attribute sets the same two lengths at once.
 */
export const messageScrollerStyles = css`
  :host {
    --_peek: calc(var(--pl-spacing) * 16);
    --_fade: calc(var(--pl-spacing) * 8);

    /* The reach of a focus ring, which the rows inherit. */
    --_bleed: calc(var(--pl-ring-width) + var(--pl-ring-offset));
    --_ms-fade-start: 0px;
    --_ms-fade-end: 0px;

    display: block;
    box-sizing: border-box;
    padding: var(--pl-space-4);
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior-block: contain;

    /* The previous item's peek: a scroll target sits this far below the top. */
    scroll-padding-block-start: var(--_peek);
    scrollbar-width: thin;
    scrollbar-color: var(--pl-color-thumb) var(--pl-color-track);
    mask-image: linear-gradient(
      to bottom,
      transparent,
      Canvas var(--_ms-fade-start),
      Canvas calc(100% - var(--_ms-fade-end)),
      transparent
    );
  }

  :host([hidden]) {
    display: none;
  }

  :host([data-scrollable~="start"]) {
    --_ms-fade-start: var(--_fade);
  }

  :host([data-scrollable~="end"]) {
    --_ms-fade-end: var(--_fade);
  }

  @supports (animation-timeline: scroll()) {
    @media (prefers-reduced-motion: no-preference) {
      :host {
        animation-name: fade-start, fade-end;
        animation-timing-function: linear;
        animation-fill-mode: both;
        animation-timeline: scroll(self block), scroll(self block);
        animation-range:
          0% var(--_fade),
          calc(100% - var(--_fade)) 100%;
      }
    }
  }

  @keyframes fade-start {
    from {
      --_ms-fade-start: 0px;
    }

    to {
      --_ms-fade-start: var(--_fade);
    }
  }

  @keyframes fade-end {
    from {
      --_ms-fade-end: var(--_fade);
    }

    to {
      --_ms-fade-end: 0px;
    }
  }

  /*
   * The ring is an inset outline at the host's edge, where the fades are
   * transparent. While it shows, the mask keeps the ring's own width opaque and
   * starts the fades inside it.
   */
  :host(:focus-visible) {
    outline: var(--pl-ring-width) solid var(--pl-color-ring);
    outline-offset: calc(var(--pl-ring-width) * -1);
    mask-image: linear-gradient(
      to bottom,
      Canvas var(--pl-ring-width),
      transparent var(--pl-ring-width),
      Canvas calc(var(--pl-ring-width) + var(--_ms-fade-start)),
      Canvas calc(100% - var(--pl-ring-width) - var(--_ms-fade-end)),
      transparent calc(100% - var(--pl-ring-width)),
      Canvas calc(100% - var(--pl-ring-width))
    );
  }

  /*
   * The rows reach out by their bleed (see the item styles); the log pads by
   * the same amount, so that reach is inside the log, and takes it back as a
   * negative margin, so the rows line up with the host's padding.
   */
  [part="log"] {
    display: flex;
    flex-direction: column;
    gap: var(--pl-space-4);
    padding: var(--_bleed);
    margin: calc(var(--_bleed) * -1);
  }

  /*
   * A zero-height strip that sticks above the bottom fade, so the button floats
   * over the messages without adding to the scrollable height.
   */
  [part="overlay"] {
    position: sticky;
    inset-block-end: calc(var(--_fade) + var(--pl-space-2));
    block-size: 0;
    display: flex;
    justify-content: center;
    align-items: flex-end;
  }

  @media (prefers-contrast: more) {
    :host {
      scrollbar-color: var(--pl-color-input-border) var(--pl-color-track);
    }
  }

  @media (forced-colors: active) {
    :host {
      scrollbar-color: auto;
      mask-image: none;
    }

    :host(:focus-visible) {
      outline-color: Highlight;
      mask-image: none;
    }
  }
`;

/*
 * content-visibility: auto skips layout and paint of rows far from the
 * viewport, which keeps a long transcript cheap without virtualization. The
 * remembered size ("auto") keeps the scrollbar steady once a row was seen.
 * Paint containment would clip a focus ring that sits outside the row, so the
 * row pads by the ring's reach (--_bleed, from the scroller) and takes the
 * same back as a negative margin.
 */
export const messageScrollerItemStyles = css`
  :host {
    display: block;
    padding: var(--_bleed, 0px);
    margin: calc(var(--_bleed, 0px) * -1);
    content-visibility: auto;
    contain-intrinsic-block-size: auto calc(var(--pl-spacing) * 20);
  }

  :host([hidden]) {
    display: none;
  }
`;

export const messageScrollerButtonStyles = css`
  :host {
    display: inline-block;
    transition: opacity var(--pl-duration) var(--pl-ease-out);
  }

  /* Nothing to scroll toward: the button is not drawn and takes no focus. */
  :host([inert]) {
    opacity: 0;
  }

  :host([hidden]) {
    display: none;
  }

  pl-button {
    background-color: var(--pl-color-background);
    box-shadow: var(--pl-elevation-panel);
  }

  @media (forced-colors: active) {
    :host {
      transition: none;
    }
  }
`;
