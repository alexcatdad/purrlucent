import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { barX, defineChart } from "@tanstack/charts";
import { scaleBand } from "@tanstack/charts/scales/band";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { html } from "lit";
import { expect, waitFor } from "storybook/test";
import "./chart.ts";
import type { PlChart } from "./chart.ts";

const meta = {
  title: "Components/Chart",
  component: "pl-chart",
} satisfies Meta;

export default meta;

type Story = StoryObj;

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

/** Rows with one value each, a row per month and plan. */
const long = months.flatMap((month, i) => [
  { month, plan: "Free", users: 120 + i * 24 },
  { month, plan: "Team", users: 80 + i * 11 },
  { month, plan: "Business", users: 30 + i * 9 },
]);

/** Rows with one value per series, a row per month. */
const wide = months.map((month, i) => ({
  month,
  desktop: 186 + i * 31 - (i % 2) * 40,
  mobile: 80 + i * 22 + (i % 3) * 18,
}));

const slices = [
  { channel: "Search", visits: 4200 },
  { channel: "Direct", visits: 2900 },
  { channel: "Referral", visits: 1800 },
  { channel: "Social", visits: 1100 },
];

const frame = (content: unknown) =>
  html`<div
    style="padding:var(--pl-space-4);max-inline-size:calc(var(--pl-spacing) * 160)"
  >
    ${content}
  </div>`;

const plans = (table = false) =>
  frame(
    html`<pl-chart
      id="chart"
      label="Monthly active users by plan, January to June, in users"
      type="line"
      x="month"
      y="users"
      series="plan"
      y-label="Users"
      legend
      ?show-table=${table}
      .data=${long}
    ></pl-chart>`,
  );

export const Default: Story = { render: () => plans() };

export const Bar: Story = {
  render: () =>
    frame(
      html`<pl-chart
        id="chart"
        label="Monthly active users by plan, January to June, in users"
        type="bar"
        x="month"
        y="users"
        series="plan"
        y-label="Users"
        legend
        .data=${long}
      ></pl-chart>`,
    ),
};

export const Area: Story = {
  render: () =>
    frame(
      html`<pl-chart
        id="chart"
        label="Monthly active users by plan, January to June, in users"
        type="area"
        x="month"
        y="users"
        series="plan"
        y-label="Users"
        legend
        .data=${long}
      ></pl-chart>`,
    ),
};

export const Donut: Story = {
  render: () =>
    frame(
      html`<pl-chart
        id="chart"
        label="Visits by channel in June, in visits"
        type="donut"
        x="channel"
        y="visits"
        y-label="Visits"
        legend
        .data=${slices}
      ></pl-chart>`,
    ),
};

/** Rows that hold several values: one series per key in `y`. */
export const WideRows: Story = {
  render: () =>
    frame(
      html`<pl-chart
        id="chart"
        label="Desktop and mobile visits by month, January to June, in visits"
        type="bar"
        x="month"
        y="desktop,mobile"
        x-label="Month"
        y-label="Visits"
        legend
        .data=${wide}
      ></pl-chart>`,
    ),
};

/** The table of the same values, shown. */
export const ShowTable: Story = {
  render: () =>
    frame(
      html`<pl-chart
        id="chart"
        label="Visits by channel in June, in visits"
        type="donut"
        x="channel"
        y="visits"
        x-label="Channel"
        y-label="Visits"
        legend
        show-table
        .data=${slices}
      ></pl-chart>`,
    ),
};

/** A definition written with TanStack Charts, drawn with this library's theme, tooltip and table. */
export const CustomDefinition: Story = {
  render: () =>
    frame(
      html`<pl-chart
        id="chart"
        label="Visits by channel in June, ranked, in visits"
        description="Channels are sorted from most to fewest visits."
        x="channel"
        y="visits"
        x-label="Channel"
        y-label="Visits"
        .data=${slices}
        .definition=${defineChart({
          marks: [barX(slices, { x: "visits", y: "channel" })],
          scales: {
            x: { scale: scaleLinear, nice: true, grid: true },
            y: { scale: () => scaleBand<string>().padding(0.2) },
          },
        })}
      ></pl-chart>`,
    ),
};

/** Moving to a point with the keyboard shows its tooltip. */
export const Tooltip: Story = {
  render: () => plans(),
  play: async ({ canvasElement }) => {
    const chart = canvasElement.querySelector<PlChart>("#chart")!;
    await chart.updateComplete;
    const svg = await waitFor(() => {
      const found = chart.shadowRoot!.querySelector<SVGElement>("svg");
      expect(found).not.toBeNull();
      return found!;
    });
    svg.focus();
    await waitFor(() => {
      const tip =
        chart.shadowRoot!.querySelector<HTMLElement>(".ts-chart-tooltip");
      expect(tip).not.toBeNull();
      expect(tip!.hidden).toBe(false);
      expect(tip!.textContent).toContain("Free");
    });
  },
};

export const Rtl: Story = {
  render: () => plans(true),
  globals: { dir: "rtl" },
};

export const Glass: Story = {
  render: () => plans(),
  globals: { material: "glass", theme: "dark", contrast: "more" },
};
