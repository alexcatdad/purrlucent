import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { expect, userEvent, waitFor } from "storybook/test";
import "./input-otp.ts";
import type { PlInputOtp } from "./input-otp.ts";
import { widths } from "../../../.storybook/widths.ts";

const meta = {
  title: "Forms/Input OTP",
  component: "pl-input-otp",
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
  render: () => column(html`<pl-input-otp id="otp">Code</pl-input-otp>`),
};

export const Labelled: Story = {
  render: () =>
    column(
      html`<pl-input-otp id="otp" label="Verification code"></pl-input-otp>`,
    ),
};

export const Lengths: Story = {
  render: () =>
    column([
      html`<pl-input-otp length="4" label="Four digits"></pl-input-otp>`,
      html`<pl-input-otp
        length="6"
        label="Six digits"
        value="123"
      ></pl-input-otp>`,
      html`<pl-input-otp
        length="8"
        inputmode="text"
        label="Eight characters"
        value="A1B2C3D4"
      ></pl-input-otp>`,
    ]),
};

/** The width is the host's `inline-size`; the boxes shrink to fit it. */
export const Widths: Story = {
  render: () =>
    widths(
      (style, label) =>
        html`<pl-input-otp style=${style} label=${label}></pl-input-otp>`,
    ),
};

export const Sizes: Story = {
  render: () =>
    column(
      (["md", "lg", "xl"] as const).map(
        (size) =>
          html`<pl-input-otp
            size=${size}
            length="4"
            label="Size ${size}"
            value="1234"
          ></pl-input-otp>`,
      ),
    ),
};

export const States: Story = {
  render: () =>
    column([
      html`<pl-input-otp label="Empty"></pl-input-otp>`,
      html`<pl-input-otp label="Filled" value="123456"></pl-input-otp>`,
      html`<pl-input-otp
        label="Disabled"
        value="123456"
        disabled
      ></pl-input-otp>`,
      html`<pl-input-otp
        label="Read only"
        value="123456"
        readonly
      ></pl-input-otp>`,
    ]),
};

/** In a form the field submits its value and follows reset, fieldset and validity. */
export const InForm: Story = {
  render: () => html`
    <form id="form" style="padding:var(--pl-space-4)">
      <fieldset
        id="fieldset"
        style="display:grid;justify-items:start;gap:var(--pl-space-3);border:0;padding:0;margin:0"
      >
        <pl-input-otp id="code" name="code" required>Code</pl-input-otp>
        <pl-input-otp id="pin" name="pin" length="4" value="12"
          >PIN</pl-input-otp
        >
      </fieldset>
    </form>
  `,
};

/** Typing fires pl-input per edit and pl-complete once every box is filled. */
export const Types: Story = {
  render: () =>
    column(html`<pl-input-otp id="otp" label="Code"></pl-input-otp>`),
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector<PlInputOtp>("#otp")!;
    const log: string[] = [];
    for (const name of ["pl-input", "pl-complete"])
      el.addEventListener(name, (event) =>
        log.push(
          `${name}:${(event as CustomEvent<{ value: string }>).detail.value}`,
        ),
      );
    await el.updateComplete;
    el.focus();
    await waitFor(() =>
      expect(el.shadowRoot!.querySelector("input")).toBe(
        el.shadowRoot!.activeElement,
      ),
    );
    await userEvent.keyboard("123456");
    expect(log.at(-1)).toBe("pl-complete:123456");
    expect(el.value).toBe("123456");
  },
};

export const Rtl: Story = {
  render: () =>
    column([
      html`<pl-input-otp label="Code" value="1234"></pl-input-otp>`,
      html`<pl-input-otp id="otp" label="Code"></pl-input-otp>`,
    ]),
  globals: { dir: "rtl" },
};

export const Glass: Story = {
  render: () =>
    column([html`<pl-input-otp label="Code" value="123"></pl-input-otp>`]),
  globals: { material: "glass", theme: "dark", contrast: "more" },
};
