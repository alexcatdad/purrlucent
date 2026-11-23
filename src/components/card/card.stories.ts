import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import "../button/button.ts";
import "./card.ts";
import { underGlass } from "../../../.storybook/under-glass.ts";

const meta = {
  title: "Cards & Lists/Card",
  component: "pl-card",
} satisfies Meta;

export default meta;

type Story = StoryObj;

const frame = (content: unknown) =>
  html`<div style="padding:var(--pl-space-4);max-inline-size:28rem">
    ${content}
  </div>`;

const full = html`<pl-card>
  <strong slot="title">Team plan</strong>
  <span slot="description">Billed every month.</span>
  <pl-button slot="actions">Edit</pl-button>
  Five members share this plan. Each member can create projects and invite
  guests.
  <pl-button slot="footer">Cancel plan</pl-button>
  <pl-button slot="footer" variant="primary">Add member</pl-button>
</pl-card>`;

export const Default: Story = { render: () => frame(full) };

/** Sections with nothing in them are hidden and add no padding. */
export const ContentOnly: Story = {
  render: () =>
    frame(html`<pl-card>Storage is used for projects and backups.</pl-card>`),
};

export const HeaderOnly: Story = {
  render: () =>
    frame(
      html`<pl-card>
        <strong slot="title">Notifications</strong>
        <span slot="description">Choose what you hear about.</span>
      </pl-card>`,
    ),
};

export const Rtl: Story = {
  render: () => frame(full),
  globals: { dir: "rtl" },
};

/** The card is a content surface, so glass leaves it solid. */
export const Glass: Story = {
  render: () => underGlass(frame(full)),
  globals: { material: "glass", theme: "dark", contrast: "more" },
};
