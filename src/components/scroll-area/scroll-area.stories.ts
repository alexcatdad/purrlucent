import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { expect } from "storybook/test";
import "./scroll-area.ts";
import type { PlScrollArea } from "./scroll-area.ts";
import "../button/button.ts";

const meta = {
  title: "Components/Scroll Area",
  component: "pl-scroll-area",
} satisfies Meta;

export default meta;

type Story = StoryObj;

const frame =
  "block-size:calc(var(--pl-spacing) * 40);inline-size:calc(var(--pl-spacing) * 60)";

const lines = (count: number) =>
  Array.from({ length: count }, (_, i) => html`<p>Line ${i + 1}</p>`);

export const Default: Story = {
  render: () =>
    html`<pl-scroll-area id="area" label="Release notes" style=${frame}
      >${lines(30)}</pl-scroll-area
    >`,
};

/** Short content does not overflow, so the region is not a tab stop. */
export const Fits: Story = {
  render: () =>
    html`<pl-scroll-area id="area" label="Notes" style=${frame}
      >${lines(2)}</pl-scroll-area
    >`,
};

/** Content with its own tab stops keeps them; the region does not add one. */
export const WithControls: Story = {
  render: () =>
    html`<pl-scroll-area id="area" label="Actions" style=${frame}
      >${Array.from(
        { length: 20 },
        (_, i) => html`<div><pl-button>Action ${i + 1}</pl-button></div>`,
      )}</pl-scroll-area
    >`,
};

export const Horizontal: Story = {
  render: () =>
    html`<pl-scroll-area
      id="area"
      label="Gallery"
      orientation="horizontal"
      style="inline-size:calc(var(--pl-spacing) * 60)"
      ><div
        style="inline-size:calc(var(--pl-spacing) * 200);white-space:nowrap"
      >
        A wide strip of content that runs past the edge of the region.
      </div></pl-scroll-area
    >`,
};

/** Content added later makes the region a tab stop. */
export const Updates: Story = {
  render: () =>
    html`<pl-scroll-area id="area" label="Log" style=${frame}
      >${lines(2)}</pl-scroll-area
    >`,
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector<PlScrollArea>("#area")!;
    await el.updateComplete;
    expect(el.hasAttribute("tabindex")).toBe(false);
    for (let i = 0; i < 30; i++) {
      const p = document.createElement("p");
      p.textContent = `More ${i}`;
      el.append(p);
    }
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    expect(el.getAttribute("tabindex")).toBe("0");
  },
};

export const Rtl: Story = {
  render: () =>
    html`<pl-scroll-area id="area" label="Release notes" style=${frame}
      >${lines(30)}</pl-scroll-area
    >`,
  globals: { dir: "rtl" },
};

export const Glass: Story = {
  render: () =>
    html`<pl-scroll-area id="area" label="Release notes" style=${frame}
      >${lines(30)}</pl-scroll-area
    >`,
  globals: { material: "glass", theme: "dark", contrast: "more" },
};
