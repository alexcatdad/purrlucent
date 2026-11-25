import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html, nothing } from "lit";
import { expect, userEvent } from "storybook/test";
import { isolate } from "../../../.storybook/isolate.ts";
import "../button/button.ts";
import "../dialog/dialog.ts";
import "./drawer.ts";
import type { PlDialog } from "../dialog/dialog.ts";
import type { PlDrawer } from "./drawer.ts";

import { playground } from "../../../.storybook/playground.ts";

const meta = {
  title: "Dialogs/Drawer",
  component: "pl-drawer",
  tags: ["autodocs"],
  parameters: { controls: { disable: true } },
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

const panel = (side: string, rtl = false) =>
  html`<pl-drawer id="drawer" side=${side} dismissible>
    <h2 slot="title">Inspector</h2>
    <p slot="description" style="margin:0">
      ${isolate(rtl, "Details of the selected photo.")}
    </p>
    <p style="margin:0">
      ${isolate(rtl, "Taken on 4 June 2026, 12 megapixels.")}
    </p>
    <pl-button slot="footer" data-close="done">Done</pl-button>
  </pl-drawer>`;

/** Opens the drawer with a real click, as a person would. */
const open = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  await userEvent.click(canvasElement.querySelector("#trigger")!);
  const el = canvasElement.querySelector<PlDrawer>("#drawer")!;
  await el.updateComplete;
  expect(el.open).toBe(true);
};

export const Playground: Story = {
  ...playground({ side: ["bottom", "start", "end"], dismissible: true }, [
    "pl-open",
    "pl-close",
    "pl-cancel",
  ]),
  render: ({ side, dismissible }) =>
    scene(
      "Show drawer",
      html`<pl-drawer side=${side} ?dismissible=${dismissible}
        >${heading}
        <p>Choose how to share this photo.</p>
        ${footer}</pl-drawer
      >`,
    ),
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

/** The `description` attribute describes a drawer that has no description slot. */
export const OpenDescribedByAttribute: Story = {
  render: () =>
    scene(
      "Show sheet",
      html`<pl-drawer
        id="drawer"
        description="Sharing can be turned off at any time."
      >
        <h2 slot="title">Share this photo</h2>
        <p style="margin:0">The photo is shared at its original size.</p>
        ${footer}
      </pl-drawer>`,
    ),
  play: open,
};

/** A dialog opened from inside the open drawer: Escape closes the dialog first. */
export const OpenWithDialog: Story = {
  render: () =>
    scene(
      "Show sheet",
      html`<pl-drawer id="drawer">
        <h2 slot="title">Share this photo</h2>
        <pl-button
          id="inner-trigger"
          @click=${(event: Event) =>
            (
              (event.currentTarget as HTMLElement)
                .nextElementSibling as PlDialog
            ).show()}
          >Remove photo</pl-button
        >
        <pl-dialog id="inner-dialog" variant="alert">
          <h2 slot="title">Remove this photo?</h2>
          It will be removed from the album.
          <pl-button slot="actions" size="lg" data-close="cancel"
            >Cancel</pl-button
          >
          <pl-button slot="actions" size="lg" data-close="remove"
            >Remove</pl-button
          >
        </pl-dialog>
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
  render: () => scene("Show inspector", panel("start", true)),
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
