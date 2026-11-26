import { css } from "lit";

/*
 * A row of controls with compact ellipses marking omitted pages. The
 * current page takes the selected fill, as a selected toggle group item does.
 * Under a coarse pointer the size tokens already reach the touch minimum.
 */
export const paginationStyles = css`
  :host {
    --_size: max(var(--pl-size-md), var(--pl-size-hit-min));

    display: block;
    background: var(--pl-material-capsule-strong);
    backdrop-filter: var(--pl-lens,) var(--pl-material-bar-filter);
    box-shadow: var(--pl-material-edge);
    color: var(--pl-color-foreground);
    font: 400 var(--pl-text-sm) / var(--pl-leading-normal) var(--pl-font-sans);
    font-variant-numeric: tabular-nums;
  }

  :host([hidden]) {
    display: none;
  }

  ul {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--pl-space-1);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li {
    display: flex;
  }

  @media (pointer: coarse) {
    ul {
      column-gap: var(--pl-space-0-5);
    }
  }

  .control {
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-inline-size: var(--_size);
    min-block-size: var(--_size);
    padding: var(--pl-space-1) var(--pl-space-2);
    border: 0;
    border-radius: var(--pl-radius-control);
    background-color: transparent;
    color: inherit;
    font: inherit;
    font-variant-numeric: inherit;
    text-decoration: none;
    cursor: var(--pl-cursor-interactive);
    user-select: none;
    transition: background-color var(--pl-duration-fast) var(--pl-ease-out);
  }

  .gap {
    color: var(--pl-color-muted-foreground);
    user-select: none;
  }

  .control svg {
    flex: none;
    inline-size: var(--pl-icon-md);
    block-size: var(--pl-icon-md);
  }

  /* The arrows point left and right; the row reads the other way in RTL. */
  :host(:dir(rtl)) .control svg {
    transform: scaleX(-1);
  }

  @media (hover: hover) {
    .control:not(
        :disabled,
        [aria-disabled="true"],
        [aria-current="page"]
      ):hover {
      background-color: var(--pl-color-muted-3);
    }
  }

  .control:not(
      :disabled,
      [aria-disabled="true"],
      [aria-current="page"]
    ):active {
    background-color: var(--pl-color-muted-pressed);
  }

  .control:focus-visible {
    outline: var(--pl-ring-width) solid var(--pl-color-ring);
    outline-offset: var(--pl-ring-offset);
  }

  .control:is(:disabled, [aria-disabled="true"]) {
    cursor: var(--pl-cursor-disabled);
    color: var(--pl-color-disabled-foreground);
  }

  .control[aria-current="page"] {
    background-color: color-mix(
      in srgb,
      var(--pl-color-selected) 97%,
      var(--pl-color-shade)
    );
    box-shadow: var(--pl-boundary);
    color: var(--pl-color-selected-foreground);
  }

  /* System colors replace ours: the current page paints Highlight. */
  @media (forced-colors: active) {
    .control {
      transition: none;
    }

    .control:focus-visible {
      outline-color: Highlight;
    }

    .control:is(:disabled, [aria-disabled="true"]) {
      color: GrayText;
    }

    .control[aria-current="page"] {
      forced-color-adjust: none;
      background-color: Highlight;
      color: HighlightText;
    }
  }
`;
