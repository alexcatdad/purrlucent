import type { ReactiveController, ReactiveControllerHost } from "lit";

export type RovingFocusOptions = {
  items: () => HTMLElement[];
  orientation: "horizontal" | "vertical";
  wrap: boolean;
};

/** Roving tabindex: one tab stop, arrow keys, Home and End move focus. */
export class RovingFocusController implements ReactiveController {
  #host: ReactiveControllerHost & HTMLElement;
  #opts: RovingFocusOptions;
  #active = 0;

  constructor(
    host: ReactiveControllerHost & HTMLElement,
    opts: RovingFocusOptions,
  ) {
    this.#host = host;
    this.#opts = opts;
    host.addController(this);
  }

  hostConnected() {
    this.#host.addEventListener("keydown", this.#onKeydown as EventListener);
    this.#host.addEventListener("focusin", this.#onFocusin as EventListener);
    this.#sync();
  }

  hostDisconnected() {
    this.#host.removeEventListener("keydown", this.#onKeydown as EventListener);
    this.#host.removeEventListener("focusin", this.#onFocusin as EventListener);
  }

  hostUpdated() {
    this.#sync();
  }

  #indexOf(target: EventTarget | null) {
    return this.#opts
      .items()
      .findIndex((i) => i === target || i.contains?.(target as Node));
  }

  /** Makes `index` the tab stop without moving focus. */
  activate(index: number): void {
    const last = this.#opts.items().length - 1;
    if (index < 0 || index > last) return;
    this.#active = index;
    this.#sync();
  }

  #sync() {
    this.#active = Math.max(
      0,
      Math.min(this.#active, this.#opts.items().length - 1),
    );
    this.#opts
      .items()
      .forEach((item, i) => (item.tabIndex = i === this.#active ? 0 : -1));
  }

  #move(to: number) {
    const items = this.#opts.items();
    this.#active = to;
    this.#sync();
    items[to]?.focus();
  }

  #onFocusin = (e: FocusEvent) => {
    const i = this.#indexOf(e.target);
    if (i < 0 || i === this.#active) return;
    this.#active = i;
    this.#sync();
  };

  #onKeydown = (e: KeyboardEvent) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const from = this.#indexOf(e.target);
    if (from < 0) return;
    const last = this.#opts.items().length - 1;
    const horizontal = this.#opts.orientation === "horizontal";
    const rtl = horizontal && this.#host.matches(":dir(rtl)");
    const next = horizontal ? (rtl ? "ArrowLeft" : "ArrowRight") : "ArrowDown";
    const prev = horizontal ? (rtl ? "ArrowRight" : "ArrowLeft") : "ArrowUp";
    const { wrap } = this.#opts;
    let to: number;
    if (e.key === next) to = from < last ? from + 1 : wrap ? 0 : from;
    else if (e.key === prev) to = from > 0 ? from - 1 : wrap ? last : from;
    else if (e.key === "Home") to = 0;
    else if (e.key === "End") to = last;
    else return;
    e.preventDefault();
    this.#move(to);
  };
}
