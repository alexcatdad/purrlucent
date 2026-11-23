import { css } from "lit";

/*
 * A circle that clips its content. The initials sit under the image in one
 * grid cell, so the fallback is already there when an image is slow or fails.
 * Text size is a share of the circle, so every size scales together.
 */
export const avatarStyles = css`
  :host {
    --_s: calc(var(--pl-spacing) * 8);

    display: inline-grid;
    place-items: center;
    inline-size: var(--_s);
    block-size: var(--_s);
    flex: none;
    overflow: hidden;
    vertical-align: middle;
    border-radius: var(--pl-radius-full);
    background-color: var(--pl-color-muted-1);
    color: var(--pl-color-foreground);
    font-family: var(--pl-font-sans);
    font-size: calc(var(--_s) * 0.4);
    font-weight: 600;
    line-height: 1;
    user-select: none;
  }

  :host([hidden]) {
    display: none;
  }

  :host([size="sm"]) {
    --_s: calc(var(--pl-spacing) * 6);
  }

  :host([size="lg"]) {
    --_s: calc(var(--pl-spacing) * 10);
  }

  :host([size="xl"]) {
    --_s: calc(var(--pl-spacing) * 12);
  }

  [part="initials"],
  [part="image"] {
    grid-area: 1 / 1;
  }

  [part="image"] {
    display: block;
    inline-size: 100%;
    block-size: 100%;
    object-fit: cover;
  }

  @media (forced-colors: active) {
    :host {
      border: 1px solid ButtonText;
      background: Canvas;
      color: CanvasText;
    }
  }
`;
