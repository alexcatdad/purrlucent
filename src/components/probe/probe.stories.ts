import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { expect } from "storybook/test";
import "./probe.ts";

const meta = {
  title: "Probe",
  component: "purr-probe",
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {
  render: () => html`<purr-probe>Probe</purr-probe>`,
};

export const GlobalsReachTheRoot: Story = {
  render: () => html`<purr-probe>Probe</purr-probe>`,
  globals: { material: "glass", theme: "dark", contrast: "more", dir: "rtl" },
  play: () => {
    const root = document.documentElement;
    expect(root.getAttribute("purr-material")).toBe("glass");
    expect(root.getAttribute("data-theme")).toBe("dark");
    expect(root.getAttribute("data-contrast")).toBe("more");
    expect(root.getAttribute("dir")).toBe("rtl");
  },
};
