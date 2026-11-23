import { LitElement, html, nothing } from "lit";
import { errorGlyph } from "../../behaviors/glyphs.ts";
import { idOf } from "../../behaviors/ids.ts";
import { hideWhenEmpty } from "../../behaviors/slot-presence.ts";
import { fieldStyles } from "./field.css.ts";
import "./fieldset.ts";

export * from "./fieldset.ts";

/** What the field names and describes: the first match inside the slotted content. */
const CONTROLS =
  "input, select, textarea, pl-input, pl-textarea, pl-number-field, pl-select, pl-combobox, pl-date-picker, pl-checkbox, pl-switch, pl-slider, pl-radio-group, pl-toggle-group, [role]:not(button, pl-button)";

/** A control the label turns on and off; any other control takes focus. */
const TOGGLES =
  "pl-checkbox, pl-switch, input[type=checkbox], input[type=radio]";

const text = (el: Element) => el.textContent?.replace(/\s+/g, " ").trim() ?? "";

const slotted = (root: ShadowRoot, name: string) =>
  root
    .querySelector<HTMLSlotElement>(
      `slot${name ? `[name=${name}]` : ":not([name])"}`,
    )
    ?.assignedElements({ flatten: true }) ?? [];

type Control = HTMLElement & {
  label?: string;
  updateComplete?: Promise<boolean>;
  requestUpdate?: () => void;
};

/**
 * Lays out and wires a label, a control, a description and an error message
 * for a control that does not carry its own label: a native input, a third
 * party element, or a `pl-` control in a custom layout. The slotted elements
 * live in the light DOM, so the field gives the label, description and error an
 * `id` when they have none and points the control at them.
 *
 * - A control with its own role (a native input, `pl-checkbox`, `pl-switch`,
 *   `pl-slider`, `pl-radio-group`) gets `aria-labelledby`, `aria-describedby`,
 *   and, while `invalid`, `aria-invalid` and `aria-errormessage`.
 * - A `pl-input`, `pl-textarea`, `pl-number-field`, `pl-select`, `pl-combobox`
 *   or `pl-date-picker` keeps its edit control in a shadow root that an id
 *   reference cannot reach. A slotted `<label>` gets `for` pointing at the host,
 *   which names the control; the description, and the error while `invalid`, go
 *   to the control's `aria-description`, and `aria-invalid` is set on it.
 *   A label that is not a `<label>` is copied to the control's `label`.
 * - A click on the label turns a checkbox, switch or radio on or off and
 *   focuses any other control.
 *
 * Use the field or the control's own validation message, not both: the field
 * shows the `error` slot while `invalid`, and a `pl-input` shows its own
 * message after interaction.
 *
 * @attr {string} orientation - `vertical` (default), `horizontal` or `responsive`. Horizontal puts the label beside the control, and before it for a checkbox or switch, which the field puts first. Responsive is horizontal when the field is at least 32rem wide.
 * @attr {boolean} invalid - Shows the `error` slot and marks the control invalid.
 * @slot label - The visible label, ideally a `<label>`.
 * @slot - The control. A wrapper such as `pl-input-group` is fine; the field finds the control inside it.
 * @slot description - Help text under the control.
 * @slot error - The error message, shown while `invalid`. Say what is wrong and how to fix it.
 * @csspart base - The grid that places the parts.
 * @csspart label - The wrapper around the label.
 * @csspart control - The wrapper around the control.
 * @csspart description - The wrapper around the description.
 * @csspart error - The icon and error message while `invalid`.
 */
export class PlField extends LitElement {
  static override styles = fieldStyles;
  static override properties = {
    orientation: { reflect: true },
    invalid: { type: Boolean, reflect: true },
    _hasError: { state: true },
  };

  declare orientation: "vertical" | "horizontal" | "responsive";
  declare invalid: boolean;
  declare _hasError: boolean;

  readonly #internals = this.attachInternals();
  readonly #watch = new MutationObserver(() => this.#wire());
  /** What this field wrote, so it can merge with the author's values and take its own back. */
  readonly #wrote = new Map<string, string[]>();
  #control: Control | undefined;
  #inner: Element | undefined;
  #innerWatch: MutationObserver | undefined;
  /** The `for` this field wrote on each label, so an author's own `for` is left alone. */
  #labelFor = new WeakMap<Element, string>();
  #waiting = new Set<string>();

  constructor() {
    super();
    this.orientation = "vertical";
    this.invalid = false;
    this._hasError = false;
    this.addEventListener("click", this.#onClick);
  }

  override connectedCallback() {
    super.connectedCallback();
    this.#watch.observe(this, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    if (this.hasUpdated) this.#wire();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#watch.disconnect();
    this.#innerWatch?.disconnect();
  }

  protected override willUpdate() {
    this.orientation ??= "vertical";
  }

  protected override updated() {
    this.#wire();
  }

  /** The control: the slotted element, or the first control inside a wrapper. */
  #find() {
    const [first] = slotted(this.renderRoot as ShadowRoot, "");
    if (!first) return undefined;
    return (
      first.matches(CONTROLS) ? first : (first.querySelector(CONTROLS) ?? first)
    ) as Control;
  }

  /** Sets a token list attribute, keeping tokens the author wrote. */
  #tokens(el: Element, name: string, ids: string[]) {
    const before = this.#wrote.get(name) ?? [];
    const own = (el.getAttribute(name) ?? "")
      .split(/\s+/)
      .filter((id) => id && !before.includes(id));
    const next = [...own, ...ids];
    if (next.length) el.setAttribute(name, next.join(" "));
    else el.removeAttribute(name);
    this.#wrote.set(name, ids);
  }

  #wire() {
    const root = this.renderRoot as ShadowRoot;
    const [label] = slotted(root, "label");
    const [description] = slotted(root, "description");
    const errors = slotted(root, "error");
    const control = this.#find();
    const showError = this.invalid && errors.length > 0;

    if (control !== this.#control) {
      this.#wrote.clear();
      this.#wroteInner.clear();
      this.#innerWatch?.disconnect();
      this.#inner = undefined;
      this.#control = control;
    }
    this.#toggle("control-first", !!control?.matches(TOGGLES));
    if (!control) return;

    const labelId = label && idOf(label, "pl-field-label");
    const descId = description && idOf(description, "pl-field-description");
    const errorIds = errors.map((el) => idOf(el, "pl-field-error"));
    const name = control.localName;
    if (name.includes("-") && !customElements.get(name)) {
      // Not upgraded yet: wire again once it is, as nothing else will signal it.
      if (!this.#waiting.has(name)) {
        this.#waiting.add(name);
        void customElements.whenDefined(name).then(() => {
          this.#waiting.delete(name);
          this.#wire();
        });
      }
      return;
    }
    const delegated = !!control.shadowRoot?.delegatesFocus;

    if (label?.localName === "label") {
      const id = idOf(control, "pl-field-control");
      const current = label.getAttribute("for");
      if (
        current !== id &&
        (!current || current === this.#labelFor.get(label))
      ) {
        label.setAttribute("for", id);
        this.#labelFor.set(label, id);
        // The control reads its labels when it renders.
        control.requestUpdate?.();
      }
    }

    if (delegated) {
      // A text control cannot be reached by an id from here: name it by
      // `<label for>` or `label`, and describe its inner control by text.
      for (const attr of [
        "aria-labelledby",
        "aria-describedby",
        "aria-errormessage",
      ])
        this.#tokens(control, attr, []);
      if (label && label.localName !== "label" && "label" in control)
        control.label = text(label);
      const message = [
        description ? text(description) : "",
        showError ? errors.map(text).join(" ") : "",
      ]
        .filter(Boolean)
        .join(" ");
      void this.#decorate(control, message, this.invalid);
    } else {
      if (labelId) this.#tokens(control, "aria-labelledby", [labelId]);
      this.#tokens(control, "aria-describedby", [
        ...(descId ? [descId] : []),
        ...(showError ? errorIds : []),
      ]);
      this.#tokens(control, "aria-errormessage", showError ? errorIds : []);
      if (this.invalid) control.setAttribute("aria-invalid", "true");
      else if (
        control.getAttribute("aria-invalid") === "true" &&
        this.#invalidSet
      )
        control.removeAttribute("aria-invalid");
      this.#invalidSet = this.invalid;
    }
  }

  #invalidSet = false;

  /** `aria-description` and `aria-invalid` on the edit control inside a text control's shadow root. */
  async #decorate(control: Control, message: string, invalid: boolean) {
    await control.updateComplete;
    const inner = control.shadowRoot?.querySelector(
      "[part=control], [part=trigger]",
    );
    if (!inner || control !== this.#control || !this.isConnected) return;
    const apply = () => {
      const set = (name: string, value: string | undefined) => {
        if (value === undefined) {
          if (inner.hasAttribute(name) && this.#wroteInner.has(name)) {
            inner.removeAttribute(name);
            this.#wroteInner.delete(name);
          }
        } else if (inner.getAttribute(name) !== value) {
          inner.setAttribute(name, value);
          this.#wroteInner.add(name);
        }
      };
      set("aria-description", message || undefined);
      set("aria-invalid", invalid ? "true" : undefined);
    };
    apply();
    // The control rewrites its own aria-invalid after each update.
    this.#inner = inner;
    this.#innerWatch?.disconnect();
    this.#innerWatch = new MutationObserver(apply);
    this.#innerWatch.observe(inner, {
      attributes: true,
      attributeFilter: ["aria-invalid", "aria-description"],
    });
  }

  readonly #wroteInner = new Set<string>();

  #toggle(name: string, on: boolean) {
    if (on) this.#internals.states.add(name);
    else this.#internals.states.delete(name);
  }

  /** A click on the label, whatever element it is, acts on the control once. */
  #onClick = (event: Event) => {
    const control = this.#control;
    const [label] = slotted(this.renderRoot as ShadowRoot, "label");
    if (!control || !label || !event.composedPath().includes(label)) return;
    const hit = event.target as Element;
    if (hit.closest("a, button, input, select, textarea, pl-button")) return;
    // The label's own activation would click or focus the control a second time.
    event.preventDefault();
    if (control.matches(":disabled") || control.ariaDisabled === "true") return;
    if (control.matches(TOGGLES)) control.click();
    else control.focus();
  };

  #onSlot = (event: Event) => {
    hideWhenEmpty(event);
    this.#wire();
  };

  #onError = (event: Event) => {
    this._hasError =
      (event.target as HTMLSlotElement).assignedElements().length > 0;
    this.#wire();
  };

  override render() {
    return html`<div part="base">
      <div part="label" hidden>
        <slot name="label" @slotchange=${this.#onSlot}></slot>
      </div>
      <div part="control">
        <slot @slotchange=${() => this.#wire()}></slot>
      </div>
      <div part="description" hidden>
        <slot name="description" @slotchange=${this.#onSlot}></slot>
      </div>
      <div
        part="error"
        ?hidden=${!(this.invalid && this._hasError)}
        role=${this.invalid && this._hasError ? "alert" : nothing}
      >
        ${errorGlyph}<slot name="error" @slotchange=${this.#onError}></slot>
      </div>
    </div>`;
  }
}

customElements.define("pl-field", PlField);

declare global {
  interface HTMLElementTagNameMap {
    "pl-field": PlField;
  }
}
