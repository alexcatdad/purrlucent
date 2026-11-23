import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { expect, userEvent } from "storybook/test";
import "../button/button.ts";
import "../menu/menu.ts";
import type { PlMenu } from "../menu/menu.ts";
import "./menubar.ts";

const meta = {
  title: "Menus/Menubar",
  component: "pl-menubar",
} satisfies Meta;

export default meta;

type Story = StoryObj;

const trigger = (label: string, disabled = false) =>
  html`<pl-button slot="trigger" variant="ghost" ?disabled=${disabled}
    >${label}</pl-button
  >`;

const bar = (disabledMenu = false) => html`
  <div
    style="padding:var(--pl-space-3);min-block-size:calc(var(--pl-spacing) * 90)"
  >
    <pl-menubar id="bar" label="Application">
      <pl-menu label="File">
        ${trigger("File")}
        <pl-menu-item detail="⌘N">New</pl-menu-item>
        <pl-menu-item detail="⌘O">Open…</pl-menu-item>
        <pl-menu-separator></pl-menu-separator>
        <pl-menu-item detail="⌘W">Close</pl-menu-item>
      </pl-menu>
      <pl-menu label="Edit">
        ${trigger("Edit", disabledMenu)}
        <pl-menu-item detail="⌘Z">Undo</pl-menu-item>
        <pl-menu-item detail="⇧⌘Z">Redo</pl-menu-item>
        <pl-menu-separator></pl-menu-separator>
        <pl-menu-item>
          Find
          <pl-menu slot="submenu" label="Find">
            <pl-menu-item>Find…</pl-menu-item>
            <pl-menu-item>Find Next</pl-menu-item>
          </pl-menu>
        </pl-menu-item>
      </pl-menu>
      <pl-menu label="View">
        ${trigger("View")}
        <pl-menu-item type="checkbox" checked>Show Toolbar</pl-menu-item>
        <pl-menu-item type="checkbox">Show Sidebar</pl-menu-item>
      </pl-menu>
    </pl-menubar>
  </div>
`;

/** The accessibility check reads colours after play, so every fade has to be over. */
const settled = (canvasElement: HTMLElement) =>
  Promise.all(
    [...canvasElement.querySelectorAll("pl-menu")]
      .flatMap((menu) => menu.shadowRoot?.getAnimations() ?? [])
      .map((animation) => animation.finished),
  );

const openFile = async (canvasElement: HTMLElement) => {
  const menu = canvasElement.querySelector<PlMenu>("pl-menu")!;
  await menu.updateComplete;
  await userEvent.click(menu.querySelector("[slot=trigger]")!);
  await menu.updateComplete;
  expect(menu.open).toBe(true);
  await settled(canvasElement);
};

// Stories that other tests open as they are have no play function.
export const Default: Story = { render: () => bar() };

export const Open: Story = {
  render: () => bar(),
  play: async ({ canvasElement }) => {
    await openFile(canvasElement);
  },
};

export const DisabledMenu: Story = { render: () => bar(true) };

export const Rtl: Story = {
  render: () => bar(),
  globals: { dir: "rtl" },
  play: async ({ canvasElement }) => {
    await openFile(canvasElement);
  },
};

export const Glass: Story = {
  render: () => bar(),
  globals: { material: "glass", theme: "dark", contrast: "more" },
  play: async ({ canvasElement }) => {
    await openFile(canvasElement);
  },
};
