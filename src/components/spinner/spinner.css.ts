import { css } from "lit";

/*
 * A quiet ring with one arc that turns. Without motion the arc rests where it
 * is: a partial ring on a full groove still reads as unfinished work. With a
 * value the arc stops and shows the share done.
 */
export const spinnerStyles = css`
  :host {
    --_s: calc(var(--pl-spacing) * 8);

    display: inline-block;
    inline-size: var(--_s);
    block-size: var(--_s);
    vertical-align: middle;
  }

  :host([hidden]) {
    display: none;
  }

  :host([size="sm"]) {
    --_s: calc(var(--pl-spacing) * 4);
  }

  :host([size="lg"]) {
    --_s: calc(var(--pl-spacing) * 10);
  }

  :host([size="xl"]) {
    --_s: calc(var(--pl-spacing) * 12);
  }

  svg {
    display: block;
    inline-size: 100%;
    block-size: 100%;
    fill: none;
    stroke-width: 3;
  }

  .track {
    stroke: var(--pl-color-track);
  }

  .arc {
    stroke: var(--pl-color-selected);
    stroke-linecap: round;
    stroke-dasharray: 28 72;

    /* Only the arc turns, so the host has nothing to overflow. */
    transform-origin: center;
    transform-box: fill-box;
    animation: pl-spinner-turn calc(var(--pl-duration) * 4) linear infinite;
  }

  @keyframes pl-spinner-turn {
    to {
      rotate: 1turn;
    }
  }

  /*
   * With a value the arc is the share done, clockwise from the top (--_dash,
   * set by the element on a 100-unit path), and does not turn. At exactly 0 it
   * is hidden so the round cap leaves no dot.
   */
  :host(:state(determinate)) .arc {
    stroke-dasharray: var(--_dash);
    rotate: -0.25turn;
    animation: none;
    transition: stroke-dasharray var(--pl-duration) var(--pl-ease-out);
  }

  :host(:state(empty)) .arc {
    visibility: hidden;
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
