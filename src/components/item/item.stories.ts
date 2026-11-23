import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import "../button/button.ts";
import "./item.ts";

const meta = {
  title: "Cards & Lists/Item",
  component: "pl-item",
} satisfies Meta;

export default meta;

type Story = StoryObj;

const list = (content: unknown) =>
  html`<div style="max-inline-size:32rem">${content}</div>`;

const doc = html`<svg slot="media" viewBox="0 0 24 24" aria-hidden="true">
  <g
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
  >
    <path d="M14 3v4a1 1 0 0 0 1 1h4" />
    <path
      d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2"
    />
  </g>
</svg>`;

export const Default: Story = {
  render: () =>
    list(
      html`<pl-item>
        ${doc}
        <strong slot="title">Quarterly report</strong>
        <span slot="description">Edited yesterday</span>
        <pl-button slot="actions">Share</pl-button>
      </pl-item>`,
    ),
};

/** The whole row is one link; the button stays separate. */
export const Link: Story = {
  render: () =>
    list(
      html`<pl-item href="#report">
        ${doc}
        <strong slot="title">Quarterly report</strong>
        <span slot="description">Edited yesterday</span>
        <pl-button slot="actions">Share</pl-button>
      </pl-item>`,
    ),
};

export const TitleOnly: Story = {
  render: () =>
    list(html`<pl-item><span slot="title">Settings</span></pl-item>`),
};

export const List: Story = {
  render: () =>
    list(
      html`<div role="list">
        ${["Budget", "Roadmap", "Notes"].map(
          (name) =>
            html`<pl-item role="listitem" href="#${name}">
              <span slot="title">${name}</span>
              <span slot="description">Last opened today</span>
            </pl-item>`,
        )}
      </div>`,
    ),
};

export const LongText: Story = {
  render: () =>
    list(
      html`<pl-item href="#long">
        ${doc}
        <span slot="title"
          >A title that is long enough that it has to wrap onto a second
          line</span
        >
        <span slot="description"
          >A description that is also long enough to wrap, with a veryveryvery
          longwordthatmustbreak inside it</span
        >
        <pl-button slot="actions">Share</pl-button>
      </pl-item>`,
    ),
};

export const Rtl: Story = {
  render: () =>
    list(
      html`<pl-item href="#report">
        ${doc}
        <strong slot="title">Quarterly report</strong>
        <span slot="description">Edited yesterday</span>
        <pl-button slot="actions">Share</pl-button>
      </pl-item>`,
    ),
  globals: { dir: "rtl" },
};

export const Glass: Story = {
  render: () =>
    list(
      html`<pl-item href="#report">
        ${doc}
        <strong slot="title">Quarterly report</strong>
        <span slot="description">Edited yesterday</span>
      </pl-item>`,
    ),
  globals: { material: "glass", theme: "dark", contrast: "more" },
};
