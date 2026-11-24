import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { expect, userEvent, waitFor } from "storybook/test";
import "../input/input.ts";
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
const sizes = ["sm", "md", "lg", "xl"] as const;

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

/**
 * With an `href` the button is a link that keeps the button's look: opening in
 * a new tab and copying the address work, and a `click` listener can call
 * `preventDefault()` to route in the app instead.
 */
export const Links: Story = {
  render: () =>
    row([
      html`<pl-button id="link" href="#contracts" variant="primary"
        >Open in Contracts</pl-button
      >`,
      html`<pl-button id="link-ghost" href="#list" variant="ghost"
        >Back to list</pl-button
      >`,
      html`<pl-button id="link-icon" href="#new" icon aria-label="New contract"
        >${plus}</pl-button
      >`,
      html`<pl-button
        id="link-new-tab"
        href="#report"
        target="_blank"
        rel="noopener"
        >Open report</pl-button
      >`,
      html`<pl-button id="link-disabled" href="#archive" disabled
        >Archive</pl-button
      >`,
    ]),
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

/** A small button for dense tables, toolbars and pagination. */
export const Small: Story = {
  render: () =>
    row([
      html`<pl-button id="small" size="sm">Previous</pl-button>`,
      html`<pl-button id="small-primary" size="sm" variant="primary"
        >${plus}Add</pl-button
      >`,
      html`<pl-button id="small-ghost" size="sm" variant="ghost"
        >Clear</pl-button
      >`,
      html`<pl-button id="small-icon" size="sm" icon aria-label="Add row"
        >${plus}</pl-button
      >`,
      html`<pl-button id="small-link" size="sm" href="#next">Next</pl-button>`,
    ]),
};

/**
 * Enter in a native text field submits through the submit button, also with
 * several fields; a submit button outside the form names it with `form`, and
 * the submitting button's `name` and `value` are sent.
 */
export const SubmitForm: Story = {
  render: () => html`
    <form
      id="signup"
      style="display:flex;flex-wrap:wrap;gap:var(--pl-space-2);padding:var(--pl-space-4)"
    >
      <input name="first" aria-label="First name" />
      <input name="last" aria-label="Last name" />
      <pl-input name="email" label="Email"></pl-input>
      <pl-button type="submit" name="intent" value="save" variant="primary"
        >Save</pl-button
      >
    </form>
    <div style="padding:var(--pl-space-4)">
      <pl-button type="submit" form="signup" name="intent" value="draft"
        >Save as draft</pl-button
      >
    </div>
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
