import type { ReactiveController, ReactiveControllerHost } from "lit";
import { position, type Placement, type Side } from "./position.ts";

export interface AnchoredOptions {
  anchor: () => Element;
  panel: () => HTMLElement;
  placement: () => Placement;
  /** Called after every placement with the side the panel took. */
  onPlace?: (side: Side) => void;
}

/** Shows a `popover="manual"` panel in the top layer next to its anchor and keeps it there while the page scrolls or resizes. */
export class AnchoredController implements ReactiveController {
  #opts: AnchoredOptions;
  // A trigger that is still laying out, or a panel whose content changes, moves the target.
  #observer = new ResizeObserver(() => this.place());

  constructor(host: ReactiveControllerHost, opts: AnchoredOptions) {
    this.#opts = opts;
    host.addController(this);
  }

  hostDisconnected() {
    this.hide();
  }

  place = () => {
    const { anchor, panel, placement, onPlace } = this.#opts;
    const side = position(anchor(), panel(), placement());
    onPlace?.(side);
  };

  show() {
    const panel = this.#opts.panel();
    if (panel.matches(":popover-open")) return;
    panel.showPopover();
    this.place();
    addEventListener("resize", this.place);
    addEventListener("scroll", this.place, true);
    this.#observer.observe(this.#opts.anchor());
    this.#observer.observe(panel);
  }

  hide() {
    removeEventListener("resize", this.place);
    removeEventListener("scroll", this.place, true);
    this.#observer.disconnect();
    const panel = this.#opts.panel();
    if (panel?.matches(":popover-open")) panel.hidePopover();
  }
}
