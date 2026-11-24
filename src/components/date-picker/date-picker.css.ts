import { css } from "lit";
import { fieldStyles } from "../input/input.css.ts";

/*
 * The field shell is the text field's. The calendar button sits inside it at the
 * end, as tall as the shell, so the entry and the button read as one control.
 * The panel is as wide as the calendar's seven columns plus its own padding,
 * which is wider than the popover's default cap.
 */
export const datePickerStyles = [
  fieldStyles,
  css`
    :host {
      inline-size: calc(var(--pl-spacing) * 44);
    }

    [part="field"] {
      padding-inline-end: 0;
    }

    /* An input cannot hold a <bdi>; plaintext isolates the day the same way, so its parts keep the order the locale writes. */
    [part="control"] {
      unicode-bidi: plaintext;
      text-overflow: ellipsis;
    }

    pl-popover {
      flex: none;
    }

    pl-popover::part(panel) {
      max-inline-size: min(
        calc(var(--pl-size-lg) * 7 + var(--pl-pad-panel) * 2),
        calc(100vw - var(--pl-space-4))
      );
    }

    /* Increased contrast and the forced-colors look are the button's and the calendar's own. */
    @media (prefers-reduced-motion: reduce) {
      pl-popover::part(panel) {
        transition: none;
      }
    }
  `,
];
