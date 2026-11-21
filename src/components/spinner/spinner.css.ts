import { css } from "lit";

/*
 * A quiet ring with one arc that turns. Without motion the arc rests where it
 * is: a partial ring on a full groove still reads as unfinished work.
 */
export const spinnerStyles = css`
  :host {
    --_s: calc(var(--purr-spacing) * 8);

    display: inline-block;
    inline-size: var(--_s);
    block-size: var(--_s);
    vertical-align: middle;
  }

  :host([hidden]) {
    display: none;
  }

  :host([size="lg"]) {
    --_s: calc(var(--purr-spacing) * 10);
  }

  :host([size="xl"]) {
    --_s: calc(var(--purr-spacing) * 12);
  }

  svg {
    display: block;
    inline-size: 100%;
    block-size: 100%;
    fill: none;
    stroke-width: 3;
  }

  .track {
    stroke: var(--purr-color-track);
  }

  .arc {
    stroke: var(--purr-color-selected);
    stroke-linecap: round;
    stroke-dasharray: 28 72;

    /* Only the arc turns, so the host has nothing to overflow. */
    transform-origin: center;
    transform-box: fill-box;
    animation: purr-spinner-turn calc(var(--purr-duration) * 4) linear infinite;
  }

  @keyframes purr-spinner-turn {
    to {
      rotate: 1turn;
    }
  }

  @media (forced-colors: active) {
    .track {
      stroke: GrayText;
    }

    .arc {
      stroke: Highlight;
    }
  }
`;
