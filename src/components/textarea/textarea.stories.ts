import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { expect, userEvent } from "storybook/test";
import "./textarea.ts";
import type { PurrTextarea } from "./textarea.ts";

const meta = {
  title: "Components/Text area",
  component: "purr-textarea",
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
    html`<purr-textarea
      id="area"
      label="Message"
      placeholder="Message"
    ></purr-textarea>`,
};

export const Labelled: Story = {
  render: () =>
    column(
      html`<purr-textarea id="area" value="Hello">Message</purr-textarea>`,
    ),
};

export const States: Story = {
  render: () =>
    column([
      html`<purr-textarea
        label="Placeholder"
        placeholder="Placeholder"
      ></purr-textarea>`,
      html`<purr-textarea
        label="Filled"
        value="Value on the first line
and a second line"
      ></purr-textarea>`,
      html`<purr-textarea
        label="Disabled"
        value="Value"
        disabled
      ></purr-textarea>`,
      html`<purr-textarea
        label="Read only"
        value="Value"
        readonly
      ></purr-textarea>`,
      html`<purr-textarea
        id="invalid"
        label="Invalid"
        required
      ></purr-textarea>`,
    ]),
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector<PurrTextarea>("#invalid")!;
    await el.updateComplete;
    el.focus();
    await userEvent.tab();
    await el.updateComplete;
  },
};

export const Resize: Story = {
  render: () =>
    column([
      html`<purr-textarea label="Vertical" value="Resizes"></purr-textarea>`,
      html`<purr-textarea
        label="Fixed"
        value="Does not resize"
        resize="none"
      ></purr-textarea>`,
      html`<purr-textarea
        label="Two rows"
        rows="2"
        value="Two rows tall"
      ></purr-textarea>`,
    ]),
};

export const Sizes: Story = {
  render: () =>
    column(
      (["md", "lg", "xl"] as const).map(
        (size) =>
          html`<purr-textarea
            size=${size}
            rows="1"
            label="Size ${size}"
            value="Size ${size}"
          ></purr-textarea>`,
      ),
    ),
};

/** In a form the field submits its value and follows reset, fieldset and validity. */
export const InForm: Story = {
  render: () => html`
    <form id="form" style="padding:var(--purr-space-4)">
      <fieldset
        id="fieldset"
        style="display:grid;justify-items:start;gap:var(--purr-space-3);border:0;padding:0;margin:0"
      >
        <purr-textarea id="note" name="note" value="Hi">Note</purr-textarea>
        <purr-textarea id="body" name="body" required minlength="3"
          >Body</purr-textarea
        >
      </fieldset>
    </form>
  `,
};

/** Typing fires purr-input per edit and Enter adds a line. */
export const Types: Story = {
  render: () => html`<purr-textarea id="area" label="Message"></purr-textarea>`,
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector<PurrTextarea>("#area")!;
    const values: string[] = [];
    el.addEventListener("purr-input", (event) =>
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
    column(html`<purr-textarea label="Message" value="Value"></purr-textarea>`),
  globals: { dir: "rtl" },
};

export const Glass: Story = {
  render: () =>
    column(html`<purr-textarea label="Message" value="Value"></purr-textarea>`),
  globals: { material: "glass", theme: "dark", contrast: "more" },
};
