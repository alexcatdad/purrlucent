import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import "../button/button.ts";
import "./hover-card.ts";

const meta = {
  title: "Components/Hover Card",
  component: "pl-hover-card",
} satisfies Meta;

export default meta;

type Story = StoryObj;

const content = html`<strong style="display:block">Purrlucent</strong>
  <p style="margin:var(--pl-space-1) 0 var(--pl-space-3)">
    A Lit component library of elements for the web.
  </p>
  <pl-button size="md">View repository</pl-button>`;

// Room on every side, so a card opens where it was asked to.
const stage = (inner: unknown) =>
  html`<div
    style="display:grid;justify-items:center;padding:calc(var(--pl-spacing) * 45) var(--pl-space-10)"
  >
    ${inner}
  </div>`;

const card = (attrs: {
  id?: string;
  placement?: string;
  open?: boolean;
  label?: string;
}) =>
  html`<pl-hover-card
    id=${attrs.id ?? "card"}
    label=${attrs.label ?? "Repository"}
    placement=${attrs.placement ?? "bottom"}
    ?open=${attrs.open ?? false}
  >
    <pl-button slot="trigger" variant="tinted">purrlucent</pl-button>
    ${content}
  </pl-hover-card>`;

// Stories that other tests open as they are have no play function.
export const Default: Story = {
  render: () => stage(card({})),
};

/** Opens below the trigger. */
export const Open: Story = {
  render: () => stage(card({ open: true })),
};

/** Opens above the trigger. */
export const OpenTop: Story = {
  render: () => stage(card({ open: true, placement: "top" })),
};

/** Opens at the start side of the trigger. */
export const OpenStart: Story = {
  render: () => stage(card({ open: true, placement: "start" })),
};

/** Opens at the end side of the trigger. */
export const OpenEnd: Story = {
  render: () => stage(card({ open: true, placement: "end" })),
};

/** One card per side, all closed. Opening one closes the others. */
export const Placements: Story = {
  render: () =>
    stage(
      html`<div
        style="display:grid;grid-template-columns:repeat(2,max-content);gap:calc(var(--pl-spacing) * 60) calc(var(--pl-spacing) * 70);justify-content:center"
      >
        ${(["top", "bottom", "start", "end"] as const).map((placement) =>
          card({ id: placement, placement, label: `Repository, ${placement}` }),
        )}
      </div>`,
    ),
};

export const Rtl: Story = {
  render: () => stage(card({ placement: "start", open: true })),
  globals: { dir: "rtl" },
};

export const Glass: Story = {
  render: () => stage(card({ open: true })),
  globals: { material: "glass", theme: "dark", contrast: "more" },
};
