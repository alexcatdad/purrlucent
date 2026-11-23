import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import { expect, userEvent } from "storybook/test";
import "../field/field.ts";
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

type Attrs = {
  id?: string;
  label: string;
  value?: number;
  size?: string;
  min?: number;
  max?: number;
  step?: string;
  ticks?: number;
  disabled?: boolean;
};

/** Writes the slider's value into the field's description, as it changes. */
const showValue = (event: Event) => {
  const slider = event.target as PlSlider;
  const text = slider.closest("pl-field")?.querySelector("[slot=description]");
  if (text) text.textContent = String(slider.value);
};

/** A slider with a visible label and its value, so what it controls and where it stands can be read. */
const slider = (a: Attrs) =>
  html`<pl-field>
    <label slot="label">${a.label}</label>
    <pl-slider
      id=${ifDefined(a.id)}
      label=${a.label}
      value=${ifDefined(a.value)}
      size=${ifDefined(a.size)}
      min=${ifDefined(a.min)}
      max=${ifDefined(a.max)}
      step=${ifDefined(a.step)}
      ticks=${ifDefined(a.ticks)}
      ?disabled=${a.disabled}
      @pl-input=${showValue}
    ></pl-slider>
    <span slot="description">${a.value ?? 0}</span>
  </pl-field>`;

// Stories that other tests open as they are have no play function.
export const Default: Story = {
  render: () => column(slider({ id: "slider", label: "Volume", value: 50 })),
};

export const Sizes: Story = {
  render: () =>
    column(
      (["md", "lg", "xl"] as const).map((size) =>
        slider({ size, label: `Size ${size}`, value: 50 }),
      ),
    ),
};

export const Values: Story = {
  render: () =>
    column(
      [0, 25, 75, 100].map((value) =>
        slider({ label: `Value ${value}`, value }),
      ),
    ),
};

export const Continuous: Story = {
  render: () =>
    column(
      slider({
        label: "Continuous",
        min: 0,
        max: 10,
        step: "any",
        value: 5,
      }),
    ),
};

export const Ticks: Story = {
  render: () =>
    column(
      (["md", "lg", "xl"] as const).map((size) =>
        slider({
          size,
          label: `Ticked ${size}`,
          ticks: 5,
          step: "25",
          value: 50,
        }),
      ),
    ),
};

export const States: Story = {
  render: () =>
    column([
      slider({ label: "Idle", value: 50 }),
      slider({ label: "Disabled", value: 50, disabled: true }),
      slider({
        label: "Ticked, disabled",
        ticks: 5,
        step: "25",
        value: 50,
        disabled: true,
      }),
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
  render: () => column(slider({ id: "slider", label: "Volume", value: 50 })),
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
    column(slider({ label: "Volume", ticks: 5, step: "25", value: 25 })),
  globals: { dir: "rtl" },
};

export const Glass: Story = {
  render: () =>
    column([
      slider({ label: "Volume", value: 50 }),
      slider({ label: "Ticked", ticks: 5, step: "25", value: 50 }),
    ]),
  globals: { material: "glass", theme: "dark", contrast: "more" },
};
