import { css } from "lit";

/*
 * The bar is as tall as --_bar and centers its controls, extra-large ones
 * unless size="md". The group, separator and title inherit the private
 * metrics below.
 */
export const toolbarStyles = css`
  :host {
    --_ctl: var(--pl-size-xl);
    --_bar: var(--pl-size-bar);
    --_bar-face: var(--pl-visual-lg);
    --_rule: calc(var(--pl-spacing) * 5.5);
    --_stack: column;
    --_stack-align: flex-start;
    --_stack-gap: var(--pl-space-0-5);

    position: relative;
    min-block-size: var(--_bar);
    padding: calc((var(--_bar) - var(--_ctl)) / 2) var(--pl-space-3);
    font: 400 var(--pl-text-sm) / var(--pl-leading-normal) var(--pl-font-sans);
  }

  :host([size="md"]) {
    --_ctl: var(--pl-size-md);
    --_bar: max(
      calc(var(--pl-spacing) * 10),
      calc(var(--pl-size-md) + var(--pl-space-4))
    );
    --_bar-face: var(--pl-icon-lg);
    --_rule: var(--pl-icon-md);
    --_stack: row;
    --_stack-align: baseline;
    --_stack-gap: var(--pl-gap-icon);
  }

  /* A search field takes the capsule material of the group beside it. */
  ::slotted(pl-input[type="search"]) {
    --pl-color-input: var(--pl-color-overlay);
    --pl-color-input-border: var(--pl-color-overlay-border);

    inline-size: calc(var(--pl-spacing) * 39.75);
  }

  :host([size="md"]) ::slotted(pl-input[type="search"]) {
    inline-size: calc(var(--pl-spacing) * 37.25);
  }

  [part="items"] {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--pl-gap-controls);
  }

  /* The one emphasized item sits at the trailing end. */
  ::slotted([variant="primary"]) {
    margin-inline-start: auto;
  }

  /* Scroll edge: content scrolled beneath the bar fades out past its content-facing edge. */
  :host([scrolled])::after {
    content: "";
    position: absolute;
    inset-inline: 0;
    inset-block-start: 100%;
    block-size: var(--pl-space-2);
    background: linear-gradient(var(--pl-material-bar), transparent);
    pointer-events: none;
  }

  /* Increased contrast already draws the control-boundary edge. */
  @media (prefers-reduced-transparency: reduce) and (not (prefers-contrast: more)) {
    :host([scrolled]) {
      box-shadow: inset 0 -1px 0 var(--pl-color-border);
    }
  }

  @media (prefers-reduced-transparency: reduce), (forced-colors: active) {
    :host([scrolled])::after {
      display: none;
    }
  }
`;

/* A 1px rule that cancels the gap on both sides, so the neighbors stay put. */
export const toolbarSeparatorStyles = css`
  :host {
    flex: none;
    inline-size: 1px;
    block-size: var(--_rule);
    margin-inline: calc((var(--pl-gap-controls) + 1px) / -2);
    background: var(--pl-color-muted-3);
  }

  @media (forced-colors: active) {
    :host {
      background: ButtonBorder;
    }
  }
`;

/* Takes the free space, so the items after it sit at the trailing edge. */
export const toolbarSpacerStyles = css`
  :host {
    flex: 1;
  }
`;

/* The title shrinks, up to half the bar, and ends in an ellipsis. */
export const toolbarTitleStyles = css`
  :host {
    flex: 0 1 auto;
    min-inline-size: 0;
    max-inline-size: 50%;
    white-space: nowrap;
  }

  [part="stack"] {
    display: flex;
    min-inline-size: 0;
    flex-direction: var(--_stack);
    align-items: var(--_stack-align);
    gap: var(--_stack-gap);
  }

  /* The padding keeps descenders inside the clip box; the margin takes it back. */
  [part="title"] {
    --_clip: var(--pl-space-1);

    flex-shrink: 0;
    min-inline-size: 0;
    max-inline-size: 100%;
    padding-block: var(--_clip);
    margin-block: calc(var(--_clip) * -1);
    overflow: hidden;
    text-overflow: ellipsis;
    font: 700 var(--pl-text-lg) / var(--pl-text-lg) var(--pl-font-sans);
  }

  /* Primary label color: the subtitle sits over scrolling content, where the
     muted tone cannot hold 4.5:1. Size and weight carry the hierarchy. */
  [part="subtitle"] {
    min-inline-size: 0;
    max-inline-size: 100%;
    overflow: hidden;
    color: var(--pl-color-foreground);
    font: 400 var(--pl-text-xs) / var(--pl-leading-tight) var(--pl-font-sans);
  }

  /* A block box reports its own width in every engine; an inline one does not. */
  ::slotted([slot="subtitle"]) {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  [part="subtitle"][hidden] {
    display: none;
  }
`;

/**
 * Related icon buttons in one raised container. Each round face is at least
 * as large as the hit minimum, and the padding centers it in an extra-large
 * control height. The space between faces belongs to the hit regions, so
 * there is no dead space between neighbors.
 */
export const toolbarGroupStyles = css`
  :host {
    --_tool: max(var(--_bar-face), var(--pl-size-hit-min));
    --_pad: calc((var(--_ctl) - var(--_tool)) / 2);
    --_gap: calc(var(--pl-gap-controls) / 2);

    display: inline-flex;
    align-items: center;
    box-sizing: border-box;
    min-block-size: var(--_ctl);
    padding: var(--_pad) max(0px, calc(var(--_pad) - var(--_gap)));
    border-radius: var(--pl-radius);
    background-color: var(--pl-color-overlay);
    box-shadow: 0 0 0 1px var(--pl-color-overlay-border);
  }

  ::slotted(*) {
    --pl-face: transparent;
    --pl-face-hover: var(--pl-color-muted-3);
    --pl-face-pressed: var(--pl-color-muted-1);
    --pl-face-inset: 0 var(--_gap);

    inline-size: calc(var(--_tool) + 2 * var(--_gap));
    min-block-size: var(--_tool);
    padding: 0;
    border-radius: var(--pl-radius-full);
    color: var(--pl-color-foreground);
  }

  /* The hit regions of the neighbors already touch it, so it takes no gap. */
  ::slotted(pl-toolbar-separator) {
    inline-size: 1px;
    min-block-size: 0;
    margin-inline: 0;
    border-radius: 0;
  }

  ::slotted([disabled]) {
    color: var(--pl-color-disabled-foreground);
  }

  @media (forced-colors: active) {
    /* The item's own forced-colors face and border take over. */
    ::slotted(*) {
      --pl-face: ButtonFace;
      --pl-face-hover: ButtonFace;
      --pl-face-pressed: ButtonFace;

      color: ButtonText;
    }

    ::slotted([disabled]) {
      color: GrayText;
    }
  }
`;
