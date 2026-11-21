import { css } from "lit";

/*
 * The host is the slider and its hit region: pressing anywhere on it sets the
 * value. The inline `--_p` (0 to 1) is the only thing script writes; the fill
 * and the thumb are placed from it with logical properties, so rtl mirrors them.
 * The thumb's center travels from half a thumb in to half a thumb in, and the
 * fill ends at that center.
 */
export const sliderStyles = css`
  :host {
    --_len: calc(var(--purr-spacing) * 30);
    --_h: var(--purr-size-md);
    --_t: calc(var(--purr-spacing) * 1.5);
    --_kw: calc(var(--purr-spacing) * 5);
    --_kh: calc(var(--purr-spacing) * 4);
    --_tick: 2px;
    --_p: 0;

    position: relative;
    display: inline-block;
    box-sizing: border-box;
    inline-size: var(--_len);
    min-inline-size: var(--purr-size-hit-min);
    block-size: max(var(--_h), var(--purr-size-hit-min));
    vertical-align: middle;
    touch-action: pan-y;
    cursor: default;
    user-select: none;
  }

  :host([hidden]) {
    display: none;
  }

  :host([size="lg"]) {
    --_h: var(--purr-size-lg);
    --_kw: calc(var(--purr-spacing) * 6);
    --_kh: calc(var(--purr-spacing) * 5);
  }

  :host([size="xl"]) {
    --_h: var(--purr-size-xl);
    --_kw: calc(var(--purr-spacing) * 6);
    --_kh: calc(var(--purr-spacing) * 5);
  }

  [part="track"] {
    position: absolute;
    inset-inline: 0;
    inset-block-start: calc(50% - var(--_t) / 2);
    block-size: var(--_t);
    overflow: hidden;
    border-radius: var(--purr-radius-full);
    background-color: var(--purr-color-track);
  }

  [part="fill"] {
    display: block;
    block-size: 100%;
    inline-size: calc(var(--_kw) / 2 + var(--_p) * (100% - var(--_kw)));
    border-radius: var(--purr-radius-full);
    background-color: var(--_fill, var(--purr-color-selected));
  }

  [part="ticks"] > span {
    position: absolute;
    inset-block-start: calc(50% + var(--_t) / 2 + var(--purr-spacing) * 0.75);
    inset-inline-start: calc(
      var(--_kw) / 2 - var(--_tick) / 2 + var(--_i) * (100% - var(--_kw))
    );
    inline-size: var(--_tick);
    block-size: var(--_tick);
    border-radius: var(--purr-radius-full);
    background-color: var(--purr-color-disabled-foreground);
  }

  [part="thumb"] {
    position: absolute;
    inset-block-start: calc(50% - var(--_kh) / 2);
    inset-inline-start: calc(var(--_p) * (100% - var(--_kw)));
    inline-size: var(--_kw);
    block-size: var(--_kh);
    border-radius: var(--purr-radius-full);
    background-color: var(--purr-color-thumb);
    box-shadow: 0 0.5px calc(var(--purr-spacing) * 1.5)
      color-mix(in srgb, var(--purr-color-shade) 12%, transparent);
    transition:
      scale var(--purr-duration) var(--purr-ease-out),
      background-color var(--purr-duration-fast) var(--purr-ease-out),
      box-shadow var(--purr-duration-fast) var(--purr-ease-out);
  }

  :host(:state(dragging)) {
    --_fill: color-mix(
      in srgb,
      var(--purr-color-selected),
      var(--purr-color-shade) 12%
    );
  }

  :host(:state(dragging)) [part="thumb"] {
    scale: 1.25;
    background-color: color-mix(
      in srgb,
      var(--purr-color-thumb) 25%,
      transparent
    );
    box-shadow:
      0 0 0 1px var(--purr-color-border),
      inset 0 1px 1px
        color-mix(in srgb, var(--purr-color-thumb) 70%, transparent),
      0 calc(var(--purr-spacing) * 0.75) calc(var(--purr-spacing) * 1.5)
        color-mix(in srgb, var(--purr-color-shade) 12%, transparent);
  }

  /* The thumb stays as it is idle; only the fill and the ticks go muted. */
  :host(:disabled) {
    --_fill: light-dark(var(--purr-color-muted-5), var(--purr-color-muted-4));
  }

  :host(:disabled) [part="ticks"] > span {
    background-color: var(--purr-color-foreground-faint);
  }

  /* The ring follows the thumb, not the whole hit region. */
  :host(:focus-visible) {
    outline: none;
  }

  :host(:focus-visible) [part="thumb"] {
    outline: var(--purr-ring-width) solid var(--purr-color-ring);
    outline-offset: var(--purr-ring-offset);
  }

  @media (forced-colors: active) {
    [part="track"] {
      border: 1px solid ButtonText;
      background: Canvas;
      forced-color-adjust: none;
    }

    [part="fill"] {
      background: Highlight;
      forced-color-adjust: none;
    }

    [part="ticks"] > span {
      background: ButtonText;
      forced-color-adjust: none;
    }

    [part="thumb"] {
      background: ButtonText;
      forced-color-adjust: none;
      transition: none;
    }

    :host(:state(dragging)) [part="thumb"] {
      background: ButtonText;
    }

    :host(:disabled) {
      color: GrayText;
    }

    :host(:disabled) [part="fill"] {
      background: GrayText;
    }

    :host(:disabled) [part="thumb"],
    :host(:disabled) [part="ticks"] > span {
      background: GrayText;
    }

    :host(:focus-visible) [part="thumb"] {
      outline-color: Highlight;
    }
  }
`;
