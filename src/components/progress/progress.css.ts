import { css } from "lit";

/*
 * Determinate: the fill is `--_p` (0 to 1) of the bar, never narrower than the
 * bar is tall so 0% still shows a dot. Indeterminate: a segment crosses the bar;
 * without motion it rests in the middle, still visible.
 */
export const progressStyles = css`
  :host {
    --_h: calc(var(--purr-spacing) * 2.5);
    --_d: 1;
    --_p: 0;

    display: inline-block;
    inline-size: calc(var(--purr-spacing) * 35);
    block-size: var(--_h);
    overflow: hidden;
    vertical-align: middle;
    border-radius: var(--purr-radius-full);
    background-color: var(--purr-color-track);
  }

  :host([hidden]) {
    display: none;
  }

  :host(:dir(rtl)) {
    --_d: -1;
  }

  [part="fill"] {
    display: block;
    block-size: 100%;
    inline-size: calc(var(--_p) * 100%);
    min-inline-size: var(--_h);
    border-radius: var(--purr-radius-full);
    background-color: var(--purr-color-selected);
    transition: inline-size var(--purr-duration) var(--purr-ease-out);
  }

  :host(:state(indeterminate)) [part="fill"] {
    inline-size: 60%;
    margin-inline-start: 20%;
    background-color: transparent;
    background-image: linear-gradient(
      to right,
      transparent 5%,
      var(--purr-color-selected)
    );
    scale: var(--_d) 1;
    animation: purr-progress-slide calc(var(--purr-duration-slow) * 5.7) linear
      infinite;
  }

  /* Scaling flips the gradient and the round end; the move is mirrored by hand. */
  @keyframes purr-progress-slide {
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
