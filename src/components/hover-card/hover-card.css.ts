import { css } from "lit";
import { popoverStyles } from "../popover/popover.css.ts";

/*
 * The card is a popover's panel and arrow, so it takes the popover's look
 * unchanged. Only the two delays are its own. They are behaviour, read by the
 * element, and fixed times rather than motion tokens so they survive
 * reduced motion.
 */
export const hoverCardStyles = [
  popoverStyles,
  css`
    :host {
      --pl-hover-card-open-delay: 700ms;
      --pl-hover-card-close-delay: 300ms;

      /* Read by the element, not used: its computed value is the two delays, resolved by the browser (open, then close). */
      transition-delay:
        var(--pl-hover-card-open-delay), var(--pl-hover-card-close-delay);
    }
  `,
];
