import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { expect, userEvent } from "storybook/test";
import "./radio-group.ts";
import type { PurrRadioGroup } from "./radio-group.ts";

const meta = {
  title: "Components/Radio group",
  component: "purr-radio-group",
} satisfies Meta;

export default meta;

type Story = StoryObj;

const pad = "padding:var(--purr-space-4)";

const render = () => html`
  <purr-radio-group id="control" label="Open folders in" style=${pad}>
    <purr-radio value="tabs">Tabs</purr-radio>
    <purr-radio value="windows">New windows</purr-radio>
    <purr-radio value="split">Split view</purr-radio>
  </purr-radio-group>
`;

const control = async (canvasElement: HTMLElement) => {
  const el = canvasElement.querySelector<PurrRadioGroup>("#control")!;
  await el.updateComplete;
  return el;
};

// Stories that other tests open as they are have no play function: a play
// function would change the selection before the test starts.
export const Default: Story = { render };

/** A radio marked `checked` is the starting choice. */
export const Preselected: Story = {
  render: () => html`
    <purr-radio-group id="control" label="Open folders in" style=${pad}>
      <purr-radio value="tabs" checked>Tabs</purr-radio>
      <purr-radio value="windows">New windows</purr-radio>
      <purr-radio value="split" disabled>Split view</purr-radio>
    </purr-radio-group>
  `,
};

export const Horizontal: Story = {
  render: () => html`
    <purr-radio-group
      id="control"
      label="Open folders in"
      orientation="horizontal"
      style=${pad}
    >
      <purr-radio value="tabs" checked>Tabs</purr-radio>
      <purr-radio value="windows">New windows</purr-radio>
      <purr-radio value="split">Split view</purr-radio>
    </purr-radio-group>
  `,
};

export const Sizes: Story = {
  render: () => html`
    <div style="display:flex;gap:var(--purr-space-8);${pad}">
      ${(["md", "lg", "xl"] as const).map(
        (size) => html`
          <purr-radio-group label="Size ${size}">
            <purr-radio size=${size} value="a">${size} off</purr-radio>
            <purr-radio size=${size} value="b" checked>${size} on</purr-radio>
            <purr-radio size=${size} value="c" disabled
              >${size} disabled</purr-radio
            >
          </purr-radio-group>
        `,
      )}
    </div>
  `,
};

/** A disabled group keeps its choice visible and gives no feedback. */
export const Disabled: Story = {
  render: () => html`
    <purr-radio-group
      id="control"
      label="Open folders in"
      disabled
      style=${pad}
    >
      <purr-radio value="tabs" checked>Tabs</purr-radio>
      <purr-radio value="windows">New windows</purr-radio>
    </purr-radio-group>
  `,
};

/** The group submits name=value, resets to the checked radio and follows a fieldset. */
export const InForm: Story = {
  render: () => html`
    <form id="form" style=${pad}>
      <fieldset id="fieldset" style="border:0;padding:0;margin:0">
        <purr-radio-group
          id="control"
          name="open"
          label="Open folders in"
          required
        >
          <purr-radio value="tabs">Tabs</purr-radio>
          <purr-radio value="windows" checked>New windows</purr-radio>
        </purr-radio-group>
        <purr-radio-group id="other" name="size" label="Size" required>
          <purr-radio value="s">Small</purr-radio>
          <purr-radio value="l">Large</purr-radio>
        </purr-radio-group>
      </fieldset>
    </form>
  `,
};

export const Rtl: Story = { render, globals: { dir: "rtl" } };

export const Glass: Story = {
  render: () => html`
    <purr-radio-group label="Open folders in" style=${pad}>
      <purr-radio value="tabs" checked>Tabs</purr-radio>
      <purr-radio value="windows">New windows</purr-radio>
      <purr-radio value="split" disabled>Split view</purr-radio>
    </purr-radio-group>
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
