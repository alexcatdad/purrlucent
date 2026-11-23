import { LitElement, html, type PropertyValues } from "lit";
import { PlMenu } from "../menu/menu.ts";
import { contextMenuStyles } from "./context-menu.css.ts";

const LONG_PRESS_MS = 500;
/** How far a finger may drift, in CSS pixels, before it is a drag and not a press. */
const DRIFT = 10;

/**
 * A region with a context menu. The default slot is the region. A `pl-menu`
 * in the `menu` slot is the menu: it opens with its corner at the pointer on
 * a right-click or Control-click, at the finger after a long press, and from
 * the keyboard with Shift+F10 or the Context Menu key while the region or
 * something in it has focus, at the start edge below the focused element. It
 * flips to stay in the viewport. Escape and a press outside close it and
 * focus returns to where it came from. The items, separators, labels,
 * submenus, keys and `pl-select` are `pl-menu`'s.
 *
 * The browser's own menu is suppressed only while this one handles the event:
 * not when `disabled`, when there is no menu, or inside an inner element that
 * already handled it (a nested `pl-context-menu` wins). A long press sends a
 * `contextmenu` event to the pressed element, so a listener sees every way in
 * through one event.
 *
 * Keep the menu short and list only commands that also exist elsewhere in the
 * interface: a context menu is a shortcut, never the only way. Give the
 * `pl-menu` a `label`; it names the menu for assistive technology.
 *
 * @attr {boolean} disabled - The region has no context menu: the browser's own menu shows, and an open menu closes.
 * @slot - The region.
 * @slot menu - A `pl-menu` without a trigger.
 * @fires {CustomEvent<{ x: number, y: number }>} pl-open - The menu opened. `detail.x` and `detail.y` are the viewport point it opened at.
 * @fires pl-close - The menu closed, whether by Escape, a press outside, a choice, `disabled` or script.
 * @fires {CustomEvent<{ value: string }>} pl-select - An item of the menu was activated. It bubbles from the `pl-menu`; `detail.value` holds its value.
 */
export class PlContextMenu extends LitElement {
  static override styles = contextMenuStyles;
  static override properties = {
    disabled: { type: Boolean, reflect: true },
  };

  declare disabled: boolean;

  #menu: PlMenu | null = null;
  #open = false;
  #queued = false;
  /** What had focus when the last press began, before the press moved it. */
  #focused: HTMLElement | null = null;
  #point = { x: 0, y: 0 };
  #press: {
    id: number;
    x: number;
    y: number;
    timer: ReturnType<typeof setTimeout>;
  } | null = null;
  readonly #watch = new MutationObserver(() => this.#report());

  constructor() {
    super();
    this.disabled = false;
    this.addEventListener("contextmenu", this.#onContextmenu);
    this.addEventListener("keydown", this.#onKeydown);
    this.addEventListener("pointerdown", this.#onPointerdown);
    this.addEventListener("pointermove", this.#onPointermove);
    this.addEventListener("pointerup", this.#cancelPress);
    this.addEventListener("pointercancel", this.#cancelPress);
  }

  #inMenu(event: Event) {
    return !!this.#menu?.contains(event.target as Node);
  }

  async #show(x: number, y: number) {
    const menu = this.#menu;
    if (!menu || this.disabled || menu.open || this.#queued) return;
    this.#queued = true;
    // A press outside has just closed the menu; let its popup finish hiding.
    await menu.updateComplete;
    this.#queued = false;
    if (this.disabled) return;
    this.#point = { x, y };
    // A press on the region can drop focus to the page (Firefox does so on a
    // right-click); the menu returns focus to what had it when it opened.
    const from = this.#focused;
    if (document.activeElement === document.body && from?.isConnected)
      from.focus({ preventScroll: true });
    menu.showAt(x, y);
  }

  #onContextmenu = (event: MouseEvent) => {
    if (this.disabled || !this.#menu || event.defaultPrevented) return;
    event.preventDefault();
    if (!this.#inMenu(event)) void this.#show(event.clientX, event.clientY);
  };

  #onKeydown = (event: KeyboardEvent) => {
    const { key, shiftKey, ctrlKey, altKey, metaKey } = event;
    if (
      !(key === "ContextMenu" || (key === "F10" && shiftKey)) ||
      ctrlKey ||
      altKey ||
      metaKey ||
      this.disabled ||
      !this.#menu ||
      event.defaultPrevented ||
      this.#inMenu(event)
    )
      return;
    event.preventDefault();
    const target = event.target instanceof Element ? event.target : this;
    const box = target.getBoundingClientRect();
    const { innerWidth, innerHeight } = window;
    const left = Math.max(box.left, 0);
    const right = Math.min(box.right, innerWidth);
    const top = Math.max(box.top, 0);
    const bottom = Math.min(box.bottom, innerHeight);
    // Below the focused element; on a tall one, at its visible top.
    const x = getComputedStyle(target).direction === "rtl" ? right : left;
    const y = bottom - top > innerHeight / 2 ? top : bottom;
    void this.#show(x, y);
  };

  // A long press has no event of its own: say it as the contextmenu it stands for.
  #onPointerdown = (event: PointerEvent) => {
    this.#focused = this.#inMenu(event)
      ? null
      : (document.activeElement as HTMLElement | null);
    this.#cancelPress();
    if (
      event.pointerType !== "touch" ||
      this.disabled ||
      !this.#menu ||
      this.#inMenu(event)
    )
      return;
    const { clientX: x, clientY: y, pointerId: id, target } = event;
    this.#press = {
      id,
      x,
      y,
      timer: setTimeout(() => {
        this.#press = null;
        target!.dispatchEvent(
          new MouseEvent("contextmenu", {
            bubbles: true,
            composed: true,
            cancelable: true,
            clientX: x,
            clientY: y,
            button: 2,
          }),
        );
      }, LONG_PRESS_MS),
    };
  };

  #onPointermove = (event: PointerEvent) => {
    const press = this.#press;
    if (
      press &&
      press.id === event.pointerId &&
      Math.hypot(event.clientX - press.x, event.clientY - press.y) > DRIFT
    )
      this.#cancelPress();
  };

  #cancelPress = () => {
    if (this.#press) clearTimeout(this.#press.timer);
    this.#press = null;
  };

  /** Tells the page when the menu opened or closed, however that came about. */
  #report() {
    const open = this.#menu?.hasAttribute("open") ?? false;
    if (open === this.#open) return;
    this.#open = open;
    // Two literal names, so the element manifest lists both events.
    const init = { bubbles: true, composed: true };
    this.dispatchEvent(
      open
        ? new CustomEvent("pl-open", { ...init, detail: { ...this.#point } })
        : new CustomEvent("pl-close", { ...init, detail: {} }),
    );
  }

  #bind = () => {
    this.#watch.disconnect();
    const menu = this.querySelector(":scope > [slot=menu]");
    this.#menu = menu instanceof PlMenu ? menu : null;
    if (this.#menu)
      this.#watch.observe(this.#menu, {
        attributes: true,
        attributeFilter: ["open"],
      });
    this.#report();
  };

  override connectedCallback() {
    super.connectedCallback();
    if (this.hasUpdated) this.#bind();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#cancelPress();
    this.#watch.disconnect();
  }

  protected override updated(changed: PropertyValues<this>) {
    if (!changed.has("disabled") || !this.disabled) return;
    this.#cancelPress();
    if (this.#menu?.open) this.#menu.hide();
  }

  override render() {
    return html`<slot></slot
      ><slot name="menu" @slotchange=${this.#bind}></slot>`;
  }
}

customElements.define("pl-context-menu", PlContextMenu);

declare global {
  interface HTMLElementTagNameMap {
    "pl-context-menu": PlContextMenu;
  }
}
