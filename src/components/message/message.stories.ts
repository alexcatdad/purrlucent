import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { isolate } from "../../../.storybook/isolate.ts";
import "../avatar/avatar.ts";
import "../button/button.ts";
import "./message.ts";

const meta = {
  title: "AI & Chat/Message",
  component: "pl-message",
} satisfies Meta;

export default meta;

type Story = StoryObj;

const thread = (content: unknown) =>
  html`<div
    style="display:grid;gap:var(--pl-space-4);max-inline-size:32rem;padding:var(--pl-space-4)"
  >
    ${content}
  </div>`;

/* Stand-in for a bubble: the message only lays out whatever it is given. */
const bubble = (text: string, rtl = false) =>
  html`<div
    style="padding:var(--pl-space-2) var(--pl-space-3);border-radius:var(--pl-radius-control);background:var(--pl-color-muted-1);color:var(--pl-color-foreground)"
  >
    ${isolate(rtl, text)}
  </div>`;

const copy = html`<pl-button slot="footer" size="sm" aria-label="Copy message"
  >Copy</pl-button
>`;

const reply = (rtl = false) =>
  html`<pl-message>
    <pl-avatar slot="avatar" name="Purr Assistant"></pl-avatar>
    <span slot="header">${isolate(rtl, "Purr Assistant")}</span>
    ${bubble("Here is the summary you asked for.", rtl)}
    <span slot="footer">10:41</span>
  </pl-message>`;

export const Default: Story = {
  render: () => thread(reply()),
};

/** `align="end"`: the person's own message, mirrored. */
export const Own: Story = {
  render: () =>
    thread(
      html`<pl-message align="end">
        <pl-avatar slot="avatar" name="Alex Cat"></pl-avatar>
        <span slot="header">Alex Cat</span>
        ${bubble("Can you shorten it?")}
        <span slot="footer">Delivered</span>
      </pl-message>`,
    ),
};

/** A small drawing stands in for a photo, so the story needs no network. */
const photo =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8"><rect width="8" height="8" fill="#457b9d"/></svg>`,
  );

/** A loaded avatar image, which has no text baseline. */
export const WithAvatarImage: Story = {
  render: () =>
    thread(
      html`<pl-message>
        <pl-avatar slot="avatar" name="Purr Assistant" src=${photo}></pl-avatar>
        ${bubble("The avatar is a loaded image.")}
      </pl-message>`,
    ),
};

export const WithoutFooter: Story = {
  render: () =>
    thread(
      html`<pl-message>
        <pl-avatar slot="avatar" name="Purr Assistant"></pl-avatar>
        ${bubble("No header and no footer.")}
      </pl-message>`,
    ),
};

export const WithoutAvatar: Story = {
  render: () =>
    thread(
      html`<pl-message>${bubble("No avatar, no gap for it.")}</pl-message>`,
    ),
};

export const FooterActions: Story = {
  render: () =>
    thread(
      html`<pl-message>
        <pl-avatar slot="avatar" name="Purr Assistant"></pl-avatar>
        ${bubble("Footer actions follow the message side.")} ${copy}
        <pl-button slot="footer" size="sm" aria-label="Retry">Retry</pl-button>
      </pl-message>`,
    ),
};

export const MultipleBlocks: Story = {
  render: () =>
    thread(
      html`<pl-message>
        <pl-avatar slot="avatar" name="Purr Assistant"></pl-avatar>
        ${bubble("First block.")} ${bubble("Second block, stacked below.")}
      </pl-message>`,
    ),
};

/** Only the last message of a group shows its avatar. */
export const Group: Story = {
  render: () =>
    thread(
      html`<pl-message-group label="Purr Assistant">
        ${["One.", "Two.", "Three."].map(
          (text) =>
            html`<pl-message>
              <pl-avatar slot="avatar" name="Purr Assistant"></pl-avatar>
              ${bubble(text)}
            </pl-message>`,
        )}
      </pl-message-group>`,
    ),
};

export const LongText: Story = {
  render: () =>
    thread(
      html`<pl-message>
        <pl-avatar slot="avatar" name="Purr Assistant"></pl-avatar>
        <span slot="header"
          >A sender name that is long enough to wrap onto a second line</span
        >
        ${bubble(
          "A message that is long enough to wrap, with a veryveryveryveryvery longwordthatmustbreakinsidethebubble in it.",
        )}
        <span slot="footer"
          >A status that is also long enough to wrap onto a second line</span
        >
      </pl-message>`,
    ),
};

export const Rtl: Story = {
  render: () =>
    thread([
      reply(true),
      html`<pl-message align="end">
        <pl-avatar slot="avatar" name="Alex Cat"></pl-avatar>
        ${bubble("Can you shorten it?", true)}
        <span slot="footer">${isolate(true, "Delivered")}</span>
      </pl-message>`,
    ]),
  globals: { dir: "rtl" },
};
