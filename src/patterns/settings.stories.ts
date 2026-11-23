import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { LitElement, css, html, nothing } from "lit";
import "../components/button/button.ts";
import "../components/checkbox/checkbox.ts";
import "../components/dialog/dialog.ts";
import "../components/field/field.ts";
import "../components/input/input.ts";
import "../components/radio-group/radio-group.ts";
import "../components/select/select.ts";
import "../components/switch/switch.ts";
import "../components/tabs/tabs.ts";
import "../components/toast/toast.ts";
import type { PlDialog } from "../components/dialog/dialog.ts";
import type { PlToaster } from "../components/toast/toast.ts";

const meta = {
  title: "Patterns/Settings",
} satisfies Meta;

export default meta;

type Story = StoryObj;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** What is wrong with the email, or an empty string when it is fine. */
const emailError = (value: string) => {
  const email = value.trim();
  if (!email) return "Enter your email address.";
  if (!EMAIL.test(email)) return "Enter an address such as name@example.com.";
  return "";
};

/**
 * An app settings screen: tabs for General, Notifications and Privacy, a Save
 * button below them and a toaster for the result. It is the demo's own
 * element, not a library component. Save checks the email (required, valid
 * format): a failure marks the field invalid, shows the message in the field's
 * error slot and moves focus to it; a success shows a toast. Delete account
 * asks for confirmation in an alert dialog first.
 */
class SettingsDemo extends LitElement {
  static override properties = {
    email: {},
    /** Start as if Save had already failed. */
    attempted: { type: Boolean },
    tab: { state: true },
  };

  declare email: string;
  declare attempted: boolean;
  declare tab: string;

  constructor() {
    super();
    this.email = "sam@example.test";
    this.attempted = false;
    this.tab = "general";
  }

  get #toaster() {
    return this.renderRoot.querySelector("pl-toaster") as PlToaster;
  }

  #save = async () => {
    this.attempted = true;
    if (emailError(this.email)) {
      this.tab = "general";
      await this.updateComplete;
      await this.renderRoot.querySelector<LitElement>("pl-tabs")!
        .updateComplete;
      const input =
        this.renderRoot.querySelector<HTMLElement>("pl-input#email");
      await (input as Partial<LitElement> | null)?.updateComplete;
      input?.focus();
      return;
    }
    this.attempted = false;
    this.#toaster.show({ title: "Settings saved" });
  };

  #ask = () =>
    this.renderRoot.querySelector<PlDialog>("pl-dialog#delete")!.show();

  #deleted = (event: Event) => {
    if (
      (event as CustomEvent<{ returnValue: string }>).detail.returnValue ===
      "delete"
    )
      this.#toaster.show({
        title: "Account deleted",
        description: "Your data will be removed within 30 days.",
      });
  };

  override render() {
    const error = this.attempted ? emailError(this.email) : "";
    return html`
      <h1>Settings</h1>
      <pl-tabs
        label="Settings"
        .value=${this.tab}
        @pl-change=${(event: CustomEvent<{ value: string }>) => {
          if (event.target === event.currentTarget)
            this.tab = event.detail.value;
        }}
      >
        <pl-tab value="general">General</pl-tab>
        <pl-tab value="notifications">Notifications</pl-tab>
        <pl-tab value="privacy">Privacy</pl-tab>

        <pl-tab-panel value="general">
          <div class="stack">
            <pl-field>
              <label slot="label">Display name</label>
              <pl-input
                id="name"
                value="Sam Rivera"
                autocomplete="name"
              ></pl-input>
              <span slot="description">Shown next to your messages.</span>
            </pl-field>
            <pl-field id="email-field" ?invalid=${!!error}>
              <label slot="label">Email</label>
              <pl-input
                id="email"
                inputmode="email"
                autocomplete="email"
                .value=${this.email}
                @pl-input=${(event: CustomEvent<{ value: string }>) =>
                  (this.email = event.detail.value)}
              ></pl-input>
              <span slot="description"
                >We send receipts and security notices here.</span
              >
              ${error ? html`<span slot="error">${error}</span>` : nothing}
            </pl-field>
            <pl-field>
              <label slot="label">Language</label>
              <pl-select id="language">
                <pl-option value="en" selected>English</pl-option>
                <pl-option value="es">Español</pl-option>
                <pl-option value="fr">Français</pl-option>
                <pl-option value="de">Deutsch</pl-option>
              </pl-select>
            </pl-field>
            <pl-field>
              <span slot="label">Appearance</span>
              <pl-radio-group
                id="appearance"
                label="Appearance"
                name="appearance"
              >
                <pl-radio value="light">Light</pl-radio>
                <pl-radio value="dark">Dark</pl-radio>
                <pl-radio value="auto" checked>Automatic</pl-radio>
              </pl-radio-group>
              <span slot="description"
                >Automatic follows your device setting.</span
              >
            </pl-field>
          </div>
        </pl-tab-panel>

        <pl-tab-panel value="notifications">
          <pl-fieldset>
            <span slot="legend">Notify me by</span>
            <span slot="description"
              >Choose how you hear about activity in your workspace.</span
            >
            <div class="stack">
              <pl-field orientation="horizontal">
                <label slot="label">Email</label>
                <pl-switch checked></pl-switch>
                <span slot="description">Replies and mentions.</span>
              </pl-field>
              <pl-field orientation="horizontal">
                <label slot="label">Push</label>
                <pl-switch checked></pl-switch>
                <span slot="description">Alerts on this device.</span>
              </pl-field>
              <pl-field orientation="horizontal">
                <label slot="label">Weekly summary</label>
                <pl-switch></pl-switch>
                <span slot="description">A digest every Monday morning.</span>
              </pl-field>
            </div>
          </pl-fieldset>
        </pl-tab-panel>

        <pl-tab-panel value="privacy">
          <div class="stack">
            <pl-field orientation="horizontal">
              <label slot="label">Share usage data</label>
              <pl-checkbox></pl-checkbox>
              <span slot="description"
                >Anonymous diagnostics help us fix problems sooner.</span
              >
            </pl-field>
            <section class="danger">
              <h2>Delete account</h2>
              <p>
                This removes your profile and everything you saved. It cannot be
                undone.
              </p>
              <pl-button id="ask" destructive @click=${this.#ask}
                >Delete account</pl-button
              >
            </section>
          </div>
        </pl-tab-panel>
      </pl-tabs>

      <div class="actions">
        <pl-button id="save" variant="primary" @click=${this.#save}
          >Save</pl-button
        >
      </div>

      <pl-dialog id="delete" variant="alert" @pl-close=${this.#deleted}>
        <h2 slot="title">Delete your account?</h2>
        All of your messages, files and settings will be removed. This cannot be
        undone.
        <pl-button slot="actions" size="lg" cancel data-close="cancel"
          >Cancel</pl-button
        >
        <pl-button slot="actions" size="lg" destructive data-close="delete"
          >Delete</pl-button
        >
      </pl-dialog>
      <pl-toaster></pl-toaster>
    `;
  }

  static override styles = css`
    :host {
      display: block;
      box-sizing: border-box;
      inline-size: min(100%, calc(var(--pl-spacing) * 160));
      margin-inline: auto;
      padding: var(--pl-space-6);
      border: 1px solid var(--pl-color-border);
      border-radius: var(--pl-radius-lg);
      background: var(--pl-color-background);
      color: var(--pl-color-foreground);
      font: 400 var(--pl-text-base) / var(--pl-leading-normal)
        var(--pl-font-sans);
    }

    h1 {
      margin: 0 0 var(--pl-space-4);
      font: 600 var(--pl-text-xl) / var(--pl-leading-tight) var(--pl-font-sans);
    }

    h2 {
      margin: 0;
      font: 600 var(--pl-text-base) / var(--pl-leading-tight)
        var(--pl-font-sans);
    }

    p {
      margin: 0;
    }

    .stack {
      display: grid;
      gap: var(--pl-space-5);
      padding-block: var(--pl-space-4);
    }

    pl-fieldset {
      margin-block: var(--pl-space-4);
    }

    .danger {
      display: grid;
      justify-items: start;
      gap: var(--pl-space-2);
      padding-block-start: var(--pl-space-5);
      border-block-start: 1px solid var(--pl-color-border);
    }

    .danger p {
      color: var(--pl-color-muted-foreground);
      font-size: var(--pl-text-sm);
    }

    .danger pl-button {
      margin-block-start: var(--pl-space-2);
    }

    .actions {
      display: flex;
      justify-content: flex-end;
      padding-block-start: var(--pl-space-4);
      border-block-start: 1px solid var(--pl-color-border);
    }
  `;
}

if (!customElements.get("settings-demo"))
  customElements.define("settings-demo", SettingsDemo);

const page = (content: unknown) =>
  html`<div style="padding:var(--pl-space-4)">${content}</div>`;

/** Three tabs of settings. Save checks the email; a valid save shows a toast. */
export const Default: Story = {
  render: () => page(html`<settings-demo></settings-demo>`),
};

/** After a failed save: the email is empty, its field is invalid and says what to fix. */
export const Errors: Story = {
  render: () => page(html`<settings-demo email="" attempted></settings-demo>`),
};

export const Rtl: Story = {
  render: () => page(html`<settings-demo></settings-demo>`),
  globals: { dir: "rtl" },
};

export const Glass: Story = {
  render: () => page(html`<settings-demo></settings-demo>`),
  globals: { material: "glass", theme: "dark", contrast: "more" },
};
