import { LitElement, html } from "lit";

/** Proves the toolchain end to end. Deleted in Task 10. */
export class PurrProbe extends LitElement {
  override render() {
    return html`<slot></slot>`;
  }
}

customElements.define("purr-probe", PurrProbe);

declare global {
  interface HTMLElementTagNameMap {
    "purr-probe": PurrProbe;
  }
}
