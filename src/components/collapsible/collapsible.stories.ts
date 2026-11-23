import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { expect, userEvent } from "storybook/test";
import "./collapsible.ts";
import type { PlCollapsible } from "./collapsible.ts";

const meta = { title: "Components/Collapsible" } satisfies Meta;

export default meta;

type Story = StoryObj;

const render = () => html`
  <pl-collapsible id="control">
    <span slot="trigger">Shipping details</span>
    <p id="body" style="margin:0">
      Orders leave the warehouse within two working days.
    </p>
  </pl-collapsible>
`;

// Stories that other tests open as they are have no play function: a play
// function would change the state before the test starts.
export const Default: Story = { render };

/** `open` shows the content from the first paint, with no event. */
export const Open: Story = {
  render: () => html`
    <pl-collapsible id="control" open>
      <span slot="trigger">Shipping details</span>
      <p id="body" style="margin:0">
        Orders leave the warehouse within two working days.
      </p>
    </pl-collapsible>
  `,
};

export const Glass: Story = {
  render,
  globals: { material: "glass", theme: "dark", contrast: "more", dir: "ltr" },
};

export const Light: Story = { render, globals: { theme: "light" } };

export const Dark: Story = { render, globals: { theme: "dark" } };

export const MoreContrast: Story = { render, globals: { contrast: "more" } };

/** Under right-to-left the chevron mirrors and the content keeps the label's edge. */
export const Rtl: Story = { render, globals: { dir: "rtl" } };

/** Tab reaches the trigger, and Enter opens the content. */
export const Keyboard: Story = {
  render,
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector<PlCollapsible>("#control")!;
    await el.updateComplete;
    await userEvent.tab();
    await userEvent.keyboard("{Enter}");
    await el.updateComplete;
    expect(el.open).toBe(true);
  },
};
