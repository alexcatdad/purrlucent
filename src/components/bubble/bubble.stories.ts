import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import "./bubble.ts";

const meta = {
  title: "AI & Chat/Bubble",
  component: "pl-bubble",
} satisfies Meta;

export default meta;

type Story = StoryObj;

const column = (content: unknown) =>
  html`<div
    style="display:grid;gap:var(--pl-space-3);padding:var(--pl-space-4);color:var(--pl-color-foreground)"
  >
    ${content}
  </div>`;

const variants = [
  "default",
  "secondary",
  "muted",
  "tinted",
  "outline",
  "ghost",
] as const;

export const Default: Story = {
  render: () =>
    column(
      html`<pl-bubble align="end"
          >Can you summarize the meeting notes?</pl-bubble
        >
        <pl-bubble variant="ghost"
          >Here is a summary: the team agreed on the release date and the open
          risks are tracked in the planning document.</pl-bubble
        >`,
    ),
};

/** Each variant, with the fill and label color made for it. */
export const Variants: Story = {
  render: () =>
    column([
      ...variants.map(
        (variant) =>
          html`<pl-bubble variant=${variant} align="end"
            >A ${variant} bubble</pl-bubble
          >`,
      ),
      html`<pl-bubble variant="destructive"
        >The message could not be sent. Check the connection and try
        again.</pl-bubble
      >`,
    ]),
};

export const Alignment: Story = {
  render: () =>
    column(
      html`<pl-bubble variant="secondary">Aligned to the start</pl-bubble>
        <pl-bubble align="end">Aligned to the end</pl-bubble>`,
    ),
};

/** Long text wraps at the maximum width; a long word breaks instead of overflowing. */
export const LongText: Story = {
  render: () =>
    column(
      html`<pl-bubble variant="secondary"
          >A long message wraps at four fifths of the container instead of
          running the full width, so lines stay short enough to read
          comfortably.
          Supercalifragilisticexpialidocious_and_a_very_long_identifier_that_has_no_break_points</pl-bubble
        >
        <pl-bubble variant="ghost"
          >A ghost bubble has no maximum width, so its text runs the full width
          of the container.</pl-bubble
        >`,
    ),
};

/** Reactions overlap the bubble's top or bottom edge, at its start or end. */
export const Reactions: Story = {
  render: () =>
    column(
      html`<pl-bubble variant="secondary">
          Shipped the fix this morning.
          <pl-bubble-reactions slot="reactions" label="2 likes, 1 laugh"
            >👍 2 😂 1</pl-bubble-reactions
          >
        </pl-bubble>
        <pl-bubble variant="secondary" align="end">
          Shipped the fix this morning.
          <pl-bubble-reactions
            slot="reactions"
            side="top"
            align="start"
            label="1 heart"
            >❤️ 1</pl-bubble-reactions
          >
        </pl-bubble>
        <pl-bubble variant="secondary">
          Shipped the fix this morning.
          <pl-bubble-reactions
            slot="reactions"
            side="top"
            align="end"
            label="1 heart"
            >❤️ 1</pl-bubble-reactions
          >
        </pl-bubble>
        <pl-bubble variant="secondary" align="end">
          Shipped the fix this morning.
          <pl-bubble-reactions slot="reactions" align="start" label="1 heart"
            >❤️ 1</pl-bubble-reactions
          >
        </pl-bubble>`,
    ),
};

/** Interactive reactions are real buttons, each with its own name. */
export const InteractiveReactions: Story = {
  render: () =>
    column(
      html`<pl-bubble variant="secondary">
        Shipped the fix this morning.
        <pl-bubble-reactions slot="reactions" interactive label="Reactions">
          <button type="button" aria-label="Like, 2 reactions">👍 2</button>
          <button type="button" aria-label="Laugh, 1 reaction">😂 1</button>
        </pl-bubble-reactions>
      </pl-bubble>`,
    ),
};

/** With an href the body is a link; with interactive it is a button. */
export const Controls: Story = {
  render: () =>
    column(
      html`<pl-bubble variant="tinted" href="https://example.com/report"
          >Open the report</pl-bubble
        >
        <pl-bubble variant="secondary" interactive
          >Regenerate response</pl-bubble
        >`,
    ),
};

/** Assistant text and code: unframed, full width, the content slotted as rendered markdown. */
export const Assistant: Story = {
  render: () =>
    column(
      html`<pl-bubble variant="ghost">
        <p>Two steps remain:</p>
        <ul>
          <li>Run the build.</li>
          <li>Publish the package.</li>
        </ul>
        <pre><code>bun run build</code></pre>
      </pl-bubble>`,
    ),
};

/** A run of messages from one sender: touching corners are tight. */
export const Group: Story = {
  render: () =>
    column(
      html`<pl-bubble-group label="You">
        <pl-bubble align="end">First message</pl-bubble>
        <pl-bubble align="end">Second message</pl-bubble>
        <pl-bubble align="end">Third message</pl-bubble>
      </pl-bubble-group>`,
    ),
};

export const Rtl: Story = {
  render: () =>
    column(
      html`<pl-bubble variant="secondary"
        >Starts at the right edge
        <pl-bubble-reactions slot="reactions" align="start" label="1 heart"
          >❤️ 1</pl-bubble-reactions
        ></pl-bubble
      >`,
    ),
  globals: { dir: "rtl" },
};

export const Glass: Story = {
  render: () =>
    column(
      html`<pl-bubble variant="secondary" align="end"
          >A secondary bubble</pl-bubble
        >
        <pl-bubble variant="outline">An outline bubble</pl-bubble>
        <pl-bubble variant="muted">A muted bubble</pl-bubble>`,
    ),
  globals: { material: "glass", theme: "dark", contrast: "more" },
};
