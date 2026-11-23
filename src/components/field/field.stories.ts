import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import "../checkbox/checkbox.ts";
import "../button/button.ts";
import "../input/input.ts";
import "../input-group/input-group.ts";
import "../switch/switch.ts";
import "../textarea/textarea.ts";
import "./field.ts";

const meta = {
  title: "Components/Field",
  component: "pl-field",
} satisfies Meta;

export default meta;

type Story = StoryObj;

const column = (content: unknown, width = "28rem") =>
  html`<div
    style="display:grid;gap:var(--pl-space-4);padding:var(--pl-space-4);max-inline-size:${width}"
  >
    ${content}
  </div>`;

export const Default: Story = {
  render: () =>
    column(
      html`<pl-field id="field">
        <label slot="label" id="label">Email</label>
        <pl-input
          id="control"
          type="email"
          placeholder="you@example.com"
        ></pl-input>
        <span slot="description" id="description"
          >We only use it to send your receipt.</span
        >
      </pl-field>`,
    ),
};

export const InputGroup: Story = {
  render: () =>
    column(
      html`<pl-field id="field" invalid>
        <label slot="label" id="label">Invite link</label>
        <pl-input-group>
          <pl-button slot="start" id="addon">Copy</pl-button>
          <pl-input id="control" value="example.test/invite"></pl-input>
        </pl-input-group>
        <span slot="description">Anyone with the link can join.</span>
        <span slot="error">The link has expired.</span>
      </pl-field>`,
    ),
};

export const Invalid: Story = {
  render: () =>
    column(
      html`<pl-field id="field" invalid>
        <label slot="label">Email</label>
        <pl-input id="control" type="email" value="nope"></pl-input>
        <span slot="description">We only use it to send your receipt.</span>
        <span slot="error" id="error"
          >Enter an address such as name@example.com.</span
        >
      </pl-field>`,
    ),
};

export const Textarea: Story = {
  render: () =>
    column(
      html`<pl-field id="field">
        <label slot="label">Notes</label>
        <pl-textarea id="control"></pl-textarea>
        <span slot="description">Visible to your team.</span>
      </pl-field>`,
    ),
};

/** The label is not a label element: the field copies its text to the control and still focuses it on click. */
export const SpanLabel: Story = {
  render: () =>
    column(
      html`<pl-field id="field">
        <span slot="label" id="label">Display name</span>
        <pl-input id="control"></pl-input>
      </pl-field>`,
    ),
};

export const Horizontal: Story = {
  render: () =>
    column(
      html`<pl-field id="field" orientation="horizontal">
        <label slot="label">Display name</label>
        <pl-input id="control"></pl-input>
        <span slot="description">Shown on your profile.</span>
      </pl-field>`,
      "40rem",
    ),
};

/** Narrow, the field stacks; at 32rem and wider the label moves beside the control. */
export const Responsive: Story = {
  render: () =>
    column(
      [
        html`<div id="narrow" style="inline-size:20rem">
          <pl-field orientation="responsive">
            <label slot="label">Display name</label>
            <pl-input></pl-input>
          </pl-field>
        </div>`,
        html`<div id="wide" style="inline-size:40rem">
          <pl-field orientation="responsive">
            <label slot="label">Display name</label>
            <pl-input></pl-input>
          </pl-field>
        </div>`,
      ],
      "40rem",
    ),
};

export const Toggles: Story = {
  render: () =>
    column([
      html`<pl-field id="checkbox" orientation="horizontal">
        <label slot="label">Accept the terms</label>
        <pl-checkbox></pl-checkbox>
        <span slot="description">You can read them before you agree.</span>
      </pl-field>`,
      html`<pl-field id="switch" orientation="horizontal">
        <label slot="label">Notifications</label>
        <pl-switch></pl-switch>
        <span slot="description">Alerts for new replies.</span>
      </pl-field>`,
    ]),
};

export const Fieldset: Story = {
  render: () =>
    column(
      html`<pl-fieldset id="fieldset">
        <span slot="legend" id="legend">Profile</span>
        <span slot="description" id="description"
          >This appears on your public page.</span
        >
        <pl-field>
          <label slot="label">Name</label>
          <pl-input id="name"></pl-input>
        </pl-field>
        <pl-field orientation="horizontal">
          <label slot="label">Show my email</label>
          <pl-switch id="email"></pl-switch>
        </pl-field>
      </pl-fieldset>`,
    ),
};

export const DisabledFieldset: Story = {
  render: () =>
    column(
      html`<pl-fieldset id="fieldset" disabled>
        <span slot="legend">Billing</span>
        <pl-field>
          <label slot="label">Card holder</label>
          <pl-input id="name"></pl-input>
        </pl-field>
        <pl-field orientation="horizontal">
          <label slot="label">Save this card</label>
          <pl-checkbox id="save"></pl-checkbox>
        </pl-field>
      </pl-fieldset>`,
    ),
};

export const Rtl: Story = {
  render: () =>
    column(
      html`<pl-field id="field" orientation="horizontal">
        <label slot="label">Name</label>
        <pl-input id="control"></pl-input>
        <span slot="description">Shown on your profile.</span>
      </pl-field>`,
      "40rem",
    ),
  globals: { dir: "rtl" },
};

export const Glass: Story = {
  render: () =>
    column(
      html`<pl-field id="field" invalid>
        <label slot="label">Email</label>
        <pl-input type="email" value="nope"></pl-input>
        <span slot="description">We only use it to send your receipt.</span>
        <span slot="error">Enter an address such as name@example.com.</span>
      </pl-field>`,
    ),
  globals: { material: "glass", theme: "dark", contrast: "more" },
};
