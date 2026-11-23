import { css } from "lit";
import { listRowSurface } from "../../surfaces/surfaces.css.ts";

/*
 * Builds on the list row surface. With an href, the link's ::after covers the
 * whole row, so a click anywhere follows it. The actions sit above that cover
 * and stay separate controls.
 */
export const itemStyles = [
  listRowSurface,
  css`
    :host {
      position: relative;
      gap: var(--pl-space-3);
      font: 400 var(--pl-text-sm) / var(--pl-leading-normal) var(--pl-font-sans);
      transition: background-color var(--pl-duration-fast) var(--pl-ease-out);
    }

    ::slotted([slot="media"]) {
      flex: none;
      inline-size: var(--pl-icon-lg);
      block-size: var(--pl-icon-lg);
      color: var(--pl-color-muted-foreground);
      object-fit: cover;
    }

    [part="text"] {
      flex: 1;
      min-inline-size: 0;
      overflow-wrap: anywhere;
    }

    [part="title"],
    [part="link"] {
      display: block;
      color: inherit;
      font-weight: 700;
      text-decoration: none;
    }

    ::slotted([slot="title"]),
    ::slotted([slot="description"]) {
      display: block;
      margin: 0;
      font: inherit;
    }

    slot[name="description"] {
      display: block;
      color: var(--pl-color-muted-foreground);
    }

    [part="link"]::after {
      content: "";
      position: absolute;
      inset: 0;
    }

    [part="link"]:focus-visible {
      outline: none;
    }

    [part="link"]:focus-visible::after {
      outline: var(--pl-ring-width) solid var(--pl-color-ring);
      outline-offset: calc(var(--pl-ring-width) * -1);
    }

    [part="actions"] {
      position: relative;
      display: flex;
      flex: none;
      align-items: center;
      gap: var(--pl-gap-controls);
    }

    [hidden] {
      display: none !important;
    }

    @media (hover: hover) {
      :host([href]:hover) {
        background: var(--pl-color-muted-1);
      }
    }

    :host([href]:active) {
      background: var(--pl-color-muted-pressed);
    }

    @media (forced-colors: active) {
      [part="link"]:focus-visible::after {
        outline-color: Highlight;
      }
    }
  `,
];
