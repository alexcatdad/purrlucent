import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { LitElement, css, html, nothing, svg } from "lit";
import { repeat } from "lit/directives/repeat.js";
import "../components/badge/badge.ts";
import "../components/button/button.ts";
import "../components/card/card.ts";
import "../components/chart/chart.ts";
import "../components/menu/menu.ts";
import "../components/select/select.ts";
import "../components/sidebar/sidebar.ts";
import "../components/table/table.ts";

const meta = {
  title: "Patterns/Dashboard",
} satisfies Meta;

export default meta;

type Story = StoryObj;

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const usdCents = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});
const collator = new Intl.Collator("en-US", { numeric: true });
const money = (value: number) => usd.format(value);

/** Fictional weekly takings, oldest first. */
const weeks = [
  "Jun 9",
  "Jun 16",
  "Jun 23",
  "Jun 30",
  "Jul 7",
  "Jul 14",
  "Jul 21",
  "Jul 28",
  "Aug 4",
  "Aug 11",
  "Aug 18",
  "Aug 25",
];
const takings = [
  31200, 33400, 32100, 35800, 36900, 35200, 38400, 40100, 39300, 41800, 43200,
  44600,
];

type Tone = "good" | "bad" | "flat";
interface Change {
  text: string;
  tone: Tone;
}
interface Range {
  label: string;
  weeks: number;
  orders: string;
  customers: string;
  refunds: string;
  changes: [Change, Change, Change, Change];
  channels: { channel: string; orders: number }[];
}

const ranges: Record<string, Range> = {
  "4": {
    label: "Last 4 weeks",
    weeks: 4,
    orders: "1,240",
    customers: "318",
    refunds: "1.8%",
    changes: [
      { text: "Up 4%", tone: "good" },
      { text: "Up 2%", tone: "good" },
      { text: "Down 3%", tone: "flat" },
      { text: "Up 0.3 points", tone: "bad" },
    ],
    channels: [
      { channel: "Direct", orders: 410 },
      { channel: "Search", orders: 360 },
      { channel: "Email", orders: 270 },
      { channel: "Referral", orders: 200 },
    ],
  },
  "8": {
    label: "Last 8 weeks",
    weeks: 8,
    orders: "2,420",
    customers: "604",
    refunds: "1.7%",
    changes: [
      { text: "Up 9%", tone: "good" },
      { text: "Up 5%", tone: "good" },
      { text: "Up 1%", tone: "good" },
      { text: "Down 0.1 points", tone: "good" },
    ],
    channels: [
      { channel: "Direct", orders: 800 },
      { channel: "Search", orders: 700 },
      { channel: "Email", orders: 540 },
      { channel: "Referral", orders: 380 },
    ],
  },
  "12": {
    label: "Last 12 weeks",
    weeks: 12,
    orders: "3,610",
    customers: "905",
    refunds: "1.9%",
    changes: [
      { text: "Up 12%", tone: "good" },
      { text: "Up 8%", tone: "good" },
      { text: "No change", tone: "flat" },
      { text: "Up 0.2 points", tone: "bad" },
    ],
    channels: [
      { channel: "Direct", orders: 1190 },
      { channel: "Search", orders: 1050 },
      { channel: "Email", orders: 800 },
      { channel: "Referral", orders: 570 },
    ],
  },
};

/** The chart rows per range, built once so a re-render never redraws a chart. */
const revenueRows = Object.fromEntries(
  Object.entries(ranges).map(([key, { weeks: n }]) => [
    key,
    weeks
      .slice(-n)
      .map((week, i) => ({ week, revenue: takings.slice(-n)[i]! })),
  ]),
);

const kpisOf = ({ weeks: n, orders, customers, refunds, changes }: Range) =>
  [
    {
      name: "Revenue",
      value: money(takings.slice(-n).reduce((a, b) => a + b, 0)),
      change: changes[0],
    },
    { name: "Orders", value: orders, change: changes[1] },
    { name: "New customers", value: customers, change: changes[2] },
    { name: "Refund rate", value: refunds, change: changes[3] },
  ] as const;

const variants = {
  good: "accent",
  bad: "destructive",
  flat: "neutral",
} as const;

type Status = "Paid" | "Pending" | "Refunded" | "Failed";
interface Order {
  id: number;
  customer: string;
  status: Status;
  total: number;
}

const statusVariant = {
  Paid: "accent",
  Pending: "neutral",
  Refunded: "neutral",
  Failed: "destructive",
} as const;

const seedOrders: Order[] = [
  { id: 1048, customer: "Jonas Lindqvist", status: "Paid", total: 128.4 },
  { id: 1047, customer: "Noor Haddad", status: "Pending", total: 64 },
  { id: 1046, customer: "Avery Stone", status: "Paid", total: 212.15 },
  { id: 1045, customer: "Mina Okafor", status: "Failed", total: 89.99 },
  { id: 1044, customer: "Leo Marchetti", status: "Refunded", total: 45.5 },
  { id: 1043, customer: "Sana Iyer", status: "Paid", total: 301 },
  { id: 1042, customer: "Tomas Novak", status: "Pending", total: 18.75 },
  { id: 1041, customer: "Priya Raman", status: "Paid", total: 156.2 },
];

type SortKey = "id" | "customer" | "status" | "total";
type Direction = "ascending" | "descending";

const columns: { key: SortKey; label: string; align?: "end" }[] = [
  { key: "id", label: "Order" },
  { key: "customer", label: "Customer" },
  { key: "status", label: "Status" },
  { key: "total", label: "Total", align: "end" },
];

const glyph = {
  ascending: svg`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 15l6 -6l6 6" /></svg>`,
  descending: svg`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6l6 -6" /></svg>`,
  none: svg`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 9l4 -4l4 4" /><path d="M16 15l-4 4l-4 -4" /></svg>`,
};

// design/icons/more.svg
const more = html`<svg
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
>
  <circle cx="5" cy="12" r="1.45" />
  <circle cx="12" cy="12" r="1.45" />
  <circle cx="19" cy="12" r="1.45" />
</svg>`;

/**
 * The analytics dashboard: a sidebar, a header with the date range, KPI tiles,
 * two charts and a sortable table of recent orders with a menu per row. It is
 * the demo's own element, not a library component. The date range changes the
 * tiles and both charts; the table sorts in place; Refund and Delete in a row
 * menu change the table and say so in the status line. `narrow` fixes a phone
 * width and starts the sidebar collapsed.
 */
class DashboardDemo extends LitElement {
  static override properties = {
    narrow: { type: Boolean, reflect: true },
    range: { state: true },
    sortKey: { state: true },
    sortDirection: { state: true },
    orders: { state: true },
    note: { state: true },
  };

  declare narrow: boolean;
  declare range: string;
  declare sortKey: SortKey;
  declare sortDirection: Direction;
  declare orders: Order[];
  declare note: string;

  constructor() {
    super();
    this.narrow = false;
    this.range = "8";
    this.sortKey = "id";
    this.sortDirection = "descending";
    this.orders = seedOrders;
    this.note = "";
  }

  get #rows() {
    const sign = this.sortDirection === "descending" ? -1 : 1;
    const key = this.sortKey;
    return [...this.orders].sort((a, b) =>
      key === "customer" || key === "status"
        ? sign * collator.compare(a[key], b[key])
        : sign * (a[key] - b[key]),
    );
  }

  #sort(key: SortKey) {
    this.sortDirection =
      this.sortKey === key && this.sortDirection === "ascending"
        ? "descending"
        : "ascending";
    this.sortKey = key;
  }

  #act(order: Order, action: string) {
    if (action === "view") this.note = `Viewing order ${order.id}.`;
    else if (action === "refund") {
      this.orders = this.orders.map((o) =>
        o.id === order.id ? { ...o, status: "Refunded" } : o,
      );
      this.note = `Order ${order.id} refunded.`;
    } else {
      const index = this.#rows.findIndex((o) => o.id === order.id);
      this.orders = this.orders.filter((o) => o.id !== order.id);
      this.note = `Order ${order.id} deleted.`;
      // The row that held focus is gone; move to the row that took its place.
      void this.updateComplete.then(() => {
        const triggers = this.renderRoot.querySelectorAll<HTMLElement>(
          "pl-menu > [slot=trigger]",
        );
        triggers[Math.min(index, triggers.length - 1)]?.focus();
      });
    }
  }

  #kpi(kpi: ReturnType<typeof kpisOf>[number], span: number) {
    return html`<li>
      <pl-card>
        <span slot="title">${kpi.name}</span>
        <span slot="description">${ranges[this.range]!.label}</span>
        <p class="value">${kpi.value}</p>
        <p class="change">
          <pl-badge variant=${variants[kpi.change.tone]}
            >${kpi.change.text}</pl-badge
          >
          <span>from the previous ${span} weeks</span>
        </p>
      </pl-card>
    </li>`;
  }

  #heading(column: (typeof columns)[number]) {
    const sorted = this.sortKey === column.key;
    return html`<th
      scope="col"
      align=${column.align ?? nothing}
      aria-sort=${sorted ? this.sortDirection : nothing}
    >
      <pl-button
        class="sort"
        variant="ghost"
        @pl-press=${() => this.#sort(column.key)}
        >${column.label}${glyph[sorted ? this.sortDirection : "none"]}</pl-button
      >
    </th>`;
  }

  #row(order: Order) {
    return html`<tr>
      <th scope="row">#${order.id}</th>
      <td>${order.customer}</td>
      <td>
        <pl-badge variant=${statusVariant[order.status]}
          >${order.status}</pl-badge
        >
      </td>
      <td align="end">${usdCents.format(order.total)}</td>
      <td align="end">
        <pl-menu
          label=${`Order ${order.id}`}
          @pl-select=${(event: CustomEvent<{ value: string }>) =>
            this.#act(order, event.detail.value)}
        >
          <pl-button
            slot="trigger"
            icon
            variant="ghost"
            aria-label=${`Actions for order ${order.id}`}
            >${more}</pl-button
          >
          <pl-menu-item value="view">View</pl-menu-item>
          <pl-menu-item value="refund" ?disabled=${order.status !== "Paid"}
            >Refund</pl-menu-item
          >
          <pl-menu-separator></pl-menu-separator>
          <pl-menu-item value="delete" destructive>Delete</pl-menu-item>
        </pl-menu>
      </td>
    </tr>`;
  }

  override render() {
    const range = ranges[this.range]!;
    const period = range.label.toLowerCase();
    return html`<div class="frame">
      <div class="layout">
        <pl-sidebar
          label="Main"
          toggle-label="Main navigation"
          ?collapsed=${this.narrow}
        >
          <pl-sidebar-item href="#overview" selected>Overview</pl-sidebar-item>
          <pl-sidebar-item href="#customers">Customers</pl-sidebar-item>
          <pl-sidebar-item href="#orders">Orders</pl-sidebar-item>
          <pl-sidebar-item href="#settings">Settings</pl-sidebar-item>
        </pl-sidebar>
        <main>
          <header class="head">
            <h1>Overview</h1>
            <div class="tools">
              <pl-select
                label="Date range"
                value=${this.range}
                @pl-change=${(event: CustomEvent<{ value: string }>) =>
                  (this.range = event.detail.value)}
              >
                ${Object.entries(ranges).map(
                  ([value, { label }]) =>
                    html`<pl-option value=${value}>${label}</pl-option>`,
                )}
              </pl-select>
              <pl-button
                variant="primary"
                @pl-press=${() => (this.note = "Report exported.")}
                >Export report</pl-button
              >
            </div>
          </header>
          <p class="note" role="status">${this.note}</p>
          <ul class="kpis" role="list" aria-label=${`Key figures, ${period}`}>
            ${kpisOf(range).map((kpi) => this.#kpi(kpi, range.weeks))}
          </ul>
          <div class="charts">
            <pl-card>
              <h2 slot="title">Revenue by week</h2>
              <span slot="description">${range.label}, in US dollars</span>
              <pl-chart
                label=${`Revenue by week, ${period}, in US dollars`}
                type="line"
                x="week"
                y="revenue"
                x-label="Week starting"
                y-label="Revenue (US dollars)"
                aspect-ratio="2"
                .format=${money}
                .data=${revenueRows[this.range]}
              ></pl-chart>
            </pl-card>
            <pl-card>
              <h2 slot="title">Orders by channel</h2>
              <span slot="description">${range.label}, in orders</span>
              <pl-chart
                label=${`Orders by channel, ${period}, in orders`}
                type="bar"
                x="channel"
                y="orders"
                x-label="Channel"
                y-label="Orders"
                aspect-ratio="2"
                .data=${range.channels}
              ></pl-chart>
            </pl-card>
          </div>
          <pl-card class="orders">
            <h2 slot="title">Recent orders</h2>
            <pl-table label="Recent orders">
              <table aria-label="Recent orders">
                <thead>
                  <tr>
                    ${columns.map((column) => this.#heading(column))}
                    <th scope="col" class="actions">
                      <span class="sr">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  ${repeat(
                    this.#rows,
                    (order) => order.id,
                    (order) => this.#row(order),
                  )}
                </tbody>
              </table>
            </pl-table>
          </pl-card>
        </main>
      </div>
    </div>`;
  }

  static override styles = css`
    :host {
      display: block;
      inline-size: min(100%, calc(var(--pl-spacing) * 300));
      margin-inline: auto;
    }

    :host([narrow]) {
      inline-size: min(100%, calc(var(--pl-spacing) * 90));
    }

    /* The layout answers to the frame's own width, in em so it follows text size. */
    .frame {
      container-type: inline-size;
      border: 1px solid var(--pl-color-border);
      border-radius: var(--pl-radius-lg);
      background: var(--pl-color-background);
      color: var(--pl-color-foreground);
      font: 400 var(--pl-text-base) / var(--pl-leading-normal)
        var(--pl-font-sans);
    }

    .layout {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      align-items: start;
      gap: var(--pl-space-4);
      padding: var(--pl-space-4);
    }

    @container (max-width: 56em) {
      .layout {
        grid-template-columns: minmax(0, 1fr);
      }

      pl-sidebar:not([collapsed]) {
        inline-size: 100%;
      }
    }

    main {
      display: grid;
      gap: var(--pl-space-4);
      min-inline-size: 0;
    }

    .head {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--pl-space-3);
    }

    h1,
    h2,
    p {
      margin: 0;
    }

    h1 {
      font-size: var(--pl-text-xl);
      font-weight: 700;
      line-height: calc(var(--pl-text-xl) * 1.25);
    }

    .tools {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--pl-gap-controls);
    }

    .note {
      color: var(--pl-color-muted-foreground);
    }

    ul {
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .kpis {
      display: grid;
      grid-template-columns: repeat(
        auto-fit,
        minmax(min(100%, calc(var(--pl-spacing) * 44)), 1fr)
      );
      gap: var(--pl-space-4);
    }

    .charts {
      display: grid;
      grid-template-columns: repeat(
        auto-fit,
        minmax(min(100%, calc(var(--pl-spacing) * 80)), 1fr)
      );
      gap: var(--pl-space-4);
    }

    .kpis pl-card,
    .charts pl-card {
      block-size: 100%;
    }

    h2 {
      font: inherit;
    }

    .value {
      font-size: var(--pl-text-xl);
      font-weight: 700;
      line-height: calc(var(--pl-text-xl) * 1.25);
      font-variant-numeric: tabular-nums;
    }

    .change {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--pl-space-2);
      margin-block-start: var(--pl-space-2);
      color: var(--pl-color-muted-foreground);
    }

    .orders pl-table :is(th, td) {
      padding-inline: var(--pl-space-3);
    }

    .orders pl-table th[scope="row"] {
      color: var(--pl-color-foreground);
      font-weight: 400;
    }

    /* The sort button's label lines up with the cell text beside it. */
    .sort {
      margin-inline: calc(var(--pl-pad-control) * -1);
    }

    .sort:hover,
    th[aria-sort] .sort {
      color: var(--pl-color-foreground);
    }

    /* The actions heading is for assistive technology: a strip as wide as the cell. */
    .actions {
      position: relative;
    }

    .sr {
      position: absolute;
      inset-inline: 0;
      inset-block-start: 0;
      block-size: 1px;
      overflow: hidden;
      overflow-wrap: anywhere;
      clip-path: inset(50%);
    }
  `;
}

if (!customElements.get("dashboard-demo"))
  customElements.define("dashboard-demo", DashboardDemo);

const page = (content: unknown) =>
  html`<div style="padding:var(--pl-space-4)">${content}</div>`;

/** The full dashboard: sidebar beside the content, KPI tiles, two charts and the orders table. */
export const Default: Story = {
  render: () => page(html`<dashboard-demo></dashboard-demo>`),
};

/** A phone-width container: one column, the sidebar collapsed to its toggle and the table scrolling inside its card. */
export const Narrow: Story = {
  render: () => page(html`<dashboard-demo narrow></dashboard-demo>`),
};

export const Rtl: Story = {
  render: () => page(html`<dashboard-demo></dashboard-demo>`),
  globals: { dir: "rtl" },
};

export const Glass: Story = {
  render: () => page(html`<dashboard-demo></dashboard-demo>`),
  globals: { material: "glass", theme: "dark", contrast: "more" },
};
