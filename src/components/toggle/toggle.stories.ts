import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { expect, userEvent } from "storybook/test";
import "./toggle.ts";
import type { PurrToggle } from "./toggle.ts";

const meta = {
  title: "Components/Toggle",
  component: "purr-toggle",
} satisfies Meta;

export default meta;

type Story = StoryObj;

const row = (content: unknown) =>
  html`<div
    style="display:flex;flex-wrap:wrap;align-items:center;gap:var(--purr-space-4);padding:var(--purr-space-4)"
  >
    ${content}
  </div>`;

const sizes = ["md", "lg", "xl"] as const;

// The icon is outline when off and filled when on (see toggle.css.ts).
const star = html`<svg
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
>
  <path
    d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"
  />
</svg>`;

export const Default: Story = {
  render: () => html`<purr-toggle id="toggle">Favorite</purr-toggle>`,
};

/** Off and on, with and without an icon. */
export const States: Story = {
  render: () =>
    row([
      html`<purr-toggle>${star}Favorite</purr-toggle>`,
      html`<purr-toggle pressed>${star}Favorite</purr-toggle>`,
      html`<purr-toggle>Favorite</purr-toggle>`,
      html`<purr-toggle pressed>Favorite</purr-toggle>`,
    ]),
};

export const Sizes: Story = {
  render: () =>
    row([
      ...sizes.map(
        (size) =>
          html`<purr-toggle size=${size} pressed>${star}Favorite</purr-toggle>`,
      ),
      ...sizes.map(
        (size) =>
          html`<purr-toggle size=${size} icon aria-label="Favorite"
            >${star}</purr-toggle
          >`,
      ),
      ...sizes.map(
        (size) =>
          html`<purr-toggle size=${size} icon pressed aria-label="Favorite"
            >${star}</purr-toggle
          >`,
      ),
    ]),
};

export const Disabled: Story = {
  render: () =>
    row([
      html`<purr-toggle disabled>${star}Favorite</purr-toggle>`,
      html`<purr-toggle disabled pressed>${star}Favorite</purr-toggle>`,
    ]),
};

/** A click, Enter and Space each flip the state and fire purr-change. */
export const Behavior: Story = {
  render: () => html`<purr-toggle id="toggle">${star}Favorite</purr-toggle>`,
  play: async () => {
    const toggle = document.getElementById("toggle") as PurrToggle;
    const changes: boolean[] = [];
    toggle.addEventListener("purr-change", (event) =>
      changes.push((event as CustomEvent<{ pressed: boolean }>).detail.pressed),
    );
    await userEvent.click(toggle);
    expect(toggle.pressed).toBe(true);
    toggle.focus();
    await userEvent.keyboard("{Enter}");
    expect(toggle.pressed).toBe(false);
    await userEvent.keyboard(" ");
    expect(changes).toEqual([true, false, true]);
    // Setting the property is not a user toggle and fires nothing.
    toggle.pressed = false;
    expect(changes).toHaveLength(3);
  },
};

/** A disabled fieldset disables the toggle. */
export const InFieldset: Story = {
  render: () =>
    html`<fieldset
      id="fieldset"
      disabled
      style="border:0;padding:var(--purr-space-4)"
    >
      <purr-toggle id="toggle" pressed>${star}Favorite</purr-toggle>
    </fieldset>`,
};

export const Glass: Story = {
  render: () =>
    row([
      html`<purr-toggle>${star}Favorite</purr-toggle>`,
      html`<purr-toggle pressed>${star}Favorite</purr-toggle>`,
      html`<purr-toggle disabled pressed>${star}Favorite</purr-toggle>`,
    ]),
  globals: { material: "glass", theme: "dark", contrast: "more", dir: "rtl" },
};
