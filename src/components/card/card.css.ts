import { css } from "lit";

/*
 * A content surface: solid and raised off the page, with no material. Its
 * frame is a hairline in light and clear in dark, where the fill alone
 * separates it. The header,
 * content and footer are stacked sections; a section with nothing in it is
 * hidden, so it adds neither height nor gap.
 */
export const cardStyles = css`
  :host {
    display: flex;
    flex-direction: column;
    gap: var(--pl-space-4);
    box-sizing: border-box;
    background: var(--pl-color-raised);
    backdrop-filter: none;
    border: 1px solid var(--pl-color-frame);
    border-radius: var(--pl-radius-control);
    color: var(--pl-color-foreground);
    font: 400 var(--pl-text-sm) / var(--pl-leading-normal) var(--pl-font-sans);
    overflow: clip;
    padding: var(--pl-space-4);
  }

  [hidden] {
    display: none !important;
  }

  [part="header"] {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas:
      "title actions"
      "description actions";
    column-gap: var(--pl-space-3);
  }

  [part="content"] {
    overflow-wrap: anywhere;
  }

  [part="footer"] {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--pl-gap-controls);
  }

  /* Slots are display: contents by default, which ignores grid-area. */
  slot[name="title"],
  slot[name="description"] {
    display: block;
  }

  slot[name="title"] {
    grid-area: title;
    font-weight: 700;
    font-size: var(--pl-text-base);
  }

  slot[name="description"] {
    grid-area: description;
    color: var(--pl-color-muted-foreground);
  }

  slot[name="actions"] {
    grid-area: actions;
    display: flex;
    align-items: start;
    gap: var(--pl-gap-controls);
  }

  ::slotted([slot="title"]),
  ::slotted([slot="description"]) {
    display: block;
    margin: 0;
    font: inherit;
    overflow-wrap: anywhere;
  }

  @media (forced-colors: active) {
    :host {
      border-color: CanvasText;
    }
  }
`;
