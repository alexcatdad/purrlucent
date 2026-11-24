import { css } from "lit";

/*
 * The panel is a one-row grid: the row grows from 0fr to 1fr, so the height
 * animates without measuring the content. `visibility` flips after the close
 * finishes, which keeps the hidden content out of the tab order and the
 * accessibility tree.
 */
export const collapsibleStyles = css`
  :host {
    display: block;
    color: var(--pl-color-foreground);
    font: 400 var(--pl-text-sm) / var(--pl-leading-normal) var(--pl-font-sans);
  }

  :host([hidden]) {
    display: none;
  }

  .trigger {
    display: flex;
    align-items: center;
    gap: var(--pl-gap-icon);
    box-sizing: border-box;
    inline-size: 100%;
    min-block-size: var(--pl-size-hit-min);
    padding: var(--pl-space-1) var(--pl-pad-item);
    border: 0;
    border-radius: var(--pl-radius-control);
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

  /* A slotted trigger brings its own look: the wrapper only carries the current fill. */
  .head {
    border-radius: var(--pl-radius-control);
  }

  :host([current]) .trigger,
  :host([current]) .head {
    background-color: var(--pl-color-muted-3);
  }

  :host([current]) .trigger:active:not(:disabled) {
    background-color: var(--pl-color-muted-pressed);
  }

  .trigger:disabled,
  .trigger:disabled .chevron {
    color: var(--pl-color-disabled-foreground);
  }

  .trigger:focus-visible {
    outline: var(--pl-ring-width) solid var(--pl-color-ring);
    outline-offset: var(--pl-ring-offset);
  }

  /* Points inline-end, mirrored in RTL, and turns toward block-end when open. */
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

  .panel {
    display: grid;
    grid-template-rows: 0fr;
    visibility: hidden;
    transition:
      grid-template-rows var(--pl-duration) var(--pl-ease-out),
      visibility 0s linear var(--pl-duration);
  }

  :host([open]) .panel {
    grid-template-rows: 1fr;
    visibility: visible;
    transition-delay: 0s;
  }

  .clip {
    min-block-size: 0;
    overflow: hidden;
  }

  /* The content lines up with the label, past the chevron. */
  .content {
    padding-block: var(--pl-space-1);
    padding-inline: calc(
        var(--pl-pad-item) + var(--pl-icon-md) + var(--pl-gap-icon)
      )
      var(--pl-pad-item);
  }

  @media (prefers-reduced-motion: reduce) {
    .panel,
    .chevron {
      transition: none;
    }
  }

  /* System colors replace ours; nothing fades and the ring stays solid. */
  @media (forced-colors: active) {
    .trigger,
    .chevron {
      transition: none;
    }

    .chevron {
      color: ButtonText;
    }

    .trigger:disabled,
    .trigger:disabled .chevron {
      color: GrayText;
    }

    :host([current]) .trigger,
    :host([current]) .trigger:active:not(:disabled),
    :host([current]) .head {
      background-color: Highlight;
      color: HighlightText;
    }

    :host([current]) .trigger {
      forced-color-adjust: none;
    }

    :host([current]) .chevron {
      color: inherit;
    }

    .trigger:focus-visible {
      outline-color: Highlight;
    }
  }
`;
