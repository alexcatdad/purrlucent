import { css } from "lit";
import { sidebarSurface } from "../../surfaces/surfaces.css.ts";

/**
 * Face and focus ring of a row control or the toggle. The face is `::before`;
 * each control sets `--_face-hover` and `--_face-pressed`. The ring sits inside
 * the face and follows its radius.
 */
const face = css`
  .control,
  .disclosure,
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
  .disclosure::before,
  .toggle::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -1;
    border-radius: var(--pl-radius-row);
    background-color: var(--_face, transparent);
    transition: background-color var(--pl-duration-fast) var(--pl-ease-out);
  }

  @media (hover: hover) {
    .control:hover::before,
    .disclosure:hover::before,
    .toggle:hover::before {
      background-color: var(--_face-hover);
    }
  }

  .control:active::before,
  .disclosure:active::before,
  .toggle:active::before {
    background-color: var(--_face-pressed);
  }

  .control:focus-visible,
  .disclosure:focus-visible,
  .toggle:focus-visible {
    outline: none;
  }

  .control:focus-visible::before,
  .disclosure:focus-visible::before,
  .toggle:focus-visible::before {
    outline: var(--pl-ring-width) solid var(--pl-color-ring);
    outline-offset: calc(var(--pl-ring-width) * -1);
  }

  @media (forced-colors: active) {
    .control::before,
    .disclosure::before,
    .toggle::before {
      transition: none;
    }

    .control:focus-visible::before,
    .disclosure:focus-visible::before,
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
      inline-size: calc(var(--pl-spacing) * 64);
      max-inline-size: 100%;
      padding: 0 var(--pl-space-3) var(--pl-space-4);
      font: 400 var(--_text) / var(--_leading) var(--pl-font-sans);
    }

    :host([hidden]) {
      display: none;
    }

    /* Row and heading metrics; the items and sections inherit them. */
    :host {
      --_text: var(--pl-text-sm);
      --_leading: var(--pl-leading-normal);
      --_row: max(calc(var(--pl-spacing) * 8), var(--pl-size-hit-min));
      --_glyph: var(--pl-icon-md);
      --_head: calc(var(--pl-spacing) * 4.5);
      --_head-text: var(--pl-text-xs);
      --_head-leading: var(--pl-leading-tight);
    }

    :host([size="lg"]) {
      --_text: var(--pl-text-lg);
      --_leading: var(--pl-leading-loose);
      --_row: max(calc(var(--pl-spacing) * 10), var(--pl-size-hit-min));
      --_glyph: calc(var(--pl-spacing) * 4.5);
      --_head: var(--pl-icon-lg);
      --_head-text: var(--pl-text-sm);
      --_head-leading: var(--pl-leading-normal);
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
      --_face-hover: var(--pl-color-muted-3);
      --_face-pressed: var(--pl-color-muted-1);

      display: grid;
      place-items: center;
      inline-size: var(--pl-size-xl);
      block-size: var(--pl-size-xl);
      margin-block: calc((var(--pl-size-bar) - var(--pl-size-xl)) / 2);
      margin-inline-start: auto;
      padding: 0;
    }

    .toggle::before {
      inset: calc((100% - var(--pl-visual-lg)) / 2);
      border-radius: var(--pl-radius-full);
    }

    .toggle svg {
      inline-size: var(--pl-icon-md);
      block-size: var(--pl-icon-md);
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
    .control,
    .disclosure {
      --_fill: var(--pl-color-muted-3);
      --_face-hover: color-mix(in srgb, var(--_fill) 50%, transparent);
      --_face-pressed: var(--_fill);

      display: grid;
      grid-template-columns:
        calc(var(--pl-icon-md) + var(--pl-space-1)) auto minmax(0, 1fr)
        auto;
      align-items: center;
      inline-size: 100%;
      min-block-size: var(--_row);
      padding: var(--pl-space-1) var(--pl-pad-item);
      text-align: start;
      text-decoration: none;
    }

    :host([expandable]) .control {
      font-weight: 400;
    }

    /* Beside a link, the disclosure button covers the link's chevron column,
       so the label keeps the edge it has on a button row. */
    :host([expandable]) {
      position: relative;
    }

    .disclosure {
      position: absolute;
      inset-block: 0;
      inset-inline-start: 0;
      z-index: 1;
      display: flex;
      align-items: center;
      inline-size: auto;
      min-inline-size: var(--pl-size-hit-min);
      padding-inline: var(--pl-pad-item) var(--pl-space-1);
    }

    :host([level="2"]) .control {
      padding-inline-start: calc(var(--pl-pad-item) + var(--pl-indent));
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
      margin-inline-end: var(--pl-gap-icon);
      color: var(--pl-color-accent-text);
    }

    ::slotted([slot="detail"]) {
      grid-column: 4;
      margin-inline-start: var(--pl-space-2);
      font-weight: 400;
      color: var(--pl-color-muted-foreground);
    }

    :host([selected]) .control {
      --_face: var(--_fill);
      --_face-hover: var(--_fill);
    }

    /* Points inline-end, mirrored in RTL, and turns toward block-end when open. */
    .chevron {
      grid-column: 1;
      inline-size: var(--pl-icon-md);
      block-size: var(--pl-icon-md);
      color: var(--pl-color-muted-foreground);
      transition: transform var(--pl-duration) var(--pl-ease-out);
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
        box-shadow: inset 0 0 0 1px var(--pl-color-input-border);
      }
    }

    /* System colors replace ours; the selected row keeps Highlight in every state. */
    @media (forced-colors: active) {
      .chevron {
        transition: none;
      }

      :host([selected]) .control,
      :host([selected]) .disclosure {
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

      :host([selected]) .control:focus-visible::before,
      :host([selected]) .disclosure:focus-visible::before {
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
    margin-block-start: var(--pl-space-3);
  }

  .heading {
    display: flex;
    align-items: center;
    min-block-size: var(--_head);
    padding-inline: var(--pl-pad-item);
    color: var(--pl-color-muted-foreground);
    font: 700 var(--_head-text) / var(--_head-leading) var(--pl-font-sans);
  }
`;
