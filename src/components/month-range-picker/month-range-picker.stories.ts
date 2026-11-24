import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import "./month-range-picker.ts";

const meta = {
  title: "Forms/Month Range Picker",
  component: "pl-month-range-picker",
} satisfies Meta;

export default meta;

type Story = StoryObj;

const row = (content: unknown) =>
  html`<div
    style="display:flex;flex-wrap:wrap;align-items:flex-start;gap:var(--pl-space-6);padding:var(--pl-space-4)"
  >
    ${content}
  </div>`;

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
