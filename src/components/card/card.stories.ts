import { previewTexture } from "../../../.storybook/backdrop.css.ts";
import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import "../button/button.ts";
import "./card.ts";
import { isolate } from "../../../.storybook/isolate.ts";
import { underGlass } from "../../../.storybook/under-glass.ts";

import { playground } from "../../../.storybook/playground.ts";

const meta = {
  title: "Cards & Lists/Card",
  component: "pl-card",
  tags: ["autodocs"],
  parameters: { controls: { disable: true } },
} satisfies Meta;

export default meta;

type Story = StoryObj;

const frame = (content: unknown) =>
  html`<div style="padding:var(--pl-space-4);max-inline-size:28rem">
    ${content}
  </div>`;

const full = (rtl = false) =>
  html`<pl-card pl-texture=${previewTexture()}>
    <strong slot="title">Team plan</strong>
    <span slot="description">${isolate(rtl, "Billed every month.")}</span>
    <pl-button slot="actions">Edit</pl-button>
    ${isolate(
      rtl,
      "Five members share this plan. Each member can create projects and invite guests.",
    )}
    <pl-button slot="footer">Cancel plan</pl-button>
    <pl-button slot="footer" variant="primary">Add member</pl-button>
  </pl-card>`;

export const Playground: Story = {
  ...playground({
    heading: "Team plan",
    description: "Billed every month.",
    content: "Five members share this plan.",
  }),
  render: ({ heading, description, content }) =>
    frame(
      html`<pl-card
        ><strong slot="title">${heading}</strong
        ><span slot="description">${description}</span>${content}</pl-card
      >`,
    ),
};

export const Default: Story = { render: () => frame(full()) };

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
  render: () => frame(full(true)),
  globals: { dir: "rtl" },
};

/** The card is a content surface, so glass leaves it solid. */
export const Glass: Story = {
  render: () => underGlass(frame(full())),
  globals: { material: "glass", theme: "dark", contrast: "more" },
};
