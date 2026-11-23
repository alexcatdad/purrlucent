import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { LitElement, css, html, type PropertyValues } from "lit";
import "../components/button/button.ts";
import "../components/card/card.ts";
import "../components/checkbox/checkbox.ts";
import "../components/field/field.ts";
import "../components/input-otp/input-otp.ts";
import type { PlInputOtp } from "../components/input-otp/input-otp.ts";
import "../components/input/input.ts";
import "../components/toast/toast.ts";
import type { PlToaster } from "../components/toast/toast.ts";

const meta = {
  title: "Patterns/Sign-in",
} satisfies Meta;

export default meta;

type Story = StoryObj;

/** The only code that signs in. No network: every step is simulated. */
const CODE = "123456";
const RESEND_SECONDS = 30;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INCOMPLETE = "Enter the 6-digit code.";
const WRONG = "That code is not right. Try again.";

type Step = "credentials" | "code" | "done";

/**
 * A two-step sign-in: email and password, then a one-time code. It is the
 * demo's own element, not a library component. Both steps are real forms, so
 * Enter submits. The first valid email and password lead to the code step; the
 * code 123456 signs in and anything else shows an error.
 */
class SignInDemo extends LitElement {
  static override properties = {
    step: { reflect: true },
    email: {},
    password: {},
    code: {},
    showErrors: { type: Boolean, attribute: "show-errors" },
    emailError: { state: true },
    passwordError: { state: true },
    left: { state: true },
    resent: { state: true },
  };

  declare step: Step;
  declare email: string;
  declare password: string;
  declare code: string;
  declare showErrors: boolean;
  declare emailError: string;
  declare passwordError: string;
  declare left: number;
  declare resent: boolean;

  #until = 0;
  #tick = 0;

  constructor() {
    super();
    this.step = "credentials";
    this.email = "";
    this.password = "";
    this.code = "";
    this.showErrors = false;
    this.emailError = "";
    this.passwordError = "";
    this.left = 0;
    this.resent = false;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    clearInterval(this.#tick);
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    if (changed.has("step")) {
      if (this.step === "code") this.#countdown();
      else clearInterval(this.#tick);
    }
  }

  protected override async firstUpdated() {
    if (!this.showErrors) return;
    if (this.step === "credentials") this.#checkCredentials();
    else if (this.step === "code") {
      await this.#otp?.updateComplete;
      this.#verify();
    }
  }

  get #otp() {
    return this.renderRoot.querySelector<PlInputOtp>("pl-input-otp");
  }

  /** Moves focus to an element of the step that has just been drawn. */
  async #focus(selector: string) {
    await this.updateComplete;
    const el = this.renderRoot.querySelector<HTMLElement>(selector);
    await (el as { updateComplete?: Promise<boolean> } | null)?.updateComplete;
    el?.focus();
  }

  /** Counts down from the clock, so a slow tick never drifts. */
  #countdown() {
    clearInterval(this.#tick);
    this.#until = Date.now() + RESEND_SECONDS * 1000;
    this.left = RESEND_SECONDS;
    this.#tick = window.setInterval(() => {
      this.left = Math.max(0, Math.ceil((this.#until - Date.now()) / 1000));
      if (!this.left) clearInterval(this.#tick);
    }, 1000);
  }

  /** Sets the field errors; true when the email and password are good. */
  #checkCredentials() {
    this.emailError = !this.email.trim()
      ? "Enter your email address."
      : EMAIL.test(this.email.trim())
        ? ""
        : "Enter an email address like name@example.com.";
    this.passwordError =
      this.password.length < 8 ? "Use at least 8 characters." : "";
    return !this.emailError && !this.passwordError;
  }

  #signIn = (event: Event) => {
    event.preventDefault();
    if (!this.#checkCredentials()) {
      void this.#focus(
        this.emailError ? "pl-input[name=email]" : "pl-input[name=password]",
      );
      return;
    }
    this.code = "";
    this.resent = false;
    this.step = "code";
    void this.#focus("pl-input-otp");
  };

  /** Shows a message under the code boxes and keeps the focus in them. */
  #reject(message: string) {
    const otp = this.#otp;
    if (!otp) return;
    otp.setCustomValidity(message);
    // The field shows its message once it has been touched; this touches it.
    otp.dispatchEvent(new Event("invalid"));
  }

  #verify = (event?: Event) => {
    event?.preventDefault();
    if (this.code.length < 6) {
      this.#reject(INCOMPLETE);
      this.#otp?.focus();
    } else if (this.code !== CODE) {
      this.#reject(WRONG);
      this.#otp?.focus();
    } else {
      this.#otp?.setCustomValidity("");
      this.step = "done";
      this.renderRoot
        .querySelector<PlToaster>("pl-toaster")
        ?.show({ title: "Signed in", description: "Welcome back." });
      void this.#focus("h1");
    }
  };

  #resend = () => {
    if (this.left > 0) return;
    this.code = "";
    this.resent = true;
    this.#otp?.setCustomValidity("");
    this.#countdown();
    void this.#focus("pl-input-otp");
  };

  #signOut = () => {
    this.email = "";
    this.password = "";
    this.emailError = "";
    this.passwordError = "";
    this.step = "credentials";
    void this.#focus("pl-input[name=email]");
  };

  #forgot = () => {
    const toaster = this.renderRoot.querySelector<PlToaster>("pl-toaster");
    toaster?.show({
      title: "Check your email",
      description: "If an account exists, a reset link is on its way.",
    });
  };

  #onEmail = (event: Event) => {
    this.email = (event as CustomEvent<{ value: string }>).detail.value;
    this.emailError = "";
  };

  #onPassword = (event: Event) => {
    this.password = (event as CustomEvent<{ value: string }>).detail.value;
    this.passwordError = "";
  };

  #onCode = (event: Event) => {
    this.code = (event as CustomEvent<{ value: string }>).detail.value;
    this.#otp?.setCustomValidity("");
  };

  #credentials() {
    return html`<pl-card>
      <h1 slot="title" tabindex="-1">Sign in</h1>
      <span slot="description">Use your email and password to continue.</span>
      <form novalidate @submit=${this.#signIn}>
        <pl-field ?invalid=${!!this.emailError}>
          <label slot="label">Email</label>
          <pl-input
            type="text"
            inputmode="email"
            name="email"
            autocomplete="email"
            placeholder="name@example.com"
            .value=${this.email}
            @pl-input=${this.#onEmail}
          ></pl-input>
          <span slot="error">${this.emailError}</span>
        </pl-field>
        <pl-field ?invalid=${!!this.passwordError}>
          <label slot="label">Password</label>
          <pl-input
            type="password"
            name="password"
            autocomplete="current-password"
            .value=${this.password}
            @pl-input=${this.#onPassword}
          ></pl-input>
          <span slot="error">${this.passwordError}</span>
        </pl-field>
        <pl-checkbox name="keep">Keep me signed in</pl-checkbox>
        <div class="actions">
          <pl-button type="submit" variant="primary" size="lg"
            >Continue</pl-button
          >
          <pl-button variant="ghost" @click=${this.#forgot}
            >Forgot password</pl-button
          >
        </div>
      </form>
    </pl-card>`;
  }

  #verification() {
    return html`<pl-card>
      <h1 slot="title" tabindex="-1">Enter the code</h1>
      <span slot="description"
        >We sent a 6-digit code to ${this.email || "your email"}.</span
      >
      <form novalidate @submit=${this.#verify}>
        <!-- Above the code field: the field's own message, shown when it
             loses focus, would otherwise push this button from under the
             pointer that is pressing it. -->
        <div class="resend">
          <pl-button
            variant="ghost"
            ?disabled=${this.left > 0}
            @click=${this.#resend}
            >Send a new code</pl-button
          >
          <p class="hint">
            <span role="status"
              >${this.resent ? "A new code is on its way." : ""}</span
            >
            ${
              this.left > 0
                ? html`<span>You can ask for another in ${this.left}s.</span>`
                : ""
            }
          </p>
        </div>
        <pl-input-otp
          length="6"
          name="code"
          label="Verification code"
          incomplete-message=${INCOMPLETE}
          .value=${this.code}
          @pl-input=${this.#onCode}
          @pl-complete=${() => this.#verify()}
        ></pl-input-otp>
        <div class="actions">
          <pl-button type="submit" variant="primary" size="lg"
            >Verify</pl-button
          >
        </div>
      </form>
    </pl-card>`;
  }

  #signedIn() {
    return html`<pl-card>
      <h1 slot="title" tabindex="-1">You are signed in</h1>
      <span slot="description">Welcome back, ${this.email}.</span>
      <pl-button variant="secondary" size="lg" @click=${this.#signOut}
        >Sign out</pl-button
      >
    </pl-card>`;
  }

  override render() {
    return html`${
        this.step === "code"
          ? this.#verification()
          : this.step === "done"
            ? this.#signedIn()
            : this.#credentials()
      } <pl-toaster></pl-toaster>`;
  }

  static override styles = css`
    :host {
      display: block;
      box-sizing: border-box;
      inline-size: min(100%, calc(var(--pl-spacing) * 100));
      color: var(--pl-color-foreground);
      font: 400 var(--pl-text-base) / var(--pl-leading-normal)
        var(--pl-font-sans);
    }

    form {
      display: grid;
      gap: var(--pl-space-4);
    }

    .actions {
      display: grid;
      gap: var(--pl-gap-controls);
    }

    .resend {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--pl-gap-controls);
    }

    .hint {
      margin: 0;
      color: var(--pl-color-muted-foreground);
      font-size: var(--pl-text-sm);
    }

    h1 {
      margin: 0;
    }
  `;
}

if (!customElements.get("sign-in-demo"))
  customElements.define("sign-in-demo", SignInDemo);

const page = (content: unknown) =>
  html`<div
    style="display:flex;flex-wrap:wrap;justify-content:center;gap:var(--pl-space-4);padding:var(--pl-space-4)"
  >
    ${content}
  </div>`;

/** Step 1: email and password. Enter submits; an empty or invalid email and a short password show a field error. */
export const Default: Story = {
  render: () => page(html`<sign-in-demo></sign-in-demo>`),
};

/** Step 2: the one-time code. Type 123456 to sign in; any other code is rejected. A new code can be sent once the countdown ends. */
export const Code: Story = {
  render: () =>
    page(
      html`<sign-in-demo step="code" email="hello@example.com"></sign-in-demo>`,
    ),
};

/** Both steps with their errors showing: a bad email and a short password, then a wrong code. */
export const ErrorStates: Story = {
  render: () =>
    page(html`
      <sign-in-demo show-errors email="hello" password="short"></sign-in-demo>
      <sign-in-demo
        show-errors
        step="code"
        email="hello@example.com"
        code="000000"
      ></sign-in-demo>
    `),
};

export const Rtl: Story = {
  render: () => page(html`<sign-in-demo></sign-in-demo>`),
  globals: { dir: "rtl" },
};

export const Glass: Story = {
  render: () => page(html`<sign-in-demo></sign-in-demo>`),
  globals: { material: "glass", theme: "dark", contrast: "more" },
};
