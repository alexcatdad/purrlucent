import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { expect, userEvent } from "storybook/test";
import { isolate } from "../../../.storybook/isolate.ts";
import "./tabs.ts";
import type { PlTabs } from "./tabs.ts";

import { playground } from "../../../.storybook/playground.ts";

const meta = {
  title: "Navigation/Tabs",
  component: "pl-tabs",
  tags: ["autodocs"],
  parameters: { controls: { disable: true } },
} satisfies Meta;

export default meta;

type Story = StoryObj;

const tabs = (rtl: boolean, orientation = "horizontal") => html`
  <pl-tabs id="control" label="Account" orientation=${orientation}>
    <pl-tab value="profile">Profile</pl-tab>
    <pl-tab value="security">Security</pl-tab>
    <pl-tab value="billing">Billing</pl-tab>
    <pl-tab-panel value="profile"
      >${isolate(rtl, "Your name and photo.")}</pl-tab-panel
    >
    <pl-tab-panel value="security"
      >${isolate(rtl, "Password and sign-in.")}</pl-tab-panel
    >
    <pl-tab-panel value="billing"
      >${isolate(rtl, "Plan and invoices.")}</pl-tab-panel
    >
  </pl-tabs>
`;

const render = () => tabs(false);
const renderRtl = () => tabs(true);

const control = async (canvasElement: HTMLElement) => {
  const el = canvasElement.querySelector<PlTabs>("#control")!;
  await el.updateComplete;
  return el;
};

export const Playground: Story = {
  ...playground({ orientation: ["horizontal", "vertical"] }, ["pl-change"]),
  render: ({ orientation }) => tabs(false, orientation),
};

// Stories that other tests open as they are have no play function: a play
// function would change the selection before the test starts.
export const Default: Story = { render };

/** `value` selects the tab and shows its panel. */
export const Preselected: Story = {
  render: () => html`
    <pl-tabs id="control" label="Account" value="billing">
      <pl-tab value="profile">Profile</pl-tab>
      <pl-tab value="security">Security</pl-tab>
      <pl-tab value="billing">Billing</pl-tab>
      <pl-tab-panel value="profile">Your name and photo.</pl-tab-panel>
      <pl-tab-panel value="security">Password and sign-in.</pl-tab-panel>
      <pl-tab-panel value="billing">Plan and invoices.</pl-tab-panel>
    </pl-tabs>
  `,
};

/** Vertical tabs use Up and Down. */
export const Vertical: Story = {
  render: () => html`
    <pl-tabs id="control" label="Account" orientation="vertical">
      <pl-tab value="profile">Profile</pl-tab>
      <pl-tab value="security">Security</pl-tab>
      <pl-tab value="billing">Billing</pl-tab>
      <pl-tab-panel value="profile">Your name and photo.</pl-tab-panel>
      <pl-tab-panel value="security">Password and sign-in.</pl-tab-panel>
      <pl-tab-panel value="billing">Plan and invoices.</pl-tab-panel>
    </pl-tabs>
  `,
};

/** An unavailable tab takes no focus and cannot be selected. */
export const DisabledTab: Story = {
  render: () => html`
    <pl-tabs id="control" label="Account">
      <pl-tab value="profile">Profile</pl-tab>
      <pl-tab value="security" disabled>Security</pl-tab>
      <pl-tab value="billing">Billing</pl-tab>
      <pl-tab-panel value="profile">Your name and photo.</pl-tab-panel>
      <pl-tab-panel value="security">Password and sign-in.</pl-tab-panel>
      <pl-tab-panel value="billing">Plan and invoices.</pl-tab-panel>
    </pl-tabs>
  `,
};

/** `hide-scrollbar` hides the scrollbar of a tab list that overflows; it still scrolls. */
export const HideScrollbar: Story = {
  render: () => html`
    <div style="inline-size:16rem">
      <pl-tabs id="control" label="Account" hide-scrollbar>
        <pl-tab value="profile">Profile</pl-tab>
        <pl-tab value="security">Security</pl-tab>
        <pl-tab value="billing">Billing</pl-tab>
        <pl-tab value="notifications">Notifications</pl-tab>
        <pl-tab value="integrations">Integrations</pl-tab>
        <pl-tab-panel value="profile">Your name and photo.</pl-tab-panel>
        <pl-tab-panel value="security">Password and sign-in.</pl-tab-panel>
        <pl-tab-panel value="billing">Plan and invoices.</pl-tab-panel>
        <pl-tab-panel value="notifications">Email and push.</pl-tab-panel>
        <pl-tab-panel value="integrations">Connected apps.</pl-tab-panel>
      </pl-tabs>
    </div>
  `,
};

export const Glass: Story = {
  render,
  globals: { material: "glass", theme: "dark", contrast: "more", dir: "ltr" },
};

export const Light: Story = { render, globals: { theme: "light" } };

export const Dark: Story = { render, globals: { theme: "dark" } };

export const MoreContrast: Story = { render, globals: { contrast: "more" } };

/** Under right-to-left the tabs mirror. */
export const Rtl: Story = { render: renderRtl, globals: { dir: "rtl" } };

/** Tab enters on the selected tab, and ArrowRight selects the next. */
export const Keyboard: Story = {
  render,
  play: async ({ canvasElement }) => {
    const el = await control(canvasElement);
    expect(el.value).toBe("profile");
    await userEvent.tab();
    await userEvent.keyboard("{ArrowRight}");
    await el.updateComplete;
    expect(el.value).toBe("security");
    expect(el.querySelector("[value=security]")).toHaveFocus();
  },
};

/** Under right-to-left, the arrow keys follow the visual direction. */
export const KeyboardRtl: Story = {
  render: renderRtl,
  globals: { dir: "rtl" },
  play: async ({ canvasElement }) => {
    const el = await control(canvasElement);
    await userEvent.tab();
    await userEvent.keyboard("{ArrowLeft}");
    await el.updateComplete;
    expect(el.value).toBe("security");
  },
};
