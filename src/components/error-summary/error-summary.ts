import { html, LitElement, nothing } from "lit";
import { messages } from "../../behaviors/locale.ts";
import { errorSummaryStyles } from "./error-summary.css.ts";

export interface PlFieldError {
  /** The form control's `name`. */
  name: string;
  /** A message that identifies the field and explains how to correct it. */
  message: string;
}

/**
 * A summary of form errors with links to the named controls. Place it near
 * the start of the form and provide the same feedback at each field. After
 * an unsuccessful submit, assign `errors`, await `updateComplete`, and call
 * `focus()`. Errors without a visible, enabled control appear as text. An
 * empty list hides the summary.
 *
 * @attr {string} heading - The summary title. Defaults to the page language's text (see `setMessages`), in English "Check the form".
 * @attr {string} form - ID of the form in the same document or shadow root. Omit it inside a form.
 * @csspart summary - The focusable group.
 * @csspart heading - The group's visible title.
 * @csspart list - The list of errors.
 * @csspart link - Each link to a form control.
 */
export class PlErrorSummary extends LitElement {
  static override styles = errorSummaryStyles;
  static override properties = {
    errors: { attribute: false },
    heading: {},
    form: {},
  };

  /** Errors in form order. Replace the array when a message changes. */
  declare errors: readonly PlFieldError[];
  declare heading: string;
  declare form: string | undefined;

  readonly #internals = this.attachInternals();
  readonly #watchFields = new MutationObserver(() => this.requestUpdate());
  readonly #pendingDefinitions = new Set<string>();
  #observedForm?: HTMLFormElement;

  constructor() {
    super();
    this.errors = [];
    this.heading = "";
  }

  override connectedCallback() {
    super.connectedCallback();
    this.requestUpdate();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#watchFields.disconnect();
    this.#observedForm = undefined;
  }

  protected override willUpdate() {
    if (this.errors.length) this.#internals.states.add("has-errors");
    else this.#internals.states.delete("has-errors");
  }

  protected override updated() {
    const form =
      this.isConnected && this.errors.length ? this.#findForm() : undefined;
    if (form !== this.#observedForm) {
      this.#watchFields.disconnect();
      this.#observedForm = form;
      if (form) {
        this.#watchFields.observe(form, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: [
            "class",
            "disabled",
            "form",
            "hidden",
            "id",
            "inert",
            "name",
            "style",
            "type",
          ],
        });
      }
    }
    if (!form) return;

    // An undefined custom field does not appear in form.elements until it upgrades.
    for (const element of form.querySelectorAll("[name]:not(:defined)")) {
      const tag = element.localName;
      if (!tag.includes("-") || this.#pendingDefinitions.has(tag)) continue;
      if (
        !this.errors.some(({ name }) => name === element.getAttribute("name"))
      )
        continue;
      this.#pendingDefinitions.add(tag);
      const summary = new WeakRef(this);
      void customElements.whenDefined(tag).then(
        () => {
          const host = summary.deref();
          if (!host) return;
          host.#pendingDefinitions.delete(tag);
          host.requestUpdate();
        },
        () => {
          const host = summary.deref();
          if (host) host.#pendingDefinitions.delete(tag);
        },
      );
    }
  }

  override focus(options?: FocusOptions) {
    this.renderRoot
      ?.querySelector<HTMLElement>('[part="summary"]')
      ?.focus(options);
  }

  #findForm() {
    if (this.form) {
      for (const root of [
        this.getRootNode(),
        this.assignedSlot?.getRootNode(),
      ]) {
        if (!(root instanceof Document || root instanceof ShadowRoot)) continue;
        const form = root.getElementById(this.form);
        if (form instanceof HTMLFormElement) return form;
      }
      return;
    }
    return (
      this.closest("form") ?? this.assignedSlot?.closest("form") ?? undefined
    );
  }

  #field(name: string) {
    const form = this.#findForm();
    if (!form) return;
    const named = form.elements.namedItem(name);
    const fields = (
      named instanceof RadioNodeList ? [...named] : [named]
    ).filter(
      (element): element is HTMLElement =>
        element instanceof HTMLElement &&
        element.getAttribute("name") === name &&
        !element.matches(":disabled, input[type=hidden]") &&
        !element.closest("[inert]") &&
        element.checkVisibility({ visibilityProperty: true }),
    );
    return fields.find((field) => field.matches(":invalid")) ?? fields[0];
  }

  override render() {
    if (!this.errors.length) return nothing;
    return html`<div
      part="summary"
      role="group"
      aria-labelledby="heading"
      tabindex="-1"
    >
      <p id="heading" part="heading">
        ${this.heading || messages(this).checkForm}
      </p>
      <ul part="list" role="list">
        ${this.errors.map(({ name, message }) => {
          const field = this.#field(name);
          return html`<li>
            ${
              field
                ? html`<a
                    part="link"
                    href=${`#${encodeURIComponent(field.id || name)}`}
                    @click=${(event: MouseEvent) => {
                      event.preventDefault();
                      const target = this.#field(name);
                      target?.focus();
                      if (target !== field) this.requestUpdate();
                    }}
                    >${message}</a
                  >`
                : message
            }
          </li>`;
        })}
      </ul>
    </div>`;
  }
}

customElements.define("pl-error-summary", PlErrorSummary);

declare global {
  interface HTMLElementTagNameMap {
    "pl-error-summary": PlErrorSummary;
  }
}
