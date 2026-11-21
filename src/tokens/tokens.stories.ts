import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";

const meta = { title: "Tokens" } satisfies Meta;

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
      style="background: var(--purr-color-background); padding: var(--purr-space-4); font-family: var(--purr-font-sans);"
    >
      ${textRoles.map(
        (role) => html`
          <p
            style="margin: 0 0 var(--purr-space-2); font: 400 var(--purr-text-sm) / var(--purr-leading-normal) var(--purr-font-sans); color: var(--purr-color-${role});"
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
      style="padding: var(--purr-space-4); background: repeating-conic-gradient(#000 0 25%, #fff 0 50%) 0 0 / 16px 16px;"
    >
      <div
        id="bar"
        style="padding: var(--purr-space-3); font-family: var(--purr-font-sans); color: var(--purr-color-foreground); background: var(--purr-material-bar); backdrop-filter: var(--purr-material-bar-filter); box-shadow: var(--purr-material-edge);"
      >
        Toolbar
      </div>
    </div>
  `,
};
