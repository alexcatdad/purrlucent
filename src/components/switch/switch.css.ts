import { css } from "lit";

/*
 * Each size sets the track height and the thumb inset; everything else is
 * calculated from them. The track has its own heights, smaller than the
 * control heights, and is 2.25 times as wide as it is tall, so the thumb, 4/3
 * as wide as the track is tall, always has room to travel.
 * While pressed it grows about its own center, to 0.92 of the track width.
 * The track keeps its drawn size with a coarse pointer; the host, which is the
 * hit region, grows around it. A label that wraps grows the row downwards: the
 * track and the label's first line share one row, --_row, centered on each other.
 */
export const switchStyles = css`
  :host {
    --_h: calc(var(--pl-spacing) * 6);
    --_w: calc(var(--_h) * 2.25);
    --_in: var(--pl-space-0-5);
    --_kh: calc(var(--_h) - var(--_in) * 2);
    --_kw: calc(var(--_h) * 4 / 3);
    --_grow: calc((var(--_w) * 0.92 - var(--_kw)) / 2);
    --_x: var(--_in);
    --_hit: max(var(--_h), var(--pl-size-hit-min));
    --_row: max(var(--_h), 1lh);

    display: inline-flex;
    align-items: flex-start;
    gap: var(--pl-gap-form);
    box-sizing: border-box;
    min-block-size: var(--_hit);
    padding-block: max(0px, calc((var(--_hit) - var(--_row)) / 2));
    color: var(--pl-color-foreground);
    font: 400 var(--pl-text-sm) / var(--pl-leading-normal) var(--pl-font-sans);
    cursor: var(--pl-cursor-interactive);
  }

  :host([hidden]) {
    display: none;
  }

  :host([size="lg"]) {
    --_h: calc(var(--pl-spacing) * 7);
  }

  :host([size="xl"]) {
    --_h: calc(var(--pl-spacing) * 9);
    --_in: calc(var(--pl-spacing) * 0.75);
  }

  :host(:state(checked)) {
    --_x: calc(var(--_w) - var(--_kw) - var(--_in));
  }

  [part="track"] {
    position: relative;
    flex: none;
    inline-size: var(--_w);
    block-size: var(--_h);
    margin-block-start: calc((var(--_row) - var(--_h)) / 2);
    border-radius: var(--pl-radius-full);
    background-color: var(--pl-color-track);
    backdrop-filter: var(--pl-material-control-filter);
    box-shadow: var(--pl-material-edge);
    user-select: none;
    transition: background-color var(--pl-duration-fast) var(--pl-ease-out);
  }

  /* Increased contrast outlines the track instead of lighting its edge. */
  @media (prefers-contrast: more) {
    [part="track"] {
      box-shadow: var(--pl-boundary);
    }
  }

  [part="thumb"] {
    position: absolute;
    inset-block-start: calc(50% - var(--_kh) / 2);
    inset-inline-start: var(--_x);
    inline-size: var(--_kw);
    block-size: var(--_kh);
    border-radius: var(--pl-radius-full);
    background-color: var(--pl-color-thumb);
    box-shadow: 0 calc(var(--pl-spacing) * 0.75) calc(var(--pl-spacing) * 9)
      color-mix(in srgb, var(--pl-color-shade) 5%, transparent);
    transition:
      inset var(--pl-duration) var(--pl-ease-out),
      inline-size var(--pl-duration) var(--pl-ease-out),
      block-size var(--pl-duration) var(--pl-ease-out),
      background-color var(--pl-duration-fast) var(--pl-ease-out),
      box-shadow var(--pl-duration-fast) var(--pl-ease-out);
  }

  [part="label"] {
    padding-block-start: calc((var(--_row) - 1lh) / 2);
    overflow-wrap: anywhere;
  }

  /* No label text: the track alone, with no gap beside it. */
  :host(:not(:state(labelled))) [part="label"] {
    display: none;
  }

  :host(:state(checked)) [part="track"] {
    background-color: var(--pl-color-selected);
  }

  :host(:state(checked)) [part="thumb"] {
    background-color: var(--pl-color-selected-foreground);
  }

  :host(:state(pressed)) [part="track"] {
    background-image: linear-gradient(
      var(--pl-color-muted-2),
      var(--pl-color-muted-2)
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
      var(--pl-color-thumb) 12%,
      transparent
    );
    box-shadow:
      0 0 0 1px var(--pl-color-border),
      0 0 0 1.5px color-mix(in srgb, var(--pl-color-thumb) 45%, transparent),
      inset 0 1px 1px color-mix(in srgb, var(--pl-color-thumb) 60%, transparent),
      inset 0 -1px 1px
        color-mix(in srgb, var(--pl-color-shade) 10%, transparent),
      0 calc(var(--pl-spacing) * 2.25) calc(var(--pl-spacing) * 3)
        color-mix(in srgb, var(--pl-color-shade) 10%, transparent);
  }

  :host(:disabled) {
    cursor: var(--pl-cursor-disabled);
    opacity: 0.5;
  }

  /* The ring follows the track, not the whole row. */
  :host(:focus-visible) {
    outline: none;
  }

  :host(:focus-visible) [part="track"] {
    outline: var(--pl-ring-width) solid var(--pl-color-ring);
    outline-offset: var(--pl-ring-offset);
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

    /* Outranks the pressed thumb's translucent fill; checked below wins. */
    :host(:state(pressed)) [part="thumb"] {
      background: ButtonText;
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

    :host(:disabled) [part="track"] {
      border-color: GrayText;
    }

    :host(:disabled) [part="thumb"] {
      background: GrayText;
    }

    :host(:disabled:state(checked)) [part="track"] {
      background: GrayText;
    }

    :host(:disabled:state(checked)) [part="thumb"] {
      background: Canvas;
    }

    :host(:focus-visible) [part="track"] {
      outline-color: Highlight;
    }
  }
`;
