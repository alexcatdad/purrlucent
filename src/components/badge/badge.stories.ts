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
      <pl-badge id="success" variant="success">Done</pl-badge>
      <pl-badge id="warning" variant="warning">Behind</pl-badge>
      <pl-badge id="destructive" variant="destructive">Failed</pl-badge>
    </div>`,
};

/** `dot` makes a status pill: the neutral fill, with the variant coloring a dot. */
export const Status: Story = {
  render: () =>
    html`<div style=${row}>
      <pl-badge dot>Idle</pl-badge>
      <pl-badge dot variant="accent">Collecting</pl-badge>
      <pl-badge dot variant="success">Up to date</pl-badge>
      <pl-badge dot variant="warning">Behind</pl-badge>
      <pl-badge dot variant="destructive">Needs you</pl-badge>
    </div>`,
};

/** `appearance` sets how a variant is drawn: solid (default), soft or outline. */
export const Appearances: Story = {
  render: () =>
    html`<div
      style="display:grid;gap:var(--pl-space-3);padding:var(--pl-space-4)"
    >
      ${(["solid", "soft", "outline"] as const).map(
        (appearance) =>
          html`<div style=${row.replace("padding:var(--pl-space-4)", "")}>
            <pl-badge id="${appearance}-neutral" appearance=${appearance}
              >Draft</pl-badge
            >
            <pl-badge
              id="${appearance}-accent"
              variant="accent"
              appearance=${appearance}
              >New</pl-badge
            >
            <pl-badge
              id="${appearance}-success"
              variant="success"
              appearance=${appearance}
              >Done</pl-badge
            >
            <pl-badge
              id="${appearance}-warning"
              variant="warning"
              appearance=${appearance}
              >Behind</pl-badge
            >
            <pl-badge
              id="${appearance}-destructive"
              variant="destructive"
              appearance=${appearance}
              >Failed</pl-badge
            >
          </div>`,
      )}
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
