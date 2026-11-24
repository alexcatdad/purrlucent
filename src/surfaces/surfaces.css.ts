import { css } from "lit";

// Bar, sidebar, panel and sheet read --pl-material-*, so glass (and its solid
// fallbacks) apply through the tokens. They carry no stroke: elevation separates
// floating surfaces, and increased contrast turns it into a 1px outline. List rows and field shells hold content and stay solid.

/** A navigation or control bar, such as a toolbar or tab bar. Flat, square corners.
 * On glass its fill is thin, so a text-only button in it takes the primary text color. */
export const barSurface = css`
  :host {
    --pl-material-ghost-text: var(--pl-material-chrome-text);

    display: block;
    box-sizing: border-box;
    background: var(--pl-material-bar);
    backdrop-filter: var(--pl-lens,) var(--pl-material-bar-filter);
    box-shadow: var(--pl-material-edge);
    color: var(--pl-color-foreground);
    padding: var(--pl-space-2) var(--pl-space-4);
  }

  /* The content-facing edge. */
  @media (prefers-contrast: more) {
    :host {
      border-block-end: 1px solid var(--pl-color-input-border);
    }
  }

  @media (forced-colors: active) {
    :host {
      border-block-end: 1px solid CanvasText;
    }
  }
`;

/* Forced colors drops box-shadow, so a floating surface needs a real edge. */
const forcedEdge = css`
  @media (forced-colors: active) {
    :host {
      border: 1px solid CanvasText;
    }
  }
`;

/** A floating sidebar. */
export const sidebarSurface = css`
  :host {
    display: block;
    box-sizing: border-box;
    background: var(--pl-material-sidebar);
    backdrop-filter: var(--pl-material-sidebar-filter);
    box-shadow: var(--pl-material-edge), var(--pl-elevation-panel);
    border-radius: var(--pl-radius-panel);
    color: var(--pl-color-foreground);
    padding: var(--pl-space-2);
  }

  ${forcedEdge}
`;

/** A floating panel, such as a popover. */
export const panelSurface = css`
  :host {
    display: block;
    box-sizing: border-box;
    background: var(--pl-material-panel);
    backdrop-filter: var(--pl-lens,) var(--pl-material-panel-filter);
    box-shadow: var(--pl-material-edge), var(--pl-elevation-panel);
    border-radius: var(--pl-radius-panel);
    color: var(--pl-color-foreground);
    padding: var(--pl-space-4);
  }

  ${forcedEdge}
`;

/** A modal sheet that rises above the content. */
export const sheetSurface = css`
  :host {
    display: block;
    box-sizing: border-box;
    background: var(--pl-material-sheet);
    backdrop-filter: var(--pl-lens,) var(--pl-material-sheet-filter);
    box-shadow: var(--pl-material-edge), var(--pl-elevation-sheet);
    border-radius: var(--pl-radius-panel);
    color: var(--pl-color-foreground);
    padding: var(--pl-space-6);
  }

  ${forcedEdge}
`;

/** A row in a list of content. Never glass. */
export const listRowSurface = css`
  :host {
    display: flex;
    align-items: center;
    box-sizing: border-box;
    background: var(--pl-color-background);
    backdrop-filter: none;
    border-block-end: 1px solid var(--pl-color-border);
    color: var(--pl-color-foreground);
    min-block-size: var(--pl-touch-min);
    padding: var(--pl-space-2) var(--pl-space-4);
  }
`;

/** The frame around a text field's input. Never glass. */
export const fieldShell = css`
  :host {
    display: block;
    box-sizing: border-box;
    background: var(--pl-color-background);
    backdrop-filter: none;
    border: 1px solid var(--pl-color-input-border);
    border-radius: var(--pl-radius-control);
    color: var(--pl-color-foreground);
    padding: var(--pl-space-2) var(--pl-space-3);
  }
`;
