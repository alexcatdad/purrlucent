import { css } from "lit";

/*
 * A quiet block in the track color. With shimmer, a light band crosses it.
 * Under reduced motion the band is not drawn at all, so the block is still.
 */
export const skeletonStyles = css`
  :host {
    display: block;
    inline-size: 100%;
    block-size: calc(var(--pl-spacing) * 4);
    border-radius: var(--pl-radius-control);
    background-color: var(--pl-color-muted-1);
  }

  :host([hidden]) {
    display: none;
  }

  :host([shape="circle"]) {
    inline-size: calc(var(--pl-spacing) * 10);
    block-size: auto;
    aspect-ratio: 1;
    border-radius: var(--pl-radius-full);
  }

  :host([shimmer]) {
    background-image: linear-gradient(
      to right,
      transparent 30%,
      var(--pl-color-muted-3) 50%,
      transparent 70%
    );
    background-repeat: no-repeat;
    background-size: 300% 100%;
    animation: pl-skeleton-sweep calc(var(--pl-duration-slow) * 5) linear
      infinite;
  }

  :host([shimmer]:dir(rtl)) {
    background-image: linear-gradient(
      to left,
      transparent 30%,
      var(--pl-color-muted-3) 50%,
      transparent 70%
    );
    animation-direction: reverse;
  }

  @keyframes pl-skeleton-sweep {
    from {
      background-position: 100% 0;
    }

    to {
      background-position: 0 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    :host([shimmer]),
    :host([shimmer]:dir(rtl)) {
      background-image: none;
      animation: none;
    }
  }

  @media (forced-colors: active) {
    :host {
      border: 1px solid GrayText;
      background: Canvas;
      forced-color-adjust: none;
    }

    :host([shimmer]),
    :host([shimmer]:dir(rtl)) {
      background-image: none;
      animation: none;
    }
  }
`;
