import { css } from "lit";
import { sidebarSurface } from "../../surfaces/surfaces.css.ts";

/**
 * Face, states and ring of a row control or the toggle, after interactionStyles
 * but for an inner link or button, so `:active` stands in for the pressed state.
 * The face is `::before`, so a press scales it and never the hit region. Hover
 * and pressed read the tones the sidebar surface sets; a selected row sets its own.
 */
const face = css`
  .control,
  .toggle {
    position: relative;
    isolation: isolate;
    box-sizing: border-box;
    border: 0;
    background: transparent;
    color: var(--purr-color-label);
    font: inherit;
    cursor: pointer;
  }

  .control::before,
  .toggle::before {
    content: "";
    position: absolute;
    inset: var(--inset, 0) 0;
    z-index: -1;
    border-radius: var(--purr-radius-row);
    background-color: var(--purr-face, transparent);
    transition:
      background-color var(--purr-duration-release) var(--purr-ease-standard),
      scale var(--purr-duration-release) var(--purr-ease-spring);
  }

  @media (hover: hover) {
    .control:hover::before,
    .toggle:hover::before {
      background-color: var(--purr-face-hover);
      transition-duration:
        var(--purr-duration-hover), var(--purr-duration-release);
    }
  }

  .control:active::before,
  .toggle:active::before {
    background-color: var(--purr-face-pressed);
    scale: var(--purr-press-scale);
    transition-duration: var(--purr-duration-press);
    transition-timing-function: var(--purr-ease-standard);
  }

  /* The ring sits inside the face and follows its radius. */
  .control:focus-visible,
  .toggle:focus-visible {
    outline: none;
  }

  .control:focus-visible::before,
  .toggle:focus-visible::before {
    outline: var(--purr-focus-width) solid var(--purr-color-focus);
    outline-offset: var(--purr-focus-offset-inside);
  }

  @media (forced-colors: active) {
    .control::before,
    .toggle::before {
      transition: none;
    }

    .control:focus-visible::before,
    .toggle:focus-visible::before {
      outline-color: Highlight;
    }
  }
`;

export const sidebarStyles = [
  sidebarSurface,
  face,
  css`
    :host {
      inline-size: 17rem;
      max-inline-size: 100%;
      font: var(--purr-font-body);
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
      display: inline-grid;
      place-items: center;
      min-inline-size: var(--purr-hit-min);
      min-block-size: var(--purr-hit-min);
      padding: 0;
    }

    .toggle svg {
      inline-size: 1.5rem;
      block-size: 1.5rem;
    }

    /* Phone width with a coarse pointer: stacked navigation. The sidebar fills
       the width, square and flat, always shows its items, and has nothing to hide. */
    @media (max-width: 600px) and (pointer: coarse) {
      :host,
      :host([collapsed]) {
        inline-size: 100%;
        border-radius: 0;
        box-shadow: none;
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
  face,
  css`
    :host {
      display: block;
    }

    :host([hidden]) {
      display: none;
    }

    /* One step is the chevron slot plus its gap. Every row reserves the slot,
       so level 1 labels share a leading edge; level 2 indents one more step.
       Fine rows split the 2px gap between rows inside their hit region. */
    .control {
      --chevron: 0.875rem;
      --chevron-gap: 0.375rem;
      --inset: 0.0625rem;

      display: grid;
      grid-template-columns: var(--chevron) minmax(0, 1fr);
      column-gap: var(--chevron-gap);
      align-items: center;
      inline-size: 100%;
      padding: calc(0.375rem + var(--inset)) var(--purr-space-3);
      text-align: start;
      text-decoration: none;
    }

    @media (pointer: coarse) {
      .control {
        --chevron: 1rem;
        --chevron-gap: var(--purr-space-2);
        --inset: 0;

        padding-block: 0.6875rem;
      }

      .chevron {
        stroke-width: 2px;
      }
    }

    :host([level="2"]) .control {
      padding-inline-start: calc(
        var(--purr-space-3) + var(--chevron) + var(--chevron-gap)
      );
    }

    .label {
      grid-column: 2;
      overflow-wrap: anywhere;
    }

    :host([selected]) .control {
      --purr-face: var(--purr-color-selection);
      --purr-face-hover: var(--purr-color-selection-hover);
      --purr-face-pressed: var(--purr-color-selection-pressed);

      color: var(--purr-color-on-accent);
      font: var(--purr-font-body-emphasized);
    }

    :host([selected]) .control:focus-visible::before {
      outline-color: var(--purr-color-on-accent);
    }

    /* Points inline-end, mirrored in RTL, and turns toward block-end when open. */
    .chevron {
      inline-size: var(--chevron);
      block-size: var(--chevron);
      color: var(--purr-color-secondary-label);
      stroke-width: 1.5px;
      transition: transform var(--purr-duration-release)
        var(--purr-ease-standard);
    }

    .chevron path {
      vector-effect: non-scaling-stroke;
    }

    :host([selected]) .chevron {
      color: inherit;
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

    /* System colors replace ours; the selected row keeps Highlight in every state. */
    @media (forced-colors: active) {
      .chevron {
        transition: none;
      }

      :host([selected]) .control {
        --purr-face: Highlight;
        --purr-face-hover: Highlight;
        --purr-face-pressed: Highlight;

        color: HighlightText;
        forced-color-adjust: none;
      }

      :host([selected]) .control:focus-visible::before {
        outline-color: HighlightText;
      }
    }
  `,
];
