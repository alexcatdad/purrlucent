import type { ReactiveController, ReactiveControllerHost } from "lit";
import { position } from "../../behaviors/position.ts";

/**
 * Shows a popover listbox under an anchor and keeps it placed while it is open.
 * The list's part must carry `popover="manual"` and the `listboxStyles`.
 */
export class PopupController implements ReactiveController {
  readonly #anchor: () => HTMLElement;
  readonly #list: () => HTMLElement;

  constructor(
    host: ReactiveControllerHost,
    anchor: () => HTMLElement,
    list: () => HTMLElement,
  ) {
    this.#anchor = anchor;
    this.#list = list;
    host.addController(this);
  }

  readonly reposition = () =>
    position(this.#anchor(), this.#list(), "bottom-start");

  /** Shows or hides the popover to match `open`. True when it has just opened. */
  sync(open: boolean): boolean {
    const list = this.#list();
    if (open && !list.matches(":popover-open")) {
      list.style.setProperty(
        "--_min-inline-size",
        `${this.#anchor().offsetWidth}px`,
      );
      list.showPopover();
      this.reposition();
      addEventListener("resize", this.reposition);
      addEventListener("scroll", this.reposition, true);
      return true;
    }
    if (!open && list.matches(":popover-open")) {
      list.hidePopover();
      this.hostDisconnected();
    }
    return false;
  }

  hostDisconnected() {
    removeEventListener("resize", this.reposition);
    removeEventListener("scroll", this.reposition, true);
  }
}
