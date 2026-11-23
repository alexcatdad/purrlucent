import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { LitElement, css, html, type PropertyValues } from "lit";
import { repeat } from "lit/directives/repeat.js";
import "../components/badge/badge.ts";
import "../components/button/button.ts";
import "../components/context-menu/context-menu.ts";
import "../components/drawer/drawer.ts";
import "../components/empty/empty.ts";
import "../components/field/field.ts";
import "../components/input/input.ts";
import "../components/item/item.ts";
import "../components/menu/menu.ts";
import "../components/resizable/resizable.ts";
import "../components/sidebar/sidebar.ts";
import "../components/textarea/textarea.ts";
import "../components/toast/toast.ts";
import "../components/toolbar/toolbar.ts";
import type { PlDrawer } from "../components/drawer/drawer.ts";
import type { PlToaster } from "../components/toast/toast.ts";

const meta = {
  title: "Patterns/Mail",
} satisfies Meta;

export default meta;

type Story = StoryObj;

type Folder = "inbox" | "drafts" | "sent" | "archive" | "trash";

interface Message {
  id: string;
  folder: Folder;
  from: string;
  subject: string;
  preview: string;
  time: string;
  unread: boolean;
  body: string[];
}

const folders: { id: Folder; label: string }[] = [
  { id: "inbox", label: "Inbox" },
  { id: "drafts", label: "Drafts" },
  { id: "sent", label: "Sent" },
  { id: "archive", label: "Archive" },
  { id: "trash", label: "Trash" },
];

const seed = (): Message[] => [
  {
    id: "m1",
    folder: "inbox",
    from: "Juno Marsh",
    subject: "Lunch on Thursday?",
    preview: "There is a new place around the corner. Are you free at noon?",
    time: "9:41 AM",
    unread: true,
    body: [
      "Hi,",
      "There is a new place around the corner that does a good soup. Are you free at noon on Thursday? I can book a table for two.",
      "Let me know and I will send the details.",
      "Juno",
    ],
  },
  {
    id: "m2",
    folder: "inbox",
    from: "Theo Brandt",
    subject: "Draft of the trip itinerary",
    preview: "I put the three days into one page. Have a look at the order.",
    time: "8:12 AM",
    unread: false,
    body: [
      "Hi,",
      "I put the three days into one page: the train on Friday, the coast walk on Saturday and the market on Sunday.",
      "Have a look at the order and tell me what to move. The walk is the part I am least sure about.",
      "Theo",
    ],
  },
  {
    id: "m3",
    folder: "inbox",
    from: "Ines Calloway",
    subject: "Your order has shipped",
    preview:
      "Your parcel left the depot this morning and should arrive Friday.",
    time: "Yesterday",
    unread: true,
    body: [
      "Your parcel left the depot this morning.",
      "It should arrive on Friday. You can leave it with a neighbour if nobody is home.",
    ],
  },
  {
    id: "m4",
    folder: "inbox",
    from: "Priya Nandakumar",
    subject: "Notes from Monday's planning",
    preview: "Three decisions came out of it, and two open questions remain.",
    time: "Yesterday",
    unread: false,
    body: [
      "Hi all,",
      "Three decisions came out of Monday's planning: we ship the small version first, the review moves to Wednesday, and the schedule stays as it is.",
      "Two questions remain open. Please answer them by the end of the week.",
      "Priya",
    ],
  },
  {
    id: "m5",
    folder: "inbox",
    from: "Front desk",
    subject: "Two books are due soon",
    preview: "Two items on your card are due on Monday. You can renew them.",
    time: "Mon",
    unread: true,
    body: [
      "Two items on your card are due on Monday.",
      "You can renew them once from your account, or bring them to the front desk.",
    ],
  },
  {
    id: "m6",
    folder: "inbox",
    from: "Owen Hale",
    subject: "Photos from the weekend",
    preview:
      "Here are the ones that turned out well. The last one is my favourite.",
    time: "Sun",
    unread: false,
    body: [
      "Here are the photos that turned out well.",
      "The last one is my favourite. I can print it for you if you like.",
      "Owen",
    ],
  },
  {
    id: "d1",
    folder: "drafts",
    from: "Me",
    subject: "Reply to the itinerary",
    preview: "The order looks right. I would move the walk to Sunday morning.",
    time: "Mon",
    unread: false,
    body: ["The order looks right. I would move the walk to Sunday morning."],
  },
  {
    id: "s1",
    folder: "sent",
    from: "Me",
    subject: "Re: Notes from Monday's planning",
    preview: "Thanks for writing these up. I will answer the questions today.",
    time: "Tue",
    unread: false,
    body: ["Thanks for writing these up. I will answer the questions today."],
  },
  {
    id: "s2",
    folder: "sent",
    from: "Me",
    subject: "Re: Photos from the weekend",
    preview: "These are lovely. Yes please, print the last one.",
    time: "Sun",
    unread: false,
    body: ["These are lovely. Yes please, print the last one."],
  },
  {
    id: "a1",
    folder: "archive",
    from: "Marlow Reed",
    subject: "Minutes from the spring meeting",
    preview: "The minutes are attached, with the action items at the end.",
    time: "Mar 3",
    unread: false,
    body: ["The minutes are attached, with the action items at the end."],
  },
  {
    id: "t1",
    folder: "trash",
    from: "Newsletter",
    subject: "Ten tips for a tidy desk",
    preview: "This week: where things go, and why the drawer fills up.",
    time: "Mar 1",
    unread: false,
    body: ["This week: where things go, and why the drawer fills up."],
  },
];

const envelope = html`<svg
  slot="icon"
  viewBox="0 0 24 24"
  aria-hidden="true"
  fill="none"
  stroke="currentColor"
  stroke-width="1.5"
  stroke-linejoin="round"
>
  <rect x="3" y="5" width="18" height="14" rx="2" />
  <path d="m3 7 9 6 9-6" />
</svg>`;

/**
 * A three-pane mail client: folders, a message list and a reading pane in a
 * resizable group, with a compose drawer. It is the demo's own element, not a
 * library component. Below 40rem (a container query, so it follows the text
 * size at once) it shows one pane at a time: the list, then the opened
 * message with a Back button; the folder pane is left out.
 */
class MailDemo extends LitElement {
  static override properties = {
    selected: {},
    composing: { type: Boolean, attribute: "composing" },
    messages: { state: true },
    folder: { state: true },
    query: { state: true },
    opened: { state: true },
    to: { state: true },
    subject: { state: true },
    body: { state: true },
  };

  declare selected: string;
  declare composing: boolean;
  declare messages: Message[];
  declare folder: Folder;
  declare query: string;
  declare opened: boolean;
  declare to: string;
  declare subject: string;
  declare body: string;

  #count = 0;

  constructor() {
    super();
    this.selected = "";
    this.composing = false;
    this.messages = seed();
    this.folder = "inbox";
    this.query = "";
    this.opened = false;
    this.to = "";
    this.subject = "";
    this.body = "";
  }

  protected override updated(changed: PropertyValues<this>) {
    const drawer = this.renderRoot.querySelector<PlDrawer>("pl-drawer")!;
    if (changed.has("composing") && drawer.open !== this.composing)
      drawer.open = this.composing;
  }

  get #list() {
    const query = this.query.trim().toLowerCase();
    return this.messages.filter(
      (m) =>
        m.folder === this.folder &&
        (!query ||
          `${m.from} ${m.subject} ${m.preview}`.toLowerCase().includes(query)),
    );
  }

  get #current() {
    return this.messages.find(
      (m) => m.id === this.selected && m.folder === this.folder,
    );
  }

  #patch(id: string, change: Partial<Message>) {
    this.messages = this.messages.map((m) =>
      m.id === id ? { ...m, ...change } : m,
    );
  }

  async #open(id: string) {
    this.selected = id;
    this.opened = true;
    this.#patch(id, { unread: false });
    await this.updateComplete;
    // One pane at a time: the list is gone, so focus goes to the message.
    if (!this.#link(id)?.checkVisibility())
      this.renderRoot.querySelector<HTMLElement>(".reading h2")?.focus();
  }

  /** Back to the list; focus returns to the row that was open. */
  async #back() {
    const id = this.selected;
    this.opened = false;
    await this.updateComplete;
    this.#link(id)?.focus();
  }

  /** Moves a message to another folder and offers Undo. */
  async #move(id: string, to: Folder, title: string) {
    const message = this.messages.find((m) => m.id === id);
    if (!message) return;
    const rows = this.#list;
    const next = rows[rows.findIndex((m) => m.id === id) + 1] ?? rows.at(-2);
    const wasSelected = this.selected === id;
    this.#patch(id, { folder: to });
    if (wasSelected) {
      this.selected = "";
      this.opened = false;
    }
    this.renderRoot.querySelector<PlToaster>("pl-toaster")!.show({
      title,
      description: message.subject,
      action: {
        label: "Undo",
        onClick: () => {
          this.#patch(id, { folder: message.folder });
          this.folder = message.folder;
          this.selected = id;
        },
      },
    });
    await this.updateComplete;
    // Focus left with the removed row: bring it to the next one.
    if (
      !(this.renderRoot as ShadowRoot).activeElement &&
      next &&
      next.id !== id
    )
      this.#link(next.id)?.focus();
  }

  #link(id: string) {
    return this.renderRoot
      .querySelector(`pl-item[data-id="${id}"]`)
      ?.shadowRoot?.querySelector("a");
  }

  #compose(to = "", subject = "", body = "") {
    this.to = to;
    this.subject = subject;
    this.body = body;
    this.composing = true;
  }

  #reply(m: Message, forward: boolean) {
    this.#compose(
      forward ? "" : m.from,
      `${forward ? "Fwd" : "Re"}: ${m.subject}`,
      forward ? `\n\n${m.body.join("\n\n")}` : "",
    );
  }

  #send = () => {
    this.messages = [
      {
        id: `n${++this.#count}`,
        folder: "sent",
        from: "Me",
        subject: this.subject.trim() || "(No subject)",
        preview: this.body.trim().split("\n")[0] ?? "",
        time: "Now",
        unread: false,
        body: this.body.trim().split(/\n+/),
      },
      ...this.messages,
    ];
    this.composing = false;
    this.renderRoot
      .querySelector<PlToaster>("pl-toaster")!
      .show({ title: "Message sent", description: this.subject || undefined });
  };

  #choose = (event: Event, m: Message) => {
    const { value } = (event as CustomEvent<{ value: string }>).detail;
    if (value === "archive") void this.#move(m.id, "archive", "Archived");
    else if (value === "delete") void this.#move(m.id, "trash", "Deleted");
    else this.#reply(m, value === "forward");
  };

  #act(kind: "archive" | "delete" | "unread") {
    const m = this.#current;
    if (!m) return;
    if (kind === "unread") {
      this.#patch(m.id, { unread: true });
      this.opened = false;
    } else if (kind === "archive") void this.#move(m.id, "archive", "Archived");
    else void this.#move(m.id, "trash", "Deleted");
  }

  #row(m: Message) {
    return html`<pl-context-menu
      @pl-select=${(event: Event) => this.#choose(event, m)}
    >
      <pl-item
        data-id=${m.id}
        href="#${m.id}"
        ?selected=${m.id === this.selected}
        class=${m.unread ? "unread" : "read"}
        @click=${(event: Event) => {
          event.preventDefault();
          void this.#open(m.id);
        }}
      >
        <span slot="title"
          >${m.unread ? html`<pl-badge variant="accent">Unread</pl-badge>` : ""}
          <span class="from">${m.from}</span
          ><span class="subject">${m.subject}</span></span
        >
        <span slot="description" class="preview">${m.preview}</span>
        <time slot="actions">${m.time}</time>
      </pl-item>
      <pl-menu slot="menu" label="Message actions">
        <pl-menu-item value="reply">Reply</pl-menu-item>
        <pl-menu-item value="forward">Forward</pl-menu-item>
        <pl-menu-separator></pl-menu-separator>
        <pl-menu-item value="archive">Archive</pl-menu-item>
        <pl-menu-item value="delete" destructive>Delete</pl-menu-item>
      </pl-menu>
    </pl-context-menu>`;
  }

  #reading() {
    const m = this.#current;
    if (!m)
      return html`<div class="empty">
        <pl-empty>
          ${envelope}
          <strong slot="title">No message selected</strong>
          <span slot="description">Choose a message to read it here.</span>
        </pl-empty>
      </div>`;
    return html`<article class="reading" aria-label="Message">
      <pl-button class="back" variant="ghost" @click=${() => this.#back()}
        >Back to list</pl-button
      >
      <h2 tabindex="-1">${m.subject}</h2>
      <p class="meta">${m.from}, ${m.time}</p>
      <div class="actions">
        <pl-button @click=${() => this.#reply(m, false)}>Reply</pl-button>
        <pl-button @click=${() => this.#reply(m, true)}>Forward</pl-button>
      </div>
      ${m.body.map((paragraph) => html`<p>${paragraph}</p>`)}
    </article>`;
  }

  override render() {
    const rows = this.#list;
    const unread = this.messages.filter(
      (m) => m.folder === "inbox" && m.unread,
    ).length;
    return html`<div class="shell">
        <pl-resizable class=${this.opened ? "opened" : ""}>
          <pl-resizable-panel class="folders-pane" size="20" min="16" max="30">
            <div class="folders">
              <pl-button
                variant="primary"
                size="lg"
                @click=${() => this.#compose()}
                >Compose</pl-button
              >
              <pl-sidebar
                label="Folders"
                @pl-change=${(event: Event) => {
                  const [item] = (
                    event as CustomEvent<{ selected: HTMLElement[] }>
                  ).detail.selected;
                  this.folder = item!.id as Folder;
                  this.selected = "";
                  this.opened = false;
                }}
              >
                ${folders.map(
                  ({ id, label }) =>
                    html`<pl-sidebar-item
                      id=${id}
                      ?selected=${id === this.folder}
                      >${label}${
                        id === "inbox" && unread
                          ? html`<pl-badge slot="detail" variant="accent"
                              >${unread}</pl-badge
                            >`
                          : ""
                      }</pl-sidebar-item
                    >`,
                )}
              </pl-sidebar>
            </div>
          </pl-resizable-panel>
          <pl-resizable-handle label="Resize folders"></pl-resizable-handle>
          <pl-resizable-panel class="list-pane" size="32" min="24" max="50">
            <pl-toolbar label="Message actions" size="md">
              <pl-button
                variant="ghost"
                size="md"
                ?disabled=${!this.#current}
                @click=${() => this.#act("archive")}
                >Archive</pl-button
              >
              <pl-button
                variant="ghost"
                size="md"
                ?disabled=${!this.#current}
                @click=${() => this.#act("delete")}
                >Delete</pl-button
              >
              <pl-button
                variant="ghost"
                size="md"
                ?disabled=${!this.#current}
                @click=${() => this.#act("unread")}
                >Mark unread</pl-button
              >
              <pl-input
                type="search"
                size="md"
                label="Search mail"
                placeholder="Search"
                .value=${this.query}
                @pl-input=${(event: Event) =>
                  (this.query = (
                    event as CustomEvent<{ value: string }>
                  ).detail.value)}
              ></pl-input>
            </pl-toolbar>
            ${
              rows.length
                ? html`<div role="group" aria-label="Messages">
                    ${repeat(
                      rows,
                      (m) => m.id,
                      (m) => this.#row(m),
                    )}
                  </div>`
                : html`<div class="empty">
                    <pl-empty>
                      ${envelope}
                      <strong slot="title">No messages</strong>
                      <span slot="description"
                        >${this.query ? "Nothing matches your search." : "This folder is empty."}</span
                      >
                    </pl-empty>
                  </div>`
            }
          </pl-resizable-panel>
          <pl-resizable-handle
            label="Resize message list"
          ></pl-resizable-handle>
          <pl-resizable-panel class="reading-pane" size="48" min="30">
            ${this.#reading()}
          </pl-resizable-panel>
        </pl-resizable>
      </div>
      <pl-drawer
        side="end"
        label="New message"
        @pl-close=${() => (this.composing = false)}
      >
        <h2 slot="title">New message</h2>
        <div class="compose">
          <pl-field>
            <label slot="label">To</label>
            <pl-input
              autofocus
              .value=${this.to}
              @pl-input=${(event: Event) =>
                (this.to = (
                  event as CustomEvent<{ value: string }>
                ).detail.value)}
            ></pl-input>
          </pl-field>
          <pl-field>
            <label slot="label">Subject</label>
            <pl-input
              .value=${this.subject}
              @pl-input=${(event: Event) =>
                (this.subject = (
                  event as CustomEvent<{ value: string }>
                ).detail.value)}
            ></pl-input>
          </pl-field>
          <pl-field>
            <label slot="label">Body</label>
            <pl-textarea
              rows="8"
              .value=${this.body}
              @pl-input=${(event: Event) =>
                (this.body = (
                  event as CustomEvent<{ value: string }>
                ).detail.value)}
            ></pl-textarea>
          </pl-field>
        </div>
        <pl-button slot="footer" data-close="cancel">Cancel</pl-button>
        <pl-button slot="footer" variant="primary" @click=${this.#send}
          >Send</pl-button
        >
      </pl-drawer>
      <pl-toaster></pl-toaster>`;
  }

  static override styles = css`
    :host {
      display: block;
      box-sizing: border-box;
      block-size: calc(var(--pl-spacing) * 150);
      inline-size: min(100%, calc(var(--pl-spacing) * 240));
      margin-inline: auto;
      border: 1px solid var(--pl-color-border);
      border-radius: var(--pl-radius-lg);
      background: var(--pl-color-background);
      color: var(--pl-color-foreground);
      font: 400 var(--pl-text-base) / var(--pl-leading-normal)
        var(--pl-font-sans);
      overflow: hidden;
    }

    .shell {
      container-type: inline-size;
      block-size: 100%;
    }

    pl-resizable {
      block-size: 100%;
    }

    .back {
      display: none;
    }

    @container (max-width: 40rem) {
      .folders-pane,
      pl-resizable-handle,
      pl-resizable:not(.opened) .reading-pane,
      pl-resizable.opened .list-pane {
        display: none;
      }

      pl-resizable-panel {
        flex: 1 1 0% !important;
      }

      .back {
        display: inline-flex;
      }
    }

    .folders {
      display: grid;
      gap: var(--pl-space-3);
      padding: var(--pl-space-3);
    }

    pl-toolbar pl-input {
      flex: 1 1 calc(var(--pl-spacing) * 40);
      min-inline-size: 0;
      max-inline-size: 100%;
    }

    pl-context-menu {
      display: block;
    }

    pl-item.unread .from {
      font-weight: 700;
    }

    pl-item.read .from {
      font-weight: 400;
    }

    .from,
    .subject {
      display: block;
    }

    .subject {
      font-weight: 400;
    }

    .preview {
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 1;
      line-clamp: 1;
      overflow: hidden;
    }

    pl-item time {
      align-self: start;
      color: var(--pl-color-muted-foreground);
      font-size: var(--pl-text-xs);
    }

    pl-item[selected] {
      background: var(--pl-color-selected);
      color: var(--pl-color-selected-foreground);
    }

    pl-item[selected] .preview,
    pl-item[selected] time {
      color: var(--pl-color-selected-foreground);
    }

    .empty {
      display: grid;
      place-items: center;
      padding: var(--pl-space-4);
    }

    .reading {
      display: grid;
      gap: var(--pl-space-3);
      justify-items: start;
      padding: var(--pl-space-4);
    }

    .reading h2 {
      margin: 0;
      font: 600 var(--pl-text-xl) / var(--pl-leading-tight) var(--pl-font-sans);
      overflow-wrap: anywhere;
    }

    .reading p {
      margin: 0;
      overflow-wrap: anywhere;
    }

    .reading .meta {
      color: var(--pl-color-muted-foreground);
      font-size: var(--pl-text-sm);
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--pl-space-2);
    }

    .compose {
      display: grid;
      gap: var(--pl-space-4);
    }
  `;
}

if (!customElements.get("mail-demo"))
  customElements.define("mail-demo", MailDemo);

const page = (content: unknown) =>
  html`<div style="padding:var(--pl-space-4)">${content}</div>`;

/** Folders, the message list and the reading pane. Unread rows carry an Unread badge; each row has a context menu. */
export const Default: Story = {
  render: () => page(html`<mail-demo selected="m2"></mail-demo>`),
};

/** On a narrow screen one pane shows at a time: the list, then the opened message with a Back button. */
export const Narrow: Story = {
  render: () =>
    page(
      html`<div style="inline-size:calc(var(--pl-spacing) * 100)">
        <mail-demo></mail-demo>
      </div>`,
    ),
};

export const Rtl: Story = {
  render: () => page(html`<mail-demo selected="m2"></mail-demo>`),
  globals: { dir: "rtl" },
};

export const Glass: Story = {
  render: () => page(html`<mail-demo selected="m2"></mail-demo>`),
  globals: { material: "glass", theme: "dark", contrast: "more" },
};
