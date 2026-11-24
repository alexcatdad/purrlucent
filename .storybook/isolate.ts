import { css, html, unsafeCSS } from "lit";

// Storybook only. In a right-to-left story an English sentence sits in a <bdi>,
// so its punctuation stays on its own side. In any other story it is left as is.
export const isolate = (rtl: boolean, content: unknown) =>
  rtl ? html`<bdi>${content}</bdi>` : content;

const text =
  "p, h1, h2, h3, h4, h5, h6, li, label, blockquote, caption, figcaption, summary, dt, dd, th, td, div, span, strong, small";

// Page-sized demos hold many sentences. Under right to left each text element
// takes its direction from its own first letter, so an English sentence keeps
// its period at its end and an Arabic one still reads right to left. A demo
// puts this first in its own styles.
export const plaintextRtl = css`
  :host(:dir(rtl)) :is(${unsafeCSS(text)}) {
    unicode-bidi: plaintext;
  }
`;

/** The same rule for text in the document, scoped to a root element's selector. */
export const plaintextRtlFor = (root: string) =>
  `${root}:dir(rtl) :is(${text}) { unicode-bidi: plaintext; }`;
