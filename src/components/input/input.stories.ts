import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { expect, userEvent } from "storybook/test";
import "./input.ts";
import type { PlInput } from "./input.ts";
import { widths } from "../../../.storybook/widths.ts";

const meta = {
  title: "Forms/Input",
  component: "pl-input",
} satisfies Meta;

export default meta;

type Story = StoryObj;

const column = (content: unknown) =>
  html`<div
    style="display:grid;justify-items:start;gap:var(--pl-space-3);padding:var(--pl-space-4)"
  >
    ${content}
  </div>`;

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
