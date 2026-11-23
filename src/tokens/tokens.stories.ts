import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";

const meta = { title: "Foundations/Tokens" } satisfies Meta;

export default meta;

type Story = StoryObj;

const textRoles = [
  "foreground",
  "muted-foreground",
  "accent-text",
  "destructive-text",
];

export const Palette: Story = {
  render: () => html`
    <div
      style="background: var(--pl-color-background); padding: var(--pl-space-4); font-family: var(--pl-font-sans);"
    >
      ${textRoles.map(
        (role) => html`
          <p
            style="margin: 0 0 var(--pl-space-2); font: 400 var(--pl-text-sm) / var(--pl-leading-normal) var(--pl-font-sans); color: var(--pl-color-${role});"
          >
            ${role}
          </p>
        `,
      )}
    </div>
  `,
};

// The same bar and filter tokens a glass surface uses, over a busy backdrop.
export const Materials: Story = {
  render: () => html`
    <div
      style="padding: var(--pl-space-4); background: repeating-conic-gradient(#000 0 25%, #fff 0 50%) 0 0 / 16px 16px;"
    >
      <div
        id="bar"
        style="padding: var(--pl-space-3); font-family: var(--pl-font-sans); color: var(--pl-color-foreground); background: var(--pl-material-bar); backdrop-filter: var(--pl-material-bar-filter); box-shadow: var(--pl-material-edge);"
      >
        Toolbar
      </div>
    </div>
  `,
};
