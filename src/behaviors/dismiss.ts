import type { ReactiveController, ReactiveControllerHost } from "lit";

export interface DismissOptions {
  onDismiss: (reason: "escape" | "outside") => void;
  enabled: () => boolean;
}

/** Calls `onDismiss` on Escape or a pointer-down outside the host. Does nothing while disabled. */
export class DismissController implements ReactiveController {
  #host: ReactiveControllerHost & EventTarget;
  #opts: DismissOptions;

  constructor(
    host: ReactiveControllerHost & EventTarget,
    opts: DismissOptions,
  ) {
    this.#host = host;
    this.#opts = opts;
    host.addController(this);
  }

  hostConnected() {
    document.addEventListener("keydown", this.#onKeydown);
    document.addEventListener("pointerdown", this.#onPointerdown, true);
  }

  hostDisconnected() {
    document.removeEventListener("keydown", this.#onKeydown);
    document.removeEventListener("pointerdown", this.#onPointerdown, true);
  }

  #onKeydown = (event: Event) => {
    if ((event as KeyboardEvent).key === "Escape" && this.#opts.enabled()) {
      this.#opts.onDismiss("escape");
    }
  };

  #onPointerdown = (event: Event) => {
    if (!event.composedPath().includes(this.#host) && this.#opts.enabled()) {
      this.#opts.onDismiss("outside");
    }
  };
}
