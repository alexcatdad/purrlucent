import { css } from "lit";
import { panelSurface } from "../../surfaces/surfaces.css.ts";

const ring = css`
  .control:focus-visible {
    outline: 2px solid var(--purr-color-focus);
    outline-offset: -2px;
  }

  @media (forced-colors: active) {
    .control:focus-visible {
      outline: 2px solid Highlight;
    }
  }
`;

export const sidebarStyles = [
  panelSurface,
  ring,
  css`
    :host {
      inline-size: 17rem;
      max-inline-size: 100%;
      font-family: var(--purr-font-family);
      font-size: var(--purr-font-size-body);
      padding: var(--purr-space-2);
    }

    :host([hidden]) {
      display: none;
    }

    :host([collapsed]) {
      inline-size: fit-content;
    }

    :host([collapsed]) nav {
      display: none;
    }

    .toggle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      min-inline-size: 44px;
      min-block-size: 44px;
      padding: var(--purr-space-2);
      border: 0;
      border-radius: var(--purr-radius-small);
      background: transparent;
      color: inherit;
      cursor: pointer;
    }

    .toggle svg {
      inline-size: 1.5rem;
      block-size: 1.5rem;
    }

    @media (hover: hover) {
      .toggle:hover {
        background: var(--purr-color-fill);
      }
    }

    /* Phone width with a coarse pointer: stacked navigation. The sidebar fills
       the width, always shows its items, and has nothing to hide. */
    @media (max-width: 600px) and (pointer: coarse) {
      :host,
      :host([collapsed]) {
        inline-size: 100%;
        border-radius: 0;
        border-inline: 0;
      }

      :host([collapsed]) nav {
        display: block;
      }

      .toggle {
        display: none;
      }
    }
  `,
];

export const itemStyles = [
  ring,
  css`
    :host {
      display: block;
      font-family: var(--purr-font-family);
    }

    :host([hidden]) {
      display: none;
    }

    .control {
      display: flex;
      align-items: center;
      gap: var(--purr-space-2);
      inline-size: 100%;
      box-sizing: border-box;
      min-block-size: 2.25rem;
      padding: var(--purr-space-2) var(--purr-space-3);
      border: 0;
      border-inline-start: 3px solid transparent;
      border-radius: var(--purr-radius-small);
      background: transparent;
      color: var(--purr-color-label);
      font: inherit;
      text-align: start;
      text-decoration: none;
      cursor: pointer;
    }

    :host([level="2"]) .control {
      padding-inline-start: calc(var(--purr-space-3) + var(--purr-space-5));
    }

    @media (pointer: coarse) {
      .control {
        min-block-size: 44px;
      }
    }

    @media (hover: hover) {
      .control:hover {
        background: var(--purr-color-fill);
      }
    }

    :host([selected]) .control {
      background: var(--purr-color-fill);
      border-inline-start-color: var(--purr-color-accent);
      font-weight: 600;
    }

    /* The selected item stays visible when system colors replace ours. */
    @media (forced-colors: active) {
      :host([selected]) .control {
        background: Highlight;
        color: HighlightText;
        forced-color-adjust: none;
      }
    }

    .chevron {
      flex: none;
      inline-size: 1rem;
      block-size: 1rem;
      transition: transform var(--purr-duration-fast);
    }

    :host([expanded]) .chevron {
      transform: rotate(90deg);
    }

    :host(:dir(rtl)) .chevron {
      transform: scaleX(-1);
    }

    :host(:dir(rtl)[expanded]) .chevron {
      transform: scaleX(-1) rotate(90deg);
    }
  `,
];
