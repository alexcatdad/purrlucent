import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import "./aspect-ratio.ts";

const meta = {
  title: "Components/Aspect Ratio",
  component: "pl-aspect-ratio",
} satisfies Meta;

export default meta;

type Story = StoryObj;

const picture = (label: string) =>
  html`<div
    role="img"
    aria-label=${label}
    style="background:var(--pl-color-track)"
  ></div>`;

const column = (content: unknown) =>
  html`<div
    style="display:grid;gap:var(--pl-space-3);padding:var(--pl-space-4);inline-size:calc(var(--pl-spacing) * 60)"
  >
    ${content}
  </div>`;

export const Default: Story = {
  render: () =>
    column(
      html`<pl-aspect-ratio id="box" ratio="16/9"
        >${picture("Cat on a sofa")}</pl-aspect-ratio
      >`,
    ),
};

export const Ratios: Story = {
  render: () =>
    column(
      ["1", "4/3", "16/9", "21/9", "3/4"].map(
        (ratio) =>
          html`<pl-aspect-ratio ratio=${ratio}
            >${picture(`Picture ${ratio}`)}</pl-aspect-ratio
          >`,
      ),
    ),
};

/** Changing `ratio` resizes the box; a value that is not a ratio falls back to 1. */
export const Updates: Story = {
  render: () =>
    column(
      html`<pl-aspect-ratio id="box" ratio="2"
        >${picture("Cat on a sofa")}</pl-aspect-ratio
      >`,
    ),
};

export const Rtl: Story = {
  render: () =>
    column(
      html`<pl-aspect-ratio ratio="16/9"
        >${picture("Cat on a sofa")}</pl-aspect-ratio
      >`,
    ),
  globals: { dir: "rtl" },
};

export const Glass: Story = {
  render: () =>
    column(
      html`<pl-aspect-ratio ratio="16/9"
        >${picture("Cat on a sofa")}</pl-aspect-ratio
      >`,
    ),
  globals: { material: "glass", theme: "dark", contrast: "more" },
};
