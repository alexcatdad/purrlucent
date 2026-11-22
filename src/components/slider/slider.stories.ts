import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { expect, userEvent } from "storybook/test";
import "./slider.ts";
import type { PurrSlider } from "./slider.ts";

const meta = {
  title: "Components/Slider",
  component: "purr-slider",
} satisfies Meta;

export default meta;

type Story = StoryObj;

const column = (content: unknown) =>
  html`<div
    style="display:grid;justify-items:start;gap:var(--purr-space-3);padding:var(--purr-space-4)"
  >
    ${content}
  </div>`;

// Stories that other tests open as they are have no play function.
export const Default: Story = {
  render: () =>
    html`<purr-slider id="slider" label="Volume" value="50"></purr-slider>`,
};

export const Sizes: Story = {
  render: () =>
    column(
      (["md", "lg", "xl"] as const).map(
        (size) =>
          html`<purr-slider
            size=${size}
            label="Size ${size}"
            value="50"
          ></purr-slider>`,
      ),
    ),
};

export const Values: Story = {
  render: () =>
    column(
      [0, 25, 75, 100].map(
        (value) =>
          html`<purr-slider
            label="Value ${value}"
            value=${value}
          ></purr-slider>`,
      ),
    ),
};

export const Continuous: Story = {
  render: () =>
    html`<purr-slider
      label="Continuous"
      min="0"
      max="10"
      step="any"
      value="5"
    ></purr-slider>`,
};

export const Ticks: Story = {
  render: () =>
    column(
      (["md", "lg", "xl"] as const).map(
        (size) =>
          html`<purr-slider
            size=${size}
            label="Ticked ${size}"
            ticks="5"
            step="25"
            value="50"
          ></purr-slider>`,
      ),
    ),
};

export const States: Story = {
  render: () =>
    column([
      html`<purr-slider label="Idle" value="50"></purr-slider>`,
      html`<purr-slider label="Disabled" value="50" disabled></purr-slider>`,
      html`<purr-slider
        label="Ticked, disabled"
        ticks="5"
        step="25"
        value="50"
        disabled
      ></purr-slider>`,
    ]),
};

/** In a form the slider submits its value and follows reset and fieldset. */
export const InForm: Story = {
  render: () => html`
    <form id="form" style="padding:var(--purr-space-4)">
      <fieldset
        id="fieldset"
        style="display:grid;justify-items:start;gap:var(--purr-space-3);border:0;padding:0;margin:0"
      >
        <purr-slider
          id="volume"
          name="volume"
          label="Volume"
          value="30"
        ></purr-slider>
        <purr-slider id="bass" name="bass" label="Bass"></purr-slider>
      </fieldset>
    </form>
  `,
};

/** Keys move the value and fire purr-input and purr-change. */
export const Keyboard: Story = {
  render: () =>
    html`<purr-slider id="slider" label="Volume" value="50"></purr-slider>`,
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector<PurrSlider>("#slider")!;
    const values: number[] = [];
    el.addEventListener("purr-change", (event) =>
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
    html`<purr-slider
      label="Volume"
      ticks="5"
      step="25"
      value="25"
    ></purr-slider>`,
  globals: { dir: "rtl" },
};

export const Glass: Story = {
  render: () =>
    column([
      html`<purr-slider label="Volume" value="50"></purr-slider>`,
      html`<purr-slider
        label="Ticked"
        ticks="5"
        step="25"
        value="50"
      ></purr-slider>`,
    ]),
  globals: { material: "glass", theme: "dark", contrast: "more" },
};
