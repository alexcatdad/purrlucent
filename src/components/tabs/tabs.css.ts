import { css } from "lit";

/*
 * The tab list and the panels sit side by side when vertical, stacked when
 * horizontal. The list keeps a hairline on the edge it shares with the panels.
 */
export const tabsStyles = css`
  :host {
    display: flex;
    flex-direction: column;
    color: var(--pl-color-foreground);
    font: 400 var(--pl-text-sm) / var(--pl-leading-normal) var(--pl-font-sans);
  }

  :host([hidden]) {
    display: none;
  }

  :host([orientation="vertical"]) {
    flex-direction: row;
  }

  /* The indicator's edge, read by the tabs through inheritance. */
  [part="list"] {
    --_ind-block: auto 0;
    --_ind-inline: 0;
    --_ind-block-size: var(--pl-ring-width);
    --_ind-inline-size: auto;

    display: flex;
    flex: none;
    gap: var(--pl-space-1);
    overflow: auto;
    border-block-end: 1px solid var(--pl-color-border);
    background: var(--pl-material-capsule-strong);
    backdrop-filter: var(--pl-lens,) var(--pl-material-bar-filter);
    box-shadow: var(--pl-material-edge);
  }

  :host([orientation="vertical"]) [part="list"] {
    --_ind-block: 0;
    --_ind-inline: auto 0;
    --_ind-block-size: auto;
    --_ind-inline-size: var(--pl-ring-width);

    flex-direction: column;
    border-block-end: 0;
    border-inline-end: 1px solid var(--pl-color-border);
  }

  /* Segmented: a capsule as wide as its tabs on the strong control material,
     which keeps grey text at 4.5:1 on glass, with the selected tab a raised
     pill inside it. The tabs read the pill and the radius from here. */
  :host([variant="segmented"]) [part="list"] {
    --_ind-block-size: 0px;
    --_ind-inline-size: 0px;
    --_tab-radius: var(--pl-radius-control-inner);
    --_tab-selected-text: var(--pl-color-foreground);
    --_pill: light-dark(var(--pl-color-raised), var(--pl-color-muted-pressed));
    --_pill-shadow: 0 calc(var(--pl-spacing) / 4) var(--pl-spacing)
      color-mix(in srgb, var(--pl-color-shade) 20%, transparent);
    --_fade: calc(var(--pl-spacing) * 6);
    --_fade-dir: to right;
    --_fade-start: 0px;
    --_fade-end: 0px;

    align-self: flex-start;
    max-inline-size: 100%;
    box-sizing: border-box;
    gap: 0;
    padding: var(--pl-space-0-5);
    border: 0;
    border-radius: var(--pl-radius-control);
    background: var(--pl-material-control-strong);
    backdrop-filter: var(--pl-lens,) var(--pl-material-control-filter);
    box-shadow: var(--pl-material-edge);
    overscroll-behavior-inline: contain;
    scrollbar-width: thin;
    scrollbar-color: var(--pl-color-thumb) var(--pl-color-track);

    /* An edge with more tabs past it fades, as in toggle-group's fit-content. */
    mask-image: linear-gradient(
      var(--_fade-dir),
      transparent,
      Canvas var(--_fade-start),
      Canvas calc(100% - var(--_fade-end)),
      transparent
    );
  }

  :host([variant="segmented"]:dir(rtl)) [part="list"] {
    --_fade-dir: to left;
  }

  :host([variant="segmented"]) [part="list"][data-scrollable~="start"] {
    --_fade-start: var(--_fade);
  }

  :host([variant="segmented"]) [part="list"][data-scrollable~="end"] {
    --_fade-end: var(--_fade);
  }

  :host([hide-scrollbar]) [part="list"] {
    scrollbar-width: none;
  }

  :host([hide-scrollbar]) [part="list"]::-webkit-scrollbar {
    display: none;
  }

  [part="panels"] {
    flex: 1;
    min-inline-size: 0;
  }

  /* Stable height: the panels share one cell, so the tallest sets its size. */
  :host([stable-height]) [part="panels"] {
    display: grid;
  }

  :host([stable-height]) ::slotted(pl-tab-panel) {
    grid-area: 1 / 1;
    min-inline-size: 0;
  }

  :host([stable-height]) ::slotted(pl-tab-panel[inert]) {
    visibility: hidden;
  }

  /* Increased contrast outlines the capsule instead of lighting its edge. */
  @media (prefers-contrast: more) {
    :host([variant="segmented"]) [part="list"] {
      box-shadow: var(--pl-boundary);
      scrollbar-color: var(--pl-color-input-border) var(--pl-color-track);
    }
  }

  @media (forced-colors: active) {
    [part="list"] {
      border-color: CanvasText;
    }

    :host([variant="segmented"]) [part="list"] {
      outline: 1px solid CanvasText;
      mask-image: none;
      scrollbar-color: auto;
    }
  }
`;

export const tabStyles = css`
  :host {
    --pl-face-inset: var(--pl-space-0-5);

    flex: none;
    gap: var(--pl-gap-icon);
    min-block-size: var(--pl-size-md);
    padding: var(--pl-space-1) var(--pl-pad-control);
    color: var(--pl-color-muted-foreground);
    cursor: var(--pl-cursor-interactive);
    user-select: none;
    white-space: nowrap;
  }

  :host::before {
    border-radius: var(--_tab-radius, var(--pl-radius-control));
  }

  /* The raised pill of a segmented list. */
  :host([selected]) {
    border-radius: var(--_tab-radius, 0);
    background-color: var(--_pill, transparent);
    box-shadow: var(--_pill-shadow, none);
  }

  [part="label"] {
    display: inline-flex;
    align-items: center;
    gap: var(--pl-gap-icon);
  }

  ::slotted(svg) {
    flex: none;
    inline-size: var(--pl-icon-md);
    block-size: var(--pl-icon-md);
  }

  /* The selected tab has an indicator on the edge it shares with the panels,
     as well as its color. */
  :host::after {
    content: "";
    position: absolute;
    inset-block: var(--_ind-block);
    inset-inline: var(--_ind-inline);
    block-size: var(--_ind-block-size);
    inline-size: var(--_ind-inline-size);
    background-color: currentcolor;
    opacity: 0;
    transition: opacity var(--pl-duration) var(--pl-ease-out);
  }

  :host([selected])::after {
    opacity: 1;
  }

  :host([selected]:not(:state(disabled))) {
    color: var(--_tab-selected-text, var(--pl-color-accent-text));
  }

  /* The ring sits inside the tab: the list clips anything outside. */
  :host(:focus-visible) {
    outline-offset: calc(var(--pl-ring-width) * -1);
  }

  @media (forced-colors: active) {
    :host::after {
      forced-color-adjust: none;
      background-color: Highlight;
      transition: none;
    }

    :host([selected]:not(:state(disabled))) {
      color: HighlightText;
      forced-color-adjust: none;
      background-color: Highlight;
      box-shadow: none;
    }

    :host([selected]:not(:state(disabled)))::after {
      background-color: HighlightText;
    }
  }
`;

export const panelStyles = css`
  :host {
    display: block;
    padding: var(--pl-pad-panel);
  }

  :host([hidden]) {
    display: none;
  }

  :host(:focus-visible) {
    outline: var(--pl-ring-width) solid var(--pl-color-ring);
    outline-offset: calc(var(--pl-ring-width) * -1);
  }

  @media (forced-colors: active) {
    :host(:focus-visible) {
      outline-color: Highlight;
    }
  }
`;
