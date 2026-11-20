import { css } from "lit";

// Bar, panel and sheet read --purr-material-*, so glass (and its solid
// fallbacks) apply through the tokens. List rows and field shells hold content
// and controls' contents: they stay solid and never take the material filter.

/** A navigation or control bar, such as a toolbar or tab bar. */
export const barSurface = css`
  :host {
    display: block;
    box-sizing: border-box;
    background: var(--purr-material-bar);
    backdrop-filter: var(--purr-material-filter);
    border-block-end: 1px solid var(--purr-color-separator);
    color: var(--purr-color-label);
    padding: var(--purr-space-2) var(--purr-space-4);
  }
`;

/** A floating panel, such as a sidebar or popover. */
export const panelSurface = css`
  :host {
    display: block;
    box-sizing: border-box;
    background: var(--purr-material-panel);
    backdrop-filter: var(--purr-material-filter);
    border: 1px solid var(--purr-color-separator);
    border-radius: var(--purr-radius-large);
    color: var(--purr-color-label);
    padding: var(--purr-space-4);
  }
`;

/** A modal sheet that rises above the content. */
export const sheetSurface = css`
  :host {
    display: block;
    box-sizing: border-box;
    background: var(--purr-material-sheet);
    backdrop-filter: var(--purr-material-filter);
    border: 1px solid var(--purr-color-separator);
    border-radius: var(--purr-radius-large);
    color: var(--purr-color-label);
    padding: var(--purr-space-6);
  }
`;

/** A row in a list of content. Never glass. */
export const listRowSurface = css`
  :host {
    display: flex;
    align-items: center;
    box-sizing: border-box;
    background: var(--purr-color-background);
    backdrop-filter: none;
    border-block-end: 1px solid var(--purr-color-separator);
    color: var(--purr-color-label);
    min-block-size: 44px;
    padding: var(--purr-space-2) var(--purr-space-4);
  }
`;

/** The frame around a text field's input. Never glass. */
export const fieldShell = css`
  :host {
    display: block;
    box-sizing: border-box;
    background: var(--purr-color-background);
    backdrop-filter: none;
    border: 1px solid var(--purr-color-separator);
    border-radius: var(--purr-radius-medium);
    color: var(--purr-color-label);
    padding: var(--purr-space-2) var(--purr-space-3);
  }
`;
