import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { expect, userEvent } from "storybook/test";
import "./combobox.ts";
import type { PlCombobox } from "./combobox.ts";
import { widths } from "../../../.storybook/widths.ts";

import { playground } from "../../../.storybook/playground.ts";

const meta = {
  title: "Forms/Combobox",
  component: "pl-combobox",
  tags: ["autodocs"],
  parameters: { controls: { disable: true } },
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

export const Playground: Story = {
  ...playground(
    {
      label: "Apple variety",
      placeholder: "Choose a variety",
      disabled: false,
    },
    ["pl-input", "pl-change"],
  ),
  render: ({ label, placeholder, disabled }) =>
    column(
      html`<pl-combobox
        label=${label}
        placeholder=${placeholder}
        ?disabled=${disabled}
        >${apples}</pl-combobox
      >`,
    ),
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

/** The width is the host's `inline-size`: small, medium, large and full. */
export const Widths: Story = {
  render: () =>
    widths(
      (style, label) =>
        html`<pl-combobox
          style=${style}
          label=${label}
          placeholder="Search varieties"
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

/** Search and choose several options. A form submits the selected values under the same name. */
export const Multiple: Story = {
  render: () => html`
    <form id="form" style="padding:var(--pl-space-4)">
      <fieldset id="fieldset" style="border:0;padding:0;margin:0">
        <pl-combobox
          id="combo"
          name="variety"
          placeholder="Search varieties"
          multiple
          required
        >
          <span slot="label">Apple varieties</span>
          <pl-option value="fuji" selected>Fuji</pl-option>
          <pl-option value="gala">Gala</pl-option>
          <pl-option value="granny-smith" selected>Granny Smith</pl-option>
          <pl-option value="honeycrisp" disabled>Honeycrisp</pl-option>
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

const places = ["Amsterdam", "Berlin", "Lisbon", "Oslo", "Vienna"];

// Stands in for a server: it returns the places that contain the text, in its own order.
const search = (event: Event) => {
  const el = event.currentTarget as PlCombobox;
  const { text } = (event as CustomEvent<{ text: string }>).detail;
  el.replaceChildren(
    ...places
      .filter((place) => place.toLowerCase().includes(text.toLowerCase()))
      .map((place) =>
        Object.assign(document.createElement("pl-option"), {
          textContent: place,
        }),
      ),
  );
};

/** With `manual-filter` the field leaves the list to the app, which replaces the options on each `pl-input`. */
export const ManualFilter: Story = {
  render: () =>
    column(
      html`<pl-combobox
        id="combo"
        label="City"
        manual-filter
        @pl-input=${search}
        >${places.map((place) => html`<pl-option>${place}</pl-option>`)}</pl-combobox
      >`,
    ),
};

/** While the app's lookup runs, `busy` keeps the "No results" row away; the action row still shows. */
export const Busy: Story = {
  render: () =>
    column(
      html`<pl-combobox
        id="combo"
        label="City"
        manual-filter
        busy
        action-label
      ></pl-combobox>`,
    ),
};

/** `action-label` adds a row that offers the typed text; choosing it fires `pl-action`. */
export const ActionLabel: Story = {
  render: () =>
    column(
      html`<pl-combobox id="combo" label="Apple variety" action-label
        >${apples}</pl-combobox
      >`,
    ),
};

/** A slotted `pl-option` with `action` is always listed and fires `pl-action` instead of choosing a value. */
export const ActionOption: Story = {
  render: () =>
    column(
      html`<pl-combobox id="combo" label="Apple variety"
        >${apples}<pl-option action>Add a variety…</pl-option></pl-combobox
      >`,
    ),
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
