import { useArgs } from "storybook/preview-api";
import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { expect, userEvent } from "storybook/test";
import "../field/field.ts";
import "./checkbox.ts";
import type { PlCheckbox } from "./checkbox.ts";

import { playground } from "../../../.storybook/playground.ts";

const meta = {
  title: "Forms/Checkbox",
  component: "pl-checkbox",
  tags: ["autodocs"],
  parameters: { controls: { disable: true } },
} satisfies Meta;

export default meta;

type Story = StoryObj;

const column = (content: unknown) =>
  html`<div
    style="display:grid;justify-items:start;gap:var(--pl-space-3);padding:var(--pl-space-4)"
  >
    ${content}
  </div>`;

export const Playground: Story = {
  ...playground(
    {
      label: "Recents",
      checked: false,
      size: ["md", "lg", "xl"],
      disabled: false,
    },
    ["pl-change"],
  ),
  render: ({ label, checked, size, disabled }) => {
    const [, updateArgs] = useArgs();
    return html`<pl-checkbox
      .checked=${checked}
      @pl-change=${(event: CustomEvent<{ checked: boolean }>) => updateArgs({ checked: event.detail.checked })}
      size=${size}
      ?disabled=${disabled}
      >${label}</pl-checkbox
    >`;
  },
};

// Stories that other tests open as they are have no play function.
export const Default: Story = {
  render: () => html`<pl-checkbox id="box">Recents</pl-checkbox>`,
};

export const States: Story = {
  render: () =>
    column([
      html`<pl-checkbox>Shared</pl-checkbox>`,
      html`<pl-checkbox checked>Recents</pl-checkbox>`,
      html`<pl-checkbox indeterminate>Tags</pl-checkbox>`,
      html`<pl-checkbox disabled>Network</pl-checkbox>`,
      html`<pl-checkbox checked disabled>Favorites</pl-checkbox>`,
      html`<pl-checkbox indeterminate disabled>Locations</pl-checkbox>`,
      html`<pl-checkbox aria-label="Select all"></pl-checkbox>`,
      html`<pl-checkbox readonly checked>Read only</pl-checkbox>`,
      html`<pl-field orientation="horizontal" invalid>
        <label slot="label">Accept the terms</label>
        <pl-checkbox required></pl-checkbox>
        <span slot="error">Accept the terms to continue.</span>
      </pl-field>`,
    ]),
};

export const Sizes: Story = {
  render: () =>
    column(
      (["md", "lg", "xl"] as const).map(
        (size) =>
          html`<div style="display:flex;gap:var(--pl-space-6)">
            <pl-checkbox size=${size}>${size} off</pl-checkbox>
            <pl-checkbox size=${size} checked>${size} on</pl-checkbox>
            <pl-checkbox size=${size} indeterminate>${size} mixed</pl-checkbox>
          </div>`,
      ),
    ),
};

/** In a form the checkbox submits like a native one and follows reset and fieldset. */
export const InForm: Story = {
  render: () => html`
    <form id="form" style="padding:var(--pl-space-4)">
      <fieldset
        id="fieldset"
        style="display:grid;justify-items:start;gap:var(--pl-space-3);border:0;padding:0;margin:0"
      >
        <pl-checkbox id="news" name="news" checked>Newsletter</pl-checkbox>
        <pl-checkbox id="terms" name="terms" value="yes" required
          >Accept the terms</pl-checkbox
        >
      </fieldset>
    </form>
  `,
};

/** Click and Space each toggle once and fire pl-change; Enter does nothing; a click clears mixed. */
export const Toggles: Story = {
  render: () => html`<pl-checkbox id="box" indeterminate>Recents</pl-checkbox>`,
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector<PlCheckbox>("#box")!;
    const changes: boolean[] = [];
    el.addEventListener("pl-change", (event) =>
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
      html`<pl-checkbox checked>Recents</pl-checkbox>`,
      html`<pl-checkbox indeterminate>Tags</pl-checkbox>`,
    ]),
  globals: { dir: "rtl" },
};

export const Glass: Story = {
  render: () =>
    column([
      html`<pl-checkbox>Shared</pl-checkbox>`,
      html`<pl-checkbox checked>Recents</pl-checkbox>`,
      html`<pl-checkbox indeterminate>Tags</pl-checkbox>`,
      html`<pl-checkbox disabled checked>Network</pl-checkbox>`,
    ]),
  globals: { material: "glass", theme: "dark", contrast: "more" },
};
