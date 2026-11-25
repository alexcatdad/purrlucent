import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { expect, userEvent } from "storybook/test";
import "../button/button.ts";
import "../dialog/dialog.ts";
import "./command.ts";
import type { PlCommand } from "./command.ts";
import type { PlDialog } from "../dialog/dialog.ts";

import { playground } from "../../../.storybook/playground.ts";

const meta = {
  title: "Menus/Command",
  component: "pl-command",
  tags: ["autodocs"],
  parameters: { controls: { disable: true } },
} satisfies Meta;

export default meta;

type Story = StoryObj;

const file = html`<svg slot="icon" viewBox="0 0 24 24" aria-hidden="true">
  <path d="M14 3v4a1 1 0 0 0 1 1h4" />
  <path
    d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z"
  />
</svg>`;

const gear = html`<svg slot="icon" viewBox="0 0 24 24" aria-hidden="true">
  <path d="M9 12a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
  <path d="M12 3v3" />
  <path d="M12 18v3" />
  <path d="M3 12h3" />
  <path d="M18 12h3" />
</svg>`;

const commands = html`
  <pl-command-group label="Files">
    <pl-command-item value="new" detail="⌘N">${file}New file</pl-command-item>
    <pl-command-item value="open" detail="⌘O">${file}Open file</pl-command-item>
    <pl-command-item value="save" detail="⌘S" disabled
      >${file}Save all</pl-command-item
    >
  </pl-command-group>
  <pl-command-group label="Settings">
    <pl-command-item value="prefs" detail="⌘,"
      >${gear}Preferences</pl-command-item
    >
    <pl-command-item value="keys">${gear}Keyboard shortcuts</pl-command-item>
    <pl-command-item value="out">${gear}Sign out</pl-command-item>
  </pl-command-group>
`;

const column = (content: unknown) =>
  html`<div
    style="padding:var(--pl-space-4);max-inline-size:calc(var(--pl-spacing) * 100)"
  >
    ${content}
  </div>`;

const palette = async (canvasElement: HTMLElement) => {
  const el = canvasElement.querySelector<PlCommand>("#command")!;
  await el.updateComplete;
  return { el, input: el.shadowRoot!.querySelector("input")! };
};

export const Playground: Story = {
  ...playground({ placeholder: "Search commands" }, ["pl-input", "pl-select"]),
  render: ({ placeholder }) =>
    column(
      html`<pl-command label="Commands" placeholder=${placeholder}
        >${commands}</pl-command
      >`,
    ),
};

// Stories that other tests open as they are have no play function.
export const Default: Story = {
  render: () =>
    column(
      html`<pl-command
        id="command"
        label="Commands"
        placeholder="Search commands"
        >${commands}</pl-command
      >`,
    ),
};

export const Ungrouped: Story = {
  render: () =>
    column(
      html`<pl-command id="command" label="Commands">
        <pl-command-item value="new" detail="⌘N">New file</pl-command-item>
        <pl-command-item value="open" detail="⌘O">Open file</pl-command-item>
        <pl-command-item value="prefs" detail="⌘,">Preferences</pl-command-item>
      </pl-command>`,
    ),
};

/** Typing narrows the list; a group with nothing left hides. */
export const Filtered: Story = {
  render: () =>
    column(
      html`<pl-command
        id="command"
        label="Commands"
        placeholder="Search commands"
        >${commands}</pl-command
      >`,
    ),
  play: async ({ canvasElement }) => {
    const { el, input } = await palette(canvasElement);
    await userEvent.type(input, "file");
    await el.updateComplete;
    expect(el.query).toBe("file");
  },
};

export const NoResults: Story = {
  render: () =>
    column(
      html`<pl-command
        id="command"
        label="Commands"
        placeholder="Search commands"
        >${commands}</pl-command
      >`,
    ),
  play: async ({ canvasElement }) => {
    const { el, input } = await palette(canvasElement);
    await userEvent.type(input, "zzz");
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector("[part=empty]")).not.toBeNull();
  },
};

/** The list is always showing and the first item is active before any key. */
export const Active: Story = {
  render: () =>
    column(
      html`<pl-command
        id="command"
        label="Commands"
        placeholder="Search commands"
        >${commands}</pl-command
      >`,
    ),
  play: async ({ canvasElement }) => {
    const { el, input } = await palette(canvasElement);
    await userEvent.click(input);
    await userEvent.keyboard("{ArrowDown}");
    await el.updateComplete;
    expect(el.querySelectorAll("[data-active]").length).toBe(1);
  },
};

const dialog = html`<div style="padding:var(--pl-space-4)">
  <pl-button
    id="trigger"
    @click=${(event: Event) =>
      (
        (event.currentTarget as HTMLElement).nextElementSibling as PlDialog
      ).show()}
    >Open command palette</pl-button
  >
  <pl-dialog id="dialog" label="Command palette">
    <pl-command id="command" autofocus placeholder="Search commands"
      >${commands}</pl-command
    >
    <pl-button slot="actions" size="lg" cancel data-close="cancel"
      >Close</pl-button
    >
  </pl-dialog>
</div>`;

/** Inside a dialog: the search field takes focus, and Escape clears the text before it closes the dialog. */
export const InDialog: Story = {
  render: () => dialog,
  play: async ({ canvasElement }) => {
    await userEvent.click(canvasElement.querySelector("#trigger")!);
    const el = canvasElement.querySelector<PlDialog>("#dialog")!;
    await el.updateComplete;
    expect(el.open).toBe(true);
  },
};

export const Rtl: Story = {
  render: () =>
    column(
      html`<pl-command
        id="command"
        label="Commands"
        placeholder="Search commands"
        >${commands}</pl-command
      >`,
    ),
  globals: { dir: "rtl" },
};

export const Glass: Story = {
  render: () => dialog,
  play: async ({ canvasElement }) => {
    await userEvent.click(canvasElement.querySelector("#trigger")!);
    await canvasElement.querySelector<PlDialog>("#dialog")!.updateComplete;
  },
  globals: { material: "glass", theme: "dark", contrast: "more" },
};
