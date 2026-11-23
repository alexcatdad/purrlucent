import { css } from "lit";

/*
 * The group sets the radius of each slotted button: the outer ends keep the
 * button radius, the inner edges are square. A hairline separator sits on the
 * leading edge of every button but the first; the buttons' own faces fill the
 * rest. Logical corners make the row mirror under rtl.
 */
export const buttonGroupStyles = css`
  :host {
    --_sep: calc(var(--pl-spacing) * 5);

    display: inline-flex;
    flex-direction: row;
    max-inline-size: 100%;
  }

  :host([hidden]) {
    display: none;
  }

  :host([orientation="vertical"]) {
    flex-direction: column;
  }

  /* The group, not each button, carries the light shadow of glass. */
  :host {
    border-radius: var(--pl-radius);
    box-shadow: var(--pl-elevation-control);
  }

  ::slotted(pl-button) {
    border-radius: 0;
    box-shadow: none;
  }

  /* An icon button is round alone; in a group its outer ends stay round. */
  :host(:not([orientation="vertical"])) ::slotted(pl-button:first-child) {
    border-start-start-radius: var(--pl-radius);
    border-end-start-radius: var(--pl-radius);
  }

  :host(:not([orientation="vertical"])) ::slotted(pl-button:last-child) {
    border-start-end-radius: var(--pl-radius);
    border-end-end-radius: var(--pl-radius);
  }

  :host([orientation="vertical"]) ::slotted(pl-button:first-child) {
    border-start-start-radius: var(--pl-radius);
    border-start-end-radius: var(--pl-radius);
  }

  :host([orientation="vertical"]) ::slotted(pl-button:last-child) {
    border-end-start-radius: var(--pl-radius);
    border-end-end-radius: var(--pl-radius);
  }

  /* The ring of a focused button is drawn over its neighbours. */
  ::slotted(pl-button:focus-visible) {
    z-index: 1;
  }

  /* A separator between buttons, centred on the shared edge. */
  :host(:not([orientation="vertical"]))
    ::slotted(pl-button:not(:first-child))::after {
    content: "";
    position: absolute;
    inset-block: calc((100% - var(--_sep)) / 2);
    inset-inline-start: -0.5px;
    inline-size: 1px;
    background-color: var(--pl-color-border);
  }

  :host([orientation="vertical"])
    ::slotted(pl-button:not(:first-child))::after {
    content: "";
    position: absolute;
    inset-inline: calc((100% - var(--_sep)) / 2);
    inset-block-start: -0.5px;
    block-size: 1px;
    background-color: var(--pl-color-border);
  }

  /* Each button outlines itself under forced colors: overlap the shared edge
     so it stays one line, and drop the separator. */
  @media (forced-colors: active) {
    :host(:not([orientation="vertical"]))
      ::slotted(pl-button:not(:first-child)) {
      margin-inline-start: -1px;
    }

    :host([orientation="vertical"]) ::slotted(pl-button:not(:first-child)) {
      margin-block-start: -1px;
    }

    ::slotted(pl-button)::after {
      display: none;
    }
  }
`;
