import { css } from "lit";

// Bar, sidebar, panel and sheet read --purr-material-*, so glass (and its solid
// fallbacks) apply through the tokens. They carry no stroke: elevation separates
// floating surfaces, and increased contrast turns it into a 1px outline. List rows and field shells hold content and stay solid.

/** A navigation or control bar, such as a toolbar or tab bar. Flat, square corners. */
export const barSurface = css`
  :host {
    display: block;
    box-sizing: border-box;
    background: var(--purr-material-bar);
    backdrop-filter: var(--purr-material-bar-filter);
    box-shadow: var(--purr-material-edge);
    color: var(--purr-color-foreground);
    padding: var(--purr-space-2) var(--purr-space-4);
  }

  /* The content-facing edge. */
  @media (prefers-contrast: more) {
    :host {
      border-block-end: 1px solid var(--purr-color-input-border);
    }
  }
`;

/** A floating sidebar. */
export const sidebarSurface = css`
  :host {
    display: block;
    box-sizing: border-box;
    background: var(--purr-material-sidebar);
    backdrop-filter: var(--purr-material-sidebar-filter);
    box-shadow: var(--purr-material-edge), var(--purr-elevation-panel);
    border-radius: var(--purr-radius-lg);
    color: var(--purr-color-foreground);
    padding: var(--purr-space-2);
  }
`;

/** A floating panel, such as a popover. */
export const panelSurface = css`
  :host {
    display: block;
    box-sizing: border-box;
    background: var(--purr-material-panel);
    backdrop-filter: var(--purr-material-panel-filter);
    box-shadow: var(--purr-material-edge), var(--purr-elevation-panel);
    border-radius: var(--purr-radius-lg);
    color: var(--purr-color-foreground);
    padding: var(--purr-space-4);
  }
`;

/** A modal sheet that rises above the content. */
export const sheetSurface = css`
  :host {
    display: block;
    box-sizing: border-box;
    background: var(--purr-material-sheet);
    backdrop-filter: var(--purr-material-sheet-filter);
    box-shadow: var(--purr-material-edge), var(--purr-elevation-sheet);
    border-radius: var(--purr-radius-lg);
    color: var(--purr-color-foreground);
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
    border-block-end: 1px solid var(--purr-color-border);
    color: var(--purr-color-foreground);
    min-block-size: var(--purr-touch-min);
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
    border: 1px solid var(--purr-color-input-border);
    border-radius: var(--purr-radius);
    color: var(--purr-color-foreground);
    padding: var(--purr-space-2) var(--purr-space-3);
  }
`;
