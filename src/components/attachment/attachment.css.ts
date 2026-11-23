import { css } from "lit";

/*
 * A solid card with a hairline edge. With an href or clickable, the trigger's
 * ::after covers the whole card, so a click anywhere uses it; the actions sit
 * above that cover and stay separate controls. While uploading or processing a
 * moving mask dims a band across the title; under reduced motion it is gone.
 * The error state takes the destructive edge and text, and the reason stays
 * in the description.
 */
export const attachmentStyles = css`
  :host {
    --_media: calc(var(--pl-spacing) * 10);
    --_icon: var(--pl-icon-lg);
    --_pad: var(--pl-space-3);
    --_tone: var(--pl-color-foreground);
    --_detail: var(--pl-color-muted-foreground);

    position: relative;
    display: flex;
    align-items: center;
    gap: var(--pl-space-3);
    box-sizing: border-box;
    min-inline-size: 0;
    padding: var(--_pad);
    background: var(--pl-color-background);
    backdrop-filter: none;
    border: 1px solid var(--pl-color-border);
    border-radius: var(--pl-radius-lg);
    color: var(--pl-color-foreground);
    font: 400 var(--pl-text-sm) / var(--pl-leading-normal) var(--pl-font-sans);
    transition: background-color var(--pl-duration-fast) var(--pl-ease-out);
  }

  :host([hidden]) {
    display: none;
  }

  :host([size="sm"]) {
    --_media: calc(var(--pl-spacing) * 8);
    --_icon: var(--pl-icon-md);
    --_pad: var(--pl-space-2);
  }

  :host([size="xs"]) {
    --_media: calc(var(--pl-spacing) * 6);
    --_icon: var(--pl-icon-sm);
    --_pad: var(--pl-space-1-5);

    gap: var(--pl-space-2);
    font-size: var(--pl-text-xs);
  }

  /* A card that is a target is at least the minimum target tall. */
  :host([href]),
  :host([clickable]) {
    min-block-size: var(--pl-touch-min);
  }

  :host([orientation="vertical"]) {
    flex-direction: column;
    align-items: stretch;
  }

  :host([state="error"]) {
    --_tone: var(--pl-color-destructive-text);
    --_detail: var(--pl-color-destructive-text);

    border-color: var(--pl-color-destructive);
  }

  [hidden] {
    display: none !important;
  }

  /* The media tile: an icon centered on a quiet fill, or an image filling it. */
  [part="media"] {
    display: grid;
    flex: none;
    place-items: center;
    box-sizing: border-box;
    inline-size: var(--_media);
    block-size: var(--_media);
    overflow: hidden;
    border-radius: var(--pl-radius);
    background: var(--pl-color-muted-1);
    color: var(--_detail);
  }

  :host([orientation="vertical"]) [part="media"] {
    inline-size: 100%;
    block-size: auto;
    aspect-ratio: 16 / 9;
  }

  ::slotted([slot="media"]) {
    display: block;
    flex: none;
    inline-size: var(--_icon);
    block-size: var(--_icon);
  }

  /* Positioned, so the image fills a tile sized by aspect-ratio in every
     engine; a percentage height does not resolve against it in Firefox. */
  :host([media="image"]) [part="media"] {
    position: relative;
  }

  :host([media="image"]) ::slotted([slot="media"]) {
    position: absolute;
    inset: 0;
    inline-size: 100%;
    block-size: 100%;
    object-fit: cover;
  }

  [part="text"] {
    flex: 1;
    min-inline-size: 0;
    overflow-wrap: anywhere;
  }

  [part="trigger"],
  [part="label"] {
    display: block;
    color: var(--_tone);
    font-weight: 700;
    text-decoration: none;
  }

  button[part="trigger"] {
    box-sizing: border-box;
    inline-size: 100%;
    margin: 0;
    padding: 0;
    border: 0;
    background: none;
    font: inherit;
    font-weight: 700;
    text-align: start;
    cursor: default;
  }

  [part="title"] {
    display: block;
  }

  ::slotted([slot="title"]),
  ::slotted([slot="description"]) {
    display: block;
    margin: 0;
    font: inherit;
  }

  slot[name="description"] {
    display: block;
    color: var(--_detail);
  }

  /* Heard, not seen: it adds the state to the name. It keeps its natural size so nothing overflows. */
  [part="status"] {
    position: absolute;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  :host([state="uploading"]) [part="title"],
  :host([state="processing"]) [part="title"] {
    mask-image: linear-gradient(
      to right,
      CanvasText 30%,
      color-mix(in srgb, CanvasText 35%, transparent) 50%,
      CanvasText 70%
    );
    mask-repeat: no-repeat;
    mask-size: 300% 100%;
    animation: pl-attachment-shimmer calc(var(--pl-duration-slow) * 5) linear
      infinite;
  }

  :host([state="uploading"]:dir(rtl)) [part="title"],
  :host([state="processing"]:dir(rtl)) [part="title"] {
    animation-direction: reverse;
  }

  @keyframes pl-attachment-shimmer {
    from {
      mask-position: 100% 0;
    }

    to {
      mask-position: 0 0;
    }
  }

  /* Within the padding box: past it, Firefox counts the area as overflow. */
  [part="trigger"]::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
  }

  [part="trigger"]:focus-visible {
    outline: none;
  }

  [part="trigger"]:focus-visible::after {
    outline: var(--pl-ring-width) solid var(--pl-color-ring);
    outline-offset: calc(var(--pl-ring-width) * -1);
  }

  [part="actions"] {
    position: relative;
    display: flex;
    flex: none;
    align-items: center;
    gap: var(--pl-gap-controls);
  }

  :host([orientation="vertical"]) [part="actions"] {
    align-self: flex-end;
  }

  @media (hover: hover) {
    :host([href]:hover),
    :host([clickable]:hover) {
      background: var(--pl-color-muted-1);
    }
  }

  :host([href]:active),
  :host([clickable]:active) {
    background: var(--pl-color-muted-pressed);
  }

  @media (prefers-reduced-motion: reduce) {
    :host([state="uploading"]) [part="title"],
    :host([state="processing"]) [part="title"] {
      mask-image: none;
      animation: none;
    }
  }

  @media (forced-colors: active) {
    :host {
      border-color: CanvasText;
    }

    :host([state="error"]) {
      border-style: dashed;
    }

    :host([state="uploading"]) [part="title"],
    :host([state="processing"]) [part="title"] {
      mask-image: none;
      animation: none;
    }

    [part="media"] {
      border: 1px solid CanvasText;
    }

    [part="trigger"]:focus-visible::after {
      outline-color: Highlight;
    }
  }
`;

/*
 * The host is the scroller. Cards snap to the start edge, and a mask fades each
 * edge that has more to scroll to. The mask is only decoration.
 */
export const attachmentGroupStyles = css`
  :host {
    --_fade-left: 0px;
    --_fade-right: 0px;

    display: flex;
    gap: var(--pl-space-2);
    box-sizing: border-box;
    overflow-x: auto;
    overflow-y: hidden;
    overscroll-behavior-x: contain;
    scroll-snap-type: x proximity;
    scrollbar-width: thin;
    scrollbar-color: var(--pl-color-thumb) var(--pl-color-track);
    scroll-padding-inline: var(--pl-space-8);
    border-radius: var(--pl-radius-lg);
    mask-image: linear-gradient(
      to right,
      transparent,
      CanvasText var(--_fade-left),
      CanvasText calc(100% - var(--_fade-right)),
      transparent
    );
  }

  :host([hidden]) {
    display: none;
  }

  :host(:not([data-more-left]):not([data-more-right])) {
    mask-image: none;
  }

  :host([data-more-left]) {
    --_fade-left: var(--pl-space-8);
  }

  :host([data-more-right]) {
    --_fade-right: var(--pl-space-8);
  }

  :host(:focus-visible) {
    outline: var(--pl-ring-width) solid var(--pl-color-ring);
    outline-offset: calc(var(--pl-ring-width) * -1);
    mask-image: none;
  }

  ::slotted(*) {
    flex: none;
    scroll-snap-align: start;
    inline-size: calc(var(--pl-spacing) * 60);
    max-inline-size: 100%;
  }

  ::slotted(pl-attachment[orientation="vertical"]) {
    inline-size: calc(var(--pl-spacing) * 40);
  }

  ::slotted(pl-attachment[size="xs"]) {
    inline-size: auto;
    max-inline-size: calc(var(--pl-spacing) * 60);
  }

  @media (prefers-contrast: more) {
    :host {
      scrollbar-color: var(--pl-color-input-border) var(--pl-color-track);
    }
  }

  @media (forced-colors: active) {
    :host {
      scrollbar-color: auto;
      mask-image: none;
    }

    :host(:focus-visible) {
      outline-color: Highlight;
    }
  }
`;
