import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html, svg, type SVGTemplateResult } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import "./toolbar.ts";

const meta = {
  title: "Components/Toolbar",
  component: "purr-toolbar",
} satisfies Meta;

export default meta;

type Story = StoryObj;

// Plain buttons stand in for purr-button; the toolbar only needs focusable
// items and the variant attribute. Icons come from design/icons.
const icon = (paths: SVGTemplateResult) =>
  html`<svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    ${paths}
  </svg>`;

const search = svg`<circle cx="10" cy="10" r="6.5" /><path d="m14.65 14.65 4.5 4.5q1.1 1.1 2.1.35" />`;
const plus = svg`<path d="M12 4.75v14.5M4.75 12h14.5" />`;
const more = svg`<circle cx="5" cy="12" r="1.45" /><circle cx="12" cy="12" r="1.45" /><circle cx="19" cy="12" r="1.45" />`;

const styles = html`<style>
  purr-toolbar button {
    font: inherit;
    color: var(--purr-color-label);
    background: transparent;
    border: 0;
    border-radius: var(--purr-radius-small);
    min-inline-size: 44px;
    min-block-size: 44px;
  }
  purr-toolbar button:focus-visible {
    outline: 2px solid var(--purr-color-focus);
    outline-offset: 2px;
  }
  purr-toolbar button[variant="prominent"] {
    background: var(--purr-color-accent);
    color: var(--purr-color-background);
    padding-inline: var(--purr-space-4);
  }
  purr-toolbar button:disabled {
    opacity: 0.4;
  }
</style>`;

const items = [
  { label: "Search", icon: search },
  { label: "Add", icon: plus },
  { label: "More", icon: more },
  { label: "Done" },
];

// `disabled` and `prominent` are item indexes.
const render = ({
  disabled = [] as number[],
  prominent = [3],
  label = "Document actions",
} = {}) =>
  html`${styles}
    <purr-toolbar id="toolbar" label=${ifDefined(label || undefined)}>
      ${items.map(
        (item, i) =>
          html`<button
            aria-label=${ifDefined(item.icon ? item.label : undefined)}
            variant=${ifDefined(prominent.includes(i) ? "prominent" : undefined)}
            ?disabled=${disabled.includes(i)}
          >
            ${item.icon ? icon(item.icon) : item.label}
          </button>`,
      )}
    </purr-toolbar>`;

export const Default: Story = { render: () => render() };

export const DisabledItem: Story = {
  render: () => render({ disabled: [1] }),
};

export const DisabledFirstItem: Story = {
  render: () => render({ disabled: [0] }),
};

export const TwoProminent: Story = {
  render: () => render({ prominent: [2, 3] }),
};

export const ProminentFirst: Story = {
  render: () => render({ prominent: [0] }),
};

export const NoLabel: Story = { render: () => render({ label: "" }) };

export const Rtl: Story = { render: () => render(), globals: { dir: "rtl" } };

// Every material, theme and direction, each with a disabled item.
const matrix = (globals: Record<string, string>): Story => ({
  render: () => render({ disabled: [1] }),
  globals,
});

export const SolidDark = matrix({ theme: "dark" });
export const SolidDarkRtl = matrix({ theme: "dark", dir: "rtl" });
export const SolidRtlDisabled = matrix({ dir: "rtl" });
export const GlassLight = matrix({ material: "glass" });
export const GlassLightRtl = matrix({ material: "glass", dir: "rtl" });
export const GlassDark = matrix({ material: "glass", theme: "dark" });

export const Glass: Story = {
  render: () => render({ disabled: [1] }),
  globals: { material: "glass", theme: "dark", contrast: "more", dir: "rtl" },
};
