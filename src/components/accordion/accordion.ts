import { LitElement, html, nothing, svg, type PropertyValues } from "lit";
import { RovingFocusController } from "../../behaviors/roving-focus.ts";
import { accordionStyles, itemStyles } from "./accordion.css.ts";

// design/icons/chevron-right.svg
const chevron = svg`<svg class="chevron" part="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9.25 5.75 5.5 5.5q.75.75 0 1.5l-5.5 5.5" /></svg>`;

/** APG: with more than six panels, region landmarks add noise, so they are left off. */
const MAX_REGIONS = 6;

/**
 * One section of a `pl-accordion`: a heading that holds a disclosure button,
 * and a panel the button shows and hides. The default slot is the panel
 * content. Give every item a `heading` (or a `heading` slot) and a `value`.
 * A closed panel is hidden from sight and from assistive technology.
 *
 * @attr {string} heading - The text of the disclosure button. For richer content use the `heading` slot.
 * @attr {string} value - Identifies the item in `pl-toggle`.
 * @attr {boolean} open - The panel is shown. The person's click changes it; set it to open or close the item from code.
 * @attr {boolean} disabled - The button takes no focus and the panel cannot be toggled. Arrow keys skip it.
 * @slot - The panel content.
 * @slot heading - Rich content for the disclosure button, instead of `heading`.
 * @csspart heading - The heading element that wraps the button.
 * @csspart trigger - The disclosure button.
 * @csspart chevron - The disclosure arrow.
 * @csspart label - The wrapper around the button text.
 * @csspart panel - The region that holds the content.
 * @csspart content - The padded content box inside the panel.
 * @fires {CustomEvent<{ value: string, open: boolean }>} pl-toggle - The person opened or closed this item. `detail.value` is the item's value and `detail.open` the new state. It bubbles, so the accordion can listen for it.
 */
export class PlAccordionItem extends LitElement {
  // Focusing the item, as the accordion's arrow keys do, focuses its button.
  static override shadowRootOptions = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };
  static override styles = itemStyles;
  static override properties = {
    heading: { type: String },
    value: { type: String, reflect: true },
    open: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
  };
  declare heading: string;
  declare value: string;
  declare open: boolean;
  declare disabled: boolean;

  constructor() {
    super();
    this.heading = "";
    this.value = "";
    this.open = false;
    this.disabled = false;
  }

  // Text of the heading slot, which names the panel region.
  #slotted = "";

  #onHeadingSlot = (event: Event) => {
    this.#slotted = (event.target as HTMLSlotElement)
      .assignedNodes({ flatten: true })
      .map((node) => node.textContent ?? "")
      .join("")
      .replace(/\s+/g, " ")
      .trim();
    this.requestUpdate();
  };

  #toggle = () => {
    this.open = !this.open;
    this.dispatchEvent(
      new CustomEvent("pl-toggle", {
        detail: { value: this.value, open: this.open },
        bubbles: true,
        composed: true,
      }),
    );
  };

  protected override updated(changed: PropertyValues<this>) {
    // Opening one item, from a click or from code, closes the others.
    if (changed.has("open") && this.open)
      this.closest("pl-accordion")?.closeOthers(this);
  }

  override render() {
    const group = this.closest("pl-accordion");
    const level = Math.min(6, Math.max(1, Math.round(group?.level ?? 3) || 3));
    const region = (group?.items.length ?? 0) <= MAX_REGIONS;
    return html`
      <div class="heading" part="heading" role="heading" aria-level=${level}>
        <button
          id="trigger"
          class="trigger"
          part="trigger"
          type="button"
          aria-expanded=${this.open ? "true" : "false"}
          aria-controls="panel"
          ?disabled=${this.disabled}
          @click=${this.#toggle}
        >
          ${chevron}
          <span class="label" part="label"
            >${this.heading}<slot
              name="heading"
              @slotchange=${this.#onHeadingSlot}
            ></slot
          ></span>
        </button>
      </div>
      <div
        id="panel"
        class="panel"
        part="panel"
        role=${region ? "region" : nothing}
        aria-label=${region ? `${this.heading} ${this.#slotted}`.trim() : nothing}
      >
        <div class="inner">
          <div class="content" part="content"><slot></slot></div>
        </div>
      </div>
    `;
  }
}

/**
 * A stack of disclosure sections: each `pl-accordion-item` is a heading with a
 * button that shows and hides its panel. By default opening one closes the
 * others; `multiple` lets several stay open. Enter and Space toggle the
 * focused button. Every button is a tab stop, and, as the APG's optional
 * extras, Up and Down move among the buttons (wrapping), Home and End go to
 * the first and last. `level` sets the heading level of every item so the page
 * outline stays correct.
 *
 * @attr {boolean} multiple - Several items may be open at once.
 * @attr {number} level - The heading level, 1 to 6, of every item's heading. Defaults to 3.
 * @slot - `pl-accordion-item` elements.
 * @fires {CustomEvent<{ value: string, open: boolean }>} pl-toggle - The person opened or closed an item. It bubbles from the item; `detail.value` is the item's value and `detail.open` the new state. In single mode the items it closes fire nothing.
 */
export class PlAccordion extends LitElement {
  static override styles = accordionStyles;
  static override properties = {
    multiple: { type: Boolean, reflect: true },
    level: { type: Number, reflect: true },
  };
  declare multiple: boolean;
  declare level: number;
  readonly #roving = new RovingFocusController(this, {
    items: () => this.items.filter((item) => !item.disabled),
    orientation: "vertical",
    wrap: true,
    tabStops: "all",
    // Only keys from this accordion's own buttons: not panel content, not a nested accordion.
    ignore: (event) => {
      const origin = event.composedPath()[0];
      const root = origin instanceof Element ? origin.getRootNode() : null;
      return !(
        origin instanceof HTMLButtonElement &&
        root instanceof ShadowRoot &&
        root.host.parentElement === this
      );
    },
  });

  constructor() {
    super();
    this.multiple = false;
    this.level = 3;
  }

  /** The items of this accordion, in order. */
  get items(): PlAccordionItem[] {
    return [
      ...this.querySelectorAll<PlAccordionItem>(":scope > pl-accordion-item"),
    ];
  }

  /** @internal Closes every open item but `keep`, when only one may be open. */
  closeOthers(keep: PlAccordionItem) {
    if (this.multiple) return;
    for (const item of this.items) if (item !== keep) item.open = false;
  }

  #syncItems = () => {
    // The first open item stays open; the heading level and region count are read at render.
    const [first] = this.items.filter((item) => item.open);
    if (first) this.closeOthers(first);
    for (const item of this.items) item.requestUpdate();
  };

  protected override updated(changed: PropertyValues<this>) {
    if (changed.has("level") || changed.has("multiple")) this.#syncItems();
  }

  override render() {
    return html`<slot @slotchange=${this.#syncItems}></slot>`;
  }
}

customElements.define("pl-accordion-item", PlAccordionItem);
customElements.define("pl-accordion", PlAccordion);

declare global {
  interface HTMLElementTagNameMap {
    "pl-accordion-item": PlAccordionItem;
    "pl-accordion": PlAccordion;
  }
}
