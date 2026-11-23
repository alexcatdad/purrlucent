import { css } from "lit";

/*
 * A two-column grid. The avatar sits in the content's row, so it is level with
 * the bottom of the content and ends up above the footer when there is one.
 * The header and footer rows add no gap of their own: their wrappers carry the
 * spacing and are hidden when empty. Grid columns follow the writing
 * direction, so the end-aligned row mirrors under rtl without extra rules.
 */
export const messageStyles = css`
  :host {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    grid-template-areas:
      ". header"
      "avatar content"
      ". footer";
    font: 400 var(--pl-text-base) / var(--pl-leading-loose) var(--pl-font-sans);
    color: var(--pl-color-foreground);
    overflow-wrap: anywhere;
  }

  :host([hidden]) {
    display: none;
  }

  :host([align="end"]) {
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas:
      "header ."
      "content avatar"
      "footer .";
  }

  [hidden] {
    display: none !important;
  }

  [part="avatar"] {
    grid-area: avatar;
    align-self: end;
    display: flex;
    margin-inline-end: var(--pl-space-2);
    visibility: var(--pl-message-avatar-visibility, visible);
  }

  :host([align="end"]) [part="avatar"] {
    margin-inline-end: 0;
    margin-inline-start: var(--pl-space-2);
  }

  [part="header"] {
    grid-area: header;
    padding-block-end: var(--pl-space-1);
    color: var(--pl-color-muted-foreground);
    font-size: var(--pl-text-sm);
    line-height: var(--pl-leading-normal);
    text-align: start;
  }

  [part="content"] {
    grid-area: content;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--pl-space-1);
    min-inline-size: 0;
  }

  :host([align="end"]) [part="content"] {
    align-items: flex-end;
  }

  [part="content"] ::slotted(*) {
    max-inline-size: 100%;
    min-inline-size: 0;
  }

  [part="footer"] {
    grid-area: footer;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--pl-gap-controls);
    padding-block-start: var(--pl-space-1);
    color: var(--pl-color-muted-foreground);
    font-size: var(--pl-text-sm);
    line-height: var(--pl-leading-normal);
  }

  :host([align="end"]) [part="footer"] {
    justify-content: flex-end;
  }
`;

/*
 * A column of messages with tight spacing. A message that is not the last
 * child hides its avatar through an inherited property, so the avatar keeps
 * its space and the bubbles stay aligned.
 */
export const messageGroupStyles = css`
  :host {
    display: flex;
    flex-direction: column;
    gap: var(--pl-space-0-5);
  }

  :host([hidden]) {
    display: none;
  }

  ::slotted(pl-message:not(:last-child)) {
    --pl-message-avatar-visibility: hidden;
  }
`;
