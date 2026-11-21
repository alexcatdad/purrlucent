import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { expect } from "storybook/test";
import "./spinner.ts";
import type { PurrSpinner } from "./spinner.ts";

const meta = {
  title: "Components/Spinner",
  component: "purr-spinner",
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
    html`<purr-spinner id="spinner" label="Loading"></purr-spinner>`,
};

export const Sizes: Story = {
  render: () =>
    column(
      (["md", "lg", "xl"] as const).map(
        (size) =>
          html`<purr-spinner
            size=${size}
            label="Loading ${size}"
          ></purr-spinner>`,
      ),
    ),
};

/** The role and name come from the host. */
export const Semantics: Story = {
  render: () =>
    html`<purr-spinner id="spinner" label="Loading"></purr-spinner>`,
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector<PurrSpinner>("#spinner")!;
    await el.updateComplete;
    expect(el.getAttribute("role")).toBe("progressbar");
    expect(el.getAttribute("aria-label")).toBe("Loading");
    expect(el.hasAttribute("aria-valuenow")).toBe(false);
  },
};

export const Glass: Story = {
  render: () => html`<purr-spinner label="Loading"></purr-spinner>`,
  globals: { material: "glass", theme: "dark", contrast: "more" },
};
