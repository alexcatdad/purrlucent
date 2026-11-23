import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import "./message-scroller.ts";

const meta = {
  title: "Components/Message Scroller",
  component: "pl-message-scroller",
} satisfies Meta;

export default meta;

type Story = StoryObj;

const frame =
  "block-size:calc(var(--pl-spacing) * 80);inline-size:calc(var(--pl-spacing) * 100)";

/** Even rows are the person's (anchors, as sending starts a turn); odd rows are replies. */
const rows = (count: number) =>
  Array.from({ length: count }, (_, i) => {
    const mine = i % 2 === 0;
    return html`<pl-message-scroller-item
      message-id="m${i + 1}"
      ?scroll-anchor=${mine}
    >
      <p style="margin:0">
        ${mine ? "You" : "Assistant"}, message ${i + 1}. A reply can run to
        several lines, so the rows have different heights.
        ${mine ? "" : "More text to fill the second line of the reply."}
      </p>
    </pl-message-scroller-item>`;
  });

/** Scrolls from the start; the bottom edge fades and the button is drawn while there is more below. */
export const Default: Story = {
  render: () =>
    html`<pl-message-scroller id="scroller" style=${frame}
      >${rows(30)}</pl-message-scroller
    >`,
};

/** The first render opens at the latest message. */
export const StartAtEnd: Story = {
  render: () =>
    html`<pl-message-scroller
      id="scroller"
      default-scroll-position="end"
      style=${frame}
      >${rows(30)}</pl-message-scroller
    >`,
};

/** The first render opens at the last row with `scroll-anchor`, a peek of the row before it showing above. */
export const LastAnchor: Story = {
  render: () =>
    html`<pl-message-scroller
      id="scroller"
      default-scroll-position="last-anchor"
      style=${frame}
      >${rows(30)}
      <pl-message-scroller-item message-id="last" scroll-anchor>
        <p style="margin:0">You, the last question.</p>
      </pl-message-scroller-item>
      <pl-message-scroller-item message-id="long-reply">
        ${Array.from(
          { length: 20 },
          (_, i) => html`<p style="margin:0">Reply line ${i + 1}.</p>`,
        )}
      </pl-message-scroller-item></pl-message-scroller
    >`,
};

/** Nothing to scroll to: no fades, and the button is inert. */
export const Short: Story = {
  render: () =>
    html`<pl-message-scroller id="scroller" style=${frame}
      >${rows(2)}</pl-message-scroller
    >`,
};

/** A reply is streaming: the log is `aria-busy` and `auto-scroll` follows it while the reader is at the end. */
export const Streaming: Story = {
  render: () =>
    html`<pl-message-scroller
      id="scroller"
      auto-scroll
      busy
      default-scroll-position="end"
      style=${frame}
      >${rows(20)}</pl-message-scroller
    >`,
};

/** A numeric `peek` replaces the default peek of the previous row. */
export const Peek: Story = {
  render: () =>
    html`<pl-message-scroller id="scroller" peek="16" style=${frame}
      >${rows(30)}</pl-message-scroller
    >`,
};

/** A button in the `button` slot takes the built-in button's place. */
export const CustomButton: Story = {
  render: () =>
    html`<pl-message-scroller id="scroller" style=${frame}
      >${rows(30)}<pl-message-scroller-button
        slot="button"
        label="Jump to the newest message"
      ></pl-message-scroller-button
    ></pl-message-scroller>`,
};

export const Rtl: Story = {
  render: () =>
    html`<pl-message-scroller id="scroller" style=${frame}
      >${rows(30)}</pl-message-scroller
    >`,
  globals: { dir: "rtl" },
};

export const Glass: Story = {
  render: () =>
    html`<pl-message-scroller id="scroller" style=${frame}
      >${rows(30)}</pl-message-scroller
    >`,
  globals: { material: "glass", theme: "dark", contrast: "more" },
};
