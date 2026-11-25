import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import "../button/button.ts";
import "./prompt-input.ts";

import { playground } from "../../../.storybook/playground.ts";

const meta = {
  title: "AI & Chat/Prompt Input",
  component: "pl-prompt-input",
  tags: ["autodocs"],
  parameters: { controls: { disable: true } },
} satisfies Meta;

export default meta;

type Story = StoryObj;

const column = (content: unknown) =>
  html`<div
    style="display:grid;gap:var(--pl-space-3);padding:var(--pl-space-4);max-inline-size:calc(var(--pl-spacing) * 150)"
  >
    ${content}
  </div>`;

const plus = html`<svg
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
>
  <path d="M12 5v14" />
  <path d="M5 12h14" />
</svg>`;

export const Playground: Story = {
  ...playground({ placeholder: "Ask anything", busy: false, disabled: false }, [
    "pl-input",
    "pl-change",
    "pl-submit",
    "pl-stop",
  ]),
  render: ({ placeholder, busy, disabled }) =>
    column(
      html`<pl-prompt-input
        placeholder=${placeholder}
        ?busy=${busy}
        ?disabled=${disabled}
      ></pl-prompt-input>`,
    ),
};

export const Default: Story = {
  render: () =>
    column(
      html`<pl-prompt-input
        id="prompt"
        placeholder="Ask anything"
      ></pl-prompt-input>`,
    ),
};

/** Tools sit before the field and before the send button, beside its last line. */
export const Tools: Story = {
  render: () =>
    column(
      html`<pl-prompt-input id="prompt" placeholder="Ask anything">
        <pl-button slot="start" icon variant="ghost" aria-label="Attach"
          >${plus}</pl-button
        >
        <pl-button slot="end" variant="ghost">Model</pl-button>
      </pl-prompt-input>`,
    ),
};

/** The field grows with its text, up to about eight lines. Shift+Enter adds a line. */
export const Multiline: Story = {
  render: () =>
    column(
      html`<pl-prompt-input
        id="prompt"
        value=${"Summarize the release notes:\n- Fixes\n- Features\n- Breaking changes"}
      ></pl-prompt-input>`,
    ),
};

/** While a reply streams, Send becomes Stop and Enter sends nothing. */
export const Busy: Story = {
  render: () =>
    column(
      html`<pl-prompt-input
        id="prompt"
        busy
        value="And the next one?"
      ></pl-prompt-input>`,
    ),
};

export const Disabled: Story = {
  render: () =>
    column(
      html`<pl-prompt-input
        id="prompt"
        disabled
        value="Not now"
      ></pl-prompt-input>`,
    ),
};

export const Form: Story = {
  render: () =>
    column(
      html`<form id="form">
        <pl-prompt-input
          id="prompt"
          name="message"
          required
          value="Draft"
        ></pl-prompt-input>
      </form>`,
    ),
};

export const Rtl: Story = {
  render: () =>
    column(
      html`<pl-prompt-input id="prompt" placeholder="Ask anything">
        <pl-button slot="start" icon variant="ghost" aria-label="Attach"
          >${plus}</pl-button
        >
        <pl-button slot="end" variant="ghost">Model</pl-button>
      </pl-prompt-input>`,
    ),
  globals: { dir: "rtl" },
};

export const Glass: Story = {
  render: () =>
    column(
      html`<pl-prompt-input
        id="prompt"
        placeholder="Ask anything"
      ></pl-prompt-input>`,
    ),
  globals: { material: "glass", theme: "dark", contrast: "more" },
};
