import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { expect, userEvent } from "storybook/test";
import "./calendar.ts";
import type { PlCalendar } from "./calendar.ts";
import { underGlass } from "../../../.storybook/under-glass.ts";

import { playground } from "../../../.storybook/playground.ts";

const meta = {
  title: "Forms/Calendar",
  component: "pl-calendar",
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
  ...playground({ locale: ["en-US", "fr-FR", "ar-EG"], firstDay: [7, 1, 6] }, [
    "pl-change",
  ]),
  render: ({ locale, firstDay }) =>
    html`<pl-calendar
      value="2026-11-18"
      locale=${locale}
      first-day=${firstDay}
    ></pl-calendar>`,
};

// Fixed days, so no story depends on the date it is opened on.
// Stories that other tests open as they are have no play function.
export const Default: Story = {
  render: () =>
    row(html`<pl-calendar id="calendar" value="2026-11-18"></pl-calendar>`),
};

/** Days outside min and max cannot be selected, and the month buttons stop at the range. */
export const WithRange: Story = {
  render: () =>
    row(
      html`<pl-calendar
        id="calendar"
        value="2026-11-18"
        min="2026-11-09"
        max="2026-12-20"
      ></pl-calendar>`,
    ),
};

/** `disabled-dates` takes a list of ISO days; the `disabledDates` property also takes a function. */
export const DisabledDates: Story = {
  render: () =>
    row(
      html`<pl-calendar
        id="calendar"
        value="2026-11-18"
        disabled-dates="2026-11-03, 2026-11-11 2026-11-25"
      ></pl-calendar>`,
    ),
};

/** Weekends are off through a function. */
export const DisabledByFunction: Story = {
  render: () =>
    row(
      html`<pl-calendar
        id="calendar"
        value="2026-11-18"
        .disabledDates=${(iso: string) =>
          [0, 6].includes(new Date(`${iso}T00:00:00Z`).getUTCDay())}
      ></pl-calendar>`,
    ),
};

/** The first weekday and the names follow the locale. */
export const Locales: Story = {
  parameters: {
    // Axe splits names at spaces, so the Japanese "1日" is never found inside
    // "2026年11月1日日曜日", which holds it, as WCAG 2.5.3 asks.
    a11y: {
      options: { rules: { "label-content-name-mismatch": { enabled: false } } },
    },
  },
  render: () =>
    row(
      ["en-US", "de", "fr", "ja"].map(
        (locale) =>
          html`<pl-calendar
            id=${locale}
            locale=${locale}
            value="2026-11-18"
          ></pl-calendar>`,
      ),
    ),
};

/** Arrow keys move through the days, Page Down the month; Enter selects. */
export const Keyboard: Story = {
  render: () =>
    row(html`<pl-calendar id="calendar" value="2026-11-18"></pl-calendar>`),
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector<PlCalendar>("#calendar")!;
    await el.updateComplete;
    await el.focusDay();
    await userEvent.keyboard("{ArrowRight}{ArrowDown}");
    await userEvent.keyboard("{Enter}");
    expect(el.value).toBe("2026-11-26");
  },
};

/** In a form the calendar submits its value and follows reset. */
export const InForm: Story = {
  render: () =>
    html`<form id="form" style="padding:var(--pl-space-4)">
      <pl-calendar
        id="calendar"
        name="day"
        value="2026-11-18"
        locale="en-US"
      ></pl-calendar>
    </form>`,
};

export const Rtl: Story = {
  render: () =>
    row(
      html`<pl-calendar
        id="calendar"
        locale="ar"
        value="2026-11-18"
      ></pl-calendar>`,
    ),
  globals: { dir: "rtl" },
};

export const Glass: Story = {
  render: () =>
    underGlass(
      row(html`<pl-calendar id="calendar" value="2026-11-18"></pl-calendar>`),
    ),
  globals: { material: "glass", theme: "dark", contrast: "more" },
};
