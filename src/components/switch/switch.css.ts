import { css } from "lit";

/*
 * Each size sets the track width and height and the thumb inset; everything
 * else is calculated from them. The thumb is 4/3 as wide as the track is tall.
 * While pressed it grows about its own center, to 0.92 of the track width.
 * The track keeps its drawn size with a coarse pointer; the host, which is the
 * hit region, grows around it.
 */
export const switchStyles = css`
  :host {
    --_w: calc(var(--purr-spacing) * 13.5);
    --_h: var(--purr-visual-md);
    --_in: var(--purr-space-0-5);
    --_kh: calc(var(--_h) - var(--_in) * 2);
    --_kw: calc(var(--_h) * 4 / 3);
    --_grow: calc((var(--_w) * 0.92 - var(--_kw)) / 2);
    --_x: var(--_in);

    display: inline-flex;
    align-items: center;
    gap: var(--purr-gap-form);
    min-block-size: max(var(--_h), var(--purr-size-hit-min));
    color: var(--purr-color-foreground);
    font: 400 var(--purr-text-sm) / var(--purr-leading-normal)
      var(--purr-font-sans);
    cursor: default;
    user-select: none;
  }

  :host([hidden]) {
    display: none;
  }

  :host([size="lg"]) {
    --_w: calc(var(--purr-spacing) * 16);
    --_h: var(--purr-visual-lg);
  }

  :host([size="xl"]) {
    --_w: calc(var(--purr-spacing) * 20);
    --_h: var(--purr-visual-xl);
    --_in: calc(var(--purr-spacing) * 0.75);
  }

  :host(:state(checked)) {
    --_x: calc(var(--_w) - var(--_kw) - var(--_in));
  }

  [part="track"] {
    position: relative;
    flex: none;
    inline-size: var(--_w);
    block-size: var(--_h);
    border-radius: var(--purr-radius-full);
    background-color: var(--purr-color-track);
    box-shadow: var(--purr-boundary);
    transition: background-color var(--purr-duration-fast) var(--purr-ease-out);
  }

  [part="thumb"] {
    position: absolute;
    inset-block-start: calc(50% - var(--_kh) / 2);
    inset-inline-start: var(--_x);
    inline-size: var(--_kw);
    block-size: var(--_kh);
    border-radius: var(--purr-radius-full);
    background-color: var(--purr-color-thumb);
    box-shadow: 0 calc(var(--purr-spacing) * 0.75) calc(var(--purr-spacing) * 9)
      color-mix(in srgb, var(--purr-color-shade) 5%, transparent);
    transition:
      inset var(--purr-duration) var(--purr-ease-out),
      inline-size var(--purr-duration) var(--purr-ease-out),
      block-size var(--purr-duration) var(--purr-ease-out),
      background-color var(--purr-duration-fast) var(--purr-ease-out);
  }

  [part="label"] {
    overflow-wrap: anywhere;
  }

  /* No label text: the track alone, with no gap beside it. */
  :host(:not(:state(labelled))) [part="label"] {
    display: none;
  }

  :host(:state(checked)) [part="track"] {
    background-color: var(--purr-color-selected);
  }

  :host(:state(checked)) [part="thumb"] {
    background-color: var(--purr-color-selected-foreground);
  }

  :host(:state(pressed)) [part="track"] {
    background-image: linear-gradient(
      var(--purr-color-muted-2),
      var(--purr-color-muted-2)
    );
  }

  :host(:state(pressed)) [part="thumb"] {
    --_ch: calc(var(--_h) * 1.3);

    inset-block-start: calc(50% - var(--_ch) / 2);
    inset-inline-start: calc(var(--_x) - var(--_grow));
    inline-size: calc(var(--_kw) + 2 * var(--_grow));
    block-size: var(--_ch);
    background-color: color-mix(
      in srgb,
      var(--purr-color-thumb) 12%,
      transparent
    );
    box-shadow:
      0 0 0 1px var(--purr-color-border),
      inset 0 1px 1px
        color-mix(in srgb, var(--purr-color-thumb) 60%, transparent),
      0 calc(var(--purr-spacing) * 2.25) calc(var(--purr-spacing) * 3)
        color-mix(in srgb, var(--purr-color-shade) 10%, transparent);
  }

  :host(:disabled) {
    opacity: 0.5;
  }

  /* The ring follows the track, not the whole row. */
  :host(:focus-visible) {
    outline: none;
  }

  :host(:focus-visible) [part="track"] {
    outline: var(--purr-ring-width) solid var(--purr-color-ring);
    outline-offset: var(--purr-ring-offset);
  }

  @media (forced-colors: active) {
    [part="track"] {
      border: 1px solid ButtonText;
      background: Canvas;
      forced-color-adjust: none;
    }

    [part="thumb"] {
      background: ButtonText;
      transition: none;
    }

    :host(:state(checked)) [part="track"] {
      background: Highlight;
    }

    :host(:state(checked)) [part="thumb"] {
      background: HighlightText;
    }

    :host(:disabled) {
      opacity: 1;
      color: GrayText;
    }

    :host(:focus-visible) [part="track"] {
      outline-color: Highlight;
    }
  }
`;
