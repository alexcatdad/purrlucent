import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { expect, userEvent } from "storybook/test";
import "./resizable.ts";
import type { PlResizable } from "./resizable.ts";

const meta = {
  title: "Components/Resizable",
  component: "pl-resizable",
} satisfies Meta;

export default meta;

type Story = StoryObj;

// A group needs a definite size along its axis.
const frame = (content: unknown) =>
  html`<div
    style="box-sizing:border-box;padding:var(--pl-space-4);inline-size:min(100%,calc(var(--pl-spacing) * 150))"
  >
    ${content}
  </div>`;

const groupStyle = "block-size:calc(var(--pl-spacing) * 40)";

const pane = (text: string) =>
  html`<div style="padding:var(--pl-pad-panel);overflow-wrap:anywhere">
    ${text}
  </div>`;

// Stories that other tests open as they are have no play function.
export const Default: Story = {
  render: () =>
    frame(
      html`<pl-resizable id="group" style=${groupStyle}>
        <pl-resizable-panel size="30" min="15"
          >${pane("Library")}</pl-resizable-panel
        >
        <pl-resizable-handle label="Resize library"></pl-resizable-handle>
        <pl-resizable-panel min="15">${pane("Document")}</pl-resizable-panel>
      </pl-resizable>`,
    ),
};

export const Vertical: Story = {
  render: () =>
    frame(
      html`<pl-resizable id="group" orientation="vertical" style=${groupStyle}>
        <pl-resizable-panel size="40" min="15"
          >${pane("Editor")}</pl-resizable-panel
        >
        <pl-resizable-handle label="Resize editor"></pl-resizable-handle>
        <pl-resizable-panel min="15">${pane("Console")}</pl-resizable-panel>
      </pl-resizable>`,
    ),
};

export const ThreePanels: Story = {
  render: () =>
    frame(
      html`<pl-resizable id="group" style=${groupStyle}>
        <pl-resizable-panel size="25" min="15"
          >${pane("Folders")}</pl-resizable-panel
        >
        <pl-resizable-handle label="Resize folders"></pl-resizable-handle>
        <pl-resizable-panel min="20">${pane("Messages")}</pl-resizable-panel>
        <pl-resizable-handle label="Resize messages"></pl-resizable-handle>
        <pl-resizable-panel size="30" min="15"
          >${pane("Message")}</pl-resizable-panel
        >
      </pl-resizable>`,
    ),
};

/** Each panel keeps to its own minimum and maximum. */
export const Limits: Story = {
  render: () =>
    frame(
      html`<pl-resizable id="group" style=${groupStyle}>
        <pl-resizable-panel size="30" min="20" max="60"
          >${pane("20 to 60")}</pl-resizable-panel
        >
        <pl-resizable-handle label="Resize panel"></pl-resizable-handle>
        <pl-resizable-panel min="20">${pane("At least 20")}</pl-resizable-panel>
      </pl-resizable>`,
    ),
};

/** Enter on the divider collapses the library; Enter again restores it. */
export const Collapsible: Story = {
  render: () =>
    frame(
      html`<pl-resizable id="group" style=${groupStyle}>
        <pl-resizable-panel id="library" size="25" min="15" collapsible
          >${pane("Library")}</pl-resizable-panel
        >
        <pl-resizable-handle label="Resize library"></pl-resizable-handle>
        <pl-resizable-panel min="15">${pane("Document")}</pl-resizable-panel>
      </pl-resizable>`,
    ),
};

export const Disabled: Story = {
  render: () =>
    frame(
      html`<pl-resizable id="group" style=${groupStyle}>
        <pl-resizable-panel size="30">${pane("Fixed")}</pl-resizable-panel>
        <pl-resizable-handle
          label="Resize fixed"
          disabled
        ></pl-resizable-handle>
        <pl-resizable-panel>${pane("Rest")}</pl-resizable-panel>
      </pl-resizable>`,
    ),
};

/** Arrow keys move the divider by one percent; Home and End go to its limits. */
export const Keyboard: Story = {
  render: () =>
    frame(
      html`<pl-resizable id="group" style=${groupStyle}>
        <pl-resizable-panel size="30" min="15"
          >${pane("Library")}</pl-resizable-panel
        >
        <pl-resizable-handle
          id="handle"
          label="Resize library"
        ></pl-resizable-handle>
        <pl-resizable-panel min="15">${pane("Document")}</pl-resizable-panel>
      </pl-resizable>`,
    ),
  play: async ({ canvasElement }) => {
    const group = canvasElement.querySelector<PlResizable>("#group")!;
    const handle = canvasElement.querySelector<HTMLElement>("#handle")!;
    await group.updateComplete;
    expect(handle.getAttribute("role")).toBe("separator");
    handle.focus();
    await userEvent.keyboard("{ArrowRight}{ArrowRight}{ArrowLeft}");
    expect(group.sizes).toEqual([31, 69]);
    await userEvent.keyboard("{End}");
    expect(group.sizes).toEqual([85, 15]);
    await userEvent.keyboard("{Home}");
    expect(group.sizes).toEqual([15, 85]);
  },
};

export const Rtl: Story = {
  render: () =>
    frame(
      html`<pl-resizable id="group" style=${groupStyle}>
        <pl-resizable-panel size="30" min="15"
          >${pane("Library")}</pl-resizable-panel
        >
        <pl-resizable-handle label="Resize library"></pl-resizable-handle>
        <pl-resizable-panel min="15">${pane("Document")}</pl-resizable-panel>
      </pl-resizable>`,
    ),
  globals: { dir: "rtl" },
};

export const Glass: Story = {
  render: () =>
    frame(
      html`<pl-resizable id="group" style=${groupStyle}>
        <pl-resizable-panel size="30" min="15"
          >${pane("Library")}</pl-resizable-panel
        >
        <pl-resizable-handle label="Resize library"></pl-resizable-handle>
        <pl-resizable-panel min="15">${pane("Document")}</pl-resizable-panel>
      </pl-resizable>`,
    ),
  globals: { material: "glass", theme: "dark", contrast: "more" },
};
