import { css } from "lit";
import { fieldStyles } from "../input/input.css.ts";

/*
 * The fine-pointer stepper draws two halves on each button's ::before.
 * On touch each visible button is also its complete hit area. The buttons
 * share a row when there is room and stack at narrower field widths.
 */
export const numberFieldStyles = [
  fieldStyles,
  css`
    :host {
      --_sw: calc(var(--pl-spacing) * 5);
      --_stw: max(var(--_sw), var(--pl-size-hit-min));
      --_gap: calc(var(--_stw) - var(--_sw));
      --_stepper-width: var(--_stw);
      --_group-h: var(--_h);
      --_btn: var(--pl-color-secondary);

      inline-size: calc(var(--pl-spacing) * 16 + var(--_stepper-width));
      justify-items: start;
    }

    :host([stepper="outside"]) {
      inline-size: calc(
        var(--pl-spacing) * 15 + var(--pl-gap-controls) + var(--_stepper-width)
      );
    }

    :host([size="lg"]) {
      --_sw: calc(var(--pl-spacing) * 5.75);
    }

    :host([size="xl"]) {
      --_sw: calc(var(--pl-spacing) * 7.5);
    }

    [part="group"] {
      position: relative;
      display: flex;
      gap: var(--pl-gap-controls);
      inline-size: 100%;
      block-size: var(--_h);
    }

    [part="field"] {
      flex: 1;
      min-inline-size: 0;
      block-size: var(--_group-h);
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
      padding-inline-end: var(--_pad);
    }

    :host([stepper="outside"]) [part="stepper"] {
      position: relative;
      flex: none;
      block-size: var(--_group-h);
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
      cursor: var(--pl-cursor-interactive);
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
      border-start-start-radius: var(--pl-radius-control);
      border-start-end-radius: var(--pl-radius-control);
    }

    [part="stepper"] [part="decrement"] {
      inset-block-start: 50%;
      align-items: start;
      padding-block-start: calc(var(--_h) / 4 - 0.3075em);
    }

    [part="decrement"]::before {
      inset-block-start: 0;
      border-end-start-radius: var(--pl-radius-control);
      border-end-end-radius: var(--pl-radius-control);
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

    @media (pointer: coarse) {
      :host {
        --_stepper-width: calc(var(--pl-size-hit-min) * 2);
        --_group-h: max(var(--_h), var(--_stepper-width));
        --_gap: 0;
      }

      [part="group"] {
        container-type: inline-size;
        block-size: auto;
      }

      [part="field"] {
        padding-inline-end: calc(var(--pl-size-hit-min) + var(--_pad));
      }

      [part="stepper"] {
        display: grid;
        grid-template-rows: repeat(2, minmax(0, 1fr));
        inline-size: var(--pl-size-hit-min);
      }

      :host([stepper="outside"]) [part="stepper"] button,
      [part="stepper"] :is([part="increment"], [part="decrement"]) {
        position: relative;
        inset: auto;
        place-items: center;
        inline-size: 100%;
        block-size: 100%;
        padding: 0;
      }

      [part="stepper"] button::before {
        inline-size: 100%;
        block-size: 100%;
      }

      /* Two touch targets plus enough room for the input and its padding. */
      @container (min-width: 9rem) {
        [part="field"],
        [part="stepper"] {
          --_group-h: var(--_h);
        }

        [part="field"] {
          padding-inline-end: calc(var(--_stepper-width) + var(--_pad));
        }

        [part="stepper"] {
          grid-template: 1fr / repeat(2, minmax(0, 1fr));
          inline-size: var(--_stepper-width);
        }

        [part="increment"] {
          grid-area: 1 / 2;
        }

        [part="decrement"] {
          grid-area: 1 / 1;
        }

        :host([stepper="outside"]) [part="stepper"]::after,
        [part="stepper"]::after {
          inset-block: var(--pl-space-1);
          inset-inline: calc(50% - 0.5px) auto;
          inline-size: 1px;
          block-size: auto;
        }

        [part="increment"]::before {
          border-radius: 0;
          border-start-end-radius: var(--pl-radius-control);
          border-end-end-radius: var(--pl-radius-control);
        }

        [part="decrement"]::before {
          border-radius: 0;
        }

        :host([stepper="outside"]) [part="decrement"]::before {
          border-start-start-radius: var(--pl-radius-control);
          border-end-start-radius: var(--pl-radius-control);
        }
      }
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
      cursor: var(--pl-cursor-disabled);
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
