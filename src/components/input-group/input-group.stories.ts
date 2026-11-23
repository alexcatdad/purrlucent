import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html, svg } from "lit";
import { userEvent } from "storybook/test";
import "../button/button.ts";
import "../input/input.ts";
import type { PlInput } from "../input/input.ts";
import "../textarea/textarea.ts";
import "./input-group.ts";

const meta = {
  title: "Components/Input Group",
  component: "pl-input-group",
} satisfies Meta;

export default meta;

type Story = StoryObj;

const column = (content: unknown) =>
  html`<div
    style="display:grid;justify-items:start;gap:var(--pl-space-3);padding:var(--pl-space-4)"
  >
    ${content}
  </div>`;

const link = svg`<svg slot="start" viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14a3.5 3.5 0 0 0 5 0l4 -4a3.5 3.5 0 0 0 -5 -5l-.5 .5" /><path d="M14 10a3.5 3.5 0 0 0 -5 0l-4 4a3.5 3.5 0 0 0 5 5l.5 -.5" /></svg>`;

export const Default: Story = {
  render: () =>
    column(
      html`<pl-input-group id="group">
        <span slot="start">$</span>
        <pl-input id="input">Amount</pl-input>
        <span slot="end">USD</span>
      </pl-input-group>`,
    ),
};

export const Addons: Story = {
  render: () =>
    column([
      html`<pl-input-group>
        ${link}
        <pl-input>Website</pl-input>
      </pl-input-group>`,
      html`<pl-input-group>
        <span slot="start">https://</span>
        <pl-input>Domain</pl-input>
        <span slot="end">.com</span>
      </pl-input-group>`,
      html`<pl-input-group>
        <pl-input type="search" label="Search" placeholder="Search"></pl-input>
        <pl-button slot="end" variant="primary">Go</pl-button>
      </pl-input-group>`,
      html`<pl-input-group>
        <pl-button slot="start">Copy</pl-button>
        <pl-input label="Invite link" value="example.test/invite"></pl-input>
      </pl-input-group>`,
    ]),
};

export const Sizes: Story = {
  render: () =>
    column(
      (["md", "lg", "xl"] as const).map(
        (size) =>
          html`<pl-input-group>
            <span slot="start">$</span>
            <pl-input
              size=${size}
              label="Size ${size}"
              value="Size ${size}"
            ></pl-input>
            <span slot="end">USD</span>
          </pl-input-group>`,
      ),
    ),
};

export const Textarea: Story = {
  render: () =>
    column(
      html`<pl-input-group id="group">
        ${link}
        <pl-textarea label="Notes" placeholder="Notes"></pl-textarea>
      </pl-input-group>`,
    ),
};

export const States: Story = {
  render: () =>
    column([
      html`<pl-input-group>
        <span slot="start">$</span>
        <pl-input label="Disabled" value="10" disabled></pl-input>
        <span slot="end">USD</span>
      </pl-input-group>`,
      html`<pl-input-group id="invalid">
        <span slot="start">@</span>
        <pl-input
          id="email"
          label="Invalid"
          type="email"
          value="nope"
        ></pl-input>
      </pl-input-group>`,
    ]),
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector<PlInput>("#email")!;
    await el.updateComplete;
    el.focus();
    await userEvent.tab();
    await el.updateComplete;
  },
};

/** The field's `aria-describedby` names an addon, so the control reads it as its description. */
export const Described: Story = {
  render: () =>
    column(
      html`<pl-input-group>
        <pl-input aria-describedby="unit">Weight</pl-input>
        <span slot="end" id="unit">kilograms</span>
      </pl-input-group>`,
    ),
};

export const Rtl: Story = {
  render: () =>
    column([
      html`<pl-input-group>
        <span slot="start">$</span>
        <pl-input label="Amount" value="10"></pl-input>
        <span slot="end">USD</span>
      </pl-input-group>`,
      html`<pl-input-group>
        <pl-input label="Search" value="Value"></pl-input>
        <pl-button slot="end">Go</pl-button>
      </pl-input-group>`,
    ]),
  globals: { dir: "rtl" },
};

export const Glass: Story = {
  render: () =>
    column(
      html`<pl-input-group>
        <span slot="start">$</span>
        <pl-input label="Amount" value="10"></pl-input>
        <span slot="end">USD</span>
      </pl-input-group>`,
    ),
  globals: { material: "glass", theme: "dark", contrast: "more" },
};
