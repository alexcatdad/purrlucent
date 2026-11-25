import { LensController } from "../../behaviors/lens.ts";
import { LitElement, html } from "lit";
import { inputGroupStyles } from "./input-group.css.ts";

type Field = HTMLElement & { updateComplete: Promise<boolean> };

/**
 * One field border and focus ring around a `pl-input` or `pl-textarea` and the
 * addons beside it: text, an svg icon or a `pl-button`. The field keeps its own
 * label, accessible name, value, validation and events; the group only draws
 * the shared edge. Slot an addon as `slot="start"` or `slot="end"`; they
 * follow the text direction. Text and icons are not focusable; a button is a
 * tab stop before or after the field. Mark an svg icon `aria-hidden="true"`.
 * To describe the field with addon text, give the addon an `id` and list it in
 * the field's `aria-describedby`; the group passes that text on to the control.
 *
 * @slot - The `pl-input` or `pl-textarea`.
 * @slot start - An addon before the field.
 * @slot end - An addon after the field.
 * @csspart shell - The box behind the field and addons that draws the edge, fill and ring.
 */
export class PlInputGroup extends LitElement {
  static override styles = inputGroupStyles;

  readonly #internals = this.attachInternals();
  readonly #resize = new ResizeObserver(() => this.#measure());
  readonly #watch = new MutationObserver(() => this.#describe());
  readonly #track = new MutationObserver(() => this.#sync());
  #field: Field | undefined;

  constructor() {
    super();
    new LensController(this, "[part=shell]");
    this.addEventListener("focusin", (event) =>
      this.#setState("focused", event.target === this.#field),
    );
    this.addEventListener("focusout", () => this.#setState("focused", false));
  }

  override connectedCallback() {
    super.connectedCallback();
    this.#watch.observe(this, {
      attributes: true,
      attributeFilter: ["aria-describedby"],
      childList: true,
      subtree: true,
      characterData: true,
    });
    this.#adopt();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#watch.disconnect();
    this.#resize.disconnect();
    this.#track.disconnect();
    this.#field?.removeAttribute("data-grouped");
  }

  #setState(name: string, on: boolean) {
    if (on) this.#internals.states.add(name);
    else this.#internals.states.delete(name);
  }

  /** `:host(:has())` never matches, so the field's traits become states of the group. */
  #sync() {
    const field = this.#field;
    this.#setState("textarea", field?.localName === "pl-textarea");
    this.#setState("xl", field?.getAttribute("size") === "xl");
    this.#setState("invalid", !!field?.matches(":state(user-invalid)"));
    this.#setState("disabled", !!field?.matches(":disabled"));
  }

  /** The shell and addons follow the field row, which a label and a message move. */
  #measure() {
    const row = this.#field?.shadowRoot?.querySelector('[part="field"]');
    if (!row) return;
    const group = this.getBoundingClientRect();
    const box = row.getBoundingClientRect();
    this.style.setProperty("--_top", `${box.top - group.top}px`);
    this.style.setProperty("--_h", `${box.height}px`);
  }

  /**
   * Addon text the field lists in `aria-describedby`, set as `aria-description`
   * on the control. While the field shows an error message the control's own
   * `aria-describedby` wins, so the message is read and the addon text is not.
   */
  async #describe() {
    const field = this.#field;
    if (!field) return;
    await field.updateComplete;
    const control = field.shadowRoot?.querySelector("[part=control]");
    if (!control) return;
    const ids = (field.getAttribute("aria-describedby") ?? "")
      .split(/\s+/)
      .filter(Boolean);
    const text = ids
      .map((id) => this.querySelector(`[slot][id="${CSS.escape(id)}"]`))
      .map((addon) => addon?.textContent?.replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .join(" ");
    if (text) control.setAttribute("aria-description", text);
    else control.removeAttribute("aria-description");
  }

  #onSlotChange = (event: Event) => {
    const [field] = (event.target as HTMLSlotElement)
      .assignedElements()
      .filter((el) => el.matches("pl-input, pl-textarea"));
    if (field === this.#field) return;
    this.#field?.removeAttribute("data-grouped");
    this.#resize.disconnect();
    this.#track.disconnect();
    this.#field = field as Field | undefined;
    this.#sync();
    this.#adopt();
  };

  /** Group the field and follow its size; runs on a new field and on reconnect. */
  #adopt() {
    const grouped = this.#field;
    if (!grouped) return;
    grouped.setAttribute("data-grouped", "");
    this.#resize.observe(this);
    this.#resize.observe(grouped);
    this.#track.observe(grouped, {
      attributes: true,
      attributeFilter: ["size", "disabled"],
    });
    void grouped.updateComplete.then(() => {
      const row = grouped.shadowRoot?.querySelector('[part="field"]');
      if (row) this.#resize.observe(row);
      // The control's own `aria-invalid` and `disabled` follow validation and a disabled fieldset.
      if (grouped.shadowRoot)
        this.#track.observe(grouped.shadowRoot, {
          attributes: true,
          attributeFilter: ["aria-invalid", "disabled"],
          subtree: true,
        });
      this.#sync();
      this.#measure();
      void this.#describe();
    });
  }

  /** A click on a text or icon addon edits the field, as a click on its shell does. */
  #onAddonClick = (event: Event) => {
    const hit = event.target as Element;
    if (!hit.closest("button, a, input, select, textarea, pl-button"))
      this.#field?.focus();
  };

  override render() {
    return html`<div part="shell"></div>
      <slot name="start" @click=${this.#onAddonClick}></slot>
      <slot @slotchange=${this.#onSlotChange}></slot>
      <slot name="end" @click=${this.#onAddonClick}></slot>`;
  }
}

customElements.define("pl-input-group", PlInputGroup);

declare global {
  interface HTMLElementTagNameMap {
    "pl-input-group": PlInputGroup;
  }
}
