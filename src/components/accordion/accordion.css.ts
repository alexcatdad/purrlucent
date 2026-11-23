import { css } from "lit";

/* The accordion is a stack with a hairline above and below; each item adds
   the line between itself and the next. */
export const accordionStyles = css`
  :host {
    display: block;
    border-block: 1px solid var(--pl-color-border);
    color: var(--pl-color-foreground);
    font: 400 var(--pl-text-base) / var(--pl-leading-normal) var(--pl-font-sans);
  }

  :host([hidden]) {
    display: none;
  }

  @media (forced-colors: active) {
    :host {
      border-color: CanvasText;
    }
  }
`;

export const itemStyles = css`
  :host {
    display: block;
  }

  :host([hidden]) {
    display: none;
  }

  :host(:not(:last-child)) {
    border-block-end: 1px solid var(--pl-color-border);
  }

  .heading {
    margin: 0;
  }

  /* The button spans the row. The ring sits inside it so nothing clips it. */
  .trigger {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    gap: var(--pl-gap-icon);
    inline-size: 100%;
    min-block-size: max(var(--pl-size-lg), var(--pl-size-hit-min));
    margin: 0;
    padding: var(--pl-space-1) var(--pl-pad-panel);
    border: 0;
    background-color: transparent;
    color: inherit;
    font: inherit;
    text-align: start;
    cursor: default;
    transition: background-color var(--pl-duration-fast) var(--pl-ease-out);
  }

  @media (hover: hover) {
    .trigger:hover:not(:disabled) {
      background-color: var(--pl-color-muted-3);
    }
  }

  .trigger:active:not(:disabled) {
    background-color: var(--pl-color-muted-pressed);
  }

  .trigger:focus-visible {
    outline: var(--pl-ring-width) solid var(--pl-color-ring);
    outline-offset: calc(var(--pl-ring-width) * -1);
  }

  .trigger:disabled {
    color: var(--pl-color-disabled-foreground);
  }

  .label {
    min-inline-size: 0;
    overflow-wrap: anywhere;
  }

  /* Points inline-end when closed, mirrored in RTL, and turns down when open. */
  .chevron {
    flex: none;
    inline-size: var(--pl-icon-md);
    block-size: var(--pl-icon-md);
    color: var(--pl-color-muted-foreground);
    transition: transform var(--pl-duration) var(--pl-ease-out);
  }

  :host([open]) .chevron {
    transform: rotate(90deg);
  }

  :host(:dir(rtl)) .chevron {
    transform: scaleX(-1);
  }

  :host(:dir(rtl)[open]) .chevron {
    transform: scaleX(-1) rotate(90deg);
  }

  /* The panel grows from zero height. Hidden visibility keeps a closed
     panel out of the tab order and the accessibility tree once it is shut. */
  .panel {
    display: grid;
    grid-template-rows: 0fr;
    visibility: hidden;
    transition:
      grid-template-rows var(--pl-duration) var(--pl-ease-out),
      visibility var(--pl-duration);
  }

  :host([open]) .panel {
    grid-template-rows: 1fr;
    visibility: visible;
  }

  .inner {
    min-block-size: 0;
    overflow: hidden;
  }

  /* The content lines up with the button text, past the arrow. */
  .content {
    padding-block: 0 var(--pl-pad-panel);
    padding-inline: calc(
        var(--pl-pad-panel) + var(--pl-icon-md) + var(--pl-gap-icon)
      )
      var(--pl-pad-panel);
  }

  @media (prefers-reduced-motion: reduce) {
    .chevron,
    .panel {
      transition: none;
    }
  }

  /* System colors replace ours; the ring keeps a solid style, and nothing fades. */
  @media (forced-colors: active) {
    .trigger,
    .chevron,
    .panel {
      transition: none;
    }

    :host(:not(:last-child)) {
      border-color: CanvasText;
    }

    .trigger:focus-visible {
      outline-color: Highlight;
    }

    .trigger:disabled {
      color: GrayText;
    }
  }
`;
