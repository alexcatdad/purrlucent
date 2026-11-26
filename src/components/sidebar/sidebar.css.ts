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
    cursor: var(--pl-cursor-interactive);
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

/** Row and heading metrics; the items and sections inherit them. */
const rowMd = css`
  --_text: var(--pl-text-sm);
  --_leading: var(--pl-leading-normal);
  --_row: max(var(--pl-size-nav), var(--pl-size-hit-min));
  --_glyph: var(--pl-icon-md);
  --_head: calc(var(--pl-spacing) * 4.5);
  --_head-text: var(--pl-text-xs);
  --_head-leading: var(--pl-leading-tight);
`;

const rowLg = css`
  --_text: var(--pl-text-lg);
  --_leading: var(--pl-leading-body);
  --_row: max(var(--pl-size-nav-lg), var(--pl-size-hit-min));
  --_glyph: calc(var(--pl-spacing) * 4.5);
  --_head: var(--pl-icon-lg);
  --_head-text: var(--pl-text-sm);
  --_head-leading: var(--pl-leading-normal);
`;

export const sidebarStyles = [
  sidebarSurface,
  face,
  css`
    :host {
      display: flex;
      flex-direction: column;
      inline-size: calc(var(--pl-spacing) * 64);
      max-inline-size: 100%;
      padding: 0 var(--pl-space-3) var(--pl-space-4);
      font: 400 var(--_text) / var(--_leading) var(--pl-font-sans);
      transition:
        inline-size var(--pl-duration) var(--pl-ease-out),
        padding-inline var(--pl-duration) var(--pl-ease-out);
    }

    /* While it collapses, the content keeps its width and the host clips it,
       so it slides out instead of wrapping. Open, it fits its container. */
    :host(:not([data-overlay])) {
      overflow-x: clip;
    }

    :host([collapsed]:not([data-overlay])) {
      --_content: calc(var(--pl-spacing) * 64 - var(--pl-space-3) * 2);
    }

    :host([hidden]) {
      display: none;
    }

    :host {
      ${rowMd}
    }

    :host([size="lg"]) {
      ${rowLg}
    }

    /* Only the toggle is left; the panel of a narrow screen keeps this size,
       so the sidebar does not move when it closes. */
    :host([collapsed]),
    :host([data-overlay]) {
      inline-size: calc(var(--pl-size-xl) + var(--pl-space-3) * 2);
      padding-block-end: 0;
    }

    /* Without a toggle nothing is left, not even the padding. */
    :host([no-toggle][collapsed]),
    :host([no-toggle][data-overlay]) {
      inline-size: 0;
      padding-inline: 0;
    }

    /* The panel is in the top layer; the host leaves the page flow. */
    :host([data-overlay]) {
      position: fixed;
      inset-block-start: 0;
      inset-inline-start: 0;
    }

    /* A change the screen width caused is not animated. */
    :host([data-snap]),
    :host([data-snap]) nav,
    :host([data-snap]) [part="header"],
    :host([data-snap]) [part="footer"] {
      transition: none;
    }

    nav,
    [part="header"],
    [part="footer"] {
      min-inline-size: var(--_content, 0);
      transition:
        opacity var(--pl-duration) var(--pl-ease-out),
        display var(--pl-duration) allow-discrete;
    }

    /* The content fades out while the width shrinks, then leaves the layout. */
    :host([collapsed]) nav,
    :host([collapsed]) [part="header"],
    :host([collapsed]) [part="footer"] {
      display: none;
      opacity: 0;
    }

    @media (prefers-reduced-motion: reduce) {
      :host,
      nav,
      [part="header"],
      [part="footer"] {
        transition: none;
      }
    }

    /* The header and footer hold what the app pins to the top and bottom, such
       as a logo or the signed-in person; the navigation scrolls between them. */
    [part="header"],
    [part="footer"] {
      flex: none;
      padding: var(--pl-space-2) var(--pl-pad-item);
    }

    nav {
      flex: 1 1 auto;
      min-block-size: 0;
      overflow: clip auto;
    }

    /* A narrow screen shows the sidebar as a modal panel on the start edge over
       a scrim; the sidebar itself keeps the collapsed bar's place. The toggle
       in the panel is the one the page can reach. */
    :host([data-overlay]) .toggle:not(.in-dialog) {
      visibility: hidden;
    }

    dialog {
      display: flex;
      box-sizing: border-box;
      inline-size: calc(var(--pl-spacing) * 64);
      max-inline-size: calc(100vw - var(--pl-space-10));
      block-size: 100dvh;
      max-block-size: 100dvh;
      margin: 0;
      margin-inline: 0 auto;
      border: 0;
      border-start-end-radius: var(--pl-radius-panel);
      border-end-end-radius: var(--pl-radius-panel);
      padding: 0;
      overflow: hidden;
      background: var(--pl-material-sidebar);
      backdrop-filter: var(--pl-lens,) var(--pl-material-sidebar-filter);
      box-shadow: var(--pl-material-edge), var(--pl-elevation-panel);
      color: var(--pl-color-foreground);
      font: inherit;
    }

    .panel {
      display: flex;
      flex: 1;
      flex-direction: column;
      box-sizing: border-box;
      min-inline-size: 0;
      padding: 0 var(--pl-space-3) var(--pl-space-4);
    }

    dialog::backdrop {
      background: var(--pl-color-scrim);
    }

    dialog:not([open]) {
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

    @media (forced-colors: active) {
      dialog {
        border: var(--pl-ring-width) solid CanvasText;
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

    /* An item's own size replaces the sidebar's; the font is computed on the
       sidebar, so it is set again here from the item's metrics. */
    :host([size="md"]) {
      ${rowMd}

      font: 400 var(--_text) / var(--_leading) var(--pl-font-sans);
    }

    :host([size="lg"]) {
      ${rowLg}

      font: 400 var(--_text) / var(--_leading) var(--pl-font-sans);
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

    /* A label that does not fit ends in an ellipsis; the item then offers the
       full text as its title. */
    .label {
      grid-column: 3;
      min-inline-size: 0;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    /* The second line is muted and smaller than the label, and truncates too. */
    ::slotted([slot="description"]) {
      display: block;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      font-size: var(--pl-text-xs);
      line-height: var(--pl-leading-tight);
      font-weight: 400;
      color: var(--pl-color-muted-foreground);
    }

    /* The gap sits in this wrapper, not on the icon: page CSS that zeroes
       margins reaches a slotted element but never the shadow tree. An empty
       slot adds no column width and no gap. */
    .icon {
      grid-column: 2;
      display: grid;
      align-items: center;
    }

    .icon[data-filled] {
      padding-inline-end: var(--pl-gap-icon);
    }

    ::slotted([slot="icon"]) {
      inline-size: var(--_glyph);
      block-size: var(--_glyph);
      color: var(--pl-color-accent-text);
    }

    /* An avatar is a person's picture, not a glyph: it takes the larger share
       of the row and sets its own initials from that size. */
    ::slotted(pl-avatar[slot="icon"]) {
      --_s: calc(var(--_glyph) * 1.5);

      inline-size: var(--_s);
      block-size: var(--_s);
    }

    /* The grip of a reorderable item floats over the trailing end of the row,
       so it takes no room from the label while hidden. Its width comes from the
       icon, not the row; a coarse pointer gets the touch size from its hit area.
       Shown, the label and detail fade out beneath it. */
    :host([reorderable]) {
      --_grip: calc(var(--pl-icon-md) + var(--pl-space-2));
      /* How far the label and detail fade under a shown grip; hidden, the fade
         sits past their end, so they show whole. The text fades rather than
         a fill covering it, so any row fill or glass shows through unchanged. */
      --_fade: calc(var(--pl-space-2) * -1);

      position: relative;
    }

    :host([reorderable]) .label,
    :host([reorderable]) ::slotted([slot="detail"]) {
      mask-image: linear-gradient(
        to left,
        transparent var(--_fade),
        Canvas calc(var(--_fade) + var(--pl-space-2))
      );
    }

    :host([reorderable]:dir(rtl)) .label,
    :host([reorderable]:dir(rtl)) ::slotted([slot="detail"]) {
      mask-image: linear-gradient(
        to right,
        transparent var(--_fade),
        Canvas calc(var(--_fade) + var(--pl-space-2))
      );
    }

    :host([reorderable]:focus-within),
    :host([reorderable][data-dragging]) {
      --_fade: var(--_grip);
    }

    @media (hover: hover) {
      :host([reorderable]:hover) {
        --_fade: var(--_grip);
      }
    }

    .reorder-menu {
      display: contents;
    }

    .handle {
      position: absolute;
      inset-block: 0;
      inset-inline-end: 0;
      z-index: 1;
      display: grid;
      place-items: center;
      inline-size: var(--_grip);
      border: 0;
      border-radius: var(--pl-radius-row);
      padding: 0;
      background: transparent;
      color: var(--pl-color-muted-foreground);
      cursor: grab;
      touch-action: none;
      user-select: none;
      opacity: 0;
      transition: opacity var(--pl-duration-fast) var(--pl-ease-out);
    }

    .handle:focus-visible {
      outline: var(--pl-ring-width) solid var(--pl-color-ring);
      outline-offset: calc(var(--pl-ring-width) * -1);
    }

    @media (forced-colors: active) {
      .handle:focus-visible {
        outline-color: Highlight;
      }
    }

    /* Shown on hover and while the row has focus; a touch screen has no
       hover, so there it is always shown. */
    :host(:focus-within) .handle,
    :host([data-dragging]) .handle {
      opacity: 1;
    }

    @media (hover: hover) {
      :host(:hover) .handle {
        opacity: 1;
      }
    }

    @media (pointer: coarse), (hover: none) {
      .handle {
        opacity: 1;
      }
    }

    /* The hit area reaches the minimum size toward the label. */
    .handle::before {
      content: "";
      position: absolute;
      inset-block: 0;
      inset-inline: min(0px, calc(100% - var(--pl-size-hit-min))) 0;
    }

    @media (prefers-reduced-motion: reduce) {
      .handle {
        transition: none;
      }
    }

    .handle svg {
      inline-size: var(--pl-icon-md);
      block-size: var(--pl-icon-md);
    }

    :host([data-dragging]) {
      z-index: 2;
      box-shadow: var(--pl-elevation-panel);
      border-radius: var(--pl-radius-row);
      background: var(--pl-material-sidebar);
    }

    :host([data-dragging]) .handle {
      cursor: grabbing;
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

    /* By default the chevron follows the label and the detail, so the icons
       and labels of group and plain rows share their edges. With
       chevron="start" the leading column above stays. Beside a link, the
       disclosure button takes the trailing end and the link leaves room. */
    :host(:not([chevron="start"])) {
      --_chev-w: calc(
        var(--pl-icon-md) + var(--pl-space-1) + var(--pl-pad-item)
      );
    }

    :host(:not([chevron="start"])[expandable][href]:not([action])) {
      --_chev-w: max(
        var(--pl-size-hit-min),
        calc(var(--pl-icon-md) + var(--pl-space-1) + var(--pl-pad-item))
      );
    }

    :host(:not([chevron="start"])) .control,
    :host(:not([chevron="start"])) .disclosure {
      grid-template-columns: auto minmax(0, 1fr) auto auto;
    }

    :host(:not([chevron="start"])) .icon {
      grid-column: 1;
    }

    :host(:not([chevron="start"])) .label {
      grid-column: 2;
    }

    :host(:not([chevron="start"])) ::slotted([slot="detail"]) {
      grid-column: 3;
    }

    :host(:not([chevron="start"])) .control > .chevron {
      grid-column: 4;
      margin-inline-start: var(--pl-space-1);
    }

    :host(:not([chevron="start"])[expandable][href]:not([action])) .control {
      padding-inline-end: calc(var(--pl-pad-item) + var(--_chev-w));
    }

    :host(:not([chevron="start"])) .disclosure {
      inset-inline: auto 0;
      inline-size: var(--_chev-w);
      justify-content: flex-end;
      padding-inline: 0 var(--pl-pad-item);
    }

    /* The grip stays clear of the chevron. */
    :host(:not([chevron="start"])[expandable]) .handle {
      inset-inline-end: var(--_chev-w);
    }

    /* Where the grip is always shown, its width is reserved in the row, so it
       never covers the label, its ellipsis or the detail. */
    @media (pointer: coarse), (hover: none) {
      :host([reorderable]) .label,
      :host([reorderable]) ::slotted([slot="detail"]),
      :host([reorderable]:dir(rtl)) .label,
      :host([reorderable]:dir(rtl)) ::slotted([slot="detail"]) {
        mask-image: none;
      }

      :host([reorderable]) .control {
        padding-inline-end: calc(var(--pl-pad-item) + var(--_grip));
      }

      :host(
          :not([chevron="start"])[reorderable][expandable][href]:not([action])
        )
        .control {
        padding-inline-end: calc(
          var(--pl-pad-item) + var(--_chev-w) + var(--_grip)
        );
      }

      :host(:not([chevron="start"])[reorderable][expandable]:not([href]))
        .control
        > .chevron {
        margin-inline-start: calc(var(--pl-space-1) + var(--_grip));
      }

      :host(:not([chevron="start"])[reorderable][expandable]:not([href]))
        .control {
        padding-inline-end: var(--pl-pad-item);
      }
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
