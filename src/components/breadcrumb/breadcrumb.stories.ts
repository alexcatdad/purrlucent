import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { expect } from "storybook/test";
import "./breadcrumb.ts";

const meta = {
  title: "Navigation/Breadcrumb",
  component: "pl-breadcrumb",
} satisfies Meta;

export default meta;

type Story = StoryObj;

const body = (content: unknown) =>
  html`<div style="padding:var(--pl-space-4);max-inline-size:32rem">
    ${content}
  </div>`;

export const Default: Story = {
  render: () =>
    body(
      html`<pl-breadcrumb>
        <pl-breadcrumb-item href="#home">Home</pl-breadcrumb-item>
        <pl-breadcrumb-item href="#docs">Documents</pl-breadcrumb-item>
        <pl-breadcrumb-item href="#reports">Reports</pl-breadcrumb-item>
        <pl-breadcrumb-item href="#q3">Quarterly review</pl-breadcrumb-item>
      </pl-breadcrumb>`,
    ),
  play: async ({ canvasElement }) => {
    const items = canvasElement.querySelectorAll("pl-breadcrumb-item");
    await Promise.all([...items].map((item) => item.updateComplete));
    const last = items[items.length - 1]!;
    expect(
      last
        .shadowRoot!.querySelector('[part="link"]')!
        .getAttribute("aria-current"),
    ).toBe("page");
  },
};

/** A step with no `href` is text; a single step is the current page. */
export const TextSteps: Story = {
  render: () =>
    body(
      html`<pl-breadcrumb label="Location">
        <pl-breadcrumb-item>Library</pl-breadcrumb-item>
        <pl-breadcrumb-item>Archive</pl-breadcrumb-item>
      </pl-breadcrumb>`,
    ),
};

/** Names shrink to an ellipsis; each offers its full text as the title. */
export const LongTrail: Story = {
  render: () =>
    html`<div style="padding:var(--pl-space-4);inline-size:22rem">
      <pl-breadcrumb>
        <pl-breadcrumb-item href="#a">Home</pl-breadcrumb-item>
        <pl-breadcrumb-item href="#b"
          >Customer research and interviews</pl-breadcrumb-item
        >
        <pl-breadcrumb-item href="#c"
          >Synthesis of findings across regions</pl-breadcrumb-item
        >
        <pl-breadcrumb-item href="#d"
          >Recommendations for the next planning cycle</pl-breadcrumb-item
        >
      </pl-breadcrumb>
    </div>`,
};

export const Rtl: Story = {
  render: () =>
    body(
      html`<pl-breadcrumb>
        <pl-breadcrumb-item href="#home">Home</pl-breadcrumb-item>
        <pl-breadcrumb-item href="#docs">Documents</pl-breadcrumb-item>
        <pl-breadcrumb-item href="#reports">Reports</pl-breadcrumb-item>
      </pl-breadcrumb>`,
    ),
  globals: { dir: "rtl" },
};

export const Glass: Story = {
  render: () =>
    body(
      html`<pl-breadcrumb>
        <pl-breadcrumb-item href="#home">Home</pl-breadcrumb-item>
        <pl-breadcrumb-item href="#docs">Documents</pl-breadcrumb-item>
        <pl-breadcrumb-item href="#reports">Reports</pl-breadcrumb-item>
      </pl-breadcrumb>`,
    ),
  globals: { material: "glass", theme: "dark", contrast: "more" },
};
