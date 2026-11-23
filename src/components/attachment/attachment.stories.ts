import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import "../button/button.ts";
import "./attachment.ts";

const meta = {
  title: "Components/Attachment",
  component: "pl-attachment",
} satisfies Meta;

export default meta;

type Story = StoryObj;

const box = (content: unknown) =>
  html`<div style="max-inline-size:28rem">${content}</div>`;

const stack = (content: unknown) =>
  html`<div
    style="display:flex;flex-direction:column;gap:0.75rem;max-inline-size:28rem"
  >
    ${content}
  </div>`;

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

const picture = (alt = "") =>
  html`<img
    slot="media"
    alt=${alt}
    src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 3'%3E%3Crect width='4' height='3' fill='%2388b'/%3E%3Ccircle cx='2' cy='1.5' r='1' fill='%23cce'/%3E%3C/svg%3E"
  />`;

const remove = (name: string) =>
  html`<pl-button slot="actions" icon aria-label="Remove ${name}"
    ><svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M6 6l12 12M18 6L6 18"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
      /></svg
  ></pl-button>`;

export const Default: Story = {
  render: () =>
    box(
      html`<pl-attachment>
        ${doc}
        <span slot="title">Quarterly report.pdf</span>
        <span slot="description">PDF, 2.4 MB</span>
        ${remove("Quarterly report.pdf")}
      </pl-attachment>`,
    ),
};

export const Image: Story = {
  render: () =>
    box(
      html`<pl-attachment media="image">
        ${picture()}
        <span slot="title">Sketch.png</span>
        <span slot="description">PNG, 640 KB</span>
      </pl-attachment>`,
    ),
};

export const TitleOnly: Story = {
  render: () =>
    box(
      html`<pl-attachment><span slot="title">notes.txt</span></pl-attachment>`,
    ),
};

/** Uploading and processing shimmer the title; error uses the destructive colors with the reason in the description. */
export const States: Story = {
  render: () =>
    stack(
      html`<pl-attachment id="state-idle" state="idle">
          ${doc}
          <span slot="title">idle.pdf</span>
          <span slot="description">Waiting</span>
        </pl-attachment>
        <pl-attachment id="state-uploading" state="uploading">
          ${doc}
          <span slot="title">uploading.pdf</span>
          <span slot="description">Uploading, 40%</span>
        </pl-attachment>
        <pl-attachment id="state-processing" state="processing">
          ${doc}
          <span slot="title">processing.pdf</span>
          <span slot="description">Reading the file</span>
        </pl-attachment>
        <pl-attachment id="state-error" state="error">
          ${doc}
          <span slot="title">error.pdf</span>
          <span slot="description">File is too large. The limit is 10 MB.</span>
          ${remove("error.pdf")}
        </pl-attachment>
        <pl-attachment id="state-done" state="done">
          ${doc}
          <span slot="title">done.pdf</span>
          <span slot="description">PDF, 2.4 MB</span>
        </pl-attachment>`,
    ),
};

export const Uploading: Story = {
  render: () =>
    box(
      html`<pl-attachment state="uploading">
        ${doc}
        <span slot="title">Quarterly report.pdf</span>
        <span slot="description">Uploading, 40%</span>
        ${remove("Quarterly report.pdf")}
      </pl-attachment>`,
    ),
};

export const ErrorState: Story = {
  render: () =>
    box(
      html`<pl-attachment state="error">
        ${doc}
        <span slot="title">Quarterly report.pdf</span>
        <span slot="description">File is too large. The limit is 10 MB.</span>
        ${remove("Quarterly report.pdf")}
      </pl-attachment>`,
    ),
};

export const Sizes: Story = {
  render: () =>
    stack(
      html`${(["default", "sm", "xs"] as const).map(
        (size) =>
          html`<pl-attachment id=${`size-${size}`} size=${size}>
            ${doc}
            <span slot="title">Quarterly report.pdf</span>
            <span slot="description">PDF, 2.4 MB</span>
          </pl-attachment>`,
      )}`,
    ),
};

export const Vertical: Story = {
  render: () =>
    html`<div style="max-inline-size:14rem">
      <pl-attachment orientation="vertical" media="image">
        ${picture()}
        <span slot="title">Sketch.png</span>
        <span slot="description">PNG, 640 KB</span>
        ${remove("Sketch.png")}
      </pl-attachment>
    </div>`,
};

/** The whole card is one link; the button stays separate. */
export const Link: Story = {
  render: () =>
    box(
      html`<pl-attachment href="#report">
        ${doc}
        <span slot="title">Quarterly report.pdf</span>
        <span slot="description">PDF, 2.4 MB</span>
        ${remove("Quarterly report.pdf")}
      </pl-attachment>`,
    ),
};

/** The whole card is one button that fires pl-press. */
export const Clickable: Story = {
  render: () =>
    box(
      html`<pl-attachment id="clickable" clickable>
        ${doc}
        <span slot="title">Quarterly report.pdf</span>
        <span slot="description">PDF, 2.4 MB</span>
        ${remove("Quarterly report.pdf")}
      </pl-attachment>`,
    ),
};

export const CompactLink: Story = {
  render: () =>
    box(
      html`<pl-attachment size="xs" href="#report">
        ${doc}
        <span slot="title">Quarterly report.pdf</span>
      </pl-attachment>`,
    ),
};

export const LongText: Story = {
  render: () =>
    box(
      html`<pl-attachment href="#long">
        ${doc}
        <span slot="title"
          >A file name that is long enough that it has to wrap onto a second
          line</span
        >
        <span slot="description"
          >A description that is also long enough to wrap, with a veryveryvery
          longwordthatmustbreak inside it</span
        >
        ${remove("long file")}
      </pl-attachment>`,
    ),
};

const files = [
  "Report.pdf",
  "Budget.xlsx",
  "Notes.txt",
  "Slides.key",
  "Photo.png",
];

/** A scrolling, snapping row of linked cards. */
export const Group: Story = {
  render: () =>
    html`<div style="max-inline-size:28rem">
      <pl-attachment-group label="Attachments">
        ${files.map(
          (name) =>
            html`<pl-attachment href=${`#${name}`}>
              ${doc}
              <span slot="title">${name}</span>
              <span slot="description">Shared today</span>
            </pl-attachment>`,
        )}
      </pl-attachment-group>
    </div>`,
};

const presentational = () =>
  html`<div style="max-inline-size:28rem">
    <pl-attachment-group label="Attached files">
      ${files.map(
        (name) =>
          html`<pl-attachment>
            ${doc}
            <span slot="title">${name}</span>
            <span slot="description">Shared today</span>
          </pl-attachment>`,
      )}
    </pl-attachment-group>
  </div>`;

/** Nothing inside takes focus, so the group is the tab stop that scrolls. */
export const GroupPresentational: Story = { render: presentational };

export const GroupFew: Story = {
  render: () =>
    html`<div style="max-inline-size:40rem">
      <pl-attachment-group label="Attached files">
        <pl-attachment>
          ${doc}
          <span slot="title">Report.pdf</span>
        </pl-attachment>
      </pl-attachment-group>
    </div>`,
};

export const Rtl: Story = {
  render: () =>
    box(
      html`<pl-attachment href="#report">
        ${doc}
        <span slot="title">Quarterly report.pdf</span>
        <span slot="description">PDF, 2.4 MB</span>
        ${remove("Quarterly report.pdf")}
      </pl-attachment>`,
    ),
  globals: { dir: "rtl" },
};

export const GroupRtl: Story = {
  render: presentational,
  globals: { dir: "rtl" },
};

export const Glass: Story = {
  render: () =>
    box(
      html`<pl-attachment href="#report">
        ${doc}
        <span slot="title">Quarterly report.pdf</span>
        <span slot="description">PDF, 2.4 MB</span>
      </pl-attachment>`,
    ),
  globals: { material: "glass", theme: "dark", contrast: "more" },
};
