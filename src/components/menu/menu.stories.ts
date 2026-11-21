import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { expect, userEvent } from "storybook/test";
import "../button/button.ts";
import "./menu.ts";
import type { PurrMenu, PurrMenuItem } from "./menu.ts";

const meta = {
  title: "Components/Menu",
  component: "purr-menu",
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
  html`<purr-button slot="trigger"
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
  ></purr-button>`;

const column = (content: unknown) =>
  html`<div
    style="display:grid;justify-items:start;gap:var(--purr-space-3);padding:var(--purr-space-4);min-block-size:calc(var(--purr-spacing) * 90)"
  >
    ${content}
  </div>`;

const edit = html`
  <purr-menu id="menu" label="Edit">
    ${pullDown("Edit")}
    <purr-menu-item detail="⌘Z">${glyph(undo)}Undo</purr-menu-item>
    <purr-menu-item detail="⇧⌘Z">${glyph(redo)}Redo</purr-menu-item>
    <purr-menu-separator></purr-menu-separator>
    <purr-menu-label>Clipboard</purr-menu-label>
    <purr-menu-item detail="⌘C">${glyph(copy)}Copy</purr-menu-item>
    <purr-menu-item detail="⌘V" disabled>${glyph(copy)}Paste</purr-menu-item>
    <purr-menu-separator></purr-menu-separator>
    <purr-menu-item id="delete" destructive
      >${glyph(trash)}Delete</purr-menu-item
    >
    <purr-menu-separator></purr-menu-separator>
    <purr-menu-item id="find">
      ${glyph(find)}Find
      <purr-menu slot="submenu" label="Find">
        <purr-menu-item>${glyph(find)}Find…</purr-menu-item>
        <purr-menu-item>${glyph(find)}Find Next</purr-menu-item>
        <purr-menu-item>${glyph(find)}Find Previous</purr-menu-item>
        <purr-menu-item disabled>${glyph(copy)}Use Selection</purr-menu-item>
      </purr-menu>
    </purr-menu-item>
  </purr-menu>
`;

const view = html`
  <purr-menu id="menu" label="View">
    ${pullDown("View")}
    <purr-menu-item type="checkbox" checked detail="⌘1"
      >${glyph(list)}as Icons</purr-menu-item
    >
    <purr-menu-item type="checkbox" detail="⌘2"
      >${glyph(list)}as List</purr-menu-item
    >
    <purr-menu-item type="checkbox" checked disabled
      >${glyph(list)}Show Path Bar</purr-menu-item
    >
    <purr-menu-separator></purr-menu-separator>
    <purr-menu-label>Sort By</purr-menu-label>
    <purr-menu-item type="radio" checked>Name</purr-menu-item>
    <purr-menu-item type="radio">Date Modified</purr-menu-item>
    <purr-menu-item type="radio">Size</purr-menu-item>
  </purr-menu>
`;

const menuOf = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<PurrMenu>("#menu")!;

/** Clicks the trigger, as a person would, so the menu is measured open. */
const openMenu = async (canvasElement: HTMLElement) => {
  const el = menuOf(canvasElement);
  await el.updateComplete;
  await userEvent.click(el.querySelector("[slot=trigger]")!);
  await el.updateComplete;
  expect(el.open).toBe(true);
  return el;
};

const openSubmenu = async (canvasElement: HTMLElement) => {
  const el = await openMenu(canvasElement);
  el.querySelector<PurrMenuItem>("#find")!.focus();
  const rtl = getComputedStyle(el).direction === "rtl";
  await userEvent.keyboard(rtl ? "{ArrowLeft}" : "{ArrowRight}");
  await userEvent.keyboard("{ArrowDown}");
  return el;
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
    el.querySelector<PurrMenuItem>("#delete")!.focus();
  },
};

export const Disabled: Story = {
  render: () =>
    column(html`
      <purr-menu id="menu" label="Actions">
        ${pullDown("Actions")}
        <purr-menu-item disabled>Cut</purr-menu-item>
        <purr-menu-item>Copy</purr-menu-item>
        <purr-menu-item disabled destructive>Delete</purr-menu-item>
      </purr-menu>
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
        style="box-sizing:border-box;color:var(--purr-color-foreground);font:var(--purr-text-sm) var(--purr-font-sans);inline-size:calc(var(--purr-spacing) * 90);block-size:calc(var(--purr-spacing) * 57.5);padding:var(--purr-space-3);border:1px dashed var(--purr-color-muted-foreground);border-radius:var(--purr-radius)"
        @contextmenu=${(event: MouseEvent) => {
          event.preventDefault();
          menuOf(document.body).showAt(event.clientX, event.clientY);
        }}
      >
        Right-click here
      </div>
      <purr-menu id="menu" label="File actions">
        <purr-menu-item>Open</purr-menu-item>
        <purr-menu-item>Get Info</purr-menu-item>
        <purr-menu-item>Rename</purr-menu-item>
        <purr-menu-item disabled>Compress</purr-menu-item>
        <purr-menu-separator></purr-menu-separator>
        <purr-menu-item>Duplicate</purr-menu-item>
        <purr-menu-item destructive>Move to Trash</purr-menu-item>
      </purr-menu>
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
