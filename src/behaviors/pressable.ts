import type { ReactiveController, ReactiveControllerHost } from "lit";

/**
 * Press behavior for a custom control: fires `purr-press` on pointer-up inside
 * the host, on Enter, and on Space (on key release, as a native button does).
 * While the pointer is down the custom state `:state(pressed)` is set.
 * The controller calls `attachInternals()`, so the host must not.
 */
export class PressableController implements ReactiveController {
  readonly #host: ReactiveControllerHost & HTMLElement;
  readonly #opts: { disabled: () => boolean };
  readonly #internals: ElementInternals;
  #pressed = false;

  constructor(
    host: ReactiveControllerHost & HTMLElement,
    opts: { disabled: () => boolean },
  ) {
    this.#host = host;
    this.#opts = opts;
    this.#internals = host.attachInternals();
    host.addController(this);
  }

  get pressed(): boolean {
    return this.#pressed;
  }

  hostConnected(): void {
    const host = this.#host;
    host.addEventListener("pointerdown", this.#down);
    host.addEventListener("pointerup", this.#up);
    host.addEventListener("keydown", this.#keydown);
    host.addEventListener("keyup", this.#keyup);
    // Pointer-up runs on the host first, then bubbles here, so this only ever
    // clears a press that ended outside the host or was cancelled.
    host.ownerDocument.addEventListener("pointerup", this.#release);
    host.ownerDocument.addEventListener("pointercancel", this.#release);
  }

  hostDisconnected(): void {
    const host = this.#host;
    host.removeEventListener("pointerdown", this.#down);
    host.removeEventListener("pointerup", this.#up);
    host.removeEventListener("keydown", this.#keydown);
    host.removeEventListener("keyup", this.#keyup);
    host.ownerDocument.removeEventListener("pointerup", this.#release);
    host.ownerDocument.removeEventListener("pointercancel", this.#release);
    this.#set(false);
  }

  #set(pressed: boolean) {
    if (pressed === this.#pressed) return;
    this.#pressed = pressed;
    if (pressed) this.#internals.states.add("pressed");
    else this.#internals.states.delete("pressed");
    this.#host.requestUpdate();
  }

  #press() {
    this.#host.dispatchEvent(
      new CustomEvent("purr-press", { bubbles: true, composed: true }),
    );
  }

  #down = (event: Event) => {
    if (this.#opts.disabled() || (event as PointerEvent).button > 0) return;
    this.#set(true);
  };

  #up = () => {
    if (this.#pressed && !this.#opts.disabled()) this.#press();
  };

  #release = () => this.#set(false);

  #keydown = (event: Event) => {
    const { key, repeat } = event as KeyboardEvent;
    if (this.#opts.disabled()) return;
    if (key === " ")
      event.preventDefault(); // keeps the page from scrolling
    else if (key === "Enter" && !repeat) this.#press();
  };

  #keyup = (event: Event) => {
    if ((event as KeyboardEvent).key === " " && !this.#opts.disabled())
      this.#press();
  };
}
