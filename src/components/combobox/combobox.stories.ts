import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { expect, userEvent } from "storybook/test";
import "./combobox.ts";
import type { PurrCombobox } from "./combobox.ts";

const meta = {
  title: "Components/Combobox",
  component: "purr-combobox",
} satisfies Meta;

export default meta;

type Story = StoryObj;

const apples = html`
  <purr-option>McIntosh</purr-option>
  <purr-option>Fuji</purr-option>
  <purr-option>Gala</purr-option>
  <purr-option>Granny Smith</purr-option>
  <purr-option disabled>Honeycrisp</purr-option>
  <purr-option>Ambrosia</purr-option>
`;

const column = (content: unknown) =>
  html`<div
    style="display:grid;justify-items:start;gap:var(--purr-space-3);padding:var(--purr-space-4)"
  >
    ${content}
  </div>`;

const field = async (canvasElement: HTMLElement) => {
  const el = canvasElement.querySelector<PurrCombobox>("#combo")!;
  await el.updateComplete;
  return { el, input: el.shadowRoot!.querySelector("input")! };
};

// Stories that other tests open as they are have no play function.
export const Default: Story = {
  render: () =>
    column(
      html`<purr-combobox id="combo" label="Apple variety"
        >${apples}</purr-combobox
      >`,
    ),
};

export const Preselected: Story = {
  render: () =>
    column(
      html`<purr-combobox id="combo" label="Apple variety" value="Fuji"
        >${apples}</purr-combobox
      >`,
    ),
};

export const Placeholder: Story = {
  render: () =>
    column(
      html`<purr-combobox label="Apple variety" placeholder="Search varieties"
        >${apples}</purr-combobox
      >`,
    ),
};

export const Sizes: Story = {
  render: () =>
    column(
      (["md", "lg", "xl"] as const).map(
        (size) =>
          html`<purr-combobox
            label="Apple variety, ${size}"
            size=${size}
            value="Fuji"
            >${apples}</purr-combobox
          >`,
      ),
    ),
};

export const Disabled: Story = {
  render: () =>
    column([
      html`<purr-combobox label="Apple variety" value="Fuji" disabled
        >${apples}</purr-combobox
      >`,
      html`<purr-combobox
        label="Apple variety, empty"
        placeholder="Search varieties"
        disabled
        >${apples}</purr-combobox
      >`,
    ]),
};

export const AllowCustom: Story = {
  render: () =>
    column(
      html`<purr-combobox
        id="combo"
        label="Apple variety"
        placeholder="Pick or type your own"
        allow-custom
        >${apples}</purr-combobox
      >`,
    ),
};

/** In a form the combobox submits its value like a text field and follows reset and fieldset. */
export const InForm: Story = {
  render: () => html`
    <form id="form" style="padding:var(--purr-space-4)">
      <fieldset
        id="fieldset"
        style="display:grid;justify-items:start;gap:var(--purr-space-3);border:0;padding:0;margin:0"
      >
        <purr-combobox id="apple" name="apple" label="Apple variety">
          <purr-option value="mc">McIntosh</purr-option>
          <purr-option value="fuji" selected>Fuji</purr-option>
          <purr-option value="gala">Gala</purr-option>
        </purr-combobox>
        <purr-combobox
          id="pick"
          name="pick"
          label="Required pick"
          placeholder="Choose"
          required
        >
          <purr-option value="a">Alpha</purr-option>
          <purr-option value="b">Beta</purr-option>
        </purr-combobox>
      </fieldset>
    </form>
  `,
};

/** Opens the whole list so the open look is covered by the contrast and spacing checks. */
export const Open: Story = {
  render: () =>
    column(
      html`<purr-combobox id="combo" label="Apple variety" value="Fuji"
        >${apples}</purr-combobox
      >`,
    ),
  play: async ({ canvasElement }) => {
    const { el } = await field(canvasElement);
    await userEvent.click(el.shadowRoot!.querySelector("[part=button]")!);
    await el.updateComplete;
    expect(el.open).toBe(true);
  },
};

/** Typing narrows the list to the options that match. */
export const Filtered: Story = {
  render: () =>
    column(
      html`<purr-combobox id="combo" label="Apple variety"
        >${apples}</purr-combobox
      >`,
    ),
  play: async ({ canvasElement }) => {
    const { el, input } = await field(canvasElement);
    await userEvent.type(input, "a");
    await el.updateComplete;
    expect(el.open).toBe(true);
  },
};

export const NoResults: Story = {
  render: () =>
    column(
      html`<purr-combobox id="combo" label="Apple variety"
        >${apples}</purr-combobox
      >`,
    ),
  play: async ({ canvasElement }) => {
    const { el, input } = await field(canvasElement);
    await userEvent.type(input, "zzz");
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector("[part=empty]")).not.toBeNull();
  },
};

export const Rtl: Story = {
  render: () =>
    column(
      html`<purr-combobox label="Apple variety" value="Fuji"
        >${apples}</purr-combobox
      >`,
    ),
  globals: { dir: "rtl" },
};

export const Glass: Story = {
  render: () =>
    column(
      html`<purr-combobox label="Apple variety" value="Fuji"
        >${apples}</purr-combobox
      >`,
    ),
  globals: { material: "glass", theme: "dark", contrast: "more" },
};
