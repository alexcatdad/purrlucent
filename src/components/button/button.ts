import { LitElement, html, nothing } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import { interactionStyles } from "../../behaviors/interaction.css.ts";
import { LensController } from "../../behaviors/lens.ts";
import { PressableController } from "../../behaviors/pressable.ts";
import "../spinner/spinner.ts";
import { buttonStyles } from "./button.css.ts";

export type PlButtonVariant = "primary" | "secondary" | "tinted" | "ghost";
export type PlButtonSize = "md" | "lg" | "xl";

/**
 * A button. The label is the slotted text and is required for an accessible
 * name; an `icon` button takes an `aria-label` instead. A destructive button
 * never takes the filled primary look. With `type="submit"` or `type="reset"`
 * it submits or resets the form it is in; the default `button` does neither.
 *
 * With an `href` it is a link that looks like a button: a real `a` in its
 * shadow root takes the focus, so opening in a new tab, the context menu and
 * copying the address work as on any link. The `click` reaches the host and
 * can be cancelled with `preventDefault()` for client-side routing; otherwise
 * the browser follows the link. A disabled link has no address and cannot be
 * focused. An icon link's `aria-label` moves to the inner link; set it again
 * to rename the link. `focus()` focuses the inner link. A link does not take
 * part in a toolbar's arrow-key focus yet, so keep it out of `pl-toolbar`.
 *
 * In a dialog, `default` marks the button Return activates (not from a
 * multi-line text field) and `cancel` the one Escape or Command-Period
 * activates. The default button draws as primary unless it has another
 * variant. A destructive button cannot be the default; the dialog warns.
 *
 * @attr {boolean} default - The dialog's default button: Return activates it, it draws as primary and it takes initial focus.
 * @attr {boolean} cancel - The dialog's cancel button: Escape and Command-Period activate it.
 * @attr {boolean} busy - The action is running: a spinner shows before the label, the button ignores presses and stays focusable.
 * @attr {string} href - Makes the button a link to this address.
 * @attr {string} target - Where the link opens, as on `a`.
 * @attr {string} rel - The link's relationship, as on `a`.
 * @attr {string} download - The link downloads its address, as on `a`; the value is the suggested file name.
 * @fires pl-press - When the button is activated by pointer, Enter or Space.
 * @slot - The button label, with an optional leading svg icon.
 * @csspart label - The wrapper around the label.
 * @csspart link - The inner link, when there is an `href`.
 */
export class PlButton extends LitElement {
  static formAssociated = true;
  static override styles = [interactionStyles, buttonStyles];
  static override properties = {
    variant: { reflect: true },
    type: { reflect: true },
    size: { reflect: true },
    icon: { type: Boolean, reflect: true },
    destructive: { type: Boolean, reflect: true },
    default: { type: Boolean, reflect: true },
    cancel: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    busy: { type: Boolean, reflect: true },
    href: { reflect: true },
    target: {},
    rel: {},
    download: {},
  };

  declare variant: PlButtonVariant;
  declare type: "button" | "submit" | "reset";
  declare size: PlButtonSize;
  declare icon: boolean;
  declare destructive: boolean;
  declare default: boolean;
  declare cancel: boolean;
  declare disabled: boolean;
  declare busy: boolean;
  declare href: string | null;
  declare target: string | null;
  declare rel: string | null;
  declare download: string | null;

  // :disabled also covers a disabled fieldset around the button.
  readonly pressable = new PressableController(this, {
    disabled: () => this.busy || this.matches(":disabled"),
    // A link handles Enter itself, and Space does not follow a link.
    keys: () => !this.href,
  });
  #off = false;
  #tabindex: string | null = null;
  /** Set while the host carries the role this button gave it. */
  #ownRole = false;
  /** An icon link's name, moved from the host to the inner link. */
  #linkLabel: string | null = null;

  constructor() {
    super();
    new LensController(this);
    this.variant = "secondary";
    this.type = "button";
    this.size = "md";
    this.icon = false;
    this.destructive = false;
    this.default = false;
    this.cancel = false;
    this.disabled = false;
    this.busy = false;
    this.href = null;
    this.target = null;
    this.rel = null;
    this.download = null;
    // A disabled or busy link stops its click here, so neither the browser
    // nor a router listening on the host acts on it.
    this.addEventListener(
      "click",
      (event) => {
        if (this.href && (this.busy || this.matches(":disabled"))) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      },
      { capture: true },
    );
    // Like a native button: submit or reset the form the button belongs to.
    this.addEventListener("pl-press", () => {
      if (this.href) return;
      const { form } = this.pressable.internals;
      if (this.type === "submit") form?.requestSubmit();
      else if (this.type === "reset") form?.reset();
    });
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.#ownRole = true;
    // A link moved in the page gets no role back.
    if (this.#ownRole && !this.href) this.setAttribute("role", "button");
  }

  override focus(options?: FocusOptions) {
    const link = this.href
      ? this.renderRoot?.querySelector<HTMLElement>('[part="link"]')
      : null;
    if (link) link.focus(options);
    else super.focus(options);
  }

  static override get observedAttributes() {
    return [...super.observedAttributes, "aria-label"];
  }

  override attributeChangedCallback(
    name: string,
    old: string | null,
    value: string | null,
  ) {
    super.attributeChangedCallback(name, old, value);
    if (name === "aria-label") this.requestUpdate();
  }

  formDisabledCallback() {
    this.requestUpdate();
  }

  // An icon link's name moves to the inner link before it renders.
  protected override willUpdate() {
    if (!this.href) return;
    const label = this.getAttribute("aria-label");
    if (label !== null) {
      this.#linkLabel = label;
      this.removeAttribute("aria-label");
    }
  }

  // After the update, so a changed `disabled` attribute is already reflected.
  // A tabindex set from outside (a roving group) is kept and restored.
  protected override updated() {
    if (this.busy) this.setAttribute("aria-busy", "true");
    else this.removeAttribute("aria-busy");
    if (this.href) {
      this.#asLink();
      return;
    }
    if (this.#linkLabel !== null) {
      this.setAttribute("aria-label", this.#linkLabel);
      this.#linkLabel = null;
    }
    if (this.#ownRole) this.setAttribute("role", "button");
    const off = this.matches(":disabled");
    if (off !== this.#off) {
      this.#off = off;
      if (off) {
        this.#tabindex = this.getAttribute("tabindex");
        this.tabIndex = -1;
        this.setAttribute("aria-disabled", "true");
      } else {
        if (this.#tabindex === null) this.removeAttribute("tabindex");
        else this.setAttribute("tabindex", this.#tabindex);
        this.removeAttribute("aria-disabled");
      }
    }
    if (!off && !this.hasAttribute("tabindex")) this.tabIndex = 0;
  }

  /** The inner link is the control: the host has no role, tab stop or name of its own. */
  #asLink() {
    if (this.#ownRole) this.removeAttribute("role");
    this.removeAttribute("tabindex");
    this.removeAttribute("aria-disabled");
    this.#off = false;
    this.#tabindex = null;
  }

  override render() {
    const label = html`<span part="label"
      >${
        this.busy
          ? html`<pl-spinner size="sm" aria-hidden="true"></pl-spinner>`
          : nothing
      }<slot></slot
    ></span>`;
    if (!this.href) return label;
    const off = this.matches(":disabled");
    return html`<a
      part="link"
      href=${off ? nothing : this.href}
      role=${off ? "link" : nothing}
      aria-disabled=${off ? "true" : nothing}
      aria-label=${ifDefined(this.#linkLabel ?? undefined)}
      target=${ifDefined(this.target ?? undefined)}
      rel=${ifDefined(this.rel ?? undefined)}
      download=${ifDefined(this.download ?? undefined)}
      >${label}</a
    >`;
  }
}

customElements.define("pl-button", PlButton);

declare global {
  interface HTMLElementTagNameMap {
    "pl-button": PlButton;
  }
}
