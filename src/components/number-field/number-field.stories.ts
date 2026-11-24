import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { expect, userEvent } from "storybook/test";
import "./number-field.ts";
import type { PlNumberField } from "./number-field.ts";
import { widths } from "../../../.storybook/widths.ts";

const meta = {
  title: "Forms/Number Field",
  component: "pl-number-field",
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
    html`<pl-number-field
      id="field"
      label="Quantity"
      value="3"
      min="0"
      max="99"
    ></pl-number-field>`,
};

export const Labelled: Story = {
  render: () =>
    column(
      html`<pl-number-field id="field" value="3" min="0" max="99"
        >Quantity</pl-number-field
      >`,
    ),
};

export const Sizes: Story = {
  render: () =>
    column(
      (["inside", "outside"] as const).map((stepper) =>
        (["md", "lg", "xl"] as const).map(
          (size) =>
            html`<pl-number-field
              size=${size}
              stepper=${stepper}
              label="${stepper} ${size}"
              value="3"
              min="0"
              max="99"
            ></pl-number-field>`,
        ),
      ),
    ),
};

/** The width is the host's `inline-size`; the stepper stays at its end. */
export const Widths: Story = {
  render: () =>
    widths(
      (style, label) =>
        html`<pl-number-field
          style=${style}
          label=${label}
          value="3"
        ></pl-number-field>`,
    ),
};

export const States: Story = {
  render: () =>
    column(
      (["inside", "outside"] as const).map((stepper) => [
        html`<pl-number-field
          stepper=${stepper}
          label="At max ${stepper}"
          value="9"
          max="9"
        ></pl-number-field>`,
        html`<pl-number-field
          stepper=${stepper}
          label="At min ${stepper}"
          value="0"
          min="0"
        ></pl-number-field>`,
        html`<pl-number-field
          stepper=${stepper}
          label="Empty ${stepper}"
        ></pl-number-field>`,
        html`<pl-number-field
          stepper=${stepper}
          label="Disabled ${stepper}"
          value="3"
          disabled
        ></pl-number-field>`,
        html`<pl-number-field
          stepper=${stepper}
          label="Read only ${stepper}"
          value="3"
          readonly
        ></pl-number-field>`,
      ]),
    ),
};

/** In a form the field submits its number and follows reset, fieldset and required. */
export const InForm: Story = {
  render: () => html`
    <form id="form" style="padding:var(--pl-space-4)">
      <fieldset
        id="fieldset"
        style="display:grid;justify-items:start;gap:var(--pl-space-3);border:0;padding:0;margin:0"
      >
        <pl-number-field
          id="count"
          name="count"
          value="4"
          min="0"
          max="10"
          step="2"
          >Count</pl-number-field
        >
        <pl-number-field id="age" name="age" required stepper="outside"
          >Age</pl-number-field
        >
      </fieldset>
    </form>
  `,
};

const quantity = html`<pl-number-field
  id="field"
  label="Quantity"
  value="5"
  min="0"
  max="10"
></pl-number-field>`;

export const Steps: Story = { render: () => quantity };

/** Arrow, page and Home keys move the value. */
export const Keyboard: Story = {
  render: () => quantity,
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector<PlNumberField>("#field")!;
    await el.updateComplete;
    el.focus();
    await userEvent.keyboard("{ArrowUp}{ArrowUp}");
    expect(el.value).toBe(7);
    await userEvent.keyboard("{PageUp}");
    expect(el.value).toBe(10);
    await userEvent.keyboard("{Home}");
    expect(el.value).toBe(0);
  },
};

/** Under `lang="de"` the decimal separator is a comma; the form still gets a plain number. */
export const Decimals: Story = {
  render: () => html`
    <form id="form" lang="de" style="padding:var(--pl-space-4)">
      <pl-number-field name="weight" value="1.5" step="0.1"
        >Weight</pl-number-field
      >
    </form>
  `,
};

export const Rtl: Story = {
  render: () =>
    column(
      (["inside", "outside"] as const).map(
        (stepper) =>
          html`<pl-number-field
            stepper=${stepper}
            label="Quantity"
            value="3"
          ></pl-number-field>`,
      ),
    ),
  globals: { dir: "rtl" },
};

export const Glass: Story = {
  render: () =>
    column(
      (["inside", "outside"] as const).map(
        (stepper) =>
          html`<pl-number-field
            stepper=${stepper}
            label="Quantity"
            value="3"
            min="0"
          ></pl-number-field>`,
      ),
    ),
  globals: { material: "glass", theme: "dark", contrast: "more" },
};
