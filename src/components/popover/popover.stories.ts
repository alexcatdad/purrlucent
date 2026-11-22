import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { expect, userEvent } from "storybook/test";
import "../button/button.ts";
import "./popover.ts";
import type { PurrPopover } from "./popover.ts";

const meta = {
  title: "Components/Popover",
  component: "purr-popover",
} satisfies Meta;

export default meta;

type Story = StoryObj;

const content = html`<strong style="display:block">Sharing</strong>
  <p style="margin:var(--purr-space-1) 0 var(--purr-space-3)">
    Anyone with the link can view.
  </p>
  <purr-button size="md">Copy link</purr-button>`;

// Room on every side, so a panel opens where it was asked to.
const stage = (inner: unknown) =>
  html`<div
    style="display:grid;justify-items:center;padding:calc(var(--purr-spacing) * 45) var(--purr-space-10)"
  >
    ${inner}
  </div>`;

const popover = (attrs: {
  id?: string;
  placement?: string;
  open?: boolean;
  label?: string;
}) =>
  html`<purr-popover
    id=${attrs.id ?? "popover"}
    label=${attrs.label ?? "Sharing"}
    placement=${attrs.placement ?? "bottom"}
    ?open=${attrs.open ?? false}
  >
    <purr-button slot="trigger">Show popover</purr-button>
    ${content}
  </purr-popover>`;

// Stories that other tests open as they are have no play function.
export const Default: Story = {
  render: () => stage(popover({})),
};

// Opens the panel so the open look is covered by the contrast and spacing checks.
const opened = (placement: string): Story => ({
  render: () => stage(popover({ placement })),
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector<PurrPopover>("#popover")!;
    await el.updateComplete;
    await userEvent.click(el.querySelector("purr-button")!);
    await el.updateComplete;
    expect(el.open).toBe(true);
  },
});

/** Opens below the trigger. */
export const Open = opened("bottom");

/** Opens above the trigger. */
export const OpenTop = opened("top");

/** Opens at the start side of the trigger. */
export const OpenStart = opened("start");

/** Opens at the end side of the trigger. */
export const OpenEnd = opened("end");

/** One popover per side, all closed. Opening one closes the others; the Open stories cover each side open. */
export const Placements: Story = {
  render: () =>
    stage(
      html`<div
        style="display:grid;grid-template-columns:repeat(2,max-content);gap:calc(var(--purr-spacing) * 60) calc(var(--purr-spacing) * 70);justify-content:center"
      >
        ${(["top", "bottom", "start", "end"] as const).map((placement) =>
          popover({
            id: placement,
            placement,
            label: `Sharing, ${placement}`,
          }),
        )}
      </div>`,
    ),
};

export const Rtl: Story = {
  render: () => stage(popover({ placement: "start", open: true })),
  globals: { dir: "rtl" },
};

export const Glass: Story = {
  render: () => stage(popover({ open: true })),
  globals: { material: "glass", theme: "dark", contrast: "more" },
};
