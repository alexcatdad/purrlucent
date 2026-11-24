import { LitElement, html, nothing, svg, type PropertyValues } from "lit";
import { collapsibleStyles } from "./collapsible.css.ts";

// A slotted element of one of these kinds is the trigger itself, not a label for the built-in button.
const triggerSelector = 'button, a[href], [role="button"]';

// Ids given to content for aria-controls where element reflection is missing.
let uid = 0;

// design/icons/chevron-right.svg
const chevron = svg`<svg class="chevron" part="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9.25 5.75 5.5 5.5q.75.75 0 1.5l-5.5 5.5" /></svg>`;

/**
 * A single disclosure: a trigger that shows and hides a block of content. The
 * trigger is a button named by the text in the `trigger` slot; it carries
 * `aria-expanded` and `aria-controls`. Space and Enter toggle it, as on any
 * button. To use your own trigger, such as a sidebar row, slot a `button`, an
 * `a[href]` or an element with `role="button"` as `slot="trigger"`: it replaces
 * the built-in button and the collapsible sets `aria-expanded` and `aria-controls` on it, and `aria-current` and `aria-disabled` when it has none, and toggles on click, Enter and Space. A link trigger toggles and also follows its `href`; to only toggle, use a `button`. The content grows and shrinks in height with `--pl-duration`; under
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
    if (!trigger || !event.composedPath().includes(trigger)) return;
    if (this.disabled) event.preventDefault();
    this.#toggle();
  };

  /** A slotted trigger that is not a native button answers Enter and Space itself; a link answers Enter by navigating (and toggling, as a click) and Space here. */
  #onKeydown = (event: KeyboardEvent) => {
    const trigger = this.#slotted;
    if (!trigger || event.target !== trigger || trigger.matches("button"))
      return;
    const keys = trigger.matches("a[href]") ? [" "] : ["Enter", " "];
    if (!keys.includes(event.key)) return;
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

  #wired: HTMLElement | undefined;
  #added = new Set<string>();
  #idOn: Element | undefined;
  #tabindex: string | null | undefined;

  /** Sets an ARIA state on the consumer's trigger only when it has none, and removes only what was added here. */
  #mark(trigger: HTMLElement, name: string, on: boolean) {
    if (on) {
      if (trigger.hasAttribute(name)) return;
      trigger.setAttribute(name, "true");
      this.#added.add(name);
    } else if (this.#added.delete(name)) trigger.removeAttribute(name);
  }

  /** Points the trigger at the content: by element where supported, else by id (given to the first content child when it has none). */
  #control(trigger: HTMLElement, content: Element[]) {
    const first = content[0];
    if (Reflect.has(trigger, "ariaControlsElements")) {
      (
        trigger as HTMLElement & { ariaControlsElements: Element[] }
      ).ariaControlsElements = content;
      return;
    }
    // The first child changed: take back the id given to the old one.
    if (this.#idOn !== first) {
      this.#idOn?.removeAttribute("id");
      this.#idOn = undefined;
    }
    if (!first) {
      if (this.#added.delete("aria-controls"))
        trigger.removeAttribute("aria-controls");
      return;
    }
    if (!first.id) {
      first.id = `pl-collapsible-${++uid}`;
      this.#idOn = first;
    }
    if (
      !trigger.hasAttribute("aria-controls") ||
      this.#added.has("aria-controls")
    ) {
      trigger.setAttribute("aria-controls", first.id);
      this.#added.add("aria-controls");
    }
  }

  /** A disabled slotted trigger takes no focus: tabindex -1 now, the consumer's value back after. */
  #focusable(trigger: HTMLElement, on: boolean) {
    if (!on) {
      if (this.#tabindex === undefined) return;
      if (this.#tabindex === null) trigger.removeAttribute("tabindex");
      else trigger.setAttribute("tabindex", this.#tabindex);
      this.#tabindex = undefined;
    } else if (this.#tabindex === undefined) {
      this.#tabindex = trigger.getAttribute("tabindex");
      trigger.setAttribute("tabindex", "-1");
    }
  }

  /** Takes back everything this component put on a trigger that is being replaced. */
  #unwire(trigger: HTMLElement) {
    for (const name of this.#added) trigger.removeAttribute(name);
    this.#added.clear();
    this.#focusable(trigger, false);
    this.#idOn?.removeAttribute("id");
    this.#idOn = undefined;
  }

  /** The trigger and the content are both in the light DOM: wire them by element. */
  #wire(trigger: HTMLElement) {
    if (this.#wired !== trigger) {
      if (this.#wired) this.#unwire(this.#wired);
      this.#wired = trigger;
    }
    trigger.setAttribute("aria-expanded", String(this.open));
    this.#control(
      trigger,
      [...this.children].filter((c) => !c.slot),
    );
    this.#mark(trigger, "aria-current", this.current);
    this.#mark(trigger, "aria-disabled", this.disabled);
    this.#focusable(trigger, this.disabled);
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
