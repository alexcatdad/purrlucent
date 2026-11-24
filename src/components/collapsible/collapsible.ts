import { LitElement, html, nothing, svg, type PropertyValues } from "lit";
import { collapsibleStyles } from "./collapsible.css.ts";

// A slotted element of one of these kinds is the trigger itself, not a label for the built-in button.
const triggerSelector = 'button, a[href], [role="button"]';

// design/icons/chevron-right.svg
const chevron = svg`<svg class="chevron" part="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9.25 5.75 5.5 5.5q.75.75 0 1.5l-5.5 5.5" /></svg>`;

/**
 * A single disclosure: a trigger that shows and hides a block of content. The
 * trigger is a button named by the text in the `trigger` slot; it carries
 * `aria-expanded` and `aria-controls`. Space and Enter toggle it, as on any
 * button. To use your own trigger, such as a sidebar row, slot a `button`, an
 * `a[href]` or an element with `role="button"` as `slot="trigger"`: it replaces
 * the built-in button and the collapsible sets `aria-expanded`, `aria-controls`
 * and `aria-current` on it, and toggles on click, Enter and Space. The content grows and shrinks in height with `--pl-duration`; under
 * reduced motion it shows and hides at once. Closed content is hidden from
 * focus and assistive technology. For several disclosures that open one at a
 * time, handle `pl-toggle` in the app.
 *
 * @attr {boolean} open - The content is showing. It reflects, so it also follows the user's presses.
 * @attr {boolean} disabled - The trigger takes no focus and the content cannot be toggled.
 * @attr {boolean} current - The row is the current one, as a selected row in a sidebar. It fills the trigger like other current rows and sets `aria-current="true"` on the trigger.
 * @slot - The content the trigger shows and hides.
 * @slot trigger - The trigger's label: short text, optionally with an svg. Required: without it the button has no name. A slotted `button`, `a[href]` or `[role="button"]` element is the trigger itself instead, and then brings its own chevron and styling.
 * @csspart trigger - The button, or the wrapper around a slotted trigger.
 * @csspart chevron - The disclosure arrow.
 * @csspart content - The wrapper around the content.
 * @fires {CustomEvent<{ open: boolean }>} pl-toggle - The content opened or closed, by the user or by setting `open`. `detail.open` says which. It does not fire for the starting state.
 */
export class PlCollapsible extends LitElement {
  static override styles = collapsibleStyles;
  static override properties = {
    open: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    current: { type: Boolean, reflect: true },
  };

  declare open: boolean;
  declare disabled: boolean;
  declare current: boolean;

  constructor() {
    super();
    this.open = false;
    this.disabled = false;
    this.current = false;
  }

  #onSlotChange = () => this.requestUpdate();

  /** The slotted trigger element that replaces the built-in button, if any. */
  get #slotted() {
    return this.querySelector<HTMLElement>(
      `:scope > [slot="trigger"]:is(${triggerSelector})`,
    );
  }

  #onClick = (event: Event) => {
    const trigger = this.#slotted;
    if (trigger && event.composedPath().includes(trigger)) this.#toggle();
  };

  /** A slotted trigger that is not a native button answers Enter and Space itself. */
  #onKeydown = (event: KeyboardEvent) => {
    const trigger = this.#slotted;
    if (
      !trigger ||
      trigger.matches("button, a[href]") ||
      event.target !== trigger ||
      (event.key !== "Enter" && event.key !== " ")
    )
      return;
    event.preventDefault();
    this.#toggle();
  };

  #toggle() {
    if (!this.disabled) this.open = !this.open;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.addEventListener("click", this.#onClick);
    this.addEventListener("keydown", this.#onKeydown);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("click", this.#onClick);
    this.removeEventListener("keydown", this.#onKeydown);
  }

  /** The slotted trigger is in the light DOM, the content is not: wire them by element. */
  #wire(trigger: HTMLElement) {
    trigger.setAttribute("aria-expanded", String(this.open));
    const panel = this.renderRoot.querySelector("#content");
    if ("ariaControlsElements" in trigger && panel)
      (
        trigger as HTMLElement & { ariaControlsElements: Element[] }
      ).ariaControlsElements = [panel];
    if (this.current) trigger.setAttribute("aria-current", "true");
    else trigger.removeAttribute("aria-current");
    if (this.disabled) trigger.setAttribute("aria-disabled", "true");
    else trigger.removeAttribute("aria-disabled");
  }

  protected override updated(changed: PropertyValues<this>) {
    const trigger = this.#slotted;
    if (trigger) this.#wire(trigger);
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
    const head = this.#slotted
      ? html`<div class="head" part="trigger">
          <slot name="trigger" @slotchange=${this.#onSlotChange}></slot>
        </div>`
      : html`<button
          class="trigger"
          part="trigger"
          type="button"
          aria-expanded=${this.open ? "true" : "false"}
          aria-controls="content"
          aria-current=${this.current ? "true" : nothing}
          ?disabled=${this.disabled}
          @click=${() => (this.open = !this.open)}
        >
          ${chevron}<slot
            name="trigger"
            @slotchange=${this.#onSlotChange}
          ></slot>
        </button>`;
    return html`${head}
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
