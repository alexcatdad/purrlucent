import { css } from "lit";

// Hierarchy comes from size, weight and color. Sizes and leading come from the
// text tokens, so the scale follows the root font size when people enlarge text.
// Regular and heavier weights only. Long passages get loose leading; lists,
// tables and code, which are scanned, get normal leading.

/**
 * Styles for running text: headings, paragraphs, lists, block quotes, inline
 * code and tables. Add them to the page once, for example with
 * `document.adoptedStyleSheets.push(proseStyles.styleSheet!)`, then wrap the
 * content in an element with the class `pl-prose`. The styles read tokens, so
 * load `purrlucent/tokens.css` too.
 */
export const proseStyles = css`
  .pl-prose {
    box-sizing: border-box;
    max-inline-size: calc(var(--pl-spacing) * 170);
    color: var(--pl-color-foreground);
    font-family: var(--pl-font-sans);
    font-size: var(--pl-text-base);
    font-weight: 400;
    line-height: var(--pl-leading-loose);
    overflow-wrap: break-word;
  }

  .pl-prose > :first-child {
    margin-block-start: 0;
  }

  .pl-prose > :last-child {
    margin-block-end: 0;
  }

  .pl-prose :is(h1, h2, h3, h4) {
    margin-block: var(--pl-space-6) var(--pl-space-2);
    color: var(--pl-color-foreground);
    font-weight: 700;
    text-wrap: balance;
  }

  .pl-prose h1 {
    font-size: var(--pl-text-xl);
    line-height: calc(var(--pl-text-xl) * 1.25);
  }

  .pl-prose h2 {
    font-size: var(--pl-text-lg);
    line-height: calc(var(--pl-text-lg) * 1.35);
  }

  .pl-prose :is(h3, h4) {
    font-size: var(--pl-text-base);
    line-height: var(--pl-leading-loose);
  }

  .pl-prose h4 {
    font-weight: 600;
  }

  .pl-prose p {
    margin-block: 0 var(--pl-space-4);
  }

  .pl-prose a {
    color: var(--pl-color-accent-text);
    text-decoration: underline;
    text-underline-offset: var(--pl-ring-offset);
  }

  .pl-prose :is(ul, ol) {
    margin-block: 0 var(--pl-space-4);
    padding-inline-start: var(--pl-indent);
    line-height: var(--pl-leading-normal);
  }

  .pl-prose li + li {
    margin-block-start: var(--pl-space-1);
  }

  .pl-prose :is(ul, ol) :is(ul, ol) {
    margin-block: var(--pl-space-1) 0;
  }

  .pl-prose blockquote {
    margin-block: 0 var(--pl-space-4);
    margin-inline: 0;
    padding-inline-start: var(--pl-space-4);
    border-inline-start: var(--pl-space-1) solid var(--pl-color-border);
    color: var(--pl-color-muted-foreground);
  }

  .pl-prose :not(pre) > code {
    padding: var(--pl-space-0-5) var(--pl-space-1);
    border-radius: var(--pl-radius-control-inner);
    background: var(--pl-color-track);
    font-family: var(--pl-font-mono);
    font-size: var(--pl-text-sm);
  }

  .pl-prose table {
    inline-size: 100%;
    margin-block: 0 var(--pl-space-4);
    border-collapse: collapse;
    line-height: var(--pl-leading-normal);
  }

  .pl-prose :is(th, td) {
    padding: var(--pl-space-2) var(--pl-space-3);
    border-block-end: 1px solid var(--pl-color-border);
    text-align: start;
  }

  .pl-prose th {
    font-weight: 600;
  }

  .pl-prose hr {
    margin-block: var(--pl-space-6);
    border: 0;
    border-block-start: 1px solid var(--pl-color-border);
  }

  .pl-prose :is(h5, h6) {
    margin-block: var(--pl-space-4) var(--pl-space-1);
    font-size: var(--pl-text-base);
    font-weight: 600;
    line-height: var(--pl-leading-loose);
  }

  .pl-prose h6 {
    color: var(--pl-color-muted-foreground);
    font-size: var(--pl-text-sm);
  }

  .pl-prose .lead {
    color: var(--pl-color-foreground);
    font-size: var(--pl-text-lg);
  }

  .pl-prose small {
    font-size: var(--pl-text-sm);
  }

  .pl-prose :is(strong, b) {
    font-weight: 600;
  }

  .pl-prose :is(em, i, cite) {
    font-style: italic;
  }

  .pl-prose q {
    font-style: italic;
  }

  .pl-prose mark {
    padding-inline: var(--pl-space-0-5);
    border-radius: var(--pl-radius-control-inner);
    background-color: var(--pl-color-selected);
    color: var(--pl-color-selected-foreground);
  }

  .pl-prose del {
    color: var(--pl-color-muted-foreground);
    text-decoration-line: line-through;
  }

  .pl-prose ins {
    text-decoration-line: underline;
    text-decoration-style: double;
    text-underline-offset: var(--pl-ring-offset);
  }

  .pl-prose s {
    text-decoration-line: line-through;
  }

  .pl-prose :is(sub, sup) {
    font-size: var(--pl-text-xs);
    line-height: 0;
  }

  .pl-prose abbr[title] {
    text-decoration-line: underline;
    text-decoration-style: dotted;
    text-underline-offset: var(--pl-ring-offset);
    cursor: help;
  }

  .pl-prose time {
    color: var(--pl-color-muted-foreground);
  }

  .pl-prose kbd {
    display: inline-block;
    box-sizing: border-box;
    min-inline-size: calc(var(--pl-leading-normal) + var(--pl-space-1));
    padding-inline: var(--pl-space-1-5);
    border: 1px solid var(--pl-color-border);
    border-radius: var(--pl-radius-control);
    background-color: var(--pl-color-muted-2);
    color: var(--pl-color-foreground);
    font: 500 var(--pl-text-xs) /
      calc(var(--pl-leading-normal) + var(--pl-space-1)) var(--pl-font-sans);
    text-align: center;
    white-space: nowrap;
  }

  .pl-prose dl {
    margin-block: var(--pl-space-2) var(--pl-space-4);
    line-height: var(--pl-leading-normal);
  }

  .pl-prose dt {
    font-weight: 600;
  }

  .pl-prose dd {
    margin-inline: var(--pl-indent) 0;
    margin-block-end: var(--pl-space-2);
    color: var(--pl-color-muted-foreground);
  }

  .pl-prose figure {
    margin-block: var(--pl-space-2) var(--pl-space-4);
    margin-inline: 0;
  }

  .pl-prose figure img {
    display: block;
    max-inline-size: 100%;
    block-size: auto;
    border-radius: var(--pl-radius-control);
  }

  .pl-prose figcaption {
    margin-block-start: var(--pl-space-2);
    color: var(--pl-color-muted-foreground);
    font-size: var(--pl-text-sm);
    line-height: var(--pl-leading-normal);
  }

  .pl-prose blockquote footer {
    margin-block-start: var(--pl-space-1);
    font-size: var(--pl-text-sm);
    line-height: var(--pl-leading-normal);
  }

  .pl-prose caption {
    padding-block: var(--pl-space-2);
    caption-side: bottom;
    color: var(--pl-color-muted-foreground);
    font-size: var(--pl-text-sm);
    text-align: start;
  }

  .pl-prose address {
    margin-block: var(--pl-space-2) var(--pl-space-4);
    font-style: normal;
    line-height: var(--pl-leading-normal);
  }

  .pl-prose pre {
    box-sizing: border-box;
    margin-block: var(--pl-space-2) var(--pl-space-4);
    padding: var(--pl-space-3) var(--pl-space-4);
    overflow-x: auto;
    border-radius: var(--pl-radius-control);
    background-color: var(--pl-color-track);
    font-family: var(--pl-font-mono);
    font-size: var(--pl-text-sm);
    line-height: var(--pl-leading-normal);
    tab-size: 2;
  }

  .pl-prose details {
    margin-block: var(--pl-space-2) var(--pl-space-4);
    padding-inline: var(--pl-space-3);
    border: 1px solid var(--pl-color-border);
    border-radius: var(--pl-radius-control);
  }

  .pl-prose summary {
    display: flex;
    align-items: center;
    gap: var(--pl-gap-icon);
    min-block-size: var(--pl-size-hit-min);
    font-weight: 600;
    list-style: none;
    cursor: var(--pl-cursor-interactive);
  }

  .pl-prose summary::-webkit-details-marker {
    display: none;
  }

  /* The pl-collapsible chevron: points inline-end, turns toward block-end open. */
  .pl-prose summary::before {
    flex: none;
    inline-size: var(--pl-icon-md);
    block-size: var(--pl-icon-md);
    background-color: var(--pl-color-muted-foreground);
    content: "";
    mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m9.25 5.75 5.5 5.5q.75.75 0 1.5l-5.5 5.5'/%3E%3C/svg%3E")
      center / contain no-repeat;
    transition: transform var(--pl-duration) var(--pl-ease-out);
  }

  .pl-prose details[open] > summary::before {
    transform: rotate(90deg);
  }

  .pl-prose summary:dir(rtl)::before {
    transform: scaleX(-1);
  }

  .pl-prose details[open] > summary:dir(rtl)::before {
    transform: scaleX(-1) rotate(90deg);
  }

  .pl-prose summary:focus-visible {
    outline: var(--pl-ring-width) solid var(--pl-color-ring);
    outline-offset: var(--pl-ring-offset);
  }

  .pl-prose details > :not(summary) {
    margin-block-end: var(--pl-space-3);
  }

  @media (prefers-reduced-motion: reduce) {
    .pl-prose summary::before {
      transition: none;
    }
  }

  @media (prefers-contrast: more) {
    .pl-prose blockquote {
      color: var(--pl-color-foreground);
    }

    .pl-prose :is(dd, del, time, figcaption, caption, h6) {
      color: var(--pl-color-foreground);
    }

    .pl-prose :is(th, td) {
      border-block-end-color: var(--pl-color-input-border);
    }
  }

  @media (forced-colors: active) {
    .pl-prose a {
      color: LinkText;
    }

    .pl-prose :not(pre) > code {
      border: 1px solid CanvasText;
    }

    .pl-prose blockquote {
      border-inline-start-color: CanvasText;
    }

    .pl-prose mark {
      background-color: Mark;
      color: MarkText;
    }

    .pl-prose kbd {
      border-color: ButtonText;
      background-color: ButtonFace;
      color: ButtonText;
    }

    .pl-prose pre {
      border: 1px solid CanvasText;
    }

    .pl-prose details {
      border-color: CanvasText;
    }

    .pl-prose summary::before {
      background-color: CanvasText;
      transition: none;
    }

    .pl-prose summary:focus-visible {
      outline-color: Highlight;
    }

    .pl-prose :is(th, td) {
      border-block-end-color: CanvasText;
    }
  }
`;

/**
 * A text shimmer for progress that has no number, such as "Thinking…". Add it
 * to the page like `proseStyles`, then give the text's element the class
 * `pl-shimmer`. A dimmer band, derived from the text color, sweeps across the
 * text in reading direction. It is plain text where background clipping or
 * `color-mix()` is unsupported, under reduced motion and under forced colors.
 * The element needs no other color: it reads `currentColor`.
 */
export const shimmerStyles = css`
  @supports ((background-clip: text) or (-webkit-background-clip: text)) and
    (color: color-mix(in srgb, red, blue)) {
    .pl-shimmer {
      background-image: linear-gradient(
        to right,
        currentColor 35%,
        color-mix(in srgb, currentColor 40%, transparent) 50%,
        currentColor 65%
      );
      background-repeat: no-repeat;
      background-size: 300% 100%;
      -webkit-background-clip: text;
      background-clip: text;

      /* The fill, not the color, is clear, so currentColor stays readable. */
      -webkit-text-fill-color: transparent;
      animation: pl-shimmer-sweep calc(var(--pl-duration-slow) * 5) linear
        infinite;
    }

    .pl-shimmer:dir(rtl) {
      animation-direction: reverse;
    }
  }

  @keyframes pl-shimmer-sweep {
    from {
      background-position: 100% 0;
    }

    to {
      background-position: 0 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .pl-shimmer,
    .pl-shimmer:dir(rtl) {
      background-image: none;
      -webkit-text-fill-color: currentColor;
      animation: none;
    }
  }

  @media (forced-colors: active) {
    .pl-shimmer,
    .pl-shimmer:dir(rtl) {
      background-image: none;
      -webkit-text-fill-color: currentColor;
      animation: none;
    }
  }
`;
