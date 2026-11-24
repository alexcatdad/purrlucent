import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { expect, userEvent } from "storybook/test";
import { isolate } from "../../../.storybook/isolate.ts";
import "../button/button.ts";
import "./banner.ts";
import type { PlBanner } from "./banner.ts";

const meta = {
  title: "Feedback/Banner",
  component: "pl-banner",
} satisfies Meta;

export default meta;

type Story = StoryObj;

const bell = html`<svg slot="icon" viewBox="0 0 24 24" aria-hidden="true">
  <path
    d="M10 5a2 2 0 1 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3h-16a4 4 0 0 0 2 -3v-3a7 7 0 0 1 4 -6"
  />
  <path d="M9 17v1a3 3 0 0 0 6 0v-1" />
</svg>`;

const column = (content: unknown, rtl = false) =>
  html`<div
    style="display:grid;gap:var(--pl-space-3);padding:var(--pl-space-4)"
  >
    ${content}
    <p style="margin:0">${isolate(rtl, "Content below the banners.")}</p>
  </div>`;

const review = (rtl = false) =>
  html`<pl-banner id="banner" open>
    ${bell}
    <strong slot="title">${isolate(rtl, "Design review")}</strong>
    ${isolate(
      rtl,
      "Starts in 10 minutes in the large meeting room on the second floor.",
    )}
  </pl-banner>`;

// Stories that other tests open as they are have no play function.
export const Default: Story = {
  render: () => column(review()),
};

export const Tones: Story = {
  render: () =>
    column([
      review(),
      html`<pl-banner open tone="destructive">
        ${bell}
        <strong slot="title">The message could not be sent</strong>
        Check the network connection and try again.
      </pl-banner>`,
    ]),
};

export const WithActions: Story = {
  render: () =>
    column(
      html`<pl-banner open>
        ${bell}
        <strong slot="title">Update available</strong>
        A new version is ready to install.
        <pl-button slot="actions" size="lg">Later</pl-button>
        <pl-button slot="actions" size="lg" variant="primary"
          >Install</pl-button
        >
      </pl-banner>`,
    ),
};

/** No slotted icon: each tone draws its own. */
export const ToneIcons: Story = {
  render: () =>
    column([
      html`<pl-banner open>
        <strong slot="title">Saved</strong>
        Your changes are saved.
      </pl-banner>`,
      html`<pl-banner open tone="success">
        <strong slot="title">Queued again</strong>
        12 episodes are queued again.
      </pl-banner>`,
      html`<pl-banner open tone="warning">
        <strong slot="title">Falling behind</strong>
        3 series are more than a day behind.
      </pl-banner>`,
      html`<pl-banner open tone="destructive">
        <strong slot="title">Not saved</strong>
        Your changes could not be saved.
      </pl-banner>`,
    ]),
};

/** `no-close` keeps a banner up until its cause is gone. */
export const Persistent: Story = {
  render: () =>
    column(
      html`<pl-banner id="persistent" open tone="destructive" no-close>
        <strong slot="title">Server unreachable</strong>
        Retrying every 10 seconds.
      </pl-banner>`,
    ),
};

/** `no-icon` hides the icon, the tone's own included. */
export const WithoutIcon: Story = {
  render: () =>
    column([
      html`<pl-banner open no-icon>
        <strong slot="title">Saved</strong>
        Your changes are saved.
      </pl-banner>`,
      html`<pl-banner open no-icon tone="destructive">
        <strong slot="title">Not saved</strong>
        Your changes could not be saved.
      </pl-banner>`,
    ]),
};

export const Closed: Story = {
  render: () =>
    column(
      html`<pl-banner id="banner">
        ${bell} Not shown until opened.
      </pl-banner>`,
    ),
};

/** The close button hides the banner. */
export const Dismissed: Story = {
  render: () => column(review()),
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector<PlBanner>("#banner")!;
    await el.updateComplete;
    await userEvent.click(el.shadowRoot!.querySelector("[part=close]")!);
    expect(el.open).toBe(false);
  },
};

export const Rtl: Story = {
  render: () => column(review(true), true),
  globals: { dir: "rtl" },
};

export const Glass: Story = {
  render: () => column(review()),
  globals: { material: "glass", theme: "dark", contrast: "more" },
};
