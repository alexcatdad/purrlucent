import { LitElement, html } from "lit";
import { interactionStyles } from "../../behaviors/interaction.css.ts";
import { PressableController } from "../../behaviors/pressable.ts";
import { RovingFocusController } from "../../behaviors/roving-focus.ts";
import { SelectionController } from "../../behaviors/selection.ts";
import { pickValue } from "./pick-value.ts";
import { controlStyles, segmentStyles } from "./segmented-control.css.ts";

/**
 * One choice in a `purr-segmented-control`. The slot holds its text label.
 *
 * @attr {string} value - The value the control reports when this segment is selected.
 * @attr {boolean} selected - Marks the starting selection. After that the control owns it.
 * @slot - The segment's text label.
 * @csspart label - The wrapper around the label.
 */
export class PurrSegment extends LitElement {
  static override styles = [interactionStyles, segmentStyles];
  static override properties = {
    value: { type: String, reflect: true },
    selected: { type: Boolean, reflect: true },
  };
  declare value: string;
  declare selected: boolean;
  readonly pressable = new PressableController(this, {
    disabled: () => false,
  });

  constructor() {
    super();
    this.value = "";
    this.selected = false;
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "radio");
  }

  protected override updated() {
    this.setAttribute("aria-checked", String(this.selected));
  }

  override render() {
    return html`<span part="label"><slot></slot></span>`;
  }
}

/**
 * A row of equal-width segments that offers one required choice, as a radio
 * group. Arrow keys, Home and End move focus and select; they follow the visual
 * direction under `dir="rtl"`. Enter also selects the focused segment. Space,
 * Tab and the arrows follow the APG radio group pattern; Enter, Home and End
 * are extras. Always set `label`: without it the group has no accessible name.
 *
 * @attr {string} value - The value of the selected segment. Defaults to the segment marked `selected`, else the first.
 * @attr {string} label - The accessible name of the group. Required.
 * @slot - `purr-segment` elements.
 * @csspart track - The container that holds the segments.
 * @fires purr-change - The selection changed by the user. `detail.selected` is a one-item array.
 */
export class PurrSegmentedControl extends LitElement {
  static override styles = [controlStyles];
  static override properties = {
    value: { type: String, reflect: true },
    label: { type: String },
  };
  declare value: string;
  declare label: string;
  readonly #selection = new SelectionController<string>(this, {
    mode: "single",
    required: true,
  });
  readonly #roving = new RovingFocusController(this, {
    items: () => this.#segments,
    orientation: "horizontal",
    wrap: true,
  });
  #segments: PurrSegment[] = [];
  /** True while the selection is synced from `value`: not a user change. */
  #syncing = false;

  constructor() {
    super();
    this.value = "";
    this.label = "";
    this.addEventListener("purr-change", (event) => {
      if (this.#syncing) return event.stopImmediatePropagation();
      const [selected] = (event as CustomEvent<{ selected: string[] }>).detail
        .selected;
      if (selected !== undefined) this.value = selected;
    });
    this.addEventListener("purr-press", (event) => {
      if (event.target instanceof PurrSegment)
        this.#selection.select(event.target.value);
    });
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "radiogroup");
    // After the roving focus controller's own keydown listener, so focus has moved.
    this.addEventListener("keydown", this.#onKeydown);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("keydown", this.#onKeydown);
  }

  /**
   * A key that moved focus also selects the segment that now has it. Up and
   * Down move like Left and Right in a radio group; the roving focus controller
   * only handles the horizontal arrows.
   */
  #onKeydown = (event: KeyboardEvent) => {
    const step = { ArrowDown: 1, ArrowUp: -1 }[event.key];
    if (step && !(event.altKey || event.ctrlKey || event.metaKey)) {
      const from = this.#segments.indexOf(event.target as PurrSegment);
      if (from < 0) return;
      event.preventDefault();
      const count = this.#segments.length;
      this.#segments[(from + step + count) % count]!.focus();
    } else if (!event.defaultPrevented) return;
    const focused = this.#segments.find((s) => s.matches(":focus"));
    if (focused) this.#selection.select(focused.value);
  };

  #onSlotChange = (event: Event) => {
    this.#segments = (event.target as HTMLSlotElement)
      .assignedElements()
      .filter((el): el is PurrSegment => el instanceof PurrSegment);
    this.requestUpdate();
  };

  protected override willUpdate() {
    const value = pickValue(this.#segments, this.value);
    if (value === undefined) return;
    this.value = value;
    if (!this.#selection.selected.has(value)) {
      this.#syncing = true;
      this.#selection.select(value);
      this.#syncing = false;
    }
  }

  protected override updated() {
    this.#segments.forEach((s) => (s.selected = s.value === this.value));
    this.#roving.activate(this.#segments.findIndex((s) => s.selected));
    if (this.label) this.setAttribute("aria-label", this.label);
    else this.removeAttribute("aria-label");
  }

  override render() {
    return html`<div part="track">
      <slot @slotchange=${this.#onSlotChange}></slot>
    </div>`;
  }
}

customElements.define("purr-segment", PurrSegment);
customElements.define("purr-segmented-control", PurrSegmentedControl);

declare global {
  interface HTMLElementTagNameMap {
    "purr-segment": PurrSegment;
    "purr-segmented-control": PurrSegmentedControl;
  }
}
