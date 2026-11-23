import { css } from "lit";

/*
 * The group is a flex box. A panel grows in proportion to its `--_s` (its size
 * in percent, written by the panel from the group's layout) from a basis of
 * zero, so the sizes share what the dividers leave. A collapsed panel is gone
 * and the rest fill its space.
 */
export const resizableStyles = css`
  :host {
    display: flex;
    flex-direction: row;
    min-inline-size: 0;
    min-block-size: 0;
  }

  :host([hidden]) {
    display: none;
  }

  :host([orientation="vertical"]) {
    flex-direction: column;
  }
`;

export const panelStyles = css`
  :host {
    --_s: 1;

    display: block;
    flex: var(--_s) 1 0%;
    box-sizing: border-box;
    min-inline-size: 0;
    min-block-size: 0;
    overflow: auto;
  }

  :host([hidden]),
  :host([collapsed]) {
    display: none;
  }
`;

/*
 * The divider is a thin line (HIG's preferred divider), drawn by ::before. The
 * host is the hit region: at least as large as the other controls' hit region,
 * centered on the line, with negative margins so that it takes only the line's
 * width in the layout. The region lies over the panels beside it and, being
 * the box itself, adds nothing to the scrollable overflow.
 */
export const handleStyles = css`
  :host {
    --_line: 1px;
    --_color: var(--pl-color-border);

    position: relative;
    z-index: 1;
    flex: none;
    align-self: stretch;
    box-sizing: border-box;
    inline-size: var(--pl-size-hit-min);
    margin-inline: calc((var(--_line) - var(--pl-size-hit-min)) / 2);
    cursor: col-resize;
    touch-action: none;
    user-select: none;
  }

  :host([hidden]) {
    display: none;
  }

  :host([orientation="vertical"]) {
    align-self: auto;
    inline-size: auto;
    block-size: var(--pl-size-hit-min);
    margin-inline: 0;
    margin-block: calc((var(--_line) - var(--pl-size-hit-min)) / 2);
    cursor: row-resize;
  }

  :host::before {
    content: "";
    position: absolute;
    inset-block: 0;
    inset-inline: calc(50% - var(--_line) / 2);
    background-color: var(--_color);
    transition: background-color var(--pl-duration-fast) var(--pl-ease-out);
  }

  :host([orientation="vertical"])::before {
    inset-block: calc(50% - var(--_line) / 2);
    inset-inline: 0;
  }

  :host(:hover) {
    --_color: var(--pl-color-input-border);
  }

  :host(:state(dragging)) {
    --_color: var(--pl-color-selected);
  }

  :host([disabled]) {
    --_color: var(--pl-color-foreground-faint);

    cursor: default;
  }

  :host(:focus-visible) {
    outline: none;
  }

  :host(:focus-visible)::before {
    outline: var(--pl-ring-width) solid var(--pl-color-ring);
    outline-offset: var(--pl-ring-offset);
  }

  @media (prefers-reduced-motion: reduce) {
    :host::before {
      transition: none;
    }
  }

  @media (forced-colors: active) {
    :host {
      --_color: ButtonText;
    }

    :host::before {
      forced-color-adjust: none;
      transition: none;
    }

    :host(:state(dragging)),
    :host(:focus-visible) {
      --_color: Highlight;
    }

    :host([disabled]) {
      --_color: GrayText;
    }

    :host(:focus-visible)::before {
      outline-color: Highlight;
    }
  }
`;
