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
    border-radius: var(--pl-radius);
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

  @media (prefers-contrast: more) {
    .pl-prose blockquote {
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

    .pl-prose :is(th, td) {
      border-block-end-color: CanvasText;
    }
  }
`;
