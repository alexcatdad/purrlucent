import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { expect } from "storybook/test";
import "../avatar/avatar.ts";
import "./skeleton.ts";
import { underGlass } from "../../../.storybook/under-glass.ts";

const meta = {
  title: "Feedback/Skeleton",
  component: "pl-skeleton",
} satisfies Meta;

export default meta;

type Story = StoryObj;

const column = (content: unknown) =>
  html`<div
    style="display:grid;justify-items:start;gap:var(--pl-space-3);padding:var(--pl-space-4)"
  >
    ${content}
  </div>`;

export const Default: Story = {
  render: () =>
    column(
      html`<pl-skeleton
        id="skeleton"
        style="inline-size:calc(var(--pl-spacing) * 50)"
      ></pl-skeleton>`,
    ),
};

export const Shapes: Story = {
  render: () =>
    html`<div
      style="display:flex;align-items:center;gap:var(--pl-space-4);padding:var(--pl-space-4)"
    >
      <pl-skeleton id="circle" shape="circle"></pl-skeleton>
      <pl-skeleton
        id="rect"
        style="inline-size:calc(var(--pl-spacing) * 40)"
      ></pl-skeleton>
    </div>`,
};

export const Shimmer: Story = {
  render: () =>
    column(
      html`<pl-skeleton
        id="skeleton"
        shimmer
        style="inline-size:calc(var(--pl-spacing) * 50)"
      ></pl-skeleton>`,
    ),
};

/** The region carries `aria-busy`; the placeholders inside it are hidden. */
export const LoadingRegion: Story = {
  render: () =>
    html`<section
      id="region"
      aria-label="Profile"
      aria-busy="true"
      style="display:flex;align-items:center;gap:var(--pl-space-4);padding:var(--pl-space-4)"
    >
      <pl-skeleton shape="circle" shimmer></pl-skeleton>
      <div
        style="display:grid;gap:var(--pl-space-2);inline-size:calc(var(--pl-spacing) * 50)"
      >
        <pl-skeleton shimmer></pl-skeleton>
        <pl-skeleton shimmer style="inline-size:60%"></pl-skeleton>
      </div>
    </section>`,
  play: async ({ canvasElement }) => {
    const region = canvasElement.querySelector("#region")!;
    expect(region.getAttribute("aria-busy")).toBe("true");
    for (const el of region.querySelectorAll("pl-skeleton"))
      expect(el.getAttribute("aria-hidden")).toBe("true");
  },
};

/** The same region once its content has arrived. */
export const Loaded: Story = {
  render: () =>
    html`<section
      aria-label="Profile"
      style="display:flex;align-items:center;gap:var(--pl-space-4);padding:var(--pl-space-4)"
    >
      <pl-avatar name="Ada Lovelace"></pl-avatar>
      <div>
        <strong>Ada Lovelace</strong>
        <div>Mathematician</div>
      </div>
    </section>`,
};

export const Glass: Story = {
  render: () =>
    underGlass(
      column(
        html`<pl-skeleton
          shimmer
          style="inline-size:calc(var(--pl-spacing) * 50)"
        ></pl-skeleton>`,
      ),
    ),
  globals: { material: "glass", theme: "dark", contrast: "more" },
};
