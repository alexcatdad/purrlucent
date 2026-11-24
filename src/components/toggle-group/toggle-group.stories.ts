import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { expect, userEvent } from "storybook/test";
import "./toggle-group.ts";
import type { PlToggleGroup } from "./toggle-group.ts";

const meta = { title: "Actions/Toggle Group" } satisfies Meta;

export default meta;

type Story = StoryObj;

const render = () => html`
  <pl-toggle-group id="control" label="Calendar range">
    <pl-toggle-group-item value="day">Day</pl-toggle-group-item>
    <pl-toggle-group-item value="week">Week</pl-toggle-group-item>
    <pl-toggle-group-item value="month">Month</pl-toggle-group-item>
  </pl-toggle-group>
`;

const control = async (canvasElement: HTMLElement) => {
  const el = canvasElement.querySelector<PlToggleGroup>("#control")!;
  await el.updateComplete;
  return el;
};

// Stories that other tests open as they are have no play function: a play
// function would change the selection before the test starts.
export const Default: Story = { render };

/** `fit-content`: items as wide as their text; on a narrow screen the group scrolls sideways. */
export const FitContent: Story = {
  render: () => html`
    <div style="max-inline-size: 20rem; padding: var(--pl-space-4)">
      <pl-toggle-group id="control" label="Source" fit-content>
        <pl-toggle-group-item value="all">All 4.1k</pl-toggle-group-item>
        <pl-toggle-group-item value="tapas">Tapas 1.2k</pl-toggle-group-item>
        <pl-toggle-group-item value="webtoon">Webtoon 980</pl-toggle-group-item>
        <pl-toggle-group-item value="tappytoon"
          >Tappytoon 640</pl-toggle-group-item
        >
        <pl-toggle-group-item value="toomics">Toomics 410</pl-toggle-group-item>
        <pl-toggle-group-item value="other">Other 12</pl-toggle-group-item>
      </pl-toggle-group>
    </div>
  `,
};

/** A segment marked `selected` is the starting selection. */
export const Preselected: Story = {
  render: () => html`
    <pl-toggle-group id="control" label="Calendar range">
      <pl-toggle-group-item value="day">Day</pl-toggle-group-item>
      <pl-toggle-group-item value="week">Week</pl-toggle-group-item>
      <pl-toggle-group-item value="month" selected>Month</pl-toggle-group-item>
    </pl-toggle-group>
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
    <pl-toggle-group id="control" label="Calendar range" disabled>
      <pl-toggle-group-item value="day">Day</pl-toggle-group-item>
      <pl-toggle-group-item value="week" selected>Week</pl-toggle-group-item>
      <pl-toggle-group-item value="month">Month</pl-toggle-group-item>
    </pl-toggle-group>
  `,
};

/** One segment is unavailable: it takes no focus and cannot be selected. */
export const DisabledItem: Story = {
  render: () => html`
    <pl-toggle-group id="control" label="Calendar range">
      <pl-toggle-group-item value="day">Day</pl-toggle-group-item>
      <pl-toggle-group-item value="week" disabled>Week</pl-toggle-group-item>
      <pl-toggle-group-item value="month">Month</pl-toggle-group-item>
    </pl-toggle-group>
  `,
};

/** In a form the group submits its value and follows reset and fieldset. */
export const InForm: Story = {
  render: () => html`
    <form id="form" style="padding:var(--pl-space-4)">
      <fieldset id="fieldset" style="border:0;padding:0;margin:0">
        <pl-toggle-group id="control" name="range" label="Calendar range">
          <pl-toggle-group-item value="day">Day</pl-toggle-group-item>
          <pl-toggle-group-item value="week" selected
            >Week</pl-toggle-group-item
          >
          <pl-toggle-group-item value="month">Month</pl-toggle-group-item>
        </pl-toggle-group>
      </fieldset>
    </form>
  `,
};

const icon = (path: string) =>
  html`<svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    aria-hidden="true"
  >
    <path d=${path} />
  </svg>`;

/** Icon-only segments: each item has an `aria-label`, and the svg is hidden. */
export const Icons: Story = {
  render: () => html`
    <pl-toggle-group id="control" label="Text alignment">
      <pl-toggle-group-item value="left" aria-label="Align left"
        >${icon("M4 6h16M4 12h10M4 18h14")}</pl-toggle-group-item
      >
      <pl-toggle-group-item value="center" aria-label="Align center"
        >${icon("M4 6h16M7 12h10M5 18h14")}</pl-toggle-group-item
      >
      <pl-toggle-group-item value="right" aria-label="Align right"
        >${icon("M4 6h16M10 12h10M6 18h14")}</pl-toggle-group-item
      >
    </pl-toggle-group>
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

/** A listener that calls preventDefault on pl-change keeps the selection and fires no input or change. */
export const Cancelable: Story = {
  render,
  play: async ({ canvasElement }) => {
    const el = await control(canvasElement);
    const native: string[] = [];
    el.addEventListener("pl-change", (event) => event.preventDefault());
    el.addEventListener("input", () => native.push("input"));
    el.addEventListener("change", () => native.push("change"));
    await userEvent.click(el.querySelector("[value=week]")!);
    await el.updateComplete;
    expect(el.value).toBe("day");
    expect(native).toEqual([]);
  },
};
