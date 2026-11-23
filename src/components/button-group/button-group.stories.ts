import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { expect, userEvent } from "storybook/test";
import "../button/button.ts";
import "./button-group.ts";

const meta = {
  title: "Components/Button Group",
  component: "pl-button-group",
} satisfies Meta;

export default meta;

type Story = StoryObj;

const render = () => html`
  <pl-button-group id="control" label="Document actions">
    <pl-button>Cut</pl-button>
    <pl-button>Copy</pl-button>
    <pl-button>Paste</pl-button>
  </pl-button-group>
`;

const pad = "padding:var(--pl-space-4)";

export const Default: Story = { render };

export const Glass: Story = {
  render,
  globals: { material: "glass", theme: "dark", contrast: "more", dir: "ltr" },
};

export const Light: Story = { render, globals: { theme: "light" } };

export const Dark: Story = { render, globals: { theme: "dark" } };

export const MoreContrast: Story = { render, globals: { contrast: "more" } };

/** A vertical group stacks the buttons and rounds the top and bottom ends. */
export const Vertical: Story = {
  render: () => html`
    <pl-button-group id="control" label="Zoom" orientation="vertical">
      <pl-button>Zoom in</pl-button>
      <pl-button>Zoom out</pl-button>
      <pl-button>Actual size</pl-button>
    </pl-button-group>
  `,
};

/** Buttons of equal weight share one size and one variant. */
export const Sizes: Story = {
  render: () => html`
    <div
      style="display:flex;flex-direction:column;gap:var(--pl-space-4);${pad}"
    >
      ${(["md", "lg", "xl"] as const).map(
        (size) => html`
          <pl-button-group label="Document actions, ${size}">
            <pl-button size=${size}>Cut</pl-button>
            <pl-button size=${size}>Copy</pl-button>
            <pl-button size=${size}>Paste</pl-button>
          </pl-button-group>
        `,
      )}
    </div>
  `,
};

/** One button is unavailable: it keeps its place and gives no feedback. */
export const DisabledButton: Story = {
  render: () => html`
    <pl-button-group id="control" label="Document actions">
      <pl-button>Cut</pl-button>
      <pl-button disabled>Copy</pl-button>
      <pl-button>Paste</pl-button>
    </pl-button-group>
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

/** Icon buttons: each has an `aria-label`, and the svg is hidden. */
export const Icons: Story = {
  render: () => html`
    <pl-button-group id="control" label="Text alignment">
      <pl-button icon aria-label="Align left"
        >${icon("M4 6h16M4 12h10M4 18h14")}</pl-button
      >
      <pl-button icon aria-label="Align center"
        >${icon("M4 6h16M7 12h10M5 18h14")}</pl-button
      >
      <pl-button icon aria-label="Align right"
        >${icon("M4 6h16M10 12h10M6 18h14")}</pl-button
      >
    </pl-button-group>
  `,
};

/** Under right-to-left the group mirrors: the first button is on the right. */
export const Rtl: Story = { render, globals: { dir: "rtl" } };

/** Every button is its own tab stop and presses on its own. */
export const Keyboard: Story = {
  render,
  play: async ({ canvasElement }) => {
    const buttons = [...canvasElement.querySelectorAll("pl-button")];
    const presses: string[] = [];
    for (const button of buttons)
      button.addEventListener("pl-press", () =>
        presses.push(button.textContent ?? ""),
      );
    await userEvent.tab();
    expect(buttons[0]).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await userEvent.tab();
    expect(buttons[1]).toHaveFocus();
    await userEvent.keyboard(" ");
    expect(presses).toEqual(["Cut", "Copy"]);
  },
};
