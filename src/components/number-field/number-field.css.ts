import { css } from "lit";
import { fieldStyles } from "../input/input.css.ts";

/*
 * The drawn stepper is two halves, --_sw wide and half the field tall. Each
 * button is a hit-min square that straddles the middle, so a coarse pointer
 * still gets 44 px per button, and the halves are drawn on the button's
 * ::before. In an inside stepper the hit areas reach over the input.
 */
export const numberFieldStyles = [
  fieldStyles,
  css`
    :host {
      --_sw: calc(var(--pl-spacing) * 5);
      --_stw: max(var(--_sw), var(--pl-size-hit-min));
      --_gap: calc(var(--_stw) - var(--_sw));
      --_btn: var(--pl-material-control);

      inline-size: auto;
      justify-items: start;
    }

    :host([size="lg"]) {
      --_sw: calc(var(--pl-spacing) * 5.75);
    }

    :host([size="xl"]) {
      --_sw: calc(var(--pl-spacing) * 7.5);
    }

    [part="group"] {
      position: relative;
      display: inline-flex;
      gap: var(--pl-gap-controls);
      block-size: var(--_h);
    }

    [part="field"] {
      inline-size: calc(var(--pl-spacing) * 16 + var(--_stw));
      padding-inline-end: calc(var(--_stw) + var(--_pad));
    }

    [part="control"] {
      text-align: start;
    }

    [part="stepper"] {
      position: absolute;
      inset-block: 0;
      inset-inline-end: 0;
      inline-size: var(--_stw);
    }

    :host([stepper="outside"]) [part="field"] {
      inline-size: calc(var(--pl-spacing) * 15);
      padding-inline-end: var(--_pad);
    }

    :host([stepper="outside"]) [part="stepper"] {
      position: relative;
      flex: none;
      block-size: var(--_h);
    }

    /* Outside, the drawn halves sit against the field and the hit area extends away from it. */
    :host([stepper="outside"]) [part="stepper"]::after {
      inset-inline: var(--pl-space-1) calc(var(--_gap) + var(--pl-space-1));
    }

    :host([stepper="outside"]) [part="stepper"] button {
      padding-inline: 0 var(--_gap);
    }

    :host([stepper="outside"]) [part="stepper"] button::before {
      inset-inline: 0 auto;
    }

    [part="stepper"]::after {
      content: "";
      position: absolute;
      inset-block-start: calc(50% - 0.5px);
      inset-inline: calc(var(--_gap) + var(--pl-space-1)) var(--pl-space-1);
      block-size: 1px;
      border-radius: var(--pl-radius-full);
      background: var(--pl-color-muted-1);
      pointer-events: none;
    }

    [part="stepper"] button {
      position: absolute;
      inset-inline-start: 0;
      display: grid;
      justify-items: center;
      box-sizing: border-box;
      inline-size: var(--_stw);
      block-size: var(--pl-size-hit-min);
      margin: 0;
      padding: 0;
      padding-inline-start: var(--_gap);
      border: 0;
      background: none;
      color: var(--pl-color-foreground);
      font-size: var(--pl-text-sm);
      outline: 0;
      isolation: isolate;
      cursor: default;
      touch-action: manipulation;
      transition: color var(--pl-duration-fast) var(--pl-ease-out);
    }

    [part="stepper"] button::before {
      content: "";
      position: absolute;
      inset-inline-end: 0;
      inline-size: var(--_sw);
      block-size: calc(var(--_h) / 2);
      background-color: var(--_btn);
      z-index: -1;
      transition: background-color var(--pl-duration-fast) var(--pl-ease-out);
    }

    /* The glyph is centred in the drawn half, not in the hit square. */
    [part="stepper"] [part="increment"] {
      inset-block-end: 50%;
      align-items: end;
      padding-block-end: calc(var(--_h) / 4 - 0.3075em);
    }

    [part="increment"]::before {
      inset-block-end: 0;
      border-start-start-radius: var(--pl-radius);
      border-start-end-radius: var(--pl-radius);
    }

    [part="stepper"] [part="decrement"] {
      inset-block-start: 50%;
      align-items: start;
      padding-block-start: calc(var(--_h) / 4 - 0.3075em);
    }

    [part="decrement"]::before {
      inset-block-start: 0;
      border-end-start-radius: var(--pl-radius);
      border-end-end-radius: var(--pl-radius);
    }

    /* Inside, the start side meets the field and stays square. */
    :host(:not([stepper="outside"])) [part="stepper"] button::before {
      border-start-start-radius: 0;
      border-end-start-radius: 0;
    }

    [part="stepper"] svg {
      inline-size: 1.23em;
      block-size: 0.615em;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.4;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    @media (hover: hover) {
      [part="stepper"] button:enabled:hover::before {
        background-color: color-mix(
          in srgb,
          var(--_btn),
          var(--pl-color-secondary-pressed) 50%
        );
      }
    }

    [part="stepper"] button:enabled:active::before {
      background-color: var(--pl-color-secondary-pressed);
    }

    [part="stepper"] button:disabled {
      color: var(--pl-color-disabled-foreground);
    }

    [part="stepper"] button:disabled::before {
      background-color: var(--pl-color-secondary-disabled);
    }

    @media (forced-colors: active) {
      [part="stepper"] button {
        forced-color-adjust: none;
        color: ButtonText;
      }

      [part="stepper"] button::before {
        background-color: ButtonFace;
        box-shadow: 0 0 0 1px ButtonText;
      }

      [part="stepper"] button:disabled {
        color: GrayText;
      }

      [part="stepper"] button:disabled::before {
        box-shadow: 0 0 0 1px GrayText;
      }

      [part="stepper"]::after {
        background: ButtonText;
      }
    }
  `,
];
