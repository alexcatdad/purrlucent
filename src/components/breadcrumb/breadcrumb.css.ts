import { css } from "lit";

/* The list is one row that never wraps; its items shrink and truncate. */
export const breadcrumbStyles = css`
  :host {
    display: block;
    min-inline-size: 0;
    background: var(--pl-material-capsule-strong);
    backdrop-filter: var(--pl-material-bar-filter);
    box-shadow: var(--pl-material-edge);
    font: 400 var(--pl-text-sm) / var(--pl-leading-normal) var(--pl-font-sans);
  }

  :host([hidden]) {
    display: none;
  }

  [part="list"] {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    min-inline-size: 0;
    margin: 0;
    padding: 0;
    list-style: none;
  }
`;

/*
 * The link is the hit region: at least the hit minimum tall, with the text
 * centered. A long name shrinks to an ellipsis; the item sets its full text
 * as the title while that happens.
 */
export const breadcrumbItemStyles = css`
  :host {
    --_pad: calc((var(--pl-size-hit-min) - var(--pl-leading-normal)) / 2);

    display: flex;
    flex: 0 1 auto;
    align-items: center;
    min-inline-size: 0;
    color: var(--pl-color-muted-foreground);
  }

  :host([hidden]) {
    display: none;
  }

  /* The root stays whole; the other steps give up the room. */
  :host(:first-child) {
    flex-shrink: 0;
  }

  [part="link"] {
    display: block;
    min-inline-size: 0;
    padding: var(--_pad) var(--pl-space-1-5);
    overflow: hidden;
    border-radius: var(--pl-radius-control);
    color: inherit;
    text-decoration: none;
    text-overflow: ellipsis;
    white-space: nowrap;
    transition:
      color var(--pl-duration-fast) var(--pl-ease-out),
      background-color var(--pl-duration-fast) var(--pl-ease-out);
  }

  a[part="link"]:focus-visible {
    outline: var(--pl-ring-width) solid var(--pl-color-ring);
    outline-offset: var(--pl-ring-offset);
  }

  @media (hover: hover) {
    a[part="link"]:hover {
      background-color: var(--pl-color-muted-3);
      color: var(--pl-color-foreground);
    }
  }

  a[part="link"]:active {
    background-color: var(--pl-color-muted-pressed);
    color: var(--pl-color-foreground);
  }

  :host([current]) {
    color: var(--pl-color-foreground);
  }

  :host([current]) [part="link"] {
    font-weight: 600;
  }

  /* A decorative chevron; it points the other way under right-to-left. */
  [part="separator"] {
    flex: none;
    inline-size: var(--pl-icon-sm);
    block-size: var(--pl-icon-sm);
    color: var(--pl-color-muted-foreground);
  }

  :host(:dir(rtl)) [part="separator"] {
    transform: scaleX(-1);
  }

  :host([current]) [part="separator"] {
    display: none;
  }

  @media (forced-colors: active) {
    [part="link"] {
      transition: none;
    }

    a[part="link"] {
      color: LinkText;
    }

    a[part="link"][aria-current="page"],
    span[part="link"] {
      color: CanvasText;
    }

    a[part="link"]:hover,
    a[part="link"]:active {
      background-color: transparent;
      color: Highlight;
    }

    a[part="link"]:focus-visible {
      outline-color: Highlight;
    }

    [part="separator"] {
      color: GrayText;
    }
  }
`;
