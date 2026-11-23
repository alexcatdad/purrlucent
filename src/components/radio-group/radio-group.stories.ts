import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { expect, userEvent } from "storybook/test";
import "./radio-group.ts";
import type { PlRadioGroup } from "./radio-group.ts";

const meta = {
  title: "Components/Radio group",
  component: "pl-radio-group",
} satisfies Meta;

export default meta;

type Story = StoryObj;

const pad = "padding:var(--pl-space-4)";

const render = () => html`
  <pl-radio-group id="control" label="Open folders in" style=${pad}>
    <pl-radio value="tabs">Tabs</pl-radio>
    <pl-radio value="windows">New windows</pl-radio>
    <pl-radio value="split">Split view</pl-radio>
  </pl-radio-group>
`;

const control = async (canvasElement: HTMLElement) => {
  const el = canvasElement.querySelector<PlRadioGroup>("#control")!;
  await el.updateComplete;
  return el;
};

// Stories that other tests open as they are have no play function: a play
// function would change the selection before the test starts.
export const Default: Story = { render };

/** A radio marked `checked` is the starting choice. */
export const Preselected: Story = {
  render: () => html`
    <pl-radio-group id="control" label="Open folders in" style=${pad}>
      <pl-radio value="tabs" checked>Tabs</pl-radio>
      <pl-radio value="windows">New windows</pl-radio>
      <pl-radio value="split" disabled>Split view</pl-radio>
    </pl-radio-group>
  `,
};

export const Horizontal: Story = {
  render: () => html`
    <pl-radio-group
      id="control"
      label="Open folders in"
      orientation="horizontal"
      style=${pad}
    >
      <pl-radio value="tabs" checked>Tabs</pl-radio>
      <pl-radio value="windows">New windows</pl-radio>
      <pl-radio value="split">Split view</pl-radio>
    </pl-radio-group>
  `,
};

export const Sizes: Story = {
  render: () => html`
    <div style="display:flex;gap:var(--pl-space-8);${pad}">
      ${(["md", "lg", "xl"] as const).map(
        (size) => html`
          <pl-radio-group label="Size ${size}">
            <pl-radio size=${size} value="a">${size} off</pl-radio>
            <pl-radio size=${size} value="b" checked>${size} on</pl-radio>
            <pl-radio size=${size} value="c" disabled
              >${size} disabled</pl-radio
            >
          </pl-radio-group>
        `,
      )}
    </div>
  `,
};

/** A disabled group keeps its choice visible and gives no feedback. */
export const Disabled: Story = {
  render: () => html`
    <pl-radio-group id="control" label="Open folders in" disabled style=${pad}>
      <pl-radio value="tabs" checked>Tabs</pl-radio>
      <pl-radio value="windows">New windows</pl-radio>
    </pl-radio-group>
  `,
};

/** The group submits name=value, resets to the checked radio and follows a fieldset. */
export const InForm: Story = {
  render: () => html`
    <form id="form" style=${pad}>
      <fieldset id="fieldset" style="border:0;padding:0;margin:0">
        <pl-radio-group
          id="control"
          name="open"
          label="Open folders in"
          required
        >
          <pl-radio value="tabs">Tabs</pl-radio>
          <pl-radio value="windows" checked>New windows</pl-radio>
        </pl-radio-group>
        <pl-radio-group id="other" name="size" label="Size" required>
          <pl-radio value="s">Small</pl-radio>
          <pl-radio value="l">Large</pl-radio>
        </pl-radio-group>
      </fieldset>
    </form>
  `,
};

export const Rtl: Story = { render, globals: { dir: "rtl" } };

export const Glass: Story = {
  render: () => html`
    <pl-radio-group label="Open folders in" style=${pad}>
      <pl-radio value="tabs" checked>Tabs</pl-radio>
      <pl-radio value="windows">New windows</pl-radio>
      <pl-radio value="split" disabled>Split view</pl-radio>
    </pl-radio-group>
  `,
  globals: { material: "glass", theme: "dark", contrast: "more" },
};

/** Tab enters on the first radio; the arrows move and choose, and wrap. */
export const Keyboard: Story = {
  render,
  play: async ({ canvasElement }) => {
    const el = await control(canvasElement);
    expect(el.value).toBe("");
    await userEvent.tab();
    expect(el.querySelector("[value=tabs]")).toHaveFocus();
    await userEvent.keyboard("{ArrowDown}");
    await el.updateComplete;
    expect(el.value).toBe("windows");
    await userEvent.keyboard("{ArrowLeft}{ArrowLeft}");
    await el.updateComplete;
    expect(el.value).toBe("split");
  },
};

/** Under right-to-left, the arrow keys follow the visual direction. */
export const KeyboardRtl: Story = {
  render,
  globals: { dir: "rtl" },
  play: async ({ canvasElement }) => {
    const el = await control(canvasElement);
    await userEvent.tab();
    await userEvent.keyboard("{ArrowLeft}");
    await el.updateComplete;
    expect(el.value).toBe("windows");
  },
};
