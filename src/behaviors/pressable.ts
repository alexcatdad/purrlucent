import type { ReactiveController, ReactiveControllerHost } from "lit";

/**
 * Press behavior for a custom control: fires `pl-press` on a click (a pointer
 * click, a label, `click()` or assistive technology). Enter and Space click the
 * host, so `click` listeners run for the keyboard too (Space on key release, as
 * a native button does). `enter: false` leaves Enter alone, as a native
 * checkbox does.
 * While the pointer or Space is down the custom state `:state(pressed)` is set.
 * Key events from a descendant of the host are ignored.
 * The controller uses `opts.internals` when given, otherwise it calls
 * `attachInternals()` itself; a host that also needs ElementInternals passes its
 * own or reads `internals`, so `attachInternals()` runs only once.
 */
export class PressableController implements ReactiveController {
  readonly #host: ReactiveControllerHost & HTMLElement;
  readonly #opts: { disabled: () => boolean; enter?: boolean };
  readonly #internals: ElementInternals;
  #pressed = false;
  #spaceDown = false;

  constructor(
    host: ReactiveControllerHost & HTMLElement,
    opts: {
      disabled: () => boolean;
      enter?: boolean;
      internals?: ElementInternals;
    },
  ) {
    this.#host = host;
    this.#opts = opts;
    this.#internals = opts.internals ?? host.attachInternals();
    host.addController(this);
  }

  get pressed(): boolean {
    return this.#pressed;
  }

  get internals(): ElementInternals {
    return this.#internals;
  }

  hostConnected(): void {
    const host = this.#host;
    host.addEventListener("pointerdown", this.#down);
    host.addEventListener("click", this.#click);
    host.addEventListener("keydown", this.#keydown);
    host.addEventListener("keyup", this.#keyup);
    host.addEventListener("blur", this.#blur);
    // Ends the pressed state wherever the pointer is released or cancelled.
    host.ownerDocument.addEventListener("pointerup", this.#release);
    host.ownerDocument.addEventListener("pointercancel", this.#release);
  }

  hostDisconnected(): void {
    const host = this.#host;
    host.removeEventListener("pointerdown", this.#down);
    host.removeEventListener("click", this.#click);
    host.removeEventListener("keydown", this.#keydown);
    host.removeEventListener("keyup", this.#keyup);
    host.removeEventListener("blur", this.#blur);
    host.ownerDocument.removeEventListener("pointerup", this.#release);
    host.ownerDocument.removeEventListener("pointercancel", this.#release);
    this.#blur();
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
      new CustomEvent("pl-press", { bubbles: true, composed: true }),
    );
  }

  #down = (event: Event) => {
    if (this.#opts.disabled() || (event as PointerEvent).button > 0) return;
    this.#set(true);
  };

  #click = () => {
    if (!this.#opts.disabled()) this.#press();
  };

  #release = () => this.#set(false);

  /** Focus left the host, so a held Space can no longer complete. */
  #blur = () => {
    this.#spaceDown = false;
    this.#set(false);
  };

  #keydown = (event: Event) => {
    const { key, repeat, target } = event as KeyboardEvent;
    if (this.#opts.disabled() || target !== this.#host) return;
    if (key === " ") {
      event.preventDefault(); // keeps the page from scrolling
      this.#spaceDown = true;
      this.#set(true);
    } else if (key === "Enter" && !repeat && this.#opts.enter !== false)
      this.#host.click();
  };

  #keyup = (event: Event) => {
    const { key, target } = event as KeyboardEvent;
    if (key !== " " || target !== this.#host || !this.#spaceDown) return;
    this.#spaceDown = false;
    this.#set(false);
    if (!this.#opts.disabled()) this.#host.click();
  };
}
