import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { expect, userEvent } from "storybook/test";
import "./input.ts";
import "../button/button.ts";
import "../dialog/dialog.ts";
import type { PlDialog } from "../dialog/dialog.ts";
import type { PlInput } from "./input.ts";
import { widths } from "../../../.storybook/widths.ts";

import { playground } from "../../../.storybook/playground.ts";

const meta = {
  title: "Forms/Input",
  component: "pl-input",
  tags: ["autodocs"],
  parameters: { controls: { disable: true } },
} satisfies Meta;

export default meta;

type Story = StoryObj;

const column = (content: unknown) =>
  html`<div
    style="display:grid;justify-items:start;gap:var(--pl-space-3);padding:var(--pl-space-4)"
  >
    ${content}
  </div>`;

export const Playground: Story = {
  ...playground(
    {
      label: "Name",
      placeholder: "Enter your name",
      size: ["md", "lg", "xl"],
      disabled: false,
    },
    ["pl-input", "pl-change"],
  ),
  render: ({ label, placeholder, size, disabled }) =>
    html`<pl-input
      label=${label}
      placeholder=${placeholder}
      size=${size}
      ?disabled=${disabled}
    ></pl-input>`,
};

// Stories that other tests open as they are have no play function.
export const Default: Story = {
  render: () =>
    html`<pl-input id="input" label="Name" placeholder="Name"></pl-input>`,
};

export const Labelled: Story = {
  render: () => column(html`<pl-input id="input" value="Ada">Name</pl-input>`),
};

export const Sizes: Story = {
  render: () =>
    column(
      (["md", "lg", "xl"] as const).map(
        (size) =>
          html`<pl-input
            size=${size}
            label="Size ${size}"
            value="Size ${size}"
          ></pl-input>`,
      ),
    ),
};

/** The width is the host's `inline-size`: small, medium, large and full. */
export const Widths: Story = {
  render: () =>
    widths(
      (style, label) =>
        html`<pl-input
          style=${style}
          label=${label}
          placeholder=${label}
        ></pl-input>`,
    ),
};

export const States: Story = {
  render: () =>
    column([
      html`<pl-input label="Empty"></pl-input>`,
      html`<pl-input label="Placeholder" placeholder="Placeholder"></pl-input>`,
      html`<pl-input label="Value" value="Value"></pl-input>`,
      html`<pl-input label="Disabled" value="Value" disabled></pl-input>`,
      html`<pl-input label="Read only" value="Value" readonly></pl-input>`,
      html`<pl-input
        id="invalid"
        label="Invalid"
        type="email"
        value="nope"
      ></pl-input>`,
    ]),
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector<PlInput>("#invalid")!;
    await el.updateComplete;
    el.focus();
    await userEvent.tab();
    await el.updateComplete;
  },
};

export const Search: Story = {
  render: () =>
    column([
      html`<pl-input
        type="search"
        label="Search"
        placeholder="Search"
      ></pl-input>`,
      html`<pl-input
        type="search"
        label="Search with text"
        value="Value"
      ></pl-input>`,
      html`<pl-input
        type="search"
        label="Search disabled"
        value="Value"
        disabled
      ></pl-input>`,
    ]),
};

export const Password: Story = {
  render: () =>
    column([
      html`<pl-input type="password" label="Password"></pl-input>`,
      html`<pl-input
        type="password"
        label="Password filled"
        value="synthetic"
      ></pl-input>`,
    ]),
};

/** In a form the field submits its value and follows reset, fieldset and validity. */
export const InForm: Story = {
  render: () => html`
    <form id="form" style="padding:var(--pl-space-4)">
      <fieldset
        id="fieldset"
        style="display:grid;justify-items:start;gap:var(--pl-space-3);border:0;padding:0;margin:0"
      >
        <pl-input id="name" name="name" value="Ada">Name</pl-input>
        <pl-input id="email" name="email" type="email" required>Email</pl-input>
        <pl-input id="find" name="q" type="search" label="Find"></pl-input>
      </fieldset>
    </form>
  `,
};

/** Typing fires pl-input per edit; the search field clears with its button and Escape. */
export const Types: Story = {
  render: () =>
    html`<pl-input id="input" type="search" label="Search"></pl-input>`,
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector<PlInput>("#input")!;
    const values: string[] = [];
    el.addEventListener("pl-input", (event) =>
      values.push((event as CustomEvent<{ value: string }>).detail.value),
    );
    await el.updateComplete;
    el.focus();
    await userEvent.keyboard("ab");
    expect(values).toEqual(["a", "ab"]);
    await userEvent.keyboard("{Escape}");
    expect(el.value).toBe("");
  },
};

export const Rtl: Story = {
  render: () =>
    column([
      html`<pl-input label="Name" value="Value"></pl-input>`,
      html`<pl-input type="search" label="Search" value="Value"></pl-input>`,
    ]),
  globals: { dir: "rtl" },
};

export const Glass: Story = {
  render: () =>
    column([
      html`<pl-input label="Name" value="Value"></pl-input>`,
      html`<pl-input
        type="search"
        label="Search"
        placeholder="Search"
      ></pl-input>`,
    ]),
  globals: { material: "glass", theme: "dark", contrast: "more" },
};

/** A form that validates itself sets `aria-required`, `aria-describedby`, `aria-invalid` and `aria-errormessage` on the host; the field forwards them to its native input. */
export const HostAria: Story = {
  parameters: {
    // The host attributes are forwarded to the inner control, which is where they apply.
    a11y: {
      options: {
        rules: {
          "aria-allowed-attr": { enabled: false },
          "aria-valid-attr-value": { enabled: false },
        },
      },
    },
  },
  render: () =>
    column(html`
      <pl-input
        id="input"
        label="Email"
        aria-required="true"
        aria-invalid="true"
        aria-describedby="hint"
        aria-errormessage="problem"
      ></pl-input>
      <p id="hint" style="margin:0">We only use it to send the receipt.</p>
      <p id="problem" style="margin:0">Enter an email address.</p>
    `),
};

/** Return in a field of a form without a submit button presses the dialog's default action. */
export const InDialog: Story = {
  render: () => html`
    <pl-button
      @click=${(event: Event) =>
        (
          (event.currentTarget as HTMLElement).nextElementSibling as PlDialog
        ).show()}
      >Rename…</pl-button
    >
    <pl-dialog id="dialog" variant="sheet" label="Rename">
      <form id="form" novalidate>
        <pl-input id="first" label="Name" value="Untitled"></pl-input>
        <pl-input id="second" label="Tag"></pl-input>
      </form>
      <pl-button slot="actions" cancel data-close="cancel">Cancel</pl-button>
      <pl-button slot="actions" default data-close="rename">Rename</pl-button>
    </pl-dialog>
  `,
  play: async ({ canvasElement }) => {
    const dialog = canvasElement.querySelector<PlDialog>("#dialog")!;
    await dialog.updateComplete;
    dialog.show();
    await dialog.updateComplete;
  },
};
