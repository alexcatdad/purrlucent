import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { userEvent } from "storybook/test";
import "./date-picker.ts";
import type { PlDatePicker } from "./date-picker.ts";
import { widths } from "../../../.storybook/widths.ts";

const meta = {
  title: "Forms/Date Picker",
  component: "pl-date-picker",
} satisfies Meta;

export default meta;

type Story = StoryObj;

// Room below, so the calendar opens where it was asked to.
const column = (content: unknown) =>
  html`<div
    style="display:grid;justify-items:start;gap:var(--pl-space-3);padding:var(--pl-space-4) var(--pl-space-4) calc(var(--pl-spacing) * 90)"
  >
    ${content}
  </div>`;

// Fixed days and an explicit locale, so no story depends on the date or the browser.
// Stories that other tests open as they are have no play function.
export const Default: Story = {
  render: () =>
    column(
      html`<pl-date-picker id="picker" locale="en-US" value="2026-11-18"
        >Date</pl-date-picker
      >`,
    ),
};

export const Empty: Story = {
  render: () =>
    column(
      html`<pl-date-picker id="picker" locale="en-US" placeholder="mm/dd/yyyy"
        >Date</pl-date-picker
      >`,
    ),
};

/** The width is the host's `inline-size`: small, medium, large and full. */
export const Widths: Story = {
  render: () =>
    widths(
      (style, label) =>
        html`<pl-date-picker style=${style} locale="en-US" value="2026-11-18"
          >${label}</pl-date-picker
        >`,
    ),
};

export const Sizes: Story = {
  render: () =>
    column(
      (["md", "lg", "xl"] as const).map(
        (size) =>
          html`<pl-date-picker
            size=${size}
            locale="en-US"
            value="2026-11-18"
            label="Size ${size}"
          ></pl-date-picker>`,
      ),
    ),
};

export const States: Story = {
  render: () =>
    column([
      html`<pl-date-picker
        label="Disabled"
        locale="en-US"
        value="2026-11-18"
        disabled
      ></pl-date-picker>`,
      html`<pl-date-picker
        label="Read only"
        locale="en-US"
        value="2026-11-18"
        readonly
      ></pl-date-picker>`,
      html`<pl-date-picker
        id="invalid"
        label="Invalid"
        locale="en-US"
      ></pl-date-picker>`,
    ]),
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector<PlDatePicker>("#invalid")!;
    await el.updateComplete;
    el.focus();
    await userEvent.keyboard("13/45/2026");
    await userEvent.tab();
    await el.updateComplete;
  },
};

/** The calendar open on the value, below the button. */
export const Open: Story = {
  render: () =>
    column(
      html`<pl-date-picker id="picker" locale="en-US" value="2026-11-18"
        >Date</pl-date-picker
      >`,
    ),
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector<PlDatePicker>("#picker")!;
    await el.updateComplete;
    await userEvent.click(el.shadowRoot!.querySelector("pl-button")!);
    await el.updateComplete;
  },
};

/** A start and an end date. Only days from min to max, and not the disabled ones, can be chosen. */
export const Range: Story = {
  render: () =>
    column(
      html`<pl-date-picker
          id="picker"
          locale="en-US"
          value="2026-11-18"
          min="2026-11-09"
          max="2026-12-20"
          disabled-dates="2026-11-25"
          >Start</pl-date-picker
        >
        <pl-date-picker
          id="end"
          locale="en-US"
          value="2026-12-02"
          min="2026-11-09"
          max="2026-12-20"
          disabled-dates="2026-11-25"
          >End</pl-date-picker
        >`,
    ),
};

/** The text entry and the calendar follow the locale. */
export const Locales: Story = {
  render: () =>
    column(
      ["en-US", "de", "ja", "ar"].map(
        (locale) =>
          html`<pl-date-picker
            id=${locale}
            locale=${locale}
            value="2026-11-18"
            label=${locale}
          ></pl-date-picker>`,
      ),
    ),
};

/** In a form the field submits its value and follows reset, fieldset and validity. */
export const InForm: Story = {
  render: () =>
    html`<form id="form" style="padding:var(--pl-space-4)">
      <fieldset
        id="fieldset"
        style="display:grid;justify-items:start;gap:var(--pl-space-3);border:0;padding:0;margin:0"
      >
        <pl-date-picker
          id="picker"
          name="when"
          locale="en-US"
          value="2026-11-18"
          required
          >When</pl-date-picker
        >
        <pl-date-picker id="other" name="until" locale="en-US" required
          >Until</pl-date-picker
        >
      </fieldset>
    </form>`,
};

export const Rtl: Story = {
  render: () =>
    column(
      html`<pl-date-picker id="picker" locale="ar" value="2026-11-18"
        >Date</pl-date-picker
      >`,
    ),
  globals: { dir: "rtl" },
};

export const Glass: Story = {
  render: () =>
    column(
      html`<pl-date-picker id="picker" locale="en-US" value="2026-11-18"
        >Date</pl-date-picker
      >`,
    ),
  globals: { material: "glass", theme: "dark", contrast: "more" },
};
