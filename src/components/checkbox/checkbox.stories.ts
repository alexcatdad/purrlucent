import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { expect, userEvent } from "storybook/test";
import "./checkbox.ts";
import type { PurrCheckbox } from "./checkbox.ts";

const meta = {
  title: "Components/Checkbox",
  component: "purr-checkbox",
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
  render: () => html`<purr-checkbox id="box">Recents</purr-checkbox>`,
};

export const States: Story = {
  render: () =>
    column([
      html`<purr-checkbox>Shared</purr-checkbox>`,
      html`<purr-checkbox checked>Recents</purr-checkbox>`,
      html`<purr-checkbox indeterminate>Tags</purr-checkbox>`,
      html`<purr-checkbox disabled>Network</purr-checkbox>`,
      html`<purr-checkbox checked disabled>Favorites</purr-checkbox>`,
      html`<purr-checkbox indeterminate disabled>Locations</purr-checkbox>`,
      html`<purr-checkbox aria-label="Select all"></purr-checkbox>`,
    ]),
};

export const Sizes: Story = {
  render: () =>
    column(
      (["md", "lg", "xl"] as const).map(
        (size) =>
          html`<div style="display:flex;gap:var(--purr-space-6)">
            <purr-checkbox size=${size}>${size} off</purr-checkbox>
            <purr-checkbox size=${size} checked>${size} on</purr-checkbox>
            <purr-checkbox size=${size} indeterminate
              >${size} mixed</purr-checkbox
            >
          </div>`,
      ),
    ),
};

/** In a form the checkbox submits like a native one and follows reset and fieldset. */
export const InForm: Story = {
  render: () => html`
    <form id="form" style="padding:var(--purr-space-4)">
      <fieldset
        id="fieldset"
        style="display:grid;justify-items:start;gap:var(--purr-space-3);border:0;padding:0;margin:0"
      >
        <purr-checkbox id="news" name="news" checked>Newsletter</purr-checkbox>
        <purr-checkbox id="terms" name="terms" value="yes" required
          >Accept the terms</purr-checkbox
        >
      </fieldset>
    </form>
  `,
};

/** Click and Space each toggle once and fire purr-change; Enter does nothing; a click clears mixed. */
export const Toggles: Story = {
  render: () =>
    html`<purr-checkbox id="box" indeterminate>Recents</purr-checkbox>`,
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector<PurrCheckbox>("#box")!;
    const changes: boolean[] = [];
    el.addEventListener("purr-change", (event) =>
      changes.push((event as CustomEvent<{ checked: boolean }>).detail.checked),
    );
    await el.updateComplete;
    expect(el.getAttribute("role")).toBe("checkbox");
    expect(el.getAttribute("aria-checked")).toBe("mixed");
    await userEvent.click(el);
    await el.updateComplete;
    expect(el.getAttribute("aria-checked")).toBe("true");
    el.focus();
    await userEvent.keyboard(" ");
    await userEvent.keyboard("{Enter}");
    expect(changes).toEqual([true, false]);
  },
};

export const Rtl: Story = {
  render: () =>
    column([
      html`<purr-checkbox checked>Recents</purr-checkbox>`,
      html`<purr-checkbox indeterminate>Tags</purr-checkbox>`,
    ]),
  globals: { dir: "rtl" },
};

export const Glass: Story = {
  render: () =>
    column([
      html`<purr-checkbox>Shared</purr-checkbox>`,
      html`<purr-checkbox checked>Recents</purr-checkbox>`,
      html`<purr-checkbox indeterminate>Tags</purr-checkbox>`,
      html`<purr-checkbox disabled checked>Network</purr-checkbox>`,
    ]),
  globals: { material: "glass", theme: "dark", contrast: "more" },
};
