import { css } from "lit";
import { fieldStyles } from "../input/input.css.ts";

/*
 * The field is a row: the choose button, then the chosen names. A drag over it
 * turns the edge to the accent. The native input stays out of the layout.
 */
export const fileInputStyles = [
  fieldStyles,
  css`
    :host {
      inline-size: calc(var(--pl-spacing) * 80);
      max-inline-size: 100%;
    }

    [part="field"] {
      min-block-size: var(--_h);
      block-size: auto;
      flex-wrap: wrap;
      padding-block: var(--pl-space-1);
      cursor: default;
    }

    :host(:state(dragging)) [part="field"] {
      box-shadow:
        var(--pl-material-edge),
        0 0 0 var(--pl-ring-width) var(--pl-color-ring);
    }

    [part="description"] {
      color: var(--pl-color-muted-foreground);
      font-size: var(--pl-text-xs);
    }

    input {
      display: none;
    }

    [part="button"] {
      flex: none;
      box-sizing: border-box;
      min-block-size: var(--pl-size-hit-min);
      margin: 0;
      padding-inline: var(--pl-pad-control);
      border: 0;
      border-radius: var(--pl-radius-control-inner);
      background: var(--pl-material-control);
      backdrop-filter: var(--pl-lens,) var(--pl-material-control-filter);
      color: var(--pl-color-foreground);
      font: inherit;
      cursor: var(--pl-cursor-interactive);
      transition: background-color var(--pl-duration-fast) var(--pl-ease-out);
    }

    [part="button"]:active {
      background: var(--pl-material-control-pressed);
    }

    [part="button"]:focus-visible {
      outline: var(--pl-ring-width) solid var(--pl-color-ring);
      outline-offset: var(--pl-ring-offset);
    }

    [part="button"]:disabled {
      cursor: var(--pl-cursor-disabled);
      background: var(--pl-color-secondary-disabled);
      color: var(--pl-color-disabled-foreground);
    }

    [part="names"] {
      flex: 1 1 0;
      min-inline-size: 0;
      color: var(--pl-color-muted-foreground);
      overflow-wrap: anywhere;
    }

    :host(:state(has-files)) [part="names"] {
      color: inherit;
    }

    :host(:disabled) [part="names"] {
      color: var(--pl-color-disabled-foreground);
    }

    @media (forced-colors: active) {
      [part="button"] {
        border: 1px solid ButtonText;
        background: ButtonFace;
        color: ButtonText;
        forced-color-adjust: none;
      }

      [part="button"]:focus-visible {
        outline-color: Highlight;
      }

      [part="button"]:disabled {
        border-color: GrayText;
        color: GrayText;
      }

      [part="names"] {
        color: FieldText;
      }

      :host(:state(dragging)) [part="field"] {
        outline: var(--pl-ring-width) solid Highlight;
      }
    }
  `,
];
