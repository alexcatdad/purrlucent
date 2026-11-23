import type { ReactiveControllerHost } from "lit";

export type SelectionOptions = {
  mode: "single" | "multiple";
  required: boolean;
};

/** Selected values for a group; fires `pl-change` once per change. */
export class SelectionController<T> {
  #host: ReactiveControllerHost & EventTarget;
  #opts: SelectionOptions;
  #selected: ReadonlySet<T> = new Set();

  constructor(
    host: ReactiveControllerHost & EventTarget,
    opts: SelectionOptions,
  ) {
    this.#host = host;
    this.#opts = opts;
  }

  get selected(): ReadonlySet<T> {
    return this.#selected;
  }

  select(v: T) {
    this.#set(
      this.#opts.mode === "single"
        ? new Set([v])
        : new Set([...this.#selected, v]),
    );
  }

  toggle(v: T) {
    if (!this.#selected.has(v)) return this.select(v);
    const next = new Set(this.#selected);
    next.delete(v);
    this.#set(next);
  }

  #set(next: Set<T>) {
    const same =
      next.size === this.#selected.size &&
      [...next].every((v) => this.#selected.has(v));
    if (same || (this.#opts.required && next.size === 0)) return;
    this.#selected = next;
    this.#host.requestUpdate();
    this.#host.dispatchEvent(
      new CustomEvent("pl-change", {
        detail: { selected: [...next] },
        bubbles: true,
        composed: true,
      }),
    );
  }
}
