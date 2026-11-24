import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { expect, userEvent, waitFor } from "storybook/test";
import "./button.ts";
import type { PlButton } from "./button.ts";

const meta = {
  title: "Actions/Button",
  component: "pl-button",
} satisfies Meta;

export default meta;

type Story = StoryObj;

const row = (content: unknown) =>
  html`<div
    style="display:flex;flex-wrap:wrap;align-items:center;gap:var(--pl-space-4);padding:var(--pl-space-4)"
  >
    ${content}
  </div>`;

const variants = ["secondary", "primary", "tinted", "ghost"] as const;
const sizes = ["md", "lg", "xl"] as const;

/** An action label for each variant: buttons name what they do. */
const label = (variant: (typeof variants)[number]) =>
  ({
    secondary: "Duplicate",
    primary: "Save",
    tinted: "Share",
    ghost: "Cancel",
  })[variant];

const plus = html`<svg
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  aria-hidden="true"
>
  <path d="M12 5v14M5 12h14" />
</svg>`;

/** Counts pl-press events fired by the button with the given id. */
const countPresses = (id: string) => {
  const button = document.getElementById(id) as PlButton;
  const presses = { count: 0 };
  button.addEventListener("pl-press", () => presses.count++);
  return { button, presses };
};

export const Default: Story = {
  render: () => html`<pl-button id="button">Save</pl-button>`,
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
          html`<pl-button variant=${variant}>${label(variant)}</pl-button>`,
      ),
    ),
};

export const Sizes: Story = {
  render: () =>
    row([
      ...sizes.map(
        (size) => html`<pl-button size=${size}>${plus}Add item</pl-button>`,
      ),
      ...sizes.map(
        (size) =>
          html`<pl-button size=${size} icon aria-label="Add"
            >${plus}</pl-button
          >`,
      ),
    ]),
};

export const Destructive: Story = {
  render: () =>
    row(
      variants.map(
        (variant) =>
          html`<pl-button
            id=${`destructive-${variant}`}
            variant=${variant}
            destructive
            >Delete</pl-button
          >`,
      ),
    ),
  // A destructive button never gets the filled primary look.
  play: () => {
    const filled = (id: string) =>
      getComputedStyle(document.getElementById(id)!, "::before")
        .backgroundColor;
    expect(filled("destructive-primary")).toBe(filled("destructive-tinted"));
  },
};

export const Disabled: Story = {
  render: () =>
    row(
      variants.map(
        (variant) =>
          html`<pl-button
            id=${`disabled-${variant}`}
            variant=${variant}
            disabled
            >${label(variant)}</pl-button
          >`,
      ),
    ),
  play: async () => {
    const { button, presses } = countPresses("disabled-secondary");
    expect(button.getAttribute("aria-disabled")).toBe("true");
    expect(button.tabIndex).toBe(-1);
    button.focus();
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard(" ");
    await waitFor(() => expect(presses.count).toBe(0));
  },
};

/** A busy button shows a spinner, ignores presses and stays focusable. */
export const Busy: Story = {
  render: () =>
    row([
      html`<pl-button id="busy" variant="primary" busy>Saving</pl-button>`,
      html`<pl-button id="busy-icon" icon busy aria-label="Add"
        >${plus}</pl-button
      >`,
    ]),
  play: async () => {
    const { button, presses } = countPresses("busy");
    await button.updateComplete;
    expect(button.getAttribute("aria-busy")).toBe("true");
    button.focus();
    expect(document.activeElement).toBe(button);
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard(" ");
    await waitFor(() => expect(presses.count).toBe(0));
  },
};

/** Submit and reset buttons act on the form they are in. */
export const InForm: Story = {
  render: () => html`
    <form
      id="form"
      style="display:flex;gap:var(--pl-space-2);padding:var(--pl-space-4)"
    >
      <input name="title" aria-label="Title" value="Draft" />
      <pl-button type="reset">Reset</pl-button>
      <pl-button type="submit" variant="primary">Save</pl-button>
    </form>
  `,
};

export const Glass: Story = {
  render: () =>
    row(
      variants.map(
        (variant) =>
          html`<pl-button variant=${variant}>${label(variant)}</pl-button>`,
      ),
    ),
  globals: { material: "glass", theme: "dark", contrast: "more", dir: "rtl" },
};
