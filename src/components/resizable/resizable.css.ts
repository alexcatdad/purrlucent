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
 * The divider is a thin line (HIG's preferred divider). Its hit region is a
 * larger strip centered on the line, drawn by ::before over the panels beside
 * it, at least as large as the other controls' hit region.
 */
export const handleStyles = css`
  :host {
    --_line: 1px;

    position: relative;
    z-index: 1;
    flex: none;
    align-self: stretch;
    inline-size: var(--_line);
    background-color: var(--pl-color-border);
    cursor: col-resize;
    touch-action: none;
    user-select: none;
    transition: background-color var(--pl-duration-fast) var(--pl-ease-out);
  }

  :host([hidden]) {
    display: none;
  }

  :host([orientation="vertical"]) {
    align-self: auto;
    inline-size: auto;
    block-size: var(--_line);
    cursor: row-resize;
  }

  :host::before {
    content: "";
    position: absolute;
    inset-block: 0;
    inset-inline: calc(var(--pl-size-hit-min) / -2);
  }

  :host([orientation="vertical"])::before {
    inset-block: calc(var(--pl-size-hit-min) / -2);
    inset-inline: 0;
  }

  :host(:hover) {
    background-color: var(--pl-color-input-border);
  }

  :host(:state(dragging)) {
    background-color: var(--pl-color-selected);
  }

  :host([disabled]) {
    background-color: var(--pl-color-foreground-faint);
    cursor: default;
  }

  :host(:focus-visible) {
    outline: var(--pl-ring-width) solid var(--pl-color-ring);
    outline-offset: var(--pl-ring-offset);
  }

  @media (prefers-reduced-motion: reduce) {
    :host {
      transition: none;
    }
  }

  @media (forced-colors: active) {
    :host {
      background: ButtonText;
      forced-color-adjust: none;
      transition: none;
    }

    :host(:state(dragging)),
    :host(:focus-visible) {
      background: Highlight;
    }

    :host([disabled]) {
      background: GrayText;
    }

    :host(:focus-visible) {
      outline-color: Highlight;
    }
  }
`;
