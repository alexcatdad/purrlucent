import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import "../select/select.ts";
import "./month-range-picker.ts";

import { playground } from "../../../.storybook/playground.ts";

const meta = {
  title: "Forms/Month Range Picker",
  component: "pl-month-range-picker",
  tags: ["autodocs"],
  parameters: { controls: { disable: true } },
} satisfies Meta;

export default meta;

type Story = StoryObj;

const row = (content: unknown) =>
  html`<div
    style="display:flex;flex-wrap:wrap;align-items:flex-start;gap:var(--pl-space-6);padding:var(--pl-space-4)"
  >
    ${content}
  </div>`;

export const Playground: Story = {
  ...playground({ label: "Period", inline: false, clearable: true }, [
    "pl-change",
  ]),
  render: ({ label, inline, clearable }) =>
    html`<pl-month-range-picker
      label=${label}
      value="2026-02/2026-05"
      ?inline=${inline}
      ?clearable=${clearable}
    ></pl-month-range-picker>`,
};

// Fixed months, so no story depends on the date it is opened on.
/** A button that shows the range and opens the months in a popover. */
export const Default: Story = {
  render: () =>
    row(
      html`<pl-month-range-picker
        id="picker"
        label="Period"
        value="2026-02/2026-05"
      ></pl-month-range-picker>`,
    ),
};

/** The field takes the select's height and label, so the two line up in one row. */
export const WithSelect: Story = {
  render: () =>
    row(
      html`<pl-select id="select" placeholder="Choose a variety">
          <span slot="label">Variety</span>
          <pl-option>McIntosh</pl-option>
          <pl-option>Fuji</pl-option>
        </pl-select>
        <pl-month-range-picker id="picker" value="2026-02/2026-05">
          <span slot="label">Period</span>
        </pl-month-range-picker>`,
    ),
};

/** Without a value the field shows its placeholder. */
export const Placeholder: Story = {
  render: () =>
    row(
      html`<pl-month-range-picker
        id="picker"
        label="Period"
        placeholder="Choose a period"
      ></pl-month-range-picker>`,
    ),
};

/** A range across two years shows both years in the field, and its band on each year's page. */
export const CrossYear: Story = {
  render: () =>
    row(
      html`<pl-month-range-picker
          id="picker"
          label="Period"
          value="2025-11/2026-02"
        ></pl-month-range-picker>
        <pl-month-range-picker
          id="inline"
          inline
          label="Period"
          value="2025-11/2026-02"
        ></pl-month-range-picker>`,
    ),
};

/** A range of one month is a single rounded cap. */
export const SingleMonth: Story = {
  render: () =>
    row(
      html`<pl-month-range-picker
        id="picker"
        inline
        label="Period"
        value="2026-03/2026-03"
      ></pl-month-range-picker>`,
    ),
};

/** Without a value, the Clear button is disabled and this month has a dot. */
export const Empty: Story = {
  render: () =>
    row(
      html`<pl-month-range-picker
        id="picker"
        inline
        clearable
        label="Period"
      ></pl-month-range-picker>`,
    ),
};

/** Presets choose a ready-made range and close the popover. */
export const Presets: Story = {
  render: () =>
    row(
      html`<pl-month-range-picker
        id="picker"
        label="Period"
        .presets=${[
          { label: "First quarter", start: "2026-01", end: "2026-03" },
          { label: "Second quarter", start: "2026-04", end: "2026-06" },
          { label: "Year to date", start: "2026-01", end: "2026-11" },
        ]}
      ></pl-month-range-picker>`,
    ),
};

/** The months in place, with a Clear button. */
export const Inline: Story = {
  render: () =>
    row(
      html`<pl-month-range-picker
        id="picker"
        inline
        clearable
        label="Period"
        value="2026-02/2026-05"
      ></pl-month-range-picker>`,
    ),
};

/** Months outside min and max cannot be chosen, and the year buttons stop at the range. */
export const WithRange: Story = {
  render: () =>
    row(
      html`<pl-month-range-picker
        id="picker"
        inline
        label="Period"
        min="2025-10"
        max="2026-03"
        value="2026-01/2026-01"
      ></pl-month-range-picker>`,
    ),
};

/** Month names and the range text follow the locale. */
export const Locales: Story = {
  render: () =>
    row(
      ["en-US", "sv", "de", "ar"].map(
        (locale) =>
          html`<pl-month-range-picker
            inline
            locale=${locale}
            dir=${locale === "ar" ? "rtl" : "ltr"}
            label="Period"
            value="2026-02/2026-05"
          ></pl-month-range-picker>`,
      ),
    ),
};

/** It submits `name` with `yyyy-mm/yyyy-mm` and a reset returns it to its `value` attribute. */
export const InAForm: Story = {
  render: () =>
    row(
      html`<form id="form">
        <pl-month-range-picker
          name="period"
          label="Period"
          value="2026-02/2026-05"
        ></pl-month-range-picker>
        <button type="reset">Reset</button>
      </form>`,
    ),
};
