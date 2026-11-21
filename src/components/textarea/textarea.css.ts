import { css } from "lit";
import { fieldStyles } from "../input/input.css.ts";

/*
 * The shell grows with the text area, which resizes inside it. The shell keeps
 * the control height as its minimum, and the resize handle sits in its corner.
 */
export const textareaStyles = [
  fieldStyles,
  css`
    :host {
      --_rows-h: calc(var(--purr-spacing) * 18);

      inline-size: calc(var(--purr-spacing) * 60);
    }

    [part="field"] {
      display: grid;
      align-items: stretch;
      block-size: auto;
      min-block-size: var(--_h);
      padding: 0;
    }

    [part="control"] {
      box-sizing: border-box;
      block-size: var(--_rows-h);
      min-block-size: var(--_h);
      padding: var(--purr-space-1) var(--_pad);
      resize: vertical;
      cursor: inherit;
    }

    :host([resize="none"]) [part="control"] {
      resize: none;
    }

    :host([rows]) [part="control"] {
      block-size: auto;
    }
  `,
];
