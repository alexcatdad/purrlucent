import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { expect } from "storybook/test";
import "./separator.ts";
import type { PlSeparator } from "./separator.ts";

const meta = {
  title: "Containers/Separator",
  component: "pl-separator",
} satisfies Meta;

export default meta;

type Story = StoryObj;

const box = "padding:var(--pl-space-4);inline-size:20rem";

/** Decoration by default: assistive technology skips it. */
export const Default: Story = {
  render: () =>
    html`<div style=${box}>
      <p>Account</p>
      <pl-separator id="rule"></pl-separator>
      <p>Notifications</p>
    </div>`,
};

/** A vertical rule fills the height of the row it sits in. */
export const Vertical: Story = {
  render: () =>
    html`<div
      style="display:flex;align-items:center;gap:var(--pl-space-3);padding:var(--pl-space-4)"
    >
      <span>Docs</span>
      <pl-separator id="rule" orientation="vertical"></pl-separator>
      <span>Blog</span>
      <pl-separator orientation="vertical"></pl-separator>
      <span>Source</span>
    </div>`,
};

/** With `semantic` it is a separator that a screen reader announces. */
export const Semantic: Story = {
  render: () =>
    html`<div style=${box}>
      <p>Account</p>
      <pl-separator id="rule" semantic></pl-separator>
      <p>Notifications</p>
    </div>`,
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector<PlSeparator>("#rule")!;
    await el.updateComplete;
    expect(el.getAttribute("role")).toBe("separator");
    expect(el.getAttribute("aria-orientation")).toBe("horizontal");
  },
};

export const Rtl: Story = {
  render: () =>
    html`<div
      dir="rtl"
      style="display:flex;align-items:center;gap:var(--pl-space-3);padding:var(--pl-space-4)"
    >
      <span>Docs</span>
      <pl-separator id="rule" orientation="vertical"></pl-separator>
      <span>Blog</span>
    </div>`,
};

export const Glass: Story = {
  render: () =>
    html`<div style=${box}>
      <p>Account</p>
      <pl-separator></pl-separator>
      <p>Notifications</p>
    </div>`,
  globals: { material: "glass", theme: "dark", contrast: "more" },
};
