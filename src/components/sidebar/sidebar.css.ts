import { css } from "lit";
import { sidebarSurface } from "../../surfaces/surfaces.css.ts";

/**
 * Face and focus ring of a row control or the toggle. The face is `::before`;
 * each control sets `--_face-hover` and `--_face-pressed`. The ring sits inside
 * the face and follows its radius.
 */
const face = css`
  .control,
  .toggle {
    position: relative;
    isolation: isolate;
    box-sizing: border-box;
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    cursor: default;
  }

  .control::before,
  .toggle::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -1;
    border-radius: var(--purr-radius);
    background-color: var(--_face, transparent);
    transition: background-color var(--purr-duration-fast) var(--purr-ease-out);
  }

  @media (hover: hover) {
    .control:hover::before,
    .toggle:hover::before {
      background-color: var(--_face-hover);
    }
  }

  .control:active::before,
  .toggle:active::before {
    background-color: var(--_face-pressed);
  }

  .control:focus-visible,
  .toggle:focus-visible {
    outline: none;
  }

  .control:focus-visible::before,
  .toggle:focus-visible::before {
    outline: var(--purr-ring-width) solid var(--purr-color-ring);
    outline-offset: calc(var(--purr-ring-width) * -1);
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
      inline-size: calc(var(--purr-spacing) * 64);
      max-inline-size: 100%;
      padding: 0 var(--purr-space-3) var(--purr-space-4);
      font: 400 var(--_text) / var(--_leading) var(--purr-font-sans);
    }

    :host([hidden]) {
      display: none;
    }

    /* Row and heading metrics; the items and sections inherit them. */
    :host {
      --_text: var(--purr-text-sm);
      --_leading: var(--purr-leading-normal);
      --_row: max(calc(var(--purr-spacing) * 8), var(--purr-size-hit-min));
      --_glyph: var(--purr-icon-md);
      --_head: calc(var(--purr-spacing) * 4.5);
      --_head-text: var(--purr-text-xs);
      --_head-leading: var(--purr-leading-tight);
    }

    :host([size="lg"]) {
      --_text: var(--purr-text-lg);
      --_leading: var(--purr-leading-loose);
      --_row: max(calc(var(--purr-spacing) * 10), var(--purr-size-hit-min));
      --_glyph: calc(var(--purr-spacing) * 4.5);
      --_head: var(--purr-icon-lg);
      --_head-text: var(--purr-text-sm);
      --_head-leading: var(--purr-leading-normal);
    }

    :host([collapsed]) {
      inline-size: fit-content;
      padding-block-end: 0;
    }

    :host([collapsed]) nav {
      display: none;
    }

    /* The toggle sits at the trailing end of a bar as tall as a toolbar, so
       the two line up side by side. Its round face is smaller than its hit
       region. */
    .toggle {
      --_face-hover: var(--purr-color-muted-3);
      --_face-pressed: var(--purr-color-muted-1);

      display: grid;
      place-items: center;
      inline-size: var(--purr-size-xl);
      block-size: var(--purr-size-xl);
      margin-block: calc((var(--purr-size-bar) - var(--purr-size-xl)) / 2);
      margin-inline-start: auto;
      padding: 0;
    }

    .toggle::before {
      inset: calc((100% - var(--purr-visual-lg)) / 2);
      border-radius: var(--purr-radius-full);
    }

    .toggle svg {
      inline-size: var(--purr-icon-md);
      block-size: var(--purr-icon-md);
    }

    /* Narrow screen, any pointer: the sidebar starts collapsed (see
       sidebar.ts); shown again, it fills the width, square and flat. */
    @media (max-width: 600px) {
      :host(:not([collapsed])) {
        inline-size: 100%;
        border-radius: 0;
        box-shadow: none;
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

    /* Every row reserves the chevron column, so level 1 labels share a leading
       edge; level 2 indents one step. Hover is half the selected fill. */
    .control {
      --_fill: var(--purr-color-muted-3);
      --_face-hover: color-mix(in srgb, var(--_fill) 50%, transparent);
      --_face-pressed: var(--_fill);

      display: grid;
      grid-template-columns:
        calc(var(--purr-icon-md) + var(--purr-space-1)) auto minmax(0, 1fr)
        auto;
      align-items: center;
      inline-size: 100%;
      min-block-size: var(--_row);
      padding: var(--purr-space-1) var(--purr-pad-item);
      text-align: start;
      text-decoration: none;
    }

    :host([expandable]) .control {
      font-weight: 400;
    }

    :host([level="2"]) .control {
      padding-inline-start: calc(var(--purr-pad-item) + var(--purr-indent));
    }

    .label {
      grid-column: 3;
      overflow-wrap: anywhere;
    }

    /* An empty slot adds no column width and no margin. */
    ::slotted([slot="icon"]) {
      grid-column: 2;
      inline-size: var(--_glyph);
      block-size: var(--_glyph);
      margin-inline-end: var(--purr-gap-icon);
      color: var(--purr-color-accent-text);
    }

    ::slotted([slot="detail"]) {
      grid-column: 4;
      margin-inline-start: var(--purr-space-2);
      font-weight: 400;
      color: var(--purr-color-muted-foreground);
    }

    :host([selected]) .control {
      --_face: var(--_fill);
      --_face-hover: var(--_fill);
    }

    /* Points inline-end, mirrored in RTL, and turns toward block-end when open. */
    .chevron {
      grid-column: 1;
      inline-size: var(--purr-icon-md);
      block-size: var(--purr-icon-md);
      color: var(--purr-color-muted-foreground);
      transition: transform var(--purr-duration) var(--purr-ease-out);
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

    /* The fill alone is faint, so increased contrast adds a stroke. */
    @media (prefers-contrast: more) {
      :host([selected]) .control::before {
        box-shadow: inset 0 0 0 1px var(--purr-color-input-border);
      }
    }

    /* System colors replace ours; the selected row keeps Highlight in every state. */
    @media (forced-colors: active) {
      .chevron {
        transition: none;
      }

      :host([selected]) .control {
        --_face: Highlight;
        --_face-hover: Highlight;
        --_face-pressed: Highlight;

        color: HighlightText;
        forced-color-adjust: none;
      }

      :host([selected]) .chevron,
      :host([selected]) ::slotted([slot]) {
        color: inherit;
      }

      :host([selected]) .control:focus-visible::before {
        outline-color: HighlightText;
      }
    }
  `,
];

export const sectionStyles = css`
  :host {
    display: block;
  }

  :host([hidden]) {
    display: none;
  }

  :host(:not(:first-child)) {
    margin-block-start: var(--purr-space-3);
  }

  .heading {
    display: flex;
    align-items: center;
    min-block-size: var(--_head);
    padding-inline: var(--purr-pad-item);
    color: var(--purr-color-muted-foreground);
    font: 700 var(--_head-text) / var(--_head-leading) var(--purr-font-sans);
  }
`;
