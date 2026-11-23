import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import "./kbd.ts";
import { underGlass } from "../../../.storybook/under-glass.ts";

const meta = {
  title: "Text/Kbd",
  component: "pl-kbd",
} satisfies Meta;

export default meta;

type Story = StoryObj;

const row =
  "display:flex;align-items:center;gap:var(--pl-space-2);padding:var(--pl-space-4)";

export const Default: Story = {
  render: () => html`<pl-kbd id="key">⌘K</pl-kbd>`,
};

/** Modifiers in the order Control, Option, Shift, Command, then the key. */
export const Shortcut: Story = {
  render: () =>
    html`<div style=${row}>
      <pl-kbd id="shortcut">⌃⌥⇧⌘K</pl-kbd>
      <pl-kbd>⌘S</pl-kbd>
      <pl-kbd>Esc</pl-kbd>
    </div>`,
};

/** One element for each key. */
export const SeparateKeys: Story = {
  render: () =>
    html`<div style=${row}>
      Press <pl-kbd>⌘</pl-kbd><pl-kbd>K</pl-kbd> to search
    </div>`,
};

export const Rtl: Story = {
  render: () =>
    html`<div dir="rtl" style=${row}><pl-kbd id="key">⌘K</pl-kbd> بحث</div>`,
};

export const Glass: Story = {
  render: () => underGlass(html`<pl-kbd>⌘K</pl-kbd>`),
  globals: { material: "glass", theme: "dark", contrast: "more" },
};
