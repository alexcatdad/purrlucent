import type { Meta, StoryObj } from "@storybook/web-components-vite";
import {
  LitElement,
  css,
  html,
  type PropertyValues,
  type TemplateResult,
} from "lit";
import { repeat } from "lit/directives/repeat.js";
import "../components/attachment/attachment.ts";
import "../components/avatar/avatar.ts";
import "../components/bubble/bubble.ts";
import "../components/empty/empty.ts";
import "../components/marker/marker.ts";
import "../components/message-scroller/message-scroller.ts";
import "../components/message/message.ts";
import "../components/prompt-input/prompt-input.ts";
import "../components/spinner/spinner.ts";

const meta = {
  title: "Patterns/Chat",
} satisfies Meta;

export default meta;

type Story = StoryObj;

/** The canned reply the demo streams. No network: a timer reveals it word by word. */
const reply =
  "Here is a short answer, streamed one word at a time so you can watch the transcript follow the live edge. The notes read well. Two lines could be tighter, and the changelog still needs the date of the release. Press Stop at any time to end the reply early.";

/** How long the Thinking marker shows, and the pause between words. */
const THINKING_MS = 1000;
const WORD_MS = 40;

type Row =
  | { id: string; kind: "seed"; anchor?: boolean; body: TemplateResult }
  | { id: string; kind: "me"; text: string }
  | { id: string; kind: "reply"; text: string; thinking: boolean }
  | { id: string; kind: "note"; text: string };

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

const avatar = html`<pl-avatar
  slot="avatar"
  name="Purr Assistant"
></pl-avatar>`;

const folder = html`<svg slot="icon" viewBox="0 0 24 24" aria-hidden="true">
  <path
    d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linejoin="round"
  />
</svg>`;

const conversation: Row[] = [
  {
    id: "s-today",
    kind: "seed",
    body: html`<pl-marker variant="separator">Today</pl-marker>`,
  },
  {
    id: "s-ask",
    kind: "seed",
    anchor: true,
    body: html`<pl-message-group label="You">
      <pl-message align="end">
        <pl-bubble align="end"
          ><bdi
            >Can you review the release notes before I publish?</bdi
          ></pl-bubble
        >
      </pl-message>
      <pl-message align="end">
        <pl-bubble align="end"
          ><bdi>I attached the draft and the checklist.</bdi></pl-bubble
        >
        <pl-attachment-group label="Attachments">
          <pl-attachment size="sm" state="uploading">
            ${doc}
            <span slot="title">Checklist.md</span>
            <span slot="description">Uploading, 40%</span>
          </pl-attachment>
          <pl-attachment size="sm" state="done">
            ${doc}
            <span slot="title">Release notes.md</span>
            <span slot="description">Markdown, 3 KB</span>
          </pl-attachment>
        </pl-attachment-group>
      </pl-message>
    </pl-message-group>`,
  },
  {
    id: "s-review",
    kind: "seed",
    body: html`<pl-message-group label="Assistant">
      <pl-message>
        ${avatar}
        <pl-bubble variant="ghost">
          <div class="prose" dir="ltr">
            <p>
              The notes are clear and the order is right. Two changes before you
              publish:
            </p>
            <p>
              Name the breaking change in the first line, and add the release
              date to the changelog. Then tag and publish:
            </p>
            <pre><code>bun run build
bun publish</code></pre>
          </div>
        </pl-bubble>
      </pl-message>
    </pl-message-group>`,
  },
  {
    id: "s-thanks",
    kind: "seed",
    anchor: true,
    body: html`<pl-message-group label="You">
      <pl-message align="end">
        <pl-bubble align="end"
          ><bdi>Thanks, that is clearer.</bdi>
          <pl-bubble-reactions slot="reactions" align="start" label="1 like"
            >👍 1</pl-bubble-reactions
          >
        </pl-bubble>
      </pl-message>
    </pl-message-group>`,
  },
  {
    id: "s-welcome",
    kind: "seed",
    body: html`<pl-message-group label="Assistant">
      <pl-message>
        ${avatar}
        <pl-bubble variant="ghost"
          ><p dir="ltr">Glad it helps. Tell me when it ships.</p></pl-bubble
        >
      </pl-message>
    </pl-message-group>`,
  },
];

/** A reply caught mid-stream: the first words of the canned reply. */
const partial = reply.split(" ").slice(0, 15).join(" ");

const streaming: Row[] = [
  ...conversation,
  { id: "p-ask", kind: "me", text: "Can you check the changelog too?" },
  { id: "p-reply", kind: "reply", text: partial, thinking: false },
];

const seeds: Record<string, Row[]> = { conversation, streaming, empty: [] };

/**
 * The chat set working together: a scroller of rows with the prompt input
 * docked below it. It is the demo's own element, not a library component.
 * Sending appends the person's message as a scroll anchor, sets the scroller
 * and the prompt busy, shows a Thinking marker, then streams the canned reply.
 */
class ChatDemo extends LitElement {
  static override properties = {
    seed: {},
    draft: {},
    rows: { state: true },
    busy: { state: true },
  };

  declare seed: string;
  declare draft: string;
  declare rows: Row[];
  declare busy: boolean;

  #count = 0;
  #timer = 0;
  #live = "";

  constructor() {
    super();
    this.seed = "empty";
    this.draft = "";
    this.rows = [];
    this.busy = false;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    clearTimeout(this.#timer);
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    if (changed.has("seed")) {
      this.rows = seeds[this.seed ?? "empty"] ?? [];
      // The streaming seed is caught mid-reply, so the prompt offers Stop.
      this.busy = this.seed === "streaming";
    }
  }

  #patch(id: string, change: Partial<Row>) {
    this.rows = this.rows.map((row) =>
      row.id === id ? ({ ...row, ...change } as Row) : row,
    );
  }

  #send = (event: Event) => {
    const { value } = (event as CustomEvent<{ value: string }>).detail;
    const n = ++this.#count;
    this.#live = `r${n}`;
    this.rows = [
      ...this.rows,
      { id: `m${n}`, kind: "me", text: value },
      { id: this.#live, kind: "reply", text: "", thinking: true },
    ];
    this.busy = true;
    this.#timer = window.setTimeout(() => this.#stream(0), THINKING_MS);
  };

  #stream(shown: number) {
    const words = reply.split(" ");
    const next = shown + 1;
    this.#patch(this.#live, {
      text: words.slice(0, next).join(" "),
      thinking: false,
    });
    if (next < words.length)
      this.#timer = window.setTimeout(() => this.#stream(next), WORD_MS);
    else this.busy = false;
  }

  #stop = () => {
    clearTimeout(this.#timer);
    this.busy = false;
    const live = this.rows.find((row) => row.id === this.#live);
    // Stopped before the first word: the reply row becomes a note.
    if (live?.kind === "reply" && live.thinking)
      this.rows = this.rows.map((row) =>
        row.id === this.#live
          ? { id: row.id, kind: "note", text: "Stopped" }
          : row,
      );
  };

  #row(row: Row) {
    switch (row.kind) {
      case "seed":
        return row.body;
      case "me":
        return html`<pl-message-group label="You">
          <pl-message align="end">
            <pl-bubble align="end"
              ><span class="sent" dir="ltr">${row.text}</span></pl-bubble
            >
          </pl-message>
        </pl-message-group>`;
      case "note":
        return html`<pl-marker>${row.text}</pl-marker>`;
      case "reply":
        return row.thinking
          ? html`<pl-marker shimmer role="status">
              <pl-spinner slot="icon" size="sm" label="Working"></pl-spinner>
              Thinking…
            </pl-marker>`
          : html`<pl-message-group label="Assistant">
              <pl-message>
                ${avatar}
                <pl-bubble variant="ghost"
                  ><p dir="ltr">${row.text}</p></pl-bubble
                >
              </pl-message>
            </pl-message-group>`;
    }
  }

  override render() {
    return html`${
        this.rows.length
          ? html`<pl-message-scroller
              auto-scroll
              default-scroll-position="end"
              ?busy=${this.busy}
            >
              ${repeat(
                this.rows,
                (row) => row.id,
                (row) =>
                  html`<pl-message-scroller-item
                    message-id=${row.id}
                    ?scroll-anchor=${
                      row.kind === "me" || (row.kind === "seed" && row.anchor)
                    }
                    >${this.#row(row)}</pl-message-scroller-item
                  >`,
              )}
            </pl-message-scroller>`
          : html`<div class="empty">
              <pl-empty>
                ${folder}
                <strong slot="title">Start a conversation</strong>
                <span slot="description"
                  >Ask a question below. The reply streams in here.</span
                >
              </pl-empty>
            </div>`
      }
      <div class="composer">
        <pl-prompt-input
          label="Message"
          placeholder="Ask anything"
          value=${this.draft}
          ?busy=${this.busy}
          @pl-submit=${this.#send}
          @pl-stop=${this.#stop}
        ></pl-prompt-input>
      </div>`;
  }

  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      block-size: calc(var(--pl-spacing) * 172);
      inline-size: min(100%, calc(var(--pl-spacing) * 180));
      margin-inline: auto;
      border: 1px solid var(--pl-color-border);
      border-radius: var(--pl-radius-panel);
      background: var(--pl-color-background);
      color: var(--pl-color-foreground);
      font: 400 var(--pl-text-base) / var(--pl-leading-body) var(--pl-font-sans);
    }

    pl-message-scroller,
    .empty {
      flex: 1 1 0;
      min-block-size: 0;
    }

    .empty {
      display: grid;
      place-items: center;
      padding: var(--pl-space-4);
    }

    .composer {
      padding: var(--pl-space-2) var(--pl-space-4) var(--pl-space-4);
    }

    p {
      margin: 0;
    }

    .sent {
      white-space: pre-wrap;
    }

    .prose {
      display: grid;
      gap: var(--pl-space-3);
    }

    pre {
      margin: 0;
      padding: var(--pl-space-3);
      border-radius: var(--pl-radius-control);
      background: var(--pl-color-muted-1);
      color: var(--pl-color-foreground);
      font: 400 var(--pl-text-sm) / var(--pl-leading-normal) var(--pl-font-mono);
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }
  `;
}

if (!customElements.get("chat-demo"))
  customElements.define("chat-demo", ChatDemo);

const page = (content: unknown) =>
  html`<div style="padding:var(--pl-space-4)">${content}</div>`;

/** A conversation: a date separator, messages from the person and the assistant, attachments, a reaction and the prompt below. Press Send: the message joins the transcript, Thinking shimmers, then the reply streams in. Stop ends it early. */
export const Conversation: Story = {
  render: () => page(html`<chat-demo seed="conversation"></chat-demo>`),
};

/** A reply part way through: the first words are in, the scroller is busy and the prompt offers Stop. */
export const Streaming: Story = {
  render: () => page(html`<chat-demo seed="streaming"></chat-demo>`),
};

/** A new chat: an empty state until the first message. */
export const Empty: Story = {
  render: () => page(html`<chat-demo seed="empty"></chat-demo>`),
};

export const Rtl: Story = {
  render: () => page(html`<chat-demo seed="conversation"></chat-demo>`),
  globals: { dir: "rtl" },
};

export const Glass: Story = {
  render: () => page(html`<chat-demo seed="conversation"></chat-demo>`),
  globals: { material: "glass", theme: "dark", contrast: "more" },
};
