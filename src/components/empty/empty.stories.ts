import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import "../button/button.ts";
import "./empty.ts";
import { isolate } from "../../../.storybook/isolate.ts";
import { underGlass } from "../../../.storybook/under-glass.ts";

import { playground } from "../../../.storybook/playground.ts";

const meta = {
  title: "Feedback/Empty",
  component: "pl-empty",
  tags: ["autodocs"],
  parameters: { controls: { disable: true } },
} satisfies Meta;

export default meta;

type Story = StoryObj;

const folder = html`<svg slot="icon" viewBox="0 0 24 24" aria-hidden="true">
  <path
    d="M5 4h4l3 3h7a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-11a2 2 0 0 1 2 -2"
  />
</svg>`;

const full = (rtl = false) =>
  html`<pl-empty>
    ${folder}
    <strong slot="title">No projects</strong>
    <span slot="description"
      >${isolate(
        rtl,
        "Projects you create appear here. Create one to get started.",
      )}</span
    >
    <pl-button slot="action" variant="primary" size="lg"
      >Create project</pl-button
    >
  </pl-empty>`;

export const Playground: Story = {
  ...playground({
    heading: "No results",
    description: "Try a different search.",
  }),
  render: ({ heading, description }) =>
    html`<pl-empty
      ><strong slot="title">${heading}</strong
      ><span slot="description">${description}</span></pl-empty
    >`,
};

export const Default: Story = { render: () => full() };

export const TitleOnly: Story = {
  render: () =>
    html`<pl-empty><strong slot="title">No results</strong></pl-empty>`,
};

export const WithoutIcon: Story = {
  render: () =>
    html`<pl-empty>
      <strong slot="title">No messages</strong>
      <span slot="description">Messages you receive appear here.</span>
    </pl-empty>`,
};

export const Rtl: Story = {
  render: () => full(true),
  globals: { dir: "rtl" },
};

export const Glass: Story = {
  render: () => underGlass(full()),
  globals: { material: "glass", theme: "dark", contrast: "more" },
};
