import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { expect, userEvent, waitFor } from "storybook/test";
import "../button/button.ts";
import "./tooltip.ts";
import type { PurrTooltip } from "./tooltip.ts";

const meta = {
  title: "Components/Tooltip",
  component: "purr-tooltip",
} satisfies Meta;

export default meta;

type Story = StoryObj;

// Room on every side, so a bubble opens where it was asked to.
const stage = (inner: unknown) =>
  html`<div
    style="display:grid;justify-items:center;padding:calc(var(--purr-spacing) * 20) var(--purr-space-10)"
  >
    ${inner}
  </div>`;

const tip = (placement = "bottom", id = "tip") =>
  html`<purr-tooltip id=${id} text="Add a new item" placement=${placement}>
    <purr-button>Add</purr-button>
  </purr-tooltip>`;

// Stories that other tests open as they are have no play function.
export const Default: Story = {
  render: () => stage(tip()),
};

/** Shows the bubble through keyboard focus, so the open look is covered by the contrast and spacing checks. */
const showByFocus: Story["play"] = async ({ canvasElement }) => {
  const el = canvasElement.querySelector<PurrTooltip>("purr-tooltip")!;
  await el.updateComplete;
  await userEvent.tab();
  await waitFor(() =>
    expect(
      el.shadowRoot!.querySelector("[part=bubble]")!.matches(":popover-open"),
    ).toBe(true),
  );
};

export const Open: Story = {
  render: () => stage(tip()),
  play: showByFocus,
};

export const Placements: Story = {
  render: () =>
    stage(
      html`<div
        style="display:grid;grid-template-columns:repeat(2,max-content);gap:calc(var(--purr-spacing) * 30) calc(var(--purr-spacing) * 70);justify-content:center"
      >
        ${(["top", "bottom", "start", "end"] as const).map((placement) =>
          tip(placement, placement),
        )}
      </div>`,
    ),
};

export const Rtl: Story = {
  render: () => stage(tip("start")),
  play: showByFocus,
  globals: { dir: "rtl" },
};

export const Glass: Story = {
  render: () => stage(tip()),
  play: showByFocus,
  globals: { material: "glass", theme: "dark", contrast: "more" },
};
