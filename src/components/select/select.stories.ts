import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { expect, userEvent } from "storybook/test";
import "./select.ts";
import type { PlSelect } from "./select.ts";

const meta = {
  title: "Components/Select",
  component: "pl-select",
} satisfies Meta;

export default meta;

type Story = StoryObj;

const apples = html`
  <pl-option>McIntosh</pl-option>
  <pl-option>Fuji</pl-option>
  <pl-option>Gala</pl-option>
  <pl-option disabled>Honeycrisp</pl-option>
`;

const column = (content: unknown) =>
  html`<div
    style="display:grid;justify-items:start;gap:var(--pl-space-3);padding:var(--pl-space-4)"
  >
    ${content}
  </div>`;

// Stories that other tests open as they are have no play function.
export const Default: Story = {
  render: () =>
    column(
      html`<pl-select id="select" label="Apple variety">${apples}</pl-select>`,
    ),
};

export const Preselected: Story = {
  render: () =>
    column(
      html`<pl-select label="Apple variety">
        <pl-option>McIntosh</pl-option>
        <pl-option selected>Fuji</pl-option>
        <pl-option>Gala</pl-option>
      </pl-select>`,
    ),
};

export const Placeholder: Story = {
  render: () =>
    column(
      html`<pl-select label="Apple variety" placeholder="Choose a variety"
        >${apples}</pl-select
      >`,
    ),
};

export const Labelled: Story = {
  render: () =>
    column(
      html`<pl-select value="Fuji"
        ><span slot="label">Apple variety</span>${apples}</pl-select
      >`,
    ),
};

export const Sizes: Story = {
  render: () =>
    column(
      (["md", "lg", "xl"] as const).map(
        (size) =>
          html`<pl-select label="Apple variety, ${size}" size=${size}>
            <pl-option selected>McIntosh</pl-option>
            <pl-option>Fuji</pl-option>
          </pl-select>`,
      ),
    ),
};

export const Disabled: Story = {
  render: () =>
    column([
      html`<pl-select label="Apple variety" disabled>
        <pl-option selected>McIntosh</pl-option>
      </pl-select>`,
      html`<pl-select
        label="Apple variety, empty"
        disabled
        placeholder="Choose"
      >
        <pl-option>McIntosh</pl-option>
      </pl-select>`,
    ]),
};

export const LongList: Story = {
  render: () =>
    column(
      html`<pl-select id="select" label="Number" value="12">
        ${Array.from(
          { length: 40 },
          (_, i) => html`<pl-option>${i + 1}</pl-option>`,
        )}
      </pl-select>`,
    ),
};

/** In a form the select submits like a native one and follows reset and fieldset. */
export const InForm: Story = {
  render: () => html`
    <form id="form" style="padding:var(--pl-space-4)">
      <fieldset
        id="fieldset"
        style="display:grid;justify-items:start;gap:var(--pl-space-3);border:0;padding:0;margin:0"
      >
        <pl-select id="apple" name="apple" label="Apple variety">
          <pl-option value="mc">McIntosh</pl-option>
          <pl-option value="fuji" selected>Fuji</pl-option>
          <pl-option value="gala">Gala</pl-option>
        </pl-select>
        <pl-select
          id="pick"
          name="pick"
          label="Required pick"
          placeholder="Choose"
          required
        >
          <pl-option value="a">Alpha</pl-option>
          <pl-option value="b">Beta</pl-option>
        </pl-select>
      </fieldset>
    </form>
  `,
};

/** Opens the list so the open look is covered by the contrast and spacing checks. */
export const Open: Story = {
  render: () =>
    column(
      html`<pl-select id="select" label="Apple variety" value="Fuji"
        >${apples}</pl-select
      >`,
    ),
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector<PlSelect>("#select")!;
    await el.updateComplete;
    await userEvent.click(el.shadowRoot!.querySelector("[part=trigger]")!);
    await el.updateComplete;
    expect(el.open).toBe(true);
  },
};

export const Rtl: Story = {
  render: () =>
    column(
      html`<pl-select label="Apple variety" value="Fuji">${apples}</pl-select>`,
    ),
  globals: { dir: "rtl" },
};

export const Glass: Story = {
  render: () =>
    column(
      html`<pl-select label="Apple variety" value="Fuji">${apples}</pl-select>`,
    ),
  globals: { material: "glass", theme: "dark", contrast: "more" },
};
