import { LitElement, html, type PropertyValues } from "lit";
import { LensController } from "../../behaviors/lens.ts";
import { RovingFocusController } from "../../behaviors/roving-focus.ts";
import { barSurface } from "../../surfaces/surfaces.css.ts";
import {
  toolbarGroupStyles,
  toolbarSeparatorStyles,
  toolbarSpacerStyles,
  toolbarStyles,
  toolbarTitleStyles,
} from "./toolbar.css.ts";
import { prominentIssue } from "./toolbar-rules.ts";

/**
 * A thin rule between related controls. It is not a tab stop.
 */
export class PlToolbarSeparator extends LitElement {
  static override styles = toolbarSeparatorStyles;

  override connectedCallback() {
    super.connectedCallback();
    this.setAttribute("role", "separator");
    // The toolbar runs left to right, so its rules are vertical.
    this.setAttribute("aria-orientation", "vertical");
  }
}

customElements.define("pl-toolbar-separator", PlToolbarSeparator);

/**
 * Free space between items. Items before it stay at the leading edge and items
 * after it move to the trailing edge; two spacers leave a center area. It is not
 * a tab stop and is hidden from assistive technology.
 */
export class PlToolbarSpacer extends LitElement {
  static override styles = toolbarSpacerStyles;

  override connectedCallback() {
    super.connectedCallback();
    this.setAttribute("aria-hidden", "true");
  }
}

customElements.define("pl-toolbar-spacer", PlToolbarSpacer);

/**
 * The title of the window or document a toolbar belongs to, with an optional
 * subtitle. It is text, not a control, and not a tab stop. A long title shrinks
 * to at most half the bar and ends in an ellipsis; its full text is still the
 * accessible name.
 *
 * @slot - The title.
 * @slot subtitle - Secondary text under the title; beside it in a compact toolbar.
 */
export class PlToolbarTitle extends LitElement {
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

customElements.define("pl-toolbar-title", PlToolbarTitle);

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

const isControl = (el: Element): el is HTMLElement =>
  el instanceof HTMLElement &&
  !(
    el instanceof PlToolbarSeparator ||
    el instanceof PlToolbarSpacer ||
    el instanceof PlToolbarTitle
  ) &&
  el.getAttribute("role") !== "separator";

const isItem = (el: Element): el is HTMLElement =>
  isControl(el) &&
  !el.hidden &&
  !el.hasAttribute("disabled") &&
  el.getAttribute("aria-disabled") !== "true";

const hasValue = (el: Element, name: string) => el.getAttribute(name)?.trim();

/** A name from an attribute, text, or a labelled or described descendant. */
const isNamed = (item: HTMLElement) =>
  ["aria-label", "aria-labelledby", "title", "label"].some((name) =>
    hasValue(item, name),
  ) ||
  item.textContent?.trim() ||
  [...item.querySelectorAll("[aria-label], img[alt]")].some(
    (el) => hasValue(el, "aria-label") || hasValue(el, "alt"),
  );

/**
 * Related symbol items, such as icon-only buttons with an `aria-label`, on one shared face.
 *
 * @slot - The items.
 */
export class PlToolbarGroup extends LitElement {
  static override styles = toolbarGroupStyles;

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "group");
  }

  override render() {
    return html`<slot></slot>`;
  }
}

customElements.define("pl-toolbar-group", PlToolbarGroup);

/**
 * A bar of controls with one tab stop and arrow-key navigation.
 *
 * A `<pl-input type="search">` takes the toolbar's material; give it the
 * `size` of the toolbar. Inside it the caret keys edit the text, and an arrow
 * at the edge of the text moves on to the next item.
 *
 * For a Back or Close item, import `backGlyph` or `closeGlyph` from
 * `purrlucent` and slot it into an icon `pl-button` with an `aria-label`.
 * The Back chevron points left; mirror it with `scaleX(-1)` under
 * right-to-left.
 *
 * @slot - Controls, `pl-toolbar-group`s, `pl-toolbar-separator`s, `pl-toolbar-spacer`s and a `pl-toolbar-title`. At most one control may be prominent (`variant="primary"`), and it goes last.
 * @csspart items - The row that lays out the slotted controls.
 */
export class PlToolbar extends LitElement {
  static override styles = [barSurface, toolbarStyles];
  static override properties = {
    label: { type: String },
    scrolled: { type: Boolean, reflect: true },
    size: { reflect: true },
    floating: { type: Boolean, reflect: true },
  };

  /** Accessible name. Required. */
  declare label: string;
  /** A capsule that floats over the content, with a shadow under glass. */
  declare floating: boolean;
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
    new LensController(this);
    this.label = "";
    this.scrolled = false;
    this.size = "xl";
    this.floating = false;
  }

  #slotted(): Element[] {
    return [
      ...(this.shadowRoot?.querySelector("slot")?.assignedElements({
        flatten: true,
      }) ?? []),
    ];
  }

  #controls(): Element[] {
    return this.#slotted().flatMap((el) =>
      el instanceof PlToolbarGroup ? [...el.children] : el,
    );
  }

  #items(): HTMLElement[] {
    return this.#controls().filter(isItem);
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
        console.warn("pl-toolbar needs a label.");
      }
    }
  }

  readonly #unnamed = new WeakSet<HTMLElement>();

  // Items added later are covered too, since the watcher requests an update.
  // Disabled and hidden items are checked too; `label` names a field such as
  // `pl-input`.
  protected override updated() {
    for (const item of this.#controls().filter(isControl)) {
      if (this.#unnamed.has(item) || isNamed(item)) continue;
      this.#unnamed.add(item);
      console.warn(
        "pl-toolbar: an item needs an accessible name (aria-label or text).",
      );
    }
  }

  #onSlotChange() {
    const issue = prominentIssue(
      this.#slotted().map((el) => el.getAttribute("variant") === "primary"),
    );
    if (issue) console.warn(`pl-toolbar: ${issue}`);
    // A title between two spacers is centered on the bar, not on the room the
    // items on either side leave it.
    const slotted = this.#slotted();
    slotted.forEach((el, i) => {
      if (el instanceof PlToolbarTitle)
        el.toggleAttribute(
          "data-centered",
          slotted[i - 1] instanceof PlToolbarSpacer &&
            slotted[i + 1] instanceof PlToolbarSpacer,
        );
    });
    this.requestUpdate();
  }

  override render() {
    return html`<div part="items">
      <slot @slotchange=${this.#onSlotChange}></slot>
    </div>`;
  }
}

customElements.define("pl-toolbar", PlToolbar);

declare global {
  interface HTMLElementTagNameMap {
    "pl-toolbar": PlToolbar;
    "pl-toolbar-group": PlToolbarGroup;
    "pl-toolbar-separator": PlToolbarSeparator;
    "pl-toolbar-spacer": PlToolbarSpacer;
    "pl-toolbar-title": PlToolbarTitle;
  }
}
