import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { expect } from "storybook/test";
import "./avatar.ts";
import type { PlAvatar } from "./avatar.ts";
import { underGlass } from "../../../.storybook/under-glass.ts";

import { playground } from "../../../.storybook/playground.ts";

const meta = {
  title: "Cards & Lists/Avatar",
  component: "pl-avatar",
  tags: ["autodocs"],
  parameters: { controls: { disable: true } },
} satisfies Meta;

export default meta;

type Story = StoryObj;

/** A small drawing stands in for a photo, so the stories need no network. */
const photo =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8"><rect width="8" height="8" fill="#457b9d"/><circle cx="4" cy="3" r="1.6" fill="#f1faee"/><rect x="1.6" y="5" width="4.8" height="3" rx="2" fill="#f1faee"/></svg>`,
  );

/** Not a valid image, so the browser reports an error. */
const broken = "data:image/png;base64,AAAA";

const row = (content: unknown) =>
  html`<div
    style="display:flex;align-items:center;gap:var(--pl-space-4);padding:var(--pl-space-4)"
  >
    ${content}
  </div>`;

export const Playground: Story = {
  ...playground({
    name: "Ada Lovelace",
    size: ["md", "sm", "lg", "xl"],
    showPhoto: false,
  }),
  render: ({ name, size, showPhoto }) =>
    html`<pl-avatar
      name=${name}
      size=${size}
      .src=${showPhoto ? photo : ""}
    ></pl-avatar>`,
};

export const Default: Story = {
  render: () =>
    html`<pl-avatar id="avatar" name="Ada Lovelace" src=${photo}></pl-avatar>`,
};

/** With no `src`, the initials of the name show. */
export const Initials: Story = {
  render: () =>
    row([
      html`<pl-avatar id="two" name="Ada Lovelace"></pl-avatar>`,
      html`<pl-avatar id="one" name="Grace"></pl-avatar>`,
      html`<pl-avatar id="three" name="Mary Jane Watson"></pl-avatar>`,
    ]),
};

/** An image that fails to load falls back to the initials. */
export const Fallback: Story = {
  render: () =>
    html`<pl-avatar id="avatar" name="Ada Lovelace" src=${broken}></pl-avatar>`,
};

export const Sizes: Story = {
  render: () =>
    row(
      (["sm", "md", "lg", "xl"] as const).map(
        (size) =>
          html`<pl-avatar
            id=${size}
            size=${size}
            name="Ada Lovelace"
            src=${photo}
          ></pl-avatar>`,
      ),
    ),
};

/** Without a `name` the avatar is decorative: no role, no name. */
export const Decorative: Story = {
  render: () => html`<pl-avatar id="avatar" src=${photo}></pl-avatar>`,
};

/** The name is on the host; the picture and the initials are hidden. */
export const Semantics: Story = {
  render: () => html`<pl-avatar id="avatar" name="Ada Lovelace"></pl-avatar>`,
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector<PlAvatar>("#avatar")!;
    await el.updateComplete;
    expect(el.getAttribute("role")).toBe("img");
    expect(el.getAttribute("aria-label")).toBe("Ada Lovelace");
    expect(
      el.shadowRoot!.querySelector("[part=initials]")!.textContent!.trim(),
    ).toBe("AL");
  },
};

export const Glass: Story = {
  render: () =>
    underGlass(
      row([
        html`<pl-avatar name="Ada Lovelace" src=${photo}></pl-avatar>`,
        html`<pl-avatar name="Grace Hopper"></pl-avatar>`,
      ]),
    ),
  globals: { material: "glass", theme: "dark", contrast: "more" },
};
