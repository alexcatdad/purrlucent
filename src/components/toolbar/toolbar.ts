import { LitElement, html, type PropertyValues } from "lit";
import { RovingFocusController } from "../../behaviors/roving-focus.ts";
import { barSurface } from "../../surfaces/surfaces.css.ts";
import {
  toolbarGroupStyles,
  toolbarSeparatorStyles,
  toolbarStyles,
  toolbarTitleStyles,
} from "./toolbar.css.ts";
import { prominentIssue } from "./toolbar-rules.ts";

/**
 * A thin rule between related controls. It is not a tab stop.
 */
export class PurrToolbarSeparator extends LitElement {
  static override styles = toolbarSeparatorStyles;

  override connectedCallback() {
    super.connectedCallback();
    this.setAttribute("role", "separator");
    // The toolbar runs left to right, so its rules are vertical.
    this.setAttribute("aria-orientation", "vertical");
  }
}

customElements.define("purr-toolbar-separator", PurrToolbarSeparator);

/**
 * The title of the window or document a toolbar belongs to, with an optional
 * subtitle. It is text, not a control, and not a tab stop.
 *
 * @slot - The title.
 * @slot subtitle - Secondary text under the title; beside it in a compact toolbar.
 */
export class PurrToolbarTitle extends LitElement {
  static override styles = toolbarTitleStyles;
  static override properties = { _subtitled: { state: true } };

  declare _subtitled: boolean;

  constructor() {
    super();
    this._subtitled = false;
  }

  override render() {
    return html`<div part="stack">
      <span part="title"><slot></slot></span>
      <span part="subtitle" ?hidden=${!this._subtitled}
        ><slot
          name="subtitle"
          @slotchange=${(event: Event) =>
            (this._subtitled =
              (event.target as HTMLSlotElement).assignedNodes().length > 0)}
        ></slot
      ></span>
    </div>`;
  }
}

customElements.define("purr-toolbar-title", PurrToolbarTitle);

/** A text field keeps the caret keys; at its edge the arrow leads out of it. */
const keepsKey = (toolbar: HTMLElement, event: KeyboardEvent) => {
  const field = event.composedPath()[0];
  if (!(field instanceof HTMLInputElement)) return false;
  const { selectionStart: start, selectionEnd: end, value } = field;
  // number, email and checkbox inputs have no caret to protect.
  if (start === null || end === null) return false;
  const rtl = toolbar.matches(":dir(rtl)");
  if (event.key === (rtl ? "ArrowLeft" : "ArrowRight"))
    return start !== end || end !== value.length;
  if (event.key === (rtl ? "ArrowRight" : "ArrowLeft"))
    return start !== end || start !== 0;
  return event.key === "Home" || event.key === "End";
};

const isItem = (el: Element): el is HTMLElement =>
  el instanceof HTMLElement &&
  !(el instanceof PurrToolbarSeparator || el instanceof PurrToolbarTitle) &&
  el.getAttribute("role") !== "separator" &&
  !el.hidden &&
  !el.hasAttribute("disabled") &&
  el.getAttribute("aria-disabled") !== "true";

/**
 * Related symbol items, such as icon-only buttons with an `aria-label`, on one shared face.
 *
 * @slot - The items.
 */
export class PurrToolbarGroup extends LitElement {
  static override styles = toolbarGroupStyles;

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "group");
  }

  override render() {
    return html`<slot></slot>`;
  }
}

customElements.define("purr-toolbar-group", PurrToolbarGroup);

/**
 * A bar of controls with one tab stop and arrow-key navigation.
 *
 * A `<purr-input type="search">` takes the toolbar's material; give it the
 * `size` of the toolbar. Inside it the caret keys edit the text, and an arrow
 * at the edge of the text moves on to the next item.
 *
 * @slot - Controls, `purr-toolbar-group`s, `purr-toolbar-separator`s and a `purr-toolbar-title`. At most one control may be prominent (`variant="primary"`), and it goes last.
 * @csspart items - The row that lays out the slotted controls.
 */
export class PurrToolbar extends LitElement {
  static override styles = [barSurface, toolbarStyles];
  static override properties = {
    label: { type: String },
    scrolled: { type: Boolean, reflect: true },
    size: { reflect: true },
  };

  /** Accessible name. Required. */
  declare label: string;
  /** `xl` (default) or the compact `md`. Give the controls the same `size`. */
  declare size: "md" | "xl";
  /** Set while content is scrolled beneath the bar; shows the scroll edge. */
  declare scrolled: boolean;

  // Registers itself on the host; arrow keys, Home and End follow the text direction.
  readonly roving = new RovingFocusController(this, {
    items: () => this.#items(),
    orientation: "horizontal",
    wrap: false,
    ignore: (event) => keepsKey(this, event),
  });

  constructor() {
    super();
    this.label = "";
    this.scrolled = false;
    this.size = "xl";
  }

  #slotted(): Element[] {
    return [
      ...(this.shadowRoot?.querySelector("slot")?.assignedElements({
        flatten: true,
      }) ?? []),
    ];
  }

  #items(): HTMLElement[] {
    return this.#slotted()
      .flatMap((el) => (el instanceof PurrToolbarGroup ? [...el.children] : el))
      .filter(isItem);
  }

  // The tab stop follows which items are enabled, so an item that is disabled
  // or enabled, added or removed inside a group updates it too.
  readonly #watcher = new MutationObserver(() => this.requestUpdate());

  override connectedCallback() {
    super.connectedCallback();
    this.setAttribute("role", "toolbar");
    this.#watcher.observe(this, {
      attributes: true,
      attributeFilter: ["disabled", "aria-disabled", "hidden"],
      childList: true,
      subtree: true,
    });
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#watcher.disconnect();
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    if (changed.has("label")) {
      if (this.label) this.setAttribute("aria-label", this.label);
      else {
        this.removeAttribute("aria-label");
        console.warn("purr-toolbar needs a label.");
      }
    }
  }

  #onSlotChange() {
    const issue = prominentIssue(
      this.#slotted().map((el) => el.getAttribute("variant") === "primary"),
    );
    if (issue) console.warn(`purr-toolbar: ${issue}`);
    this.requestUpdate();
  }

  override render() {
    return html`<div part="items">
      <slot @slotchange=${this.#onSlotChange}></slot>
    </div>`;
  }
}

customElements.define("purr-toolbar", PurrToolbar);

declare global {
  interface HTMLElementTagNameMap {
    "purr-toolbar": PurrToolbar;
    "purr-toolbar-group": PurrToolbarGroup;
    "purr-toolbar-separator": PurrToolbarSeparator;
    "purr-toolbar-title": PurrToolbarTitle;
  }
}
