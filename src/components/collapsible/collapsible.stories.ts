import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { expect, userEvent, waitFor } from "storybook/test";
import "./collapsible.ts";
import type { PlCollapsible } from "./collapsible.ts";
import { underGlass } from "../../../.storybook/under-glass.ts";

import { playground } from "../../../.storybook/playground.ts";

const meta = {
  title: "Containers/Collapsible",
  component: "pl-collapsible",
  tags: ["autodocs"],
  parameters: { controls: { disable: true } },
} satisfies Meta;

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

export const Playground: Story = {
  ...playground({ heading: "Shipping details", disabled: false }, [
    "pl-toggle",
  ]),
  render: ({ heading, disabled }) =>
    html`<pl-collapsible ?disabled=${disabled}
      ><span slot="trigger">${heading}</span>
      <p>Orders leave the warehouse within two working days.</p></pl-collapsible
    >`,
};

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

/** `disabled` dims the trigger and keeps the content as it is. */
export const Disabled: Story = {
  render: () => html`
    <pl-collapsible id="control" disabled>
      <span slot="trigger">Shipping details</span>
      <p id="body" style="margin:0">
        Orders leave the warehouse within two working days.
      </p>
    </pl-collapsible>
  `,
};

/** A slotted `button` replaces the built-in one: the collapsible wires `aria-expanded` and `aria-controls` on it. */
export const SlottedTrigger: Story = {
  render: () => html`
    <pl-collapsible id="control">
      <button
        id="trigger"
        slot="trigger"
        type="button"
        style="font:inherit;color:inherit;background:none;border:0;padding:var(--pl-space-1) var(--pl-pad-item);inline-size:100%;text-align:start"
      >
        Shipping details
      </button>
      <p id="body" style="margin:0">
        Orders leave the warehouse within two working days.
      </p>
    </pl-collapsible>
  `,
};

/** `current` fills the row like the selected row of a sidebar. */
export const Current: Story = {
  render: () => html`
    <pl-collapsible id="control" current>
      <span slot="trigger">Shipping details</span>
      <p id="body" style="margin:0">
        Orders leave the warehouse within two working days.
      </p>
    </pl-collapsible>
  `,
};

export const Glass: Story = {
  render: () => underGlass(render()),
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
    // Focus the trigger as Tab would reach it; Tab is not reliable in the test runner.
    el.shadowRoot!.querySelector("button")!.focus();
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(el.open).toBe(true));
  },
};
