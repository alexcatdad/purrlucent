import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { expect, userEvent } from "storybook/test";
import "./number-field.ts";
import type { PurrNumberField } from "./number-field.ts";

const meta = {
  title: "Components/Number field",
  component: "purr-number-field",
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
    html`<purr-number-field
      id="field"
      label="Quantity"
      value="3"
      min="0"
      max="99"
    ></purr-number-field>`,
};

export const Labelled: Story = {
  render: () =>
    column(
      html`<purr-number-field id="field" value="3" min="0" max="99"
        >Quantity</purr-number-field
      >`,
    ),
};

export const Sizes: Story = {
  render: () =>
    column(
      (["inside", "outside"] as const).map((stepper) =>
        (["md", "lg", "xl"] as const).map(
          (size) =>
            html`<purr-number-field
              size=${size}
              stepper=${stepper}
              label="${stepper} ${size}"
              value="3"
              min="0"
              max="99"
            ></purr-number-field>`,
        ),
      ),
    ),
};

export const States: Story = {
  render: () =>
    column(
      (["inside", "outside"] as const).map((stepper) => [
        html`<purr-number-field
          stepper=${stepper}
          label="At max ${stepper}"
          value="9"
          max="9"
        ></purr-number-field>`,
        html`<purr-number-field
          stepper=${stepper}
          label="At min ${stepper}"
          value="0"
          min="0"
        ></purr-number-field>`,
        html`<purr-number-field
          stepper=${stepper}
          label="Empty ${stepper}"
        ></purr-number-field>`,
        html`<purr-number-field
          stepper=${stepper}
          label="Disabled ${stepper}"
          value="3"
          disabled
        ></purr-number-field>`,
        html`<purr-number-field
          stepper=${stepper}
          label="Read only ${stepper}"
          value="3"
          readonly
        ></purr-number-field>`,
      ]),
    ),
};

/** In a form the field submits its number and follows reset, fieldset and required. */
export const InForm: Story = {
  render: () => html`
    <form id="form" style="padding:var(--purr-space-4)">
      <fieldset
        id="fieldset"
        style="display:grid;justify-items:start;gap:var(--purr-space-3);border:0;padding:0;margin:0"
      >
        <purr-number-field
          id="count"
          name="count"
          value="4"
          min="0"
          max="10"
          step="2"
          >Count</purr-number-field
        >
        <purr-number-field id="age" name="age" required stepper="outside"
          >Age</purr-number-field
        >
      </fieldset>
    </form>
  `,
};

const quantity = html`<purr-number-field
  id="field"
  label="Quantity"
  value="5"
  min="0"
  max="10"
></purr-number-field>`;

export const Steps: Story = { render: () => quantity };

/** Arrow, page and Home keys move the value. */
export const Keyboard: Story = {
  render: () => quantity,
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector<PurrNumberField>("#field")!;
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

export const Rtl: Story = {
  render: () =>
    column(
      (["inside", "outside"] as const).map(
        (stepper) =>
          html`<purr-number-field
            stepper=${stepper}
            label="Quantity"
            value="3"
          ></purr-number-field>`,
      ),
    ),
  globals: { dir: "rtl" },
};

export const Glass: Story = {
  render: () =>
    column(
      (["inside", "outside"] as const).map(
        (stepper) =>
          html`<purr-number-field
            stepper=${stepper}
            label="Quantity"
            value="3"
            min="0"
          ></purr-number-field>`,
      ),
    ),
  globals: { material: "glass", theme: "dark", contrast: "more" },
};
