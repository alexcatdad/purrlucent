import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { expect } from "storybook/test";
import "../button/button.ts";
import "./spinner.ts";
import type { PlSpinner } from "./spinner.ts";
import { underGlass } from "../../../.storybook/under-glass.ts";

import { playground } from "../../../.storybook/playground.ts";

const meta = {
  title: "Feedback/Spinner",
  component: "pl-spinner",
  tags: ["autodocs"],
  parameters: { controls: { disable: true } },
} satisfies Meta;

export default meta;

type Story = StoryObj;

const column = (content: unknown) =>
  html`<div
    style="display:grid;justify-items:start;gap:var(--pl-space-3);padding:var(--pl-space-4)"
  >
    ${content}
  </div>`;

export const Playground: Story = {
  ...playground({ label: "Loading", size: ["md", "sm", "lg"] }),
  render: ({ label, size }) =>
    html`<pl-spinner label=${label} size=${size}></pl-spinner>`,
};

export const Default: Story = {
  render: () => html`<pl-spinner id="spinner" label="Loading"></pl-spinner>`,
};

export const Sizes: Story = {
  render: () =>
    column(
      (["md", "lg", "xl"] as const).map(
        (size) =>
          html`<pl-spinner size=${size} label="Loading ${size}"></pl-spinner>`,
      ),
    ),
};

/** The small size suits a line of text or a medium control. */
export const Small: Story = {
  render: () =>
    html`<div
      style="display:flex;align-items:center;gap:var(--pl-space-4);padding:var(--pl-space-4)"
    >
      <pl-spinner id="small" size="sm" label="Loading small"></pl-spinner>
      <pl-spinner id="medium" label="Loading medium"></pl-spinner>
      <pl-button id="control">Save</pl-button>
    </div>`,
};

/** With a `value` the arc shows how much is done and stops turning. */
export const Determinate: Story = {
  render: () =>
    html`<div
      style="display:flex;align-items:center;gap:var(--pl-space-4);padding:var(--pl-space-4)"
    >
      ${[0, 25, 50, 75, 100].map(
        (value) =>
          html`<pl-spinner
            label="Upload ${value}%"
            value=${value}
          ></pl-spinner>`,
      )}
    </div>`,
};

/** The role and name come from the host. */
export const Semantics: Story = {
  render: () => html`<pl-spinner id="spinner" label="Loading"></pl-spinner>`,
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector<PlSpinner>("#spinner")!;
    await el.updateComplete;
    expect(el.getAttribute("role")).toBe("progressbar");
    expect(el.getAttribute("aria-label")).toBe("Loading");
    expect(el.hasAttribute("aria-valuenow")).toBe(false);
  },
};

export const Glass: Story = {
  render: () => underGlass(html`<pl-spinner label="Loading"></pl-spinner>`),
  globals: { material: "glass", theme: "dark", contrast: "more" },
};
