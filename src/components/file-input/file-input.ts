import { LitElement, html, nothing } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import { fieldMessage } from "../../behaviors/field-message.ts";
import { messages } from "../../behaviors/locale.ts";
import { fireNative } from "../../behaviors/native-events.ts";
import { hideWhenEmpty } from "../../behaviors/slot-presence.ts";
import { pickDropped } from "./file-match.ts";
import { fileInputStyles } from "./file-input.css.ts";

/**
 * A file picker. A button opens the system file dialog and the chosen names
 * are listed beside it; files can also be dropped on the field. The slotted
 * text is a visible label; without it, `label` becomes the group's accessible
 * name. The `files` property holds the chosen files as an array and takes a
 * `FileList` or an array. It takes part in forms like a native file input: it
 * submits the files under `name`, a reset clears it, a disabled fieldset
 * disables it, and `required` makes the form invalid while nothing is chosen.
 * It carries its own label, description and message, so do not wrap it in a
 * `pl-field`.
 *
 * @attr {string} label - The accessible name when there is no slotted label.
 * @attr {string} name - The name the files are submitted under.
 * @attr {string} accept - The kinds of file allowed: extensions such as `.pdf`, types such as `image/png`, or wildcards such as `image/*`, separated by commas.
 * @attr {boolean} multiple - More than one file can be chosen.
 * @attr {boolean} required - The form is invalid while no file is chosen.
 * @attr {boolean} disabled - No focus, no dropping, nothing submitted.
 * @slot - The visible label.
 * @slot description - Help text below the label.
 * @csspart label - The visible label.
 * @csspart description - The wrapper of the description.
 * @csspart field - The shell around the button and the names; files can be dropped on it.
 * @csspart button - The button that opens the file dialog.
 * @csspart names - The names of the chosen files.
 * @csspart message - The icon and validation message below the field while it is invalid.
 * @fires {CustomEvent<{ files: File[] }>} pl-change - Files were chosen or dropped. `detail.files` holds them.
 * @fires change - After each pl-change, as a native file input fires it.
 */
export class PlFileInput extends LitElement {
  static formAssociated = true;
  static override shadowRootOptions = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };
  static override styles = fileInputStyles;
  static override properties = {
    label: {},
    name: { reflect: true },
    accept: { reflect: true },
    multiple: { type: Boolean, reflect: true },
    required: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    _labelled: { state: true },
  };

  declare label: string | undefined;
  declare name: string;
  declare accept: string | undefined;
  declare multiple: boolean;
  declare required: boolean;
  declare disabled: boolean;
  declare _labelled: boolean;

  readonly #internals = this.attachInternals();
  readonly #labelWatch = new MutationObserver(() => this.#syncLabelled());
  #files: File[] = [];
  #touched = false;

  constructor() {
    super();
    // A blocked submit or reportValidity() is an interaction too.
    this.addEventListener("invalid", () => {
      this.#touched = true;
      this.requestUpdate();
    });
    this.name = "";
    this.multiple = false;
    this.required = false;
    this.disabled = false;
    this._labelled = false;
  }

  /** The chosen files. */
  get files(): File[] {
    return this.#files;
  }

  set files(value: FileList | File[] | null | undefined) {
    this.#files = Array.from(value ?? []);
    this.requestUpdate();
  }

  get form() {
    return this.#internals.form;
  }

  get labels() {
    return this.#internals.labels;
  }

  get validity() {
    return this.#internals.validity;
  }

  get validationMessage() {
    return this.#internals.validationMessage;
  }

  get willValidate() {
    return this.#internals.willValidate;
  }

  checkValidity() {
    return this.#internals.checkValidity();
  }

  reportValidity() {
    return this.#internals.reportValidity();
  }

  override connectedCallback() {
    super.connectedCallback();
    this.#labelWatch.observe(this, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    this.#syncLabelled();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#labelWatch.disconnect();
  }

  formResetCallback() {
    this.#touched = false;
    this.files = [];
  }

  formDisabledCallback() {
    this.requestUpdate();
  }

  // After the update, so the inner input and button already match the state.
  protected override updated() {
    const root = this.renderRoot as ShadowRoot;
    const input = root.querySelector("input")!;
    const button = root.querySelector("button")!;
    const files = this.#files;
    const current = Array.from(input.files ?? []);
    if (
      current.length !== files.length ||
      current.some((file, i) => file !== files[i])
    ) {
      const transfer = new DataTransfer();
      for (const file of files) transfer.items.add(file);
      input.files = transfer.files;
    }
    const missing = this.required && !files.length;
    const text = messages(this).fileRequired;
    this.#internals.setValidity(
      missing ? { valueMissing: true } : {},
      missing ? text : "",
      button,
    );
    const data = new FormData();
    if (this.name) for (const file of files) data.append(this.name, file);
    this.#internals.setFormValue(this.name && files.length ? data : null);
    const invalid = this.#touched && missing;
    this.#toggleState("user-invalid", invalid);
    this.#toggleState("labelled", this._labelled);
    this.#toggleState("has-files", files.length > 0);
    root.querySelector("[part=message] span")!.textContent = invalid
      ? text
      : "";
    const described = root.querySelector<HTMLElement>("#description")!.hidden
      ? "names"
      : "description names";
    button.setAttribute(
      "aria-describedby",
      invalid ? `${described} message` : described,
    );
  }

  #toggleState(state: string, on: boolean) {
    if (on) this.#internals.states.add(state);
    else this.#internals.states.delete(state);
  }

  // Watches the light DOM: editing a slotted label's text fires no slotchange.
  #syncLabelled() {
    this._labelled = [...this.childNodes].some(
      (node) =>
        !(node instanceof Element && node.slot) && !!node.textContent?.trim(),
    );
  }

  #choose(files: File[]) {
    this.#touched = true;
    this.files = files;
    this.dispatchEvent(
      new CustomEvent("pl-change", {
        detail: { files },
        bubbles: true,
        composed: true,
      }),
    );
    // The inner input's change event stays in the shadow root.
    fireNative(this, "change");
  }

  #onChange = (event: Event) =>
    this.#choose(Array.from((event.target as HTMLInputElement).files ?? []));

  #onDescription = (event: Event) => {
    hideWhenEmpty(event);
    this.requestUpdate();
  };

  #open = () => this.renderRoot.querySelector("input")!.click();

  #dragging(event: DragEvent) {
    return (
      !this.matches(":disabled") &&
      !!event.dataTransfer?.types.includes("Files")
    );
  }

  #onDragOver = (event: DragEvent) => {
    if (!this.#dragging(event)) return;
    event.preventDefault();
    event.dataTransfer!.dropEffect = "copy";
    this.#toggleState("dragging", true);
  };

  #onDragLeave = (event: DragEvent) => {
    const to = event.relatedTarget as Node | null;
    if (!to || !(event.currentTarget as Node).contains(to))
      this.#toggleState("dragging", false);
  };

  #onDrop = (event: DragEvent) => {
    if (!this.#dragging(event)) return;
    event.preventDefault();
    this.#toggleState("dragging", false);
    const files = pickDropped(
      Array.from(event.dataTransfer!.files),
      this.accept,
      this.multiple,
    );
    if (files.length) this.#choose(files);
  };

  override render() {
    const text = messages(this);
    const names = this.#files.map((file) => file.name).join(", ");
    return html`<div part="label" id="label"><slot></slot></div>
      <div part="description" id="description" hidden>
        <slot name="description" @slotchange=${this.#onDescription}></slot>
      </div>
      <div
        part="field"
        role="group"
        aria-labelledby=${ifDefined(this._labelled ? "label" : undefined)}
        aria-label=${this._labelled ? nothing : ifDefined(this.label)}
        @dragenter=${this.#onDragOver}
        @dragover=${this.#onDragOver}
        @dragleave=${this.#onDragLeave}
        @drop=${this.#onDrop}
      >
        <input
          type="file"
          tabindex="-1"
          aria-hidden="true"
          accept=${ifDefined(this.accept)}
          ?multiple=${this.multiple}
          @change=${this.#onChange}
        />
        <button
          type="button"
          part="button"
          ?disabled=${this.matches(":disabled")}
          @click=${this.#open}
        >
          ${this.multiple ? text.chooseFiles : text.chooseFile}
        </button>
        <span part="names" id="names" role="status"
          >${names || text.noFileChosen}</span
        >
      </div>
      ${fieldMessage}`;
  }
}

customElements.define("pl-file-input", PlFileInput);

declare global {
  interface HTMLElementTagNameMap {
    "pl-file-input": PlFileInput;
  }
}
