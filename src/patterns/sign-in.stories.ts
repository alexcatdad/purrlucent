import { patternPanel } from "../../.storybook/backdrop.css.ts";
import { LensController } from "../behaviors/lens.ts";
import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { LitElement, css, html, type PropertyValues } from "lit";
import { plaintextRtl } from "../../.storybook/isolate.ts";
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

type Step = "credentials" | "code" | "done" | "redirect" | "sent";
type Mode = "password" | "sso" | "passkey" | "magic";

/** Neutral glyphs, one per provider: shapes, not brand marks. */
const GLYPHS: Record<string, string> = {
  Apple: "M12 3 L21 12 L12 21 L3 12 Z",
  Google: "M12 3 a9 9 0 1 0 0.001 0 Z",
  GitHub: "M4 4 H20 V20 H4 Z",
};
const PROVIDERS = Object.keys(GLYPHS);

/**
 * A sign-in: email and password then a one-time code, or one of its variants
 * picked by `mode` (password, sso, passkey, magic). `logo`, `providers` and
 * `complete` add the logo, the provider buttons and the full set of extras. It
 * is the demo's own element, not a library component. Every step is a real
 * form, so Enter submits. The first valid email and password lead to the code
 * step; the code 123456 signs in and anything else shows an error.
 */
class SignInDemo extends LitElement {
  static override properties = {
    step: { reflect: true },
    mode: { reflect: true },
    logo: { type: Boolean },
    providers: { type: Boolean },
    complete: { type: Boolean },
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
  declare mode: Mode;
  declare logo: boolean;
  declare providers: boolean;
  declare complete: boolean;
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
    new LensController(this, "pl-card");
    this.step = "credentials";
    this.mode = "password";
    this.logo = false;
    this.providers = false;
    this.complete = false;
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
      this.mode === "password" && this.password.length < 8
        ? "Use at least 8 characters."
        : "";
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
    if (this.mode === "sso") {
      this.step = "redirect";
      void this.#focus("h1");
    } else if (this.mode === "magic") {
      this.step = "sent";
      void this.#focus("h1");
    } else {
      this.code = "";
      this.resent = false;
      this.step = "code";
      void this.#focus("pl-input-otp");
    }
  };

  #passkey = () => {
    this.step = "done";
    this.renderRoot
      .querySelector<PlToaster>("pl-toaster")
      ?.show({ title: "Signed in", description: "Passkey verified." });
    void this.#focus("h1");
  };

  /** Stops a demo link from navigating the story frame. */
  #link = (event: Event) => event.preventDefault();

  #forgotLink = (event: Event) => {
    event.preventDefault();
    this.#forgot();
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

  #logo() {
    return this.logo
      ? html`<svg
          class="logo"
          role="img"
          aria-label="Company logo"
          viewBox="0 0 24 24"
        >
          <rect width="24" height="24" rx="6" fill="currentColor" />
          <circle cx="12" cy="12" r="5" fill="var(--pl-color-background)" />
        </svg>`
      : "";
  }

  #providerButtons() {
    return html`<div class="providers">
        ${PROVIDERS.map(
          (name) =>
            html`<pl-button variant="secondary" size="lg"
              ><svg viewBox="0 0 24 24" aria-hidden="true">
                <path d=${GLYPHS[name]!} fill="currentColor" /></svg
              >Continue with ${name}</pl-button
            >`,
        )}
      </div>
      <div class="divider" aria-hidden="true"><span>or</span></div>`;
  }

  #terms() {
    return html`<p slot="footer" class="terms">
      By continuing you agree to the
      <a href="#terms" @click=${this.#link}>Terms of Service</a> and the
      <a href="#privacy" @click=${this.#link}>Privacy Policy</a>.
    </p>`;
  }

  #emailField(label: string) {
    return html`<pl-field ?invalid=${!!this.emailError}>
      <label slot="label">${label}</label>
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
    </pl-field>`;
  }

  /** Sso and magic link: one email field and one button. */
  #emailOnly() {
    const sso = this.mode === "sso";
    return html`<pl-card>
      <h1 slot="title" tabindex="-1">
        ${sso ? "Sign in with single sign-on" : "Sign in with a link"}
      </h1>
      <span slot="description"
        >${
          sso
            ? "Enter your work email and we will find your company's sign-in."
            : "We will email you a link that signs you in."
        }</span
      >
      <form novalidate @submit=${this.#signIn}>
        ${this.#emailField(sso ? "Work email" : "Email")}
        <div class="actions">
          <pl-button type="submit" variant="primary" size="lg"
            >${sso ? "Continue" : "Send link"}</pl-button
          >
        </div>
      </form>
    </pl-card>`;
  }

  #passkeyCard() {
    return html`<pl-card>
      <h1 slot="title" tabindex="-1">Sign in with a passkey</h1>
      <span slot="description"
        >Use your fingerprint, face or screen lock instead of a password.</span
      >
      <pl-button variant="primary" size="lg" @click=${this.#passkey}
        >Sign in with a passkey</pl-button
      >
    </pl-card>`;
  }

  #redirecting() {
    return html`<pl-card>
      <h1 slot="title" tabindex="-1">Single sign-on</h1>
      <span slot="description">Your work email is ${this.email}.</span>
      <p class="hint" role="status">Redirecting to your company's sign-in</p>
      <pl-button variant="ghost" @click=${this.#signOut}
        >Use a different email</pl-button
      >
    </pl-card>`;
  }

  #linkSent() {
    return html`<pl-card>
      <h1 slot="title" tabindex="-1">Check your email</h1>
      <span slot="description">We sent a sign-in link to ${this.email}.</span>
      <pl-button variant="ghost" @click=${this.#signOut}
        >Use a different email</pl-button
      >
    </pl-card>`;
  }

  #credentials() {
    if (this.mode === "sso" || this.mode === "magic") return this.#emailOnly();
    if (this.mode === "passkey") return this.#passkeyCard();
    return html`<pl-card>
      <h1 slot="title" tabindex="-1">Sign in</h1>
      <span slot="description">Use your email and password to continue.</span>
      <form novalidate @submit=${this.#signIn}>
        ${this.providers ? this.#providerButtons() : ""}
        ${this.#emailField("Email")}
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
        <pl-checkbox name="keep"
          >${this.complete ? "Remember me" : "Keep me signed in"}</pl-checkbox
        >
        <div class="actions">
          <pl-button type="submit" variant="primary" size="lg"
            >Continue</pl-button
          >
          ${
            this.complete
              ? html`<a href="#forgot" @click=${this.#forgotLink}
                  >Forgot password?</a
                >`
              : html`<pl-button variant="ghost" @click=${this.#forgot}
                  >Forgot password</pl-button
                >`
          }
        </div>
      </form>
      ${
        this.complete
          ? html`<p class="hint">
              New here?
              <a href="#create" @click=${this.#link}>Create an account</a>
            </p>`
          : ""
      }
      ${this.complete ? this.#terms() : ""}
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
      <span slot="description"
        >Welcome back${this.email ? `, ${this.email}` : ""}.</span
      >
      <pl-button variant="secondary" size="lg" @click=${this.#signOut}
        >Sign out</pl-button
      >
    </pl-card>`;
  }

  override render() {
    const card = {
      code: () => this.#verification(),
      done: () => this.#signedIn(),
      redirect: () => this.#redirecting(),
      sent: () => this.#linkSent(),
      credentials: () => this.#credentials(),
    }[this.step];
    return html`${this.#logo()}${card()}<pl-toaster></pl-toaster>`;
  }

  static override styles = css`
    pl-card {
      ${patternPanel}
      --_panel-base: var(--pl-color-surface-content);
      border-radius: var(--sb-panel-radius, var(--pl-radius-control));
    }

    ${plaintextRtl}

    :host {
      display: block;
      box-sizing: border-box;
      inline-size: min(100%, calc(var(--pl-spacing) * 100));
      color: var(--pl-color-foreground);
      font: 400 var(--pl-text-base) / var(--pl-leading-body) var(--pl-font-sans);
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

    .logo {
      display: block;
      inline-size: calc(var(--pl-spacing) * 10);
      block-size: calc(var(--pl-spacing) * 10);
      margin: 0 auto var(--pl-space-4);
      color: var(--pl-color-foreground);
    }

    .providers {
      display: grid;
      gap: var(--pl-gap-controls);
    }

    .divider {
      display: flex;
      align-items: center;
      gap: var(--pl-space-3);
      color: var(--pl-color-muted-foreground);
      font-size: var(--pl-text-sm);
    }

    .divider::before,
    .divider::after {
      content: "";
      flex: 1;
      block-size: 1px;
      background: var(--pl-color-border);
    }

    .terms {
      margin: 0;
      color: var(--pl-color-muted-foreground);
      font-size: var(--pl-text-sm);
    }

    .hint + .hint,
    form + .hint {
      margin-block-start: var(--pl-space-4);
    }

    a {
      color: var(--pl-color-foreground);
      text-decoration: underline;
    }

    .actions a {
      justify-self: center;
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

/** The sign-in with a logo above the card. */
export const WithLogo: Story = {
  render: () => page(html`<sign-in-demo logo></sign-in-demo>`),
};

/** Provider buttons above the email and password, split by an "or" divider. */
export const Providers: Story = {
  render: () => page(html`<sign-in-demo providers></sign-in-demo>`),
};

/** Single sign-on: a work email and Continue hand off to the company's sign-in. */
export const Sso: Story = {
  render: () => page(html`<sign-in-demo mode="sso"></sign-in-demo>`),
};

/** A passkey replaces the password: one button signs in. */
export const Passkey: Story = {
  render: () => page(html`<sign-in-demo mode="passkey"></sign-in-demo>`),
};

/** A magic link: an email and Send link lead to the "Check your email" state. */
export const MagicLink: Story = {
  render: () => page(html`<sign-in-demo mode="magic"></sign-in-demo>`),
};

/** Everything together: logo, providers, email and password, remember me, forgot password, create account and terms. */
export const Complete: Story = {
  render: () =>
    page(html`<sign-in-demo logo providers complete></sign-in-demo>`),
};

export const Rtl: Story = {
  render: () => page(html`<sign-in-demo></sign-in-demo>`),
  globals: { dir: "rtl" },
};

export const Glass: Story = {
  render: () => page(html`<sign-in-demo></sign-in-demo>`),
  globals: { material: "glass", theme: "dark", contrast: "more" },
};
