import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { expect, userEvent } from "storybook/test";
import "./input.ts";
import type { PurrInput } from "./input.ts";

const meta = {
  title: "Components/Input",
  component: "purr-input",
} satisfies Meta;

export default meta;

type Story = StoryObj;

const column = (content: unknown) =>
  html`<div
    style="display:grid;justify-items:start;gap:var(--purr-space-3);padding:var(--purr-space-4)"
  >
    ${content}
  </div>`;

// Stories that other tests open as they are have no play function.
export const Default: Story = {
  render: () =>
    html`<purr-input id="input" label="Name" placeholder="Name"></purr-input>`,
};

export const Labelled: Story = {
  render: () =>
    column(html`<purr-input id="input" value="Ada">Name</purr-input>`),
};

export const Sizes: Story = {
  render: () =>
    column(
      (["md", "lg", "xl"] as const).map(
        (size) =>
          html`<purr-input
            size=${size}
            label="Size ${size}"
            value="Size ${size}"
          ></purr-input>`,
      ),
    ),
};

export const States: Story = {
  render: () =>
    column([
      html`<purr-input label="Empty"></purr-input>`,
      html`<purr-input
        label="Placeholder"
        placeholder="Placeholder"
      ></purr-input>`,
      html`<purr-input label="Value" value="Value"></purr-input>`,
      html`<purr-input label="Disabled" value="Value" disabled></purr-input>`,
      html`<purr-input label="Read only" value="Value" readonly></purr-input>`,
      html`<purr-input
        id="invalid"
        label="Invalid"
        type="email"
        value="nope"
      ></purr-input>`,
    ]),
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector<PurrInput>("#invalid")!;
    await el.updateComplete;
    el.focus();
    await userEvent.tab();
    await el.updateComplete;
  },
};

export const Search: Story = {
  render: () =>
    column([
      html`<purr-input
        type="search"
        label="Search"
        placeholder="Search"
      ></purr-input>`,
      html`<purr-input
        type="search"
        label="Search with text"
        value="Value"
      ></purr-input>`,
      html`<purr-input
        type="search"
        label="Search disabled"
        value="Value"
        disabled
      ></purr-input>`,
    ]),
};

export const Password: Story = {
  render: () =>
    column([
      html`<purr-input type="password" label="Password"></purr-input>`,
      html`<purr-input
        type="password"
        label="Password filled"
        value="synthetic"
      ></purr-input>`,
    ]),
};

/** In a form the field submits its value and follows reset, fieldset and validity. */
export const InForm: Story = {
  render: () => html`
    <form id="form" style="padding:var(--purr-space-4)">
      <fieldset
        id="fieldset"
        style="display:grid;justify-items:start;gap:var(--purr-space-3);border:0;padding:0;margin:0"
      >
        <purr-input id="name" name="name" value="Ada">Name</purr-input>
        <purr-input id="email" name="email" type="email" required
          >Email</purr-input
        >
        <purr-input id="find" name="q" type="search" label="Find"></purr-input>
      </fieldset>
    </form>
  `,
};

/** Typing fires purr-input per edit; the search field clears with its button and Escape. */
export const Types: Story = {
  render: () =>
    html`<purr-input id="input" type="search" label="Search"></purr-input>`,
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector<PurrInput>("#input")!;
    const values: string[] = [];
    el.addEventListener("purr-input", (event) =>
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
      html`<purr-input label="Name" value="Value"></purr-input>`,
      html`<purr-input
        type="search"
        label="Search"
        value="Value"
      ></purr-input>`,
    ]),
  globals: { dir: "rtl" },
};

export const Glass: Story = {
  render: () =>
    column([
      html`<purr-input label="Name" value="Value"></purr-input>`,
      html`<purr-input
        type="search"
        label="Search"
        placeholder="Search"
      ></purr-input>`,
    ]),
  globals: { material: "glass", theme: "dark", contrast: "more" },
};
