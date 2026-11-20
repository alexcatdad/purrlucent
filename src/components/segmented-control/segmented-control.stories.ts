import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { expect, userEvent, waitFor } from "storybook/test";
import "./segmented-control.ts";
import type { PurrSegmentedControl } from "./segmented-control.ts";

const meta = { title: "Components/Segmented control" } satisfies Meta;

export default meta;

type Story = StoryObj;

const render = () => html`
  <purr-segmented-control id="control" label="Calendar range">
    <purr-segment value="day">Day</purr-segment>
    <purr-segment value="week">Week</purr-segment>
    <purr-segment value="month">Month</purr-segment>
  </purr-segmented-control>
`;

const control = async (canvasElement: HTMLElement) => {
  const el = canvasElement.querySelector<PurrSegmentedControl>("#control")!;
  await el.updateComplete;
  return el;
};

// Axe ignores clip-path, so it would read the sliding label copy as covering
// every label; check the control once the pill has arrived.
const settled = (el: PurrSegmentedControl) =>
  waitFor(() =>
    expect(el.shadowRoot!.querySelector('[part="track"]')).not.toHaveClass(
      "moving",
    ),
  );

// Stories that other tests open as they are have no play function: a play
// function would change the selection before the test starts.
export const Default: Story = { render };

/** A segment marked `selected` is the starting selection. */
export const Preselected: Story = {
  render: () => html`
    <purr-segmented-control id="control" label="Calendar range">
      <purr-segment value="day">Day</purr-segment>
      <purr-segment value="week">Week</purr-segment>
      <purr-segment value="month" selected>Month</purr-segment>
    </purr-segmented-control>
  `,
};

export const Glass: Story = {
  render,
  globals: { material: "glass", theme: "dark", contrast: "more", dir: "ltr" },
};

export const Light: Story = { render, globals: { theme: "light" } };

export const Dark: Story = { render, globals: { theme: "dark" } };

export const MoreContrast: Story = { render, globals: { contrast: "more" } };

/** A disabled control keeps its selection visible and gives no feedback. */
export const Disabled: Story = {
  render: () => html`
    <purr-segmented-control id="control" label="Calendar range" disabled>
      <purr-segment value="day">Day</purr-segment>
      <purr-segment value="week" selected>Week</purr-segment>
      <purr-segment value="month">Month</purr-segment>
    </purr-segmented-control>
  `,
};

/** Under right-to-left the group mirrors. */
export const Rtl: Story = { render, globals: { dir: "rtl" } };

/** Tab enters on the selected segment, and ArrowRight selects the next. */
export const Keyboard: Story = {
  render,
  play: async ({ canvasElement }) => {
    const el = await control(canvasElement);
    expect(el.value).toBe("day");
    await userEvent.tab();
    await userEvent.keyboard("{ArrowRight}");
    await el.updateComplete;
    expect(el.value).toBe("week");
    expect(el.querySelector("[value=week]")).toHaveFocus();
    await settled(el);
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
    expect(el.value).toBe("week");
    await settled(el);
  },
};
