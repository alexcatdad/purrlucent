import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { expect, userEvent } from "storybook/test";
import "./select.ts";
import type { PurrSelect } from "./select.ts";

const meta = {
  title: "Components/Select",
  component: "purr-select",
} satisfies Meta;

export default meta;

type Story = StoryObj;

const apples = html`
  <purr-option>McIntosh</purr-option>
  <purr-option>Fuji</purr-option>
  <purr-option>Gala</purr-option>
  <purr-option disabled>Honeycrisp</purr-option>
`;

const column = (content: unknown) =>
  html`<div
    style="display:grid;justify-items:start;gap:var(--purr-space-3);padding:var(--purr-space-4)"
  >
    ${content}
  </div>`;

// Stories that other tests open as they are have no play function.
export const Default: Story = {
  render: () =>
    column(
      html`<purr-select id="select" label="Apple variety"
        >${apples}</purr-select
      >`,
    ),
};

export const Preselected: Story = {
  render: () =>
    column(
      html`<purr-select label="Apple variety">
        <purr-option>McIntosh</purr-option>
        <purr-option selected>Fuji</purr-option>
        <purr-option>Gala</purr-option>
      </purr-select>`,
    ),
};

export const Placeholder: Story = {
  render: () =>
    column(
      html`<purr-select label="Apple variety" placeholder="Choose a variety"
        >${apples}</purr-select
      >`,
    ),
};

export const Labelled: Story = {
  render: () =>
    column(
      html`<purr-select value="Fuji"
        ><span slot="label">Apple variety</span>${apples}</purr-select
      >`,
    ),
};

export const Sizes: Story = {
  render: () =>
    column(
      (["md", "lg", "xl"] as const).map(
        (size) =>
          html`<purr-select label="Apple variety, ${size}" size=${size}>
            <purr-option selected>McIntosh</purr-option>
            <purr-option>Fuji</purr-option>
          </purr-select>`,
      ),
    ),
};

export const Disabled: Story = {
  render: () =>
    column([
      html`<purr-select label="Apple variety" disabled>
        <purr-option selected>McIntosh</purr-option>
      </purr-select>`,
      html`<purr-select
        label="Apple variety, empty"
        disabled
        placeholder="Choose"
      >
        <purr-option>McIntosh</purr-option>
      </purr-select>`,
    ]),
};

export const LongList: Story = {
  render: () =>
    column(
      html`<purr-select id="select" label="Number" value="12">
        ${Array.from(
          { length: 40 },
          (_, i) => html`<purr-option>${i + 1}</purr-option>`,
        )}
      </purr-select>`,
    ),
};

/** In a form the select submits like a native one and follows reset and fieldset. */
export const InForm: Story = {
  render: () => html`
    <form id="form" style="padding:var(--purr-space-4)">
      <fieldset
        id="fieldset"
        style="display:grid;justify-items:start;gap:var(--purr-space-3);border:0;padding:0;margin:0"
      >
        <purr-select id="apple" name="apple" label="Apple variety">
          <purr-option value="mc">McIntosh</purr-option>
          <purr-option value="fuji" selected>Fuji</purr-option>
          <purr-option value="gala">Gala</purr-option>
        </purr-select>
        <purr-select
          id="pick"
          name="pick"
          label="Required pick"
          placeholder="Choose"
          required
        >
          <purr-option value="a">Alpha</purr-option>
          <purr-option value="b">Beta</purr-option>
        </purr-select>
      </fieldset>
    </form>
  `,
};

/** Opens the list so the open look is covered by the contrast and spacing checks. */
export const Open: Story = {
  render: () =>
    column(
      html`<purr-select id="select" label="Apple variety" value="Fuji"
        >${apples}</purr-select
      >`,
    ),
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector<PurrSelect>("#select")!;
    await el.updateComplete;
    await userEvent.click(el.shadowRoot!.querySelector("[part=trigger]")!);
    await el.updateComplete;
    expect(el.open).toBe(true);
  },
};

export const Rtl: Story = {
  render: () =>
    column(
      html`<purr-select label="Apple variety" value="Fuji"
        >${apples}</purr-select
      >`,
    ),
  globals: { dir: "rtl" },
};

export const Glass: Story = {
  render: () =>
    column(
      html`<purr-select label="Apple variety" value="Fuji"
        >${apples}</purr-select
      >`,
    ),
  globals: { material: "glass", theme: "dark", contrast: "more" },
};
