import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import "../button/button.ts";
import "./empty.ts";
import { underGlass } from "../../../.storybook/under-glass.ts";

const meta = {
  title: "Feedback/Empty",
  component: "pl-empty",
} satisfies Meta;

export default meta;

type Story = StoryObj;

const folder = html`<svg slot="icon" viewBox="0 0 24 24" aria-hidden="true">
  <path
    d="M5 4h4l3 3h7a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-11a2 2 0 0 1 2 -2"
  />
</svg>`;

const full = html`<pl-empty>
  ${folder}
  <strong slot="title">No projects</strong>
  <span slot="description"
    >Projects you create appear here. Create one to get started.</span
  >
  <pl-button slot="action" variant="primary" size="lg"
    >Create project</pl-button
  >
</pl-empty>`;

export const Default: Story = { render: () => full };

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
  render: () => full,
  globals: { dir: "rtl" },
};

export const Glass: Story = {
  render: () => underGlass(full),
  globals: { material: "glass", theme: "dark", contrast: "more" },
};
