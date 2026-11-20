import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { expect, userEvent, waitFor } from "storybook/test";
import "./button.ts";
import type { PurrButton } from "./button.ts";

const meta = {
  title: "Components/Button",
  component: "purr-button",
} satisfies Meta;

export default meta;

type Story = StoryObj;

const row = (content: unknown) =>
  html`<div
    style="display:flex;flex-wrap:wrap;gap:1rem;padding:1rem;background:var(--purr-color-background)"
  >
    ${content}
  </div>`;

const variants = ["plain", "bordered", "prominent"] as const;

/** Title-case label for a variant. */
const label = (variant: string) => variant[0]!.toUpperCase() + variant.slice(1);

/** Counts purr-press events fired by the button with the given id. */
const countPresses = (id: string) => {
  const button = document.getElementById(id) as PurrButton;
  const presses = { count: 0 };
  button.addEventListener("purr-press", () => presses.count++);
  return { button, presses };
};

export const Default: Story = {
  render: () =>
    html`<purr-button id="button" variant="bordered">Save</purr-button>`,
  play: async () => {
    const { button, presses } = countPresses("button");
    expect(button.getAttribute("role")).toBe("button");
    expect(button.tabIndex).toBe(0);
    button.focus();
    await userEvent.keyboard("{Enter}");
    expect(presses.count).toBe(1);
    await userEvent.keyboard(" ");
    expect(presses.count).toBe(2);
    await userEvent.click(button);
    expect(presses.count).toBe(3);
  },
};

export const Variants: Story = {
  render: () =>
    row(
      variants.map(
        (variant) =>
          html`<purr-button variant=${variant}>${label(variant)}</purr-button>`,
      ),
    ),
};

export const Destructive: Story = {
  render: () =>
    row(
      variants.map(
        (variant) =>
          html`<purr-button
            id=${`destructive-${variant}`}
            variant=${variant}
            destructive
            >Delete</purr-button
          >`,
      ),
    ),
  // A destructive button never gets the prominent (accent-filled) look.
  play: () => {
    const filled = (id: string) =>
      getComputedStyle(document.getElementById(id)!, "::before")
        .backgroundColor;
    expect(filled("destructive-prominent")).toBe(
      filled("destructive-bordered"),
    );
  },
};

export const Disabled: Story = {
  render: () =>
    row(
      variants.map(
        (variant) =>
          html`<purr-button
            id=${`disabled-${variant}`}
            variant=${variant}
            disabled
            >${label(variant)}</purr-button
          >`,
      ),
    ),
  play: async () => {
    const { button, presses } = countPresses("disabled-bordered");
    expect(button.getAttribute("aria-disabled")).toBe("true");
    expect(button.tabIndex).toBe(-1);
    button.focus();
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard(" ");
    await waitFor(() => expect(presses.count).toBe(0));
  },
};

export const Glass: Story = {
  render: () =>
    row(
      variants.map(
        (variant) =>
          html`<purr-button variant=${variant}>${label(variant)}</purr-button>`,
      ),
    ),
  globals: { material: "glass", theme: "dark", contrast: "more", dir: "rtl" },
};
