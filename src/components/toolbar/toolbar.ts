import { LitElement, html, type PropertyValues } from "lit";
import { RovingFocusController } from "../../behaviors/roving-focus.ts";
import { barSurface } from "../../surfaces/surfaces.css.ts";
import { toolbarGroupStyles, toolbarStyles } from "./toolbar.css.ts";
import { prominentIssue } from "./toolbar-rules.ts";

const isItem = (el: Element): el is HTMLElement =>
  el instanceof HTMLElement &&
  el.getAttribute("role") !== "separator" &&
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
 * @slot - Controls and `purr-toolbar-group`s. At most one control may be prominent (`variant="primary"`), and it goes last.
 * @csspart items - The row that lays out the slotted controls.
 */
export class PurrToolbar extends LitElement {
  static override styles = [barSurface, toolbarStyles];
  static override properties = {
    label: { type: String },
    scrolled: { type: Boolean, reflect: true },
  };

  /** Accessible name. Required. */
  declare label: string;
  /** Set while content is scrolled beneath the bar; shows the scroll edge. */
  declare scrolled: boolean;

  // Registers itself on the host; arrow keys, Home and End follow the text direction.
  readonly roving = new RovingFocusController(this, {
    items: () => this.#items(),
    orientation: "horizontal",
    wrap: false,
  });

  constructor() {
    super();
    this.label = "";
    this.scrolled = false;
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

  override connectedCallback() {
    super.connectedCallback();
    this.setAttribute("role", "toolbar");
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
  }
}
