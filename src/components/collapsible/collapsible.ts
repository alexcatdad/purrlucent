import { LitElement, html, svg, type PropertyValues } from "lit";
import { collapsibleStyles } from "./collapsible.css.ts";

// design/icons/chevron-right.svg
const chevron = svg`<svg class="chevron" part="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9.25 5.75 5.5 5.5q.75.75 0 1.5l-5.5 5.5" /></svg>`;

/**
 * A single disclosure: a trigger that shows and hides a block of content. The
 * trigger is a button named by the text in the `trigger` slot; it carries
 * `aria-expanded` and `aria-controls`. Space and Enter toggle it, as on any
 * button. The content grows and shrinks in height with `--pl-duration`; under
 * reduced motion it shows and hides at once. Closed content is hidden from
 * focus and assistive technology. For several disclosures that open one at a
 * time, handle `pl-toggle` in the app.
 *
 * @attr {boolean} open - The content is showing. It reflects, so it also follows the user's presses.
 * @attr {boolean} disabled - The trigger takes no focus and the content cannot be toggled.
 * @slot - The content the trigger shows and hides.
 * @slot trigger - The trigger's label: short text, optionally with an svg. Required: without it the button has no name.
 * @csspart trigger - The button.
 * @csspart chevron - The disclosure arrow.
 * @csspart content - The wrapper around the content.
 * @fires {CustomEvent<{ open: boolean }>} pl-toggle - The content opened or closed, by the user or by setting `open`. `detail.open` says which. It does not fire for the starting state.
 */
export class PlCollapsible extends LitElement {
  static override styles = collapsibleStyles;
  static override properties = {
    open: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
  };

  declare open: boolean;
  declare disabled: boolean;

  constructor() {
    super();
    this.open = false;
    this.disabled = false;
  }

  protected override updated(changed: PropertyValues<this>) {
    // The starting state is part of the page as loaded: no event.
    if (!changed.has("open") || changed.get("open") === undefined) return;
    this.dispatchEvent(
      new CustomEvent("pl-toggle", {
        detail: { open: this.open },
        bubbles: true,
        composed: true,
      }),
    );
  }

  override render() {
    return html`<button
        class="trigger"
        part="trigger"
        type="button"
        aria-expanded=${this.open ? "true" : "false"}
        aria-controls="content"
        ?disabled=${this.disabled}
        @click=${() => (this.open = !this.open)}
      >
        ${chevron}<slot name="trigger"></slot>
      </button>
      <div class="panel" id="content">
        <div class="clip">
          <div class="content" part="content"><slot></slot></div>
        </div>
      </div>`;
  }
}

customElements.define("pl-collapsible", PlCollapsible);

declare global {
  interface HTMLElementTagNameMap {
    "pl-collapsible": PlCollapsible;
  }
}
