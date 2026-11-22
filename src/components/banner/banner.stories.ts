import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { expect, userEvent } from "storybook/test";
import "../button/button.ts";
import "./banner.ts";
import type { PurrBanner } from "./banner.ts";

const meta = {
  title: "Components/Banner",
  component: "purr-banner",
} satisfies Meta;

export default meta;

type Story = StoryObj;

const bell = html`<svg slot="icon" viewBox="0 0 24 24" aria-hidden="true">
  <path
    d="M10 5a2 2 0 1 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3h-16a4 4 0 0 0 2 -3v-3a7 7 0 0 1 4 -6"
  />
  <path d="M9 17v1a3 3 0 0 0 6 0v-1" />
</svg>`;

const column = (content: unknown) =>
  html`<div
    style="display:grid;gap:var(--purr-space-3);padding:var(--purr-space-4)"
  >
    ${content}
    <p style="margin:0">Content below the banners.</p>
  </div>`;

const review = html`<purr-banner id="banner" open>
  ${bell}
  <strong slot="title">Design review</strong>
  Starts in 10 minutes in the large meeting room on the second floor.
</purr-banner>`;

// Stories that other tests open as they are have no play function.
export const Default: Story = {
  render: () => column(review),
};

export const Tones: Story = {
  render: () =>
    column([
      review,
      html`<purr-banner open tone="destructive">
        ${bell}
        <strong slot="title">The message could not be sent</strong>
        Check the network connection and try again.
      </purr-banner>`,
    ]),
};

export const WithActions: Story = {
  render: () =>
    column(
      html`<purr-banner open>
        ${bell}
        <strong slot="title">Update available</strong>
        A new version is ready to install.
        <purr-button slot="actions" size="lg">Later</purr-button>
        <purr-button slot="actions" size="lg" variant="primary"
          >Install</purr-button
        >
      </purr-banner>`,
    ),
};

/** No slotted icon: each tone draws its own. */
export const WithoutIcon: Story = {
  render: () =>
    column([
      html`<purr-banner open>
        <strong slot="title">Saved</strong>
        Your changes are saved.
      </purr-banner>`,
      html`<purr-banner open tone="destructive">
        <strong slot="title">Not saved</strong>
        Your changes could not be saved.
      </purr-banner>`,
    ]),
};

export const Closed: Story = {
  render: () =>
    column(
      html`<purr-banner id="banner">
        ${bell} Not shown until opened.
      </purr-banner>`,
    ),
};

/** The close button hides the banner. */
export const Dismissed: Story = {
  render: () => column(review),
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector<PurrBanner>("#banner")!;
    await el.updateComplete;
    await userEvent.click(el.shadowRoot!.querySelector("[part=close]")!);
    expect(el.open).toBe(false);
  },
};

export const Rtl: Story = {
  render: () => column(review),
  globals: { dir: "rtl" },
};

export const Glass: Story = {
  render: () => column(review),
  globals: { material: "glass", theme: "dark", contrast: "more" },
};
