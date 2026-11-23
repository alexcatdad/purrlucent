import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html, nothing } from "lit";
import { expect, userEvent } from "storybook/test";
import "../button/button.ts";
import "./drawer.ts";
import type { PlDrawer } from "./drawer.ts";

const meta = {
  title: "Components/Drawer",
  component: "pl-drawer",
} satisfies Meta;

export default meta;

type Story = StoryObj;

/** A button that opens the drawer after it, and a drawer that starts closed. */
const scene = (label: string, drawer: unknown) =>
  html`<div style="padding:var(--pl-space-4)">
    <pl-button
      id="trigger"
      @click=${(event: Event) =>
        (
          (event.currentTarget as HTMLElement).nextElementSibling as PlDrawer
        ).show()}
      >${label}</pl-button
    >${drawer}
  </div>`;

const footer = html`<pl-button slot="footer" data-close="cancel"
    >Cancel</pl-button
  >
  <pl-button slot="footer" variant="primary" data-close="share"
    >Share</pl-button
  >`;

const heading = html`<h2 slot="title">Share this photo</h2>
  <p slot="description" style="margin:0">
    Anyone with the link can see it. You can stop sharing at any time.
  </p>`;

const paragraph = (i: number) =>
  html`<p style="margin:0 0 var(--pl-space-3)">
    ${i}. The content of this section is long enough that the body of the drawer
    has to scroll while the grabber, the title and the actions stay in view.
  </p>`;

const bottom = html`<pl-drawer id="drawer">
  ${heading}
  <p style="margin:0">
    The photo is shared at its original size, with its location removed.
  </p>
  ${footer}
</pl-drawer>`;

const detents = (detent?: string) =>
  html`<pl-drawer
    id="drawer"
    detents="medium large"
    detent=${detent ?? nothing}
    dismissible
  >
    ${heading} ${Array.from({ length: 12 }, (_, i) => paragraph(i + 1))}
    ${footer}
  </pl-drawer>`;

const panel = (side: string) =>
  html`<pl-drawer id="drawer" side=${side} dismissible>
    <h2 slot="title">Inspector</h2>
    <p slot="description" style="margin:0">Details of the selected photo.</p>
    <p style="margin:0">Taken on 4 June 2026, 12 megapixels.</p>
    <pl-button slot="footer" data-close="done">Done</pl-button>
  </pl-drawer>`;

/** Opens the drawer with a real click, as a person would. */
const open = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  await userEvent.click(canvasElement.querySelector("#trigger")!);
  const el = canvasElement.querySelector<PlDrawer>("#drawer")!;
  await el.updateComplete;
  expect(el.open).toBe(true);
};

// Stories that other tests open as they are have no play function.
export const Default: Story = {
  render: () => scene("Show sheet", bottom),
};

/** A bottom sheet as tall as its content. The grabber closes it. */
export const OpenBottom: Story = {
  render: () => scene("Show sheet", bottom),
  play: open,
};

/** Detents: medium (half the screen) and large. The grabber grows, then closes. */
export const OpenDetents: Story = {
  render: () => scene("Show sheet", detents()),
  play: open,
};

/** Starts at the large detent. */
export const OpenLargeDetent: Story = {
  render: () => scene("Show sheet", detents("large")),
  play: open,
};

/** The body scrolls; the grabber, title and actions stay in view. */
export const OpenLongContent: Story = {
  render: () =>
    scene(
      "Show terms",
      html`<pl-drawer id="drawer" dismissible>
        <h2 slot="title">Terms of use</h2>
        ${Array.from({ length: 24 }, (_, i) => paragraph(i + 1))}
        <pl-button slot="footer" data-close="decline">Decline</pl-button>
        <pl-button slot="footer" variant="primary" data-close="accept"
          >Accept</pl-button
        >
      </pl-drawer>`,
    ),
  play: open,
};

export const OpenStart: Story = {
  render: () => scene("Show inspector", panel("start")),
  play: open,
};

export const OpenEnd: Story = {
  render: () => scene("Show inspector", panel("end")),
  play: open,
};

export const Rtl: Story = {
  render: () => scene("Show inspector", panel("start")),
  play: open,
  globals: { dir: "rtl" },
};

export const Glass: Story = {
  render: () => scene("Show sheet", detents()),
  play: open,
  globals: { material: "glass", theme: "dark", contrast: "more" },
};

export const GlassPanel: Story = {
  render: () => scene("Show inspector", panel("end")),
  play: open,
  globals: { material: "glass", theme: "dark", contrast: "more" },
};
