import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { expect, waitFor } from "storybook/test";
import "../button/button.ts";
import "../menu/menu.ts";
import "./context-menu.ts";
import type { PlMenu } from "../menu/menu.ts";

const meta = {
  title: "Components/Context Menu",
  component: "pl-context-menu",
} satisfies Meta;

export default meta;

type Story = StoryObj;

// Room below the region, so a menu opens where it was asked to.
const stage = (inner: unknown) =>
  html`<div
    style="display:grid;justify-items:start;padding:var(--pl-space-4);min-block-size:calc(var(--pl-spacing) * 90)"
  >
    ${inner}
  </div>`;

const region = (disabled = false) => html`
  <pl-context-menu id="context" ?disabled=${disabled}>
    <div
      id="area"
      style="box-sizing:border-box;display:grid;justify-items:start;gap:var(--pl-space-3);inline-size:min(100%, calc(var(--pl-spacing) * 90));padding:var(--pl-space-4);border:1px dashed var(--pl-color-muted-foreground);border-radius:var(--pl-radius);color:var(--pl-color-foreground);font:var(--pl-text-sm) var(--pl-font-sans)"
    >
      <pl-button>Report.pdf</pl-button>
      <span>Right-click, long-press or press Shift+F10.</span>
    </div>
    <pl-menu slot="menu" label="File actions">
      <pl-menu-item>Open</pl-menu-item>
      <pl-menu-item>Rename</pl-menu-item>
      <pl-menu-item>
        Share
        <pl-menu slot="submenu" label="Share">
          <pl-menu-item>Mail</pl-menu-item>
          <pl-menu-item>Copy Link</pl-menu-item>
        </pl-menu>
      </pl-menu-item>
      <pl-menu-separator></pl-menu-separator>
      <pl-menu-item destructive>Move to Trash</pl-menu-item>
    </pl-menu>
  </pl-context-menu>
`;

/** The accessibility check reads colours after play, so every fade has to be over. */
const settled = (canvasElement: HTMLElement) =>
  Promise.all(
    [
      ...document.getAnimations(),
      ...[...canvasElement.querySelectorAll("pl-menu")].flatMap(
        (menu) => menu.shadowRoot?.getAnimations() ?? [],
      ),
    ].map((animation) => animation.finished),
  );

/** Right-clicks the region a little in from its start, as a person would, so the menu is measured open. */
const openMenu = async (canvasElement: HTMLElement) => {
  const menu = canvasElement.querySelector<PlMenu>(
    "pl-context-menu > pl-menu",
  )!;
  await menu.updateComplete;
  const area = canvasElement.querySelector("#area")!;
  const box = area.getBoundingClientRect();
  area.dispatchEvent(
    new MouseEvent("contextmenu", {
      bubbles: true,
      composed: true,
      cancelable: true,
      clientX: box.left + box.width / 4,
      clientY: box.top + box.height / 2,
    }),
  );
  await waitFor(() => expect(menu.open).toBe(true));
  await menu.updateComplete;
  await settled(canvasElement);
};

// Stories that other tests open as they are have no play function.
export const Default: Story = { render: () => stage(region()) };

/** The menu opens at the pointer; its first item is focused. */
export const Open: Story = {
  render: () => stage(region()),
  play: async ({ canvasElement }) => {
    await openMenu(canvasElement);
  },
};

/** The region has no context menu: the browser's own shows instead. */
export const Disabled: Story = { render: () => stage(region(true)) };

export const Rtl: Story = {
  render: () => stage(region()),
  globals: { dir: "rtl" },
  play: async ({ canvasElement }) => {
    await openMenu(canvasElement);
  },
};

export const Glass: Story = {
  render: () => stage(region()),
  globals: { material: "glass", theme: "dark", contrast: "more" },
  play: async ({ canvasElement }) => {
    await openMenu(canvasElement);
  },
};
