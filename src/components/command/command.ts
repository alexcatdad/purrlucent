import { LitElement, html, nothing } from "lit";
import type { PropertyValues } from "lit";
import { fireNative } from "../../behaviors/native-events.ts";
import { inputStyles } from "../input/input.css.ts";
import { filterIndexes } from "../select/match.ts";
import { commandStyles, groupStyles, itemStyles } from "./command.css.ts";

const glass = html`<svg part="glyph" viewBox="0 0 24 24" aria-hidden="true">
  <path d="M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" />
  <path d="M21 21l-6 -6" />
</svg>`;

const clearGlyph = html`<svg viewBox="0 0 24 24" aria-hidden="true">
  <path
    d="M17 3.34a10 10 0 1 1 -14.995 8.984l-.005 -.324l.005 -.324a10 10 0 0 1 14.995 -8.336zm-6.489 5.8a1 1 0 0 0 -1.218 1.567l1.292 1.293l-1.292 1.293l-.083 .094a1 1 0 0 0 1.497 1.32l1.293 -1.292l1.293 1.292l.094 .083a1 1 0 0 0 1.32 -1.497l-1.292 -1.293l1.292 -1.293l.083 -.094a1 1 0 0 0 -1.497 -1.32l-1.293 1.292l-1.293 -1.292l-.094 -.083z"
  />
</svg>`;

/** `ariaActiveDescendantElement` is missing from the DOM typings. */
type ActiveDescendantHost = HTMLInputElement & {
  ariaActiveDescendantElement: Element | null;
};

/**
 * One command in a `pl-command`. Its text is the label, and the search matches
 * against it. The command marks the active item with `data-active`; this
 * element does nothing alone.
 *
 * @attr {string} value - What `pl-select` reports. Defaults to the label.
 * @attr {boolean} disabled - Skipped by the keyboard and cannot be activated.
 * @attr {string} detail - Trailing text such as a shortcut. The `detail` slot wins.
 * @slot - The label.
 * @slot icon - A leading svg.
 * @slot detail - Trailing content, such as a shortcut.
 * @csspart label - The label wrapper.
 * @csspart detail - The trailing text wrapper.
 */
export class PlCommandItem extends LitElement {
  static override styles = itemStyles;
  static override properties = {
    value: { reflect: true },
    disabled: { type: Boolean, reflect: true },
    detail: { reflect: true },
  };

  declare value: string;
  declare disabled: boolean;
  declare detail: string;

  constructor() {
    super();
    this.value = "";
    this.disabled = false;
    this.detail = "";
  }

  /** The item's own text, without its icon or detail. */
  get label(): string {
    return [...this.childNodes]
      .filter((node) =>
        node instanceof Element ? !node.slot : node.nodeType === Node.TEXT_NODE,
      )
      .map((node) => node.textContent)
      .join("")
      .trim();
  }

  get itemValue(): string {
    return this.value || this.label;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.setAttribute("role", "option");
  }

  protected override updated() {
    if (this.disabled) this.setAttribute("aria-disabled", "true");
    else this.removeAttribute("aria-disabled");
  }

  override render() {
    return html`<slot name="icon"></slot><span part="label"><slot></slot></span
      ><span part="detail"><slot name="detail">${this.detail}</slot></span>`;
  }
}

/**
 * A labelled run of `pl-command-item` children. The group hides while the
 * search leaves none of its items showing.
 *
 * @attr {string} label - The heading, and the group's accessible name.
 * @slot - The `pl-command-item` children.
 * @csspart heading - The visible heading.
 */
export class PlCommandGroup extends LitElement {
  static override styles = groupStyles;
  static override properties = {
    label: { reflect: true },
  };

  declare label: string;

  constructor() {
    super();
    this.label = "";
  }

  override connectedCallback() {
    super.connectedCallback();
    this.setAttribute("role", "group");
  }

  protected override updated() {
    if (this.label) this.setAttribute("aria-label", this.label);
    else this.removeAttribute("aria-label");
  }

  override render() {
    return html`<div part="heading" aria-hidden="true">${this.label}</div>
      <slot></slot>`;
  }
}

/**
 * A command palette: a search field above a list of commands that is always
 * showing. It follows the editable combobox pattern with list autocomplete: a
 * native input does the editing and keeps focus, the `pl-command-item`
 * children (loose or inside `pl-command-group`) are the options, and the
 * active one is the input's active descendant. Typing hides the items whose
 * label does not contain the text, case-insensitively, and groups left empty;
 * the first item that remains becomes active, and a "No results" row shows when
 * none does. Down and Up move the active item with wrap and skip disabled
 * ones, Home and End jump to the first and last, Enter activates it, and
 * Escape clears the text. Escape with no text is left to the page, so inside a
 * `pl-dialog` it closes the dialog. Activating an item, with Enter or a click,
 * fires `pl-select`. It does not close or reset anything itself.
 *
 * Put `autofocus` on it to focus the search field when a dialog opens.
 *
 * @attr {string} label - The accessible name of the field and the list. Defaults to "Commands".
 * @attr {string} placeholder - Hint shown while the field is empty. Defaults to "Search".
 * @attr {string} query - The text in the search field.
 * @attr {string} empty-label - The text shown when no item matches. Defaults to "No results".
 * @attr {string} clear-label - The clear button's accessible name. Defaults to "Clear".
 * @slot - The `pl-command-item` and `pl-command-group` children.
 * @csspart field - The shell around the search input.
 * @csspart glyph - The magnifier.
 * @csspart control - The native input.
 * @csspart clear - The clear button.
 * @csspart list - The list of items.
 * @csspart empty - The "no results" row.
 * @fires {CustomEvent<{ query: string }>} pl-input - The search text changed through typing, Escape or the clear button. `detail.query` holds it.
 * @fires {CustomEvent<{ value: string }>} pl-select - An item was activated. `detail.value` holds its value.
 * @fires input - After each pl-input, as a native input fires it.
 */
export class PlCommand extends LitElement {
  static override shadowRootOptions = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };
  static override styles = [inputStyles, commandStyles];
  static override properties = {
    label: { reflect: true },
    placeholder: { reflect: true },
    query: { reflect: true },
    emptyLabel: { attribute: "empty-label" },
    clearLabel: { attribute: "clear-label" },
    _active: { state: true },
  };

  declare label: string;
  declare placeholder: string;
  declare query: string;
  declare emptyLabel: string;
  declare clearLabel: string;
  declare _active: PlCommandItem | null;

  readonly #internals = this.attachInternals();
  // Edits to the items, their text or their disabled state refilter.
  readonly #watch = new MutationObserver(() => this.requestUpdate());

  constructor() {
    super();
    this.label = "Commands";
    this.placeholder = "Search";
    this.query = "";
    this.emptyLabel = "No results";
    this.clearLabel = "Clear";
    this._active = null;
    this.addEventListener("click", this.#onClick);
  }

  get #items(): PlCommandItem[] {
    return [...this.querySelectorAll("pl-command-item")];
  }

  get #shown(): PlCommandItem[] {
    return this.#items.filter((item) => !item.hasAttribute("data-filtered"));
  }

  get #enabled(): PlCommandItem[] {
    return this.#shown.filter((item) => !item.disabled);
  }

  get #input(): ActiveDescendantHost {
    return this.shadowRoot!.querySelector("[part=control]")!;
  }

  get #list(): HTMLElement {
    return this.shadowRoot!.querySelector("[part=list]")!;
  }

  #emit(name: "pl-input" | "pl-select", detail: object) {
    this.dispatchEvent(
      new CustomEvent(name, { detail, bubbles: true, composed: true }),
    );
  }

  #setQuery(query: string) {
    this.query = query;
    this.#emit("pl-input", { query });
  }

  #clear() {
    this.#setQuery("");
    this.#input.focus();
    // Typing fires the inner input's own input event; clearing does not.
    fireNative(this, "input");
  }

  #choose(item: PlCommandItem) {
    if (!item.disabled) this.#emit("pl-select", { value: item.itemValue });
  }

  #onClick = (event: Event) => {
    const item = (event.target as Element).closest?.("pl-command-item");
    if (!item || !this.contains(item)) return;
    // The list cancels mousedown to keep focus, so a click must put it back.
    this.#input.focus();
    this.#choose(item);
  };

  // Only the keyboard or a new search scrolls the active row into view; a
  // pointer hovering a row while the wheel scrolls must not fight the wheel.
  #reveal = false;

  #onPointerover = (event: Event) => {
    const item = (event.target as Element).closest?.("pl-command-item");
    if (item && !item.disabled) this._active = item;
  };

  #onInput = (event: Event) => {
    this.#setQuery((event.target as HTMLInputElement).value);
  };

  #onKeydown = (event: KeyboardEvent) => {
    if (event.isComposing || event.ctrlKey || event.metaKey || event.altKey)
      return;
    const { key } = event;
    const enabled = this.#enabled;
    this.#reveal = ["ArrowDown", "ArrowUp", "Home", "End"].includes(key);
    if (key === "ArrowDown" || key === "ArrowUp") {
      event.preventDefault();
      if (!enabled.length) return;
      const down = key === "ArrowDown";
      const at = this._active ? enabled.indexOf(this._active) : -1;
      const next =
        at < 0
          ? down
            ? 0
            : enabled.length - 1
          : (at + (down ? 1 : -1) + enabled.length) % enabled.length;
      this._active = enabled[next]!;
    } else if (key === "Home" || key === "End") {
      event.preventDefault();
      this._active = (key === "Home" ? enabled[0] : enabled.at(-1)) ?? null;
    } else if (key === "Enter") {
      event.preventDefault();
      if (this._active) this.#choose(this._active);
    } else if (key === "Escape" && this.query) {
      // Without text, Escape stays with the page: a dialog closes on it.
      event.preventDefault();
      this.#clear();
    }
  };

  override connectedCallback() {
    super.connectedCallback();
    this.#watch.observe(this, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["disabled"],
    });
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#watch.disconnect();
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    const items = this.#items;
    const needle = (this.query ?? "").trim();
    const hits = new Set(
      filterIndexes(
        items.map((item) => item.label),
        needle,
      ),
    );
    items.forEach((item, i) =>
      item.toggleAttribute("data-filtered", !hits.has(i)),
    );
    for (const group of this.querySelectorAll("pl-command-group"))
      group.toggleAttribute(
        "data-filtered",
        !group.querySelector("pl-command-item:not([data-filtered])"),
      );
    // A new search starts at its first result; an active item that is gone,
    // disabled or filtered out is replaced the same way.
    const enabled = this.#enabled;
    if (
      changed.has("query") ||
      !this._active ||
      !enabled.includes(this._active)
    ) {
      this._active = enabled[0] ?? null;
      this.#reveal = true;
    }
  }

  protected override updated() {
    for (const item of this.#items)
      item.toggleAttribute("data-active", item === this._active);
    this.#input.ariaActiveDescendantElement = this._active;
    if (this.query) this.#internals.states.add("clearable");
    else this.#internals.states.delete("clearable");
    if (!this.#reveal) return;
    this.#reveal = false;
    // The first item scrolls its group's heading into view with it.
    if (this._active === this.#enabled[0]) this.#list.scrollTop = 0;
    else this._active?.scrollIntoView({ block: "nearest" });
  }

  override render() {
    const empty = !this.#shown.length;
    return html`<div part="field">
        ${glass}
        <input
          part="control"
          type="text"
          role="combobox"
          autocomplete="off"
          spellcheck="false"
          aria-expanded="true"
          aria-controls="list"
          aria-autocomplete="list"
          aria-label=${this.label}
          placeholder=${this.placeholder || nothing}
          .value=${this.query}
          @input=${this.#onInput}
          @keydown=${this.#onKeydown}
        />
        ${
          this.query
            ? html`<button
                part="clear"
                type="button"
                aria-label=${this.clearLabel}
                @mousedown=${(event: Event) => event.preventDefault()}
                @click=${() => this.#clear()}
              >
                ${clearGlyph}
              </button>`
            : nothing
        }
      </div>
      <div
        part="list"
        id="list"
        role="listbox"
        aria-label=${this.label}
        @mousedown=${(event: Event) => event.preventDefault()}
        @pointerover=${this.#onPointerover}
      >
        <slot></slot>
        ${
          empty
            ? html`<div part="empty" role="option" aria-disabled="true">
                ${this.emptyLabel}
              </div>`
            : nothing
        }
      </div>`;
  }
}

customElements.define("pl-command-item", PlCommandItem);
customElements.define("pl-command-group", PlCommandGroup);
customElements.define("pl-command", PlCommand);

declare global {
  interface HTMLElementTagNameMap {
    "pl-command-item": PlCommandItem;
    "pl-command-group": PlCommandGroup;
    "pl-command": PlCommand;
  }
}
