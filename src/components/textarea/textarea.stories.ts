import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { expect, userEvent } from "storybook/test";
import "./textarea.ts";
import type { PlTextarea } from "./textarea.ts";

const meta = {
  title: "Forms/Text Area",
  component: "pl-textarea",
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
    html`<pl-textarea
      id="area"
      label="Message"
      placeholder="Message"
    ></pl-textarea>`,
};

export const Labelled: Story = {
  render: () =>
    column(html`<pl-textarea id="area" value="Hello">Message</pl-textarea>`),
};

export const States: Story = {
  render: () =>
    column([
      html`<pl-textarea
        label="Placeholder"
        placeholder="Placeholder"
      ></pl-textarea>`,
      html`<pl-textarea
        label="Filled"
        value="Value on the first line
and a second line"
      ></pl-textarea>`,
      html`<pl-textarea label="Disabled" value="Value" disabled></pl-textarea>`,
      html`<pl-textarea
        label="Read only"
        value="Value"
        readonly
      ></pl-textarea>`,
      html`<pl-textarea id="invalid" label="Invalid" required></pl-textarea>`,
    ]),
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector<PlTextarea>("#invalid")!;
    await el.updateComplete;
    el.focus();
    await userEvent.tab();
    await el.updateComplete;
  },
};

export const Resize: Story = {
  render: () =>
    column([
      html`<pl-textarea label="Vertical" value="Resizes"></pl-textarea>`,
      html`<pl-textarea
        label="Fixed"
        value="Does not resize"
        resize="none"
      ></pl-textarea>`,
      html`<pl-textarea
        label="Two rows"
        rows="2"
        value="Two rows tall"
      ></pl-textarea>`,
    ]),
};

export const Sizes: Story = {
  render: () =>
    column(
      (["md", "lg", "xl"] as const).map(
        (size) =>
          html`<pl-textarea
            size=${size}
            rows="1"
            label="Size ${size}"
            value="Size ${size}"
          ></pl-textarea>`,
      ),
    ),
};

/** In a form the field submits its value and follows reset, fieldset and validity. */
export const InForm: Story = {
  render: () => html`
    <form id="form" style="padding:var(--pl-space-4)">
      <fieldset
        id="fieldset"
        style="display:grid;justify-items:start;gap:var(--pl-space-3);border:0;padding:0;margin:0"
      >
        <pl-textarea id="note" name="note" value="Hi">Note</pl-textarea>
        <pl-textarea id="body" name="body" required minlength="3"
          >Body</pl-textarea
        >
      </fieldset>
    </form>
  `,
};

/** Typing fires pl-input per edit and Enter adds a line. */
export const Types: Story = {
  render: () => html`<pl-textarea id="area" label="Message"></pl-textarea>`,
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector<PlTextarea>("#area")!;
    const values: string[] = [];
    el.addEventListener("pl-input", (event) =>
      values.push((event as CustomEvent<{ value: string }>).detail.value),
    );
    await el.updateComplete;
    el.focus();
    await userEvent.keyboard("a{Enter}b");
    expect(values).toEqual(["a", "a\n", "a\nb"]);
  },
};

export const Rtl: Story = {
  render: () =>
    column(html`<pl-textarea label="Message" value="Value"></pl-textarea>`),
  globals: { dir: "rtl" },
};

export const Glass: Story = {
  render: () =>
    column(html`<pl-textarea label="Message" value="Value"></pl-textarea>`),
  globals: { material: "glass", theme: "dark", contrast: "more" },
};
