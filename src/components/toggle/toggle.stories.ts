import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { expect, userEvent } from "storybook/test";
import "./toggle.ts";
import type { PlToggle } from "./toggle.ts";

const meta = {
  title: "Components/Toggle",
  component: "pl-toggle",
} satisfies Meta;

export default meta;

type Story = StoryObj;

const row = (content: unknown) =>
  html`<div
    style="display:flex;flex-wrap:wrap;align-items:center;gap:var(--pl-space-4);padding:var(--pl-space-4)"
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
  render: () => html`<pl-toggle id="toggle">Favorite</pl-toggle>`,
};

/** Off and on, with and without an icon. */
export const States: Story = {
  render: () =>
    row([
      html`<pl-toggle>${star}Favorite</pl-toggle>`,
      html`<pl-toggle pressed>${star}Favorite</pl-toggle>`,
      html`<pl-toggle>Favorite</pl-toggle>`,
      html`<pl-toggle pressed>Favorite</pl-toggle>`,
    ]),
};

export const Sizes: Story = {
  render: () =>
    row([
      ...sizes.map(
        (size) =>
          html`<pl-toggle size=${size} pressed>${star}Favorite</pl-toggle>`,
      ),
      ...sizes.map(
        (size) =>
          html`<pl-toggle size=${size} icon aria-label="Favorite"
            >${star}</pl-toggle
          >`,
      ),
      ...sizes.map(
        (size) =>
          html`<pl-toggle size=${size} icon pressed aria-label="Favorite"
            >${star}</pl-toggle
          >`,
      ),
    ]),
};

export const Disabled: Story = {
  render: () =>
    row([
      html`<pl-toggle disabled>${star}Favorite</pl-toggle>`,
      html`<pl-toggle disabled pressed>${star}Favorite</pl-toggle>`,
    ]),
};

/** A click, Enter and Space each flip the state and fire pl-change. */
export const Behavior: Story = {
  render: () => html`<pl-toggle id="toggle">${star}Favorite</pl-toggle>`,
  play: async () => {
    const toggle = document.getElementById("toggle") as PlToggle;
    const changes: boolean[] = [];
    toggle.addEventListener("pl-change", (event) =>
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
      style="border:0;padding:var(--pl-space-4)"
    >
      <pl-toggle id="toggle" pressed>${star}Favorite</pl-toggle>
    </fieldset>`,
};

export const Glass: Story = {
  render: () =>
    row([
      html`<pl-toggle>${star}Favorite</pl-toggle>`,
      html`<pl-toggle pressed>${star}Favorite</pl-toggle>`,
      html`<pl-toggle disabled pressed>${star}Favorite</pl-toggle>`,
    ]),
  globals: { material: "glass", theme: "dark", contrast: "more", dir: "rtl" },
};
