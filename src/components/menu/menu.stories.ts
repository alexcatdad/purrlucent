import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { expect, userEvent } from "storybook/test";
import "../button/button.ts";
import "./menu.ts";
import type { PlMenu, PlMenuItem } from "./menu.ts";

import { playground } from "../../../.storybook/playground.ts";

const meta = {
  title: "Menus/Menu",
  component: "pl-menu",
  tags: ["autodocs"],
  parameters: { controls: { disable: true } },
} satisfies Meta;

export default meta;

type Story = StoryObj;

const glyph = (d: string) =>
  html`<svg slot="icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d=${d} />
  </svg>`;

const undo = "M9 14l-4 -4l4 -4 M5 10h11a4 4 0 1 1 0 8h-1";
const redo = "M15 14l4 -4l-4 -4 M19 10h-11a4 4 0 1 0 0 8h1";
const copy =
  "M7 9.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667l0 -8.666";
const trash =
  "M4 7l16 0 M10 11l0 6 M14 11l0 6 M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12 M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3";
const find = "M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0 M21 21l-6 -6";
const list = "M9 6l11 0 M9 12l11 0 M9 18l11 0";

const pullDown = (label: string) =>
  html`<pl-button slot="trigger"
    >${label}<svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M6 9l6 6l6 -6" /></svg
  ></pl-button>`;

const column = (content: unknown) =>
  html`<div
    style="display:grid;justify-items:start;gap:var(--pl-space-3);padding:var(--pl-space-4);min-block-size:calc(var(--pl-spacing) * 90)"
  >
    ${content}
  </div>`;

const edit = html`
  <pl-menu id="menu" label="Edit">
    ${pullDown("Edit")}
    <pl-menu-item detail="⌘Z">${glyph(undo)}Undo</pl-menu-item>
    <pl-menu-item detail="⇧⌘Z">${glyph(redo)}Redo</pl-menu-item>
    <pl-menu-separator></pl-menu-separator>
    <pl-menu-label>Clipboard</pl-menu-label>
    <pl-menu-item detail="⌘C">${glyph(copy)}Copy</pl-menu-item>
    <pl-menu-item detail="⌘V" disabled>${glyph(copy)}Paste</pl-menu-item>
    <pl-menu-separator></pl-menu-separator>
    <pl-menu-item id="delete" destructive>${glyph(trash)}Delete</pl-menu-item>
    <pl-menu-separator></pl-menu-separator>
    <pl-menu-item id="find">
      ${glyph(find)}Find
      <pl-menu slot="submenu" label="Find">
        <pl-menu-item>${glyph(find)}<bdi>Find…</bdi></pl-menu-item>
        <pl-menu-item>${glyph(find)}Find Next</pl-menu-item>
        <pl-menu-item>${glyph(find)}Find Previous</pl-menu-item>
        <pl-menu-item disabled>${glyph(copy)}Use Selection</pl-menu-item>
      </pl-menu>
    </pl-menu-item>
  </pl-menu>
`;

const view = html`
  <pl-menu id="menu" label="View">
    ${pullDown("View")}
    <pl-menu-item type="checkbox" checked detail="⌘1"
      >${glyph(list)}as Icons</pl-menu-item
    >
    <pl-menu-item type="checkbox" detail="⌘2"
      >${glyph(list)}as List</pl-menu-item
    >
    <pl-menu-item type="checkbox" checked disabled
      >${glyph(list)}Show Path Bar</pl-menu-item
    >
    <pl-menu-separator></pl-menu-separator>
    <pl-menu-label>Sort By</pl-menu-label>
    <pl-menu-item type="radio" checked>Name</pl-menu-item>
    <pl-menu-item type="radio">Date Modified</pl-menu-item>
    <pl-menu-item type="radio">Size</pl-menu-item>
  </pl-menu>
`;

const menuOf = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<PlMenu>("#menu")!;

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

/** Clicks the trigger, as a person would, so the menu is measured open. */
const openMenu = async (canvasElement: HTMLElement) => {
  const el = menuOf(canvasElement);
  await el.updateComplete;
  await userEvent.click(el.querySelector("[slot=trigger]")!);
  await el.updateComplete;
  expect(el.open).toBe(true);
  await settled(canvasElement);
  return el;
};

const openSubmenu = async (canvasElement: HTMLElement) => {
  const el = await openMenu(canvasElement);
  el.querySelector<PlMenuItem>("#find")!.focus();
  const rtl = getComputedStyle(el).direction === "rtl";
  await userEvent.keyboard(rtl ? "{ArrowLeft}" : "{ArrowRight}");
  await userEvent.keyboard("{ArrowDown}");
  await settled(canvasElement);
  return el;
};

export const Playground: Story = {
  ...playground(
    {
      triggerLabel: "Edit",
      placement: ["bottom-start", "bottom-end", "top-start", "top-end"],
    },
    ["pl-select", "pl-toggle"],
  ),
  render: ({ triggerLabel, placement }) =>
    column(
      html`<pl-menu label=${triggerLabel} placement=${placement}
        >${pullDown(triggerLabel)}<pl-menu-item>Undo</pl-menu-item
        ><pl-menu-item>Redo</pl-menu-item></pl-menu
      >`,
    ),
};

// Stories that other tests open as they are have no play function.
export const Default: Story = { render: () => column(edit) };

export const Open: Story = {
  render: () => column(edit),
  play: async ({ canvasElement }) => {
    await openMenu(canvasElement);
  },
};

export const Checked: Story = {
  render: () => column(view),
  play: async ({ canvasElement }) => {
    await openMenu(canvasElement);
  },
};

/** The submenu opens beside its row, with its second item highlighted. */
export const Submenu: Story = {
  render: () => column(edit),
  play: async ({ canvasElement }) => {
    await openSubmenu(canvasElement);
  },
};

export const Destructive: Story = {
  render: () => column(edit),
  play: async ({ canvasElement }) => {
    const el = await openMenu(canvasElement);
    el.querySelector<PlMenuItem>("#delete")!.focus();
  },
};

export const Disabled: Story = {
  render: () =>
    column(html`
      <pl-menu id="menu" label="Actions">
        ${pullDown("Actions")}
        <pl-menu-item disabled>Cut</pl-menu-item>
        <pl-menu-item>Copy</pl-menu-item>
        <pl-menu-item disabled destructive>Delete</pl-menu-item>
      </pl-menu>
    `),
  play: async ({ canvasElement }) => {
    await openMenu(canvasElement);
  },
};

/** A menu without a trigger, placed at the pointer. */
export const ContextMenu: Story = {
  render: () =>
    column(html`
      <div
        id="area"
        tabindex="0"
        aria-label="File area with a context menu"
        style="box-sizing:border-box;color:var(--pl-color-foreground);font:var(--pl-text-sm) var(--pl-font-sans);inline-size:calc(var(--pl-spacing) * 90);block-size:calc(var(--pl-spacing) * 57.5);padding:var(--pl-space-3);border:1px dashed var(--pl-color-muted-foreground);border-radius:var(--pl-radius-control)"
        @contextmenu=${(event: MouseEvent) => {
          event.preventDefault();
          menuOf(document.body).showAt(event.clientX, event.clientY);
        }}
      >
        Right-click here
      </div>
      <pl-menu id="menu" label="File actions">
        <pl-menu-item>Open</pl-menu-item>
        <pl-menu-item>Get Info</pl-menu-item>
        <pl-menu-item>Rename</pl-menu-item>
        <pl-menu-item disabled>Compress</pl-menu-item>
        <pl-menu-separator></pl-menu-separator>
        <pl-menu-item>Duplicate</pl-menu-item>
        <pl-menu-item destructive>Move to Trash</pl-menu-item>
      </pl-menu>
    `),
  play: async ({ canvasElement }) => {
    const el = menuOf(canvasElement);
    await el.updateComplete;
    const area = canvasElement.querySelector("#area")!.getBoundingClientRect();
    el.showAt(area.left + area.width / 2, area.top + area.height / 4);
    await el.updateComplete;
    expect(el.open).toBe(true);
  },
};

export const Rtl: Story = {
  render: () => column(edit),
  globals: { dir: "rtl" },
  play: async ({ canvasElement }) => {
    await openSubmenu(canvasElement);
  },
};

export const Glass: Story = {
  render: () => column(edit),
  globals: { material: "glass", theme: "dark", contrast: "more" },
  play: async ({ canvasElement }) => {
    await openSubmenu(canvasElement);
  },
};

const account = html`
  <pl-menu id="menu" label="Account">
    ${pullDown("Account")}
    <div
      slot="header"
      id="header"
      style="display:grid;gap:var(--pl-space-1);padding-block:var(--pl-space-1)"
    >
      <strong>Alex Doe</strong>
      <span style="color:var(--pl-color-muted-foreground)"
        >alex@example.com</span
      >
    </div>
    <pl-menu-separator></pl-menu-separator>
    <pl-menu-item href="#profile">Profile</pl-menu-item>
    <pl-menu-item href="#billing" description="Plans and invoices"
      >Billing</pl-menu-item
    >
    <pl-menu-item href="https://example.com/help" target="_blank" rel="noopener"
      >Help</pl-menu-item
    >
    <pl-menu-item href="#archive" disabled>Archive</pl-menu-item>
    <pl-menu-separator></pl-menu-separator>
    <pl-menu-item destructive>Sign Out</pl-menu-item>
  </pl-menu>
`;

/** Items with `href` are real links: open in a new tab, copy link and middle-click work. */
export const Links: Story = {
  render: () => column(account),
  play: async ({ canvasElement }) => {
    await openMenu(canvasElement);
  },
};

/** The `description` slot or attribute adds a second, muted line. */
export const Description: Story = {
  render: () =>
    column(html`
      <pl-menu id="menu" label="Sharing">
        ${pullDown("Sharing")}
        <pl-menu-item description="Anyone with the link can view"
          >Public</pl-menu-item
        >
        <pl-menu-item>
          Team
          <span slot="description">Only people in your team</span>
        </pl-menu-item>
        <pl-menu-item detail="⌘P" description="Only you">Private</pl-menu-item>
      </pl-menu>
    `),
  play: async ({ canvasElement }) => {
    const el = await openMenu(canvasElement);
    el.querySelectorAll<PlMenuItem>("pl-menu-item")[1]!.focus();
  },
};

/** The `header` slot holds non-interactive content above the items. */
export const Header: Story = {
  render: () => column(account),
  play: async ({ canvasElement }) => {
    await openMenu(canvasElement);
  },
};

const placed = (placement: string) => html`
  <pl-menu id="menu" label="Edit" placement=${placement}>
    ${pullDown("Edit")}
    <pl-menu-item>Undo</pl-menu-item>
    <pl-menu-item>Redo</pl-menu-item>
    <pl-menu-item>Copy</pl-menu-item>
  </pl-menu>
`;

/** `placement` picks the side and edge the menu opens from, like `pl-popover`. */
export const PlacementEnd: Story = {
  render: () =>
    html`<div
      style="display:grid;place-items:center;min-block-size:calc(var(--pl-spacing) * 90)"
    >
      ${placed("end")}
    </div>`,
  play: async ({ canvasElement }) => {
    await openMenu(canvasElement);
  },
};

const centred = (placement: string) =>
  html`<div
    style="display:grid;place-items:center;min-block-size:calc(var(--pl-spacing) * 90)"
  >
    ${placed(placement)}
  </div>`;

/** `end-start` opens beside the trigger with the menu's top level with the trigger's. */
export const PlacementEndStart: Story = {
  render: () => centred("end-start"),
};

/** `end-end` opens beside the trigger with the menu's bottom level with the trigger's. `start-start` and `start-end` do the same on the other side. */
export const PlacementEndEnd: Story = {
  render: () => centred("end-end"),
};

/** A menu opened from code with `show()` focuses its first item. */
export const FromCode: Story = {
  render: () => column(edit),
  play: async ({ canvasElement }) => {
    const el = menuOf(canvasElement);
    await el.updateComplete;
    el.show();
    await el.updateComplete;
    expect(el.open).toBe(true);
    await settled(canvasElement);
  },
};
