import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { expect, userEvent } from "storybook/test";
import "./combobox.ts";
import type { PlCombobox } from "./combobox.ts";

const meta = {
  title: "Components/Combobox",
  component: "pl-combobox",
} satisfies Meta;

export default meta;

type Story = StoryObj;

const apples = html`
  <pl-option>McIntosh</pl-option>
  <pl-option>Fuji</pl-option>
  <pl-option>Gala</pl-option>
  <pl-option>Granny Smith</pl-option>
  <pl-option disabled>Honeycrisp</pl-option>
  <pl-option>Ambrosia</pl-option>
`;

const column = (content: unknown) =>
  html`<div
    style="display:grid;justify-items:start;gap:var(--pl-space-3);padding:var(--pl-space-4)"
  >
    ${content}
  </div>`;

const field = async (canvasElement: HTMLElement) => {
  const el = canvasElement.querySelector<PlCombobox>("#combo")!;
  await el.updateComplete;
  return { el, input: el.shadowRoot!.querySelector("input")! };
};

// Stories that other tests open as they are have no play function.
export const Default: Story = {
  render: () =>
    column(
      html`<pl-combobox id="combo" label="Apple variety"
        >${apples}</pl-combobox
      >`,
    ),
};

export const Preselected: Story = {
  render: () =>
    column(
      html`<pl-combobox id="combo" label="Apple variety" value="Fuji"
        >${apples}</pl-combobox
      >`,
    ),
};

export const Placeholder: Story = {
  render: () =>
    column(
      html`<pl-combobox label="Apple variety" placeholder="Search varieties"
        >${apples}</pl-combobox
      >`,
    ),
};

export const Labelled: Story = {
  render: () =>
    column(
      html`<pl-combobox value="Fuji"
        ><span slot="label">Apple variety</span>${apples}</pl-combobox
      >`,
    ),
};

export const Sizes: Story = {
  render: () =>
    column(
      (["md", "lg", "xl"] as const).map(
        (size) =>
          html`<pl-combobox
            label="Apple variety, ${size}"
            size=${size}
            value="Fuji"
            >${apples}</pl-combobox
          >`,
      ),
    ),
};

export const Disabled: Story = {
  render: () =>
    column([
      html`<pl-combobox label="Apple variety" value="Fuji" disabled
        >${apples}</pl-combobox
      >`,
      html`<pl-combobox
        label="Apple variety, empty"
        placeholder="Search varieties"
        disabled
        >${apples}</pl-combobox
      >`,
    ]),
};

export const AllowCustom: Story = {
  render: () =>
    column(
      html`<pl-combobox
        id="combo"
        label="Apple variety"
        placeholder="Pick or type your own"
        allow-custom
        >${apples}</pl-combobox
      >`,
    ),
};

/** In a form the combobox submits its value like a text field and follows reset and fieldset. */
export const InForm: Story = {
  render: () => html`
    <form id="form" style="padding:var(--pl-space-4)">
      <fieldset
        id="fieldset"
        style="display:grid;justify-items:start;gap:var(--pl-space-3);border:0;padding:0;margin:0"
      >
        <pl-combobox id="apple" name="apple" label="Apple variety">
          <pl-option value="mc">McIntosh</pl-option>
          <pl-option value="fuji" selected>Fuji</pl-option>
          <pl-option value="gala">Gala</pl-option>
        </pl-combobox>
        <pl-combobox
          id="pick"
          name="pick"
          label="Required pick"
          placeholder="Choose"
          required
        >
          <pl-option value="a">Alpha</pl-option>
          <pl-option value="b">Beta</pl-option>
        </pl-combobox>
      </fieldset>
    </form>
  `,
};

/** Opens the whole list so the open look is covered by the contrast and spacing checks. */
export const Open: Story = {
  render: () =>
    column(
      html`<pl-combobox id="combo" label="Apple variety" value="Fuji"
        >${apples}</pl-combobox
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
      html`<pl-combobox id="combo" label="Apple variety"
        >${apples}</pl-combobox
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
      html`<pl-combobox id="combo" label="Apple variety"
        >${apples}</pl-combobox
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
      html`<pl-combobox label="Apple variety" value="Fuji"
        >${apples}</pl-combobox
      >`,
    ),
  globals: { dir: "rtl" },
};

export const Glass: Story = {
  render: () =>
    column(
      html`<pl-combobox label="Apple variety" value="Fuji"
        >${apples}</pl-combobox
      >`,
    ),
  globals: { material: "glass", theme: "dark", contrast: "more" },
};
