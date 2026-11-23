import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import "../spinner/spinner.ts";
import "./marker.ts";

const meta = {
  title: "Text/Marker",
  component: "pl-marker",
} satisfies Meta;

export default meta;

type Story = StoryObj;

const wrap = (content: unknown) =>
  html`<div style="max-inline-size:24rem">${content}</div>`;

const check = html`<svg slot="icon" viewBox="0 0 24 24" aria-hidden="true">
  <path d="M5 12l5 5l10 -10" />
</svg>`;

export const Default: Story = {
  render: () => wrap(html`<pl-marker>${check}Explored 4 files</pl-marker>`),
};

/** An app sets `role="status"` on a row that reports live progress. */
export const Status: Story = {
  render: () =>
    wrap(
      html`<pl-marker role="status">
        <pl-spinner slot="icon" size="sm" label="Working"></pl-spinner>
        Searching the codebase
      </pl-marker>`,
    ),
};

export const Border: Story = {
  render: () =>
    wrap(
      html`<pl-marker variant="border"
        >${check}Switched to the review model</pl-marker
      >`,
    ),
};

/** The label is plain text between two rules; it has no separator role, so it is read. */
export const Separator: Story = {
  render: () => wrap(html`<pl-marker variant="separator">Today</pl-marker>`),
};

export const Shimmer: Story = {
  render: () =>
    wrap(
      html`<pl-marker shimmer role="status">
        <pl-spinner slot="icon" size="sm" label="Working"></pl-spinner>
        Thinking…
      </pl-marker>`,
    ),
};

export const Link: Story = {
  render: () =>
    wrap(html`<pl-marker href="#files">${check}Explored 4 files</pl-marker>`),
};

export const Button: Story = {
  render: () =>
    wrap(html`<pl-marker interactive>${check}Explored 4 files</pl-marker>`),
};

export const LongText: Story = {
  render: () =>
    html`<div style="max-inline-size:20rem">
      <pl-marker>
        ${check}A status that is long enough that it has to wrap, with a
        veryveryveryverylongwordthatmustbreak inside it
      </pl-marker>
      <pl-marker href="#long" variant="border">
        ${check}A link that is long enough that it has to wrap, with a
        veryveryveryverylongwordthatmustbreak inside it
      </pl-marker>
    </div>`,
};

export const Rtl: Story = {
  render: () => wrap(html`<pl-marker>${check}Explored 4 files</pl-marker>`),
  globals: { dir: "rtl" },
};
