import { LitElement, html } from "lit";
import { hideWhenEmpty } from "../../behaviors/slot-presence.ts";
import { fieldsetStyles } from "./fieldset.css.ts";

/** Controls this fieldset turned off, so only those are turned back on. */
const owned = new WeakSet<Element>();

/**
 * A group of fields with a legend and a description. The host is a
 * `role="group"` named by the legend's text and described by the description's
 * text, set as `aria-label` and `aria-description`. A native
 * `<fieldset>` in the shadow root would not disable the slotted fields, which
 * are not its descendants, so `disabled` turns off every control inside, as a
 * native disabled fieldset does, including ones added later, and sets
 * `aria-disabled` on the group.
 *
 * @attr {boolean} disabled - Disables every control inside. A control that was already disabled stays so when this is cleared.
 * @slot legend - The group's name.
 * @slot description - Help text under the legend.
 * @slot - The `pl-field` elements, or any other content.
 * @csspart legend - The wrapper around the legend.
 * @csspart description - The wrapper around the description.
 * @csspart fields - The wrapper around the fields.
 */
export class PlFieldset extends LitElement {
  static override styles = fieldsetStyles;
  static override properties = {
    disabled: { type: Boolean, reflect: true },
  };

  declare disabled: boolean;

  readonly #watch = new MutationObserver(() => {
    this.#sync();
    this.#name();
  });

  constructor() {
    super();
    this.disabled = false;
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "group");
    this.#watch.observe(this, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    if (this.hasUpdated) this.#sync();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#watch.disconnect();
  }

  protected override updated() {
    // The group reports itself off, so its legend and labels read as inactive.
    if (this.disabled) this.setAttribute("aria-disabled", "true");
    else this.removeAttribute("aria-disabled");
    this.#sync();
    this.#name();
  }

  readonly #waiting = new Set<string>();

  /** Every form control and custom element inside, in the light DOM, that takes `disabled`. */
  #controls() {
    const found: Element[] = [];
    for (const el of this.querySelectorAll("*")) {
      const name = el.localName;
      if (name === "pl-fieldset") continue;
      if (!name.includes("-")) {
        if (/^(input|select|textarea|button|fieldset)$/.test(name))
          found.push(el);
      } else if (customElements.get(name)) {
        if ("disabled" in el) found.push(el);
        else if (owned.delete(el)) el.removeAttribute("disabled");
      } else {
        // Not upgraded: disabled by attribute now, checked again once defined.
        found.push(el);
        if (!this.#waiting.has(name)) {
          this.#waiting.add(name);
          void customElements.whenDefined(name).then(() => {
            this.#waiting.delete(name);
            this.#sync();
          });
        }
      }
    }
    return found;
  }

  #sync() {
    for (const el of this.#controls()) {
      if (this.disabled) {
        if (!el.hasAttribute("disabled")) {
          owned.add(el);
          el.setAttribute("disabled", "");
        }
      } else if (
        owned.has(el) &&
        !el.parentElement?.closest("pl-fieldset[disabled]")
      ) {
        owned.delete(el);
        el.removeAttribute("disabled");
      }
    }
  }

  /** Points the group at its legend and description. */
  #name() {
    const slot = (name: string) =>
      this.renderRoot
        .querySelector<HTMLSlotElement>(`slot[name=${name}]`)
        ?.assignedElements({ flatten: true })[0];
    // Text, not an id reference into the slots: Firefox crashed on those.
    const set = (attr: string, el: Element | undefined) => {
      const text = el?.textContent?.replace(/\s+/g, " ").trim();
      if (text) this.setAttribute(attr, text);
      else this.removeAttribute(attr);
    };
    set("aria-label", slot("legend"));
    set("aria-description", slot("description"));
  }

  #onSlot = (event: Event) => {
    hideWhenEmpty(event);
    this.#name();
  };

  override render() {
    return html`<div part="legend" hidden>
        <slot name="legend" @slotchange=${this.#onSlot}></slot>
      </div>
      <div part="description" hidden>
        <slot name="description" @slotchange=${this.#onSlot}></slot>
      </div>
      <div part="fields"><slot @slotchange=${() => this.#sync()}></slot></div>`;
  }
}

customElements.define("pl-fieldset", PlFieldset);

declare global {
  interface HTMLElementTagNameMap {
    "pl-fieldset": PlFieldset;
  }
}
