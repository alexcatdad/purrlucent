import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { expect, userEvent } from "storybook/test";
import "./switch.ts";
import type { PurrSwitch } from "./switch.ts";

const meta = {
  title: "Components/Switch",
  component: "purr-switch",
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
  render: () => html`<purr-switch id="switch">Wi-Fi</purr-switch>`,
};

export const States: Story = {
  render: () =>
    column([
      html`<purr-switch>Bluetooth</purr-switch>`,
      html`<purr-switch checked>Wi-Fi</purr-switch>`,
      html`<purr-switch disabled>AirDrop</purr-switch>`,
      html`<purr-switch checked disabled>Hotspot</purr-switch>`,
      html`<purr-switch aria-label="Notifications"></purr-switch>`,
    ]),
};

export const Sizes: Story = {
  render: () =>
    column(
      (["md", "lg", "xl"] as const).map(
        (size, i) =>
          html`<purr-switch size=${size} ?checked=${i === 1}
            >Size ${size}</purr-switch
          >`,
      ),
    ),
};

/** In a form the switch submits like a checkbox and follows reset and fieldset. */
export const InForm: Story = {
  render: () => html`
    <form id="form" style="padding:var(--purr-space-4)">
      <fieldset
        id="fieldset"
        style="display:grid;justify-items:start;gap:var(--purr-space-3);border:0;padding:0;margin:0"
      >
        <purr-switch id="wifi" name="wifi" checked>Wi-Fi</purr-switch>
        <purr-switch id="sync" name="sync" value="yes" required
          >Sync</purr-switch
        >
      </fieldset>
    </form>
  `,
};

/** Click and Space each toggle once and fire purr-change; Enter does nothing. */
export const Toggles: Story = {
  render: () => html`<purr-switch id="switch">Wi-Fi</purr-switch>`,
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector<PurrSwitch>("#switch")!;
    const changes: boolean[] = [];
    el.addEventListener("purr-change", (event) =>
      changes.push((event as CustomEvent<{ checked: boolean }>).detail.checked),
    );
    await el.updateComplete;
    expect(el.getAttribute("role")).toBe("switch");
    await userEvent.click(el);
    el.focus();
    await userEvent.keyboard(" ");
    await userEvent.keyboard("{Enter}");
    expect(changes).toEqual([true, false]);
    await el.updateComplete;
    expect(el.getAttribute("aria-checked")).toBe("false");
  },
};

export const Rtl: Story = {
  render: () => html`<purr-switch checked>Wi-Fi</purr-switch>`,
  globals: { dir: "rtl" },
};

export const Glass: Story = {
  render: () =>
    column([
      html`<purr-switch>Bluetooth</purr-switch>`,
      html`<purr-switch checked>Wi-Fi</purr-switch>`,
    ]),
  globals: { material: "glass", theme: "dark", contrast: "more" },
};
