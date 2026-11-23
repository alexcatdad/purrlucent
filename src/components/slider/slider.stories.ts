import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { expect, userEvent } from "storybook/test";
import "./slider.ts";
import type { PlSlider } from "./slider.ts";

const meta = {
  title: "Forms/Slider",
  component: "pl-slider",
} satisfies Meta;

export default meta;

type Story = StoryObj;

const column = (content: unknown) =>
  html`<div
    style="display:grid;justify-items:start;gap:var(--pl-space-3);padding:var(--pl-space-4)"
  >
    ${content}
  </div>`;

// Stories that other tests open as they are have no play function.
export const Default: Story = {
  render: () =>
    html`<pl-slider id="slider" label="Volume" value="50"></pl-slider>`,
};

export const Sizes: Story = {
  render: () =>
    column(
      (["md", "lg", "xl"] as const).map(
        (size) =>
          html`<pl-slider
            size=${size}
            label="Size ${size}"
            value="50"
          ></pl-slider>`,
      ),
    ),
};

export const Values: Story = {
  render: () =>
    column(
      [0, 25, 75, 100].map(
        (value) =>
          html`<pl-slider label="Value ${value}" value=${value}></pl-slider>`,
      ),
    ),
};

export const Continuous: Story = {
  render: () =>
    html`<pl-slider
      label="Continuous"
      min="0"
      max="10"
      step="any"
      value="5"
    ></pl-slider>`,
};

export const Ticks: Story = {
  render: () =>
    column(
      (["md", "lg", "xl"] as const).map(
        (size) =>
          html`<pl-slider
            size=${size}
            label="Ticked ${size}"
            ticks="5"
            step="25"
            value="50"
          ></pl-slider>`,
      ),
    ),
};

export const States: Story = {
  render: () =>
    column([
      html`<pl-slider label="Idle" value="50"></pl-slider>`,
      html`<pl-slider label="Disabled" value="50" disabled></pl-slider>`,
      html`<pl-slider
        label="Ticked, disabled"
        ticks="5"
        step="25"
        value="50"
        disabled
      ></pl-slider>`,
    ]),
};

/** In a form the slider submits its value and follows reset and fieldset. */
export const InForm: Story = {
  render: () => html`
    <form id="form" style="padding:var(--pl-space-4)">
      <fieldset
        id="fieldset"
        style="display:grid;justify-items:start;gap:var(--pl-space-3);border:0;padding:0;margin:0"
      >
        <pl-slider
          id="volume"
          name="volume"
          label="Volume"
          value="30"
        ></pl-slider>
        <pl-slider id="bass" name="bass" label="Bass"></pl-slider>
      </fieldset>
    </form>
  `,
};

/** Keys move the value and fire pl-input and pl-change. */
export const Keyboard: Story = {
  render: () =>
    html`<pl-slider id="slider" label="Volume" value="50"></pl-slider>`,
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector<PlSlider>("#slider")!;
    const values: number[] = [];
    el.addEventListener("pl-change", (event) =>
      values.push((event as CustomEvent<{ value: number }>).detail.value),
    );
    await el.updateComplete;
    expect(el.getAttribute("role")).toBe("slider");
    el.focus();
    await userEvent.keyboard("{ArrowRight}{ArrowRight}{PageDown}{End}");
    expect(values).toEqual([51, 52, 42, 100]);
    await el.updateComplete;
    expect(el.getAttribute("aria-valuenow")).toBe("100");
  },
};

export const Rtl: Story = {
  render: () =>
    html`<pl-slider label="Volume" ticks="5" step="25" value="25"></pl-slider>`,
  globals: { dir: "rtl" },
};

export const Glass: Story = {
  render: () =>
    column([
      html`<pl-slider label="Volume" value="50"></pl-slider>`,
      html`<pl-slider
        label="Ticked"
        ticks="5"
        step="25"
        value="50"
      ></pl-slider>`,
    ]),
  globals: { material: "glass", theme: "dark", contrast: "more" },
};
