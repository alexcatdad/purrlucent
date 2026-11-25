import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { useArgs } from "storybook/preview-api";
import { expect, fn, userEvent } from "storybook/test";
import "./switch.ts";
import type { PlSwitch } from "./switch.ts";

const meta = {
  title: "Forms/Switch",
  component: "pl-switch",
  tags: ["autodocs"],
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        component:
          "An on/off setting that takes effect immediately. Supply its accessible name as slotted text or with aria-label.",
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj;

const column = (content: unknown) =>
  html`<div
    style="display:grid;justify-items:start;gap:var(--pl-space-3);padding:var(--pl-space-4)"
  >
    ${content}
  </div>`;

type PlaygroundArgs = Pick<PlSwitch, "checked" | "disabled" | "size"> & {
  label: string;
  "pl-change": (detail: { checked: boolean }) => void;
};

export const Playground: StoryObj<PlaygroundArgs> = {
  args: {
    label: "Wi-Fi",
    checked: false,
    disabled: false,
    size: "md",
    "pl-change": fn(),
  },
  argTypes: {
    label: {
      name: "Label",
      control: "text",
      description: "Text in the default slot.",
    },
    checked: {
      name: "Checked",
      control: "boolean",
      description: "Current on/off state.",
    },
    disabled: {
      name: "Disabled",
      control: "boolean",
      description: "Disables interaction.",
    },
    size: { name: "Size", control: "select", options: ["md", "lg", "xl"] },
    "pl-change": { table: { disable: true } },
  },
  parameters: {
    controls: {
      disable: false,
      include: ["Label", "Checked", "Disabled", "Size"],
    },
    docs: { source: { code: '<pl-switch size="md">Wi-Fi</pl-switch>' } },
  },
  render: ({ label, checked, disabled, size, "pl-change": onChange }) => {
    const [, updateArgs] = useArgs<PlaygroundArgs>();
    return html`<pl-switch
      .checked=${checked}
      ?disabled=${disabled}
      size=${size}
      @pl-change=${(event: CustomEvent<{ checked: boolean }>) => {
        onChange(event.detail);
        updateArgs({ checked: event.detail.checked });
      }}
      >${label}</pl-switch
    >`;
  },
};

// Stories that other tests open as they are have no play function.
export const Default: Story = {
  render: () => html`<pl-switch id="switch">Wi-Fi</pl-switch>`,
};

export const States: Story = {
  render: () =>
    column([
      html`<pl-switch>Bluetooth</pl-switch>`,
      html`<pl-switch checked>Wi-Fi</pl-switch>`,
      html`<pl-switch disabled>AirDrop</pl-switch>`,
      html`<pl-switch checked disabled>Hotspot</pl-switch>`,
      html`<pl-switch aria-label="Notifications"></pl-switch>`,
    ]),
};

export const Sizes: Story = {
  render: () =>
    column(
      (["md", "lg", "xl"] as const).map(
        (size, i) =>
          html`<pl-switch size=${size} ?checked=${i === 1}
            >Size ${size}</pl-switch
          >`,
      ),
    ),
};

/** In a form the switch submits like a checkbox and follows reset and fieldset. */
export const InForm: Story = {
  render: () => html`
    <form id="form" style="padding:var(--pl-space-4)">
      <fieldset
        id="fieldset"
        style="display:grid;justify-items:start;gap:var(--pl-space-3);border:0;padding:0;margin:0"
      >
        <pl-switch id="wifi" name="wifi" checked>Wi-Fi</pl-switch>
        <pl-switch id="sync" name="sync" value="yes" required>Sync</pl-switch>
      </fieldset>
    </form>
  `,
};

/** Click and Space each toggle once and fire pl-change; Enter does nothing. */
export const Toggles: Story = {
  render: () => html`<pl-switch id="switch">Wi-Fi</pl-switch>`,
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector<PlSwitch>("#switch")!;
    const changes: boolean[] = [];
    el.addEventListener("pl-change", (event) =>
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
  render: () => html`<pl-switch checked>Wi-Fi</pl-switch>`,
  globals: { dir: "rtl" },
};

export const Glass: Story = {
  render: () =>
    column([
      html`<pl-switch>Bluetooth</pl-switch>`,
      html`<pl-switch checked>Wi-Fi</pl-switch>`,
    ]),
  globals: { material: "glass", theme: "dark", contrast: "more" },
};
