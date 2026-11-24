import { css } from "lit";

/*
 * Determinate: the fill is `--_p` (0 to 1) of the bar. Above 0 it is never
 * narrower than the bar is tall, so a small value still shows; at exactly 0 the
 * track is empty. Indeterminate: a segment crosses the bar;
 * without motion it rests in the middle, still visible.
 */
export const progressStyles = css`
  :host {
    --_h: calc(var(--pl-spacing) * 2.5);
    --_d: 1;
    --_p: 0;
    --_fill: var(--pl-color-selected);

    /* A block as wide as its container, like a row of the layout: no line box
       adds space under it, and marks placed by percent of the container line
       up with the bar. Set inline-size to make it shorter. */
    display: block;
    inline-size: 100%;
    block-size: var(--_h);
    overflow: hidden;
    border-radius: var(--pl-radius-full);
    background-color: var(--pl-color-track);
  }

  :host([hidden]) {
    display: none;
  }

  :host(:dir(rtl)) {
    --_d: -1;
  }

  /* A tone takes the color made for text on the page, which keeps 3:1 against the track. */
  :host([tone="success"]) {
    --_fill: var(--pl-color-success-text);
  }

  :host([tone="warning"]) {
    --_fill: var(--pl-color-warning-text);
  }

  :host([tone="destructive"]) {
    --_fill: var(--pl-color-destructive-text);
  }

  [part="fill"] {
    display: block;
    block-size: 100%;
    inline-size: calc(var(--_p) * 100%);
    min-inline-size: calc(var(--_h) * min(1, var(--_p) * 100));
    border-radius: var(--pl-radius-full);
    background-color: var(--_fill);
    transition: inline-size var(--pl-duration) var(--pl-ease-out);
  }

  :host(:state(indeterminate)) [part="fill"] {
    inline-size: 60%;
    margin-inline-start: 20%;
    background-color: transparent;
    background-image: linear-gradient(to right, transparent 5%, var(--_fill));
    scale: var(--_d) 1;
    animation: pl-progress-slide calc(var(--pl-duration-slow) * 5.7) linear
      infinite;
  }

  /* Scaling flips the gradient and the round end; the move is mirrored by hand. */
  @keyframes pl-progress-slide {
    from {
      translate: calc(var(--_d) * -133.4%);
    }

    to {
      translate: calc(var(--_d) * 133.4%);
    }
  }

  @media (forced-colors: active) {
    :host {
      border: 1px solid ButtonText;
      background: Canvas;
      forced-color-adjust: none;
    }

    [part="fill"] {
      background: Highlight;
      transition: none;
    }

    /* The state rule's transparent color outranks the plain fill rule above. */
    :host(:state(indeterminate)) [part="fill"] {
      background-color: Highlight;
      background-image: none;
    }
  }
`;
