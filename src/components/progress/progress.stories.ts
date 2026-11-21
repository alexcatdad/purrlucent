import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { expect } from "storybook/test";
import "./progress.ts";
import type { PurrProgress } from "./progress.ts";

const meta = {
  title: "Components/Progress",
  component: "purr-progress",
} satisfies Meta;

export default meta;

type Story = StoryObj;

const column = (content: unknown) =>
  html`<div
    style="display:grid;justify-items:start;gap:var(--purr-space-3);padding:var(--purr-space-4)"
  >
    ${content}
  </div>`;

export const Default: Story = {
  render: () =>
    html`<purr-progress
      id="progress"
      label="Upload"
      value="50"
    ></purr-progress>`,
};

export const Determinate: Story = {
  render: () =>
    column(
      [0, 25, 50, 75, 100].map(
        (value) =>
          html`<purr-progress
            label="Upload ${value}%"
            value=${value}
          ></purr-progress>`,
      ),
    ),
};

export const Indeterminate: Story = {
  render: () => html`<purr-progress label="Preparing"></purr-progress>`,
};

/** A custom max scales the value; changing the value updates the bar. */
export const Updates: Story = {
  render: () =>
    html`<purr-progress
      id="progress"
      label="Files"
      max="8"
      value="2"
    ></purr-progress>`,
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector<PurrProgress>("#progress")!;
    await el.updateComplete;
    expect(el.getAttribute("aria-valuemax")).toBe("8");
    expect(el.getAttribute("aria-valuenow")).toBe("2");
    el.value = 4;
    await el.updateComplete;
    expect(el.style.getPropertyValue("--_p")).toBe("0.5");
    el.value = undefined;
    await el.updateComplete;
    expect(el.hasAttribute("aria-valuenow")).toBe(false);
  },
};

export const Rtl: Story = {
  render: () =>
    column([
      html`<purr-progress label="Upload" value="25"></purr-progress>`,
      html`<purr-progress label="Preparing"></purr-progress>`,
    ]),
  globals: { dir: "rtl" },
};

export const Glass: Story = {
  render: () =>
    column([
      html`<purr-progress label="Upload" value="50"></purr-progress>`,
      html`<purr-progress label="Preparing"></purr-progress>`,
    ]),
  globals: { material: "glass", theme: "dark", contrast: "more" },
};
