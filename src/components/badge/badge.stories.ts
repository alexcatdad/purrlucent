import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import "./badge.ts";
import { underGlass } from "../../../.storybook/under-glass.ts";

const meta = {
  title: "Text/Badge",
  component: "pl-badge",
} satisfies Meta;

export default meta;

type Story = StoryObj;

const row =
  "display:flex;align-items:center;gap:var(--pl-space-3);padding:var(--pl-space-4)";

export const Default: Story = {
  render: () => html`<pl-badge id="badge">3</pl-badge>`,
};

/** The text always says the status; the color only adds to it. */
export const Variants: Story = {
  render: () =>
    html`<div style=${row}>
      <pl-badge id="neutral">Draft</pl-badge>
      <pl-badge id="accent" variant="accent">New</pl-badge>
      <pl-badge id="destructive" variant="destructive">Failed</pl-badge>
    </div>`,
};

export const Counts: Story = {
  render: () =>
    html`<div style=${row}>
      <pl-badge id="one">1</pl-badge>
      <pl-badge id="many" variant="accent">128</pl-badge>
    </div>`,
};

export const Rtl: Story = {
  render: () =>
    html`<div dir="rtl" style=${row}>
      صندوق الوارد <pl-badge id="badge" variant="accent">3</pl-badge>
    </div>`,
};

export const Glass: Story = {
  render: () =>
    underGlass(
      html`<div style=${row}>
        <pl-badge>Draft</pl-badge>
        <pl-badge variant="accent">New</pl-badge>
        <pl-badge variant="destructive">Failed</pl-badge>
      </div>`,
    ),
  globals: { material: "glass", theme: "dark", contrast: "more" },
};
