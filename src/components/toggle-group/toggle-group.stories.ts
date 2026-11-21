import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { expect, userEvent } from "storybook/test";
import "./toggle-group.ts";
import type { PurrToggleGroup } from "./toggle-group.ts";

const meta = { title: "Components/Toggle group" } satisfies Meta;

export default meta;

type Story = StoryObj;

const render = () => html`
  <purr-toggle-group id="control" label="Calendar range">
    <purr-toggle-group-item value="day">Day</purr-toggle-group-item>
    <purr-toggle-group-item value="week">Week</purr-toggle-group-item>
    <purr-toggle-group-item value="month">Month</purr-toggle-group-item>
  </purr-toggle-group>
`;

const control = async (canvasElement: HTMLElement) => {
  const el = canvasElement.querySelector<PurrToggleGroup>("#control")!;
  await el.updateComplete;
  return el;
};

// Stories that other tests open as they are have no play function: a play
// function would change the selection before the test starts.
export const Default: Story = { render };

/** A segment marked `selected` is the starting selection. */
export const Preselected: Story = {
  render: () => html`
    <purr-toggle-group id="control" label="Calendar range">
      <purr-toggle-group-item value="day">Day</purr-toggle-group-item>
      <purr-toggle-group-item value="week">Week</purr-toggle-group-item>
      <purr-toggle-group-item value="month" selected
        >Month</purr-toggle-group-item
      >
    </purr-toggle-group>
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
    <purr-toggle-group id="control" label="Calendar range" disabled>
      <purr-toggle-group-item value="day">Day</purr-toggle-group-item>
      <purr-toggle-group-item value="week" selected
        >Week</purr-toggle-group-item
      >
      <purr-toggle-group-item value="month">Month</purr-toggle-group-item>
    </purr-toggle-group>
  `,
};

/** In a form the group submits its value and follows reset and fieldset. */
export const InForm: Story = {
  render: () => html`
    <form id="form" style="padding:var(--purr-space-4)">
      <fieldset id="fieldset" style="border:0;padding:0;margin:0">
        <purr-toggle-group id="control" name="range" label="Calendar range">
          <purr-toggle-group-item value="day">Day</purr-toggle-group-item>
          <purr-toggle-group-item value="week" selected
            >Week</purr-toggle-group-item
          >
          <purr-toggle-group-item value="month">Month</purr-toggle-group-item>
        </purr-toggle-group>
      </fieldset>
    </form>
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
  },
};
