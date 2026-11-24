import { css } from "lit";
import { shimmerStyles } from "../../typography/typography.css.ts";

/*
 * A quiet row of muted text with an optional leading icon. The border variant
 * adds a rule under the row; the separator variant centers the label between
 * two rules drawn by the host's own pseudo-elements. A link or button is one
 * control around the icon and the label, at least the hit minimum in size.
 */
export const markerStyles = [
  shimmerStyles,
  css`
    :host {
      display: flex;
      align-items: center;
      box-sizing: border-box;
      gap: var(--pl-gap-icon);
      color: var(--pl-color-muted-foreground);
      font: 400 var(--pl-text-sm) / var(--pl-leading-normal) var(--pl-font-sans);
    }

    :host([hidden]) {
      display: none;
    }

    :host([variant="border"]) {
      padding-block: var(--pl-space-2);
      border-block-end: 1px solid var(--pl-color-border);
    }

    :host([variant="separator"]) {
      justify-content: center;
      gap: var(--pl-space-3);
    }

    :host([variant="separator"])::before,
    :host([variant="separator"])::after {
      content: "";
      flex: 1;
      border-block-start: 1px solid var(--pl-color-border);
    }

    [hidden] {
      display: none !important;
    }

    [part="icon"] {
      display: flex;
      flex: none;
    }

    ::slotted([slot="icon"]) {
      display: block;
    }

    ::slotted(svg[slot="icon"]) {
      inline-size: var(--pl-icon-md);
      block-size: var(--pl-icon-md);
      fill: none;
      stroke: currentColor;
      stroke-width: 1.5;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    [part="label"] {
      min-inline-size: 0;
      overflow-wrap: anywhere;
    }

    [part="control"] {
      display: inline-flex;
      align-items: center;
      box-sizing: border-box;
      gap: var(--pl-gap-icon);
      min-inline-size: var(--pl-size-hit-min);
      min-block-size: var(--pl-size-hit-min);
      max-inline-size: 100%;
      margin: 0;
      padding: 0 var(--pl-space-1);
      border: 0;
      border-radius: var(--pl-radius-control-inner);
      background: none;
      color: inherit;
      font: inherit;
      text-align: start;
      text-decoration: none;
      cursor: default;
      transition: color var(--pl-duration-fast) var(--pl-ease-out);
    }

    @media (hover: hover) {
      [part="control"]:hover {
        color: var(--pl-color-foreground);
      }
    }

    [part="control"]:active {
      color: var(--pl-color-foreground);
    }

    [part="control"]:focus-visible {
      outline: var(--pl-ring-width) solid var(--pl-color-ring);
      outline-offset: calc(var(--pl-ring-width) * -1);
    }

    @media (prefers-contrast: more) {
      :host {
        color: var(--pl-color-foreground);
      }

      :host([variant="border"]),
      :host([variant="separator"])::before,
      :host([variant="separator"])::after {
        border-color: var(--pl-color-input-border);
      }
    }

    @media (forced-colors: active) {
      :host([variant="border"]),
      :host([variant="separator"])::before,
      :host([variant="separator"])::after {
        border-color: CanvasText;
      }

      [part="control"]:focus-visible {
        outline-color: Highlight;
      }
    }
  `,
];
