import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { expect, userEvent, waitFor } from "storybook/test";
import "./data-table.ts";
import type { PlDataTable, PlDataTableColumn } from "./data-table.ts";

const meta = { title: "Data/Data Table" } satisfies Meta;

export default meta;

type Story = StoryObj;

const columns: PlDataTableColumn[] = [
  { key: "name", label: "Name", sortable: true },
  { key: "role", label: "Role", sortable: true },
  { key: "age", label: "Age", sortable: true, align: "end" },
];

const rows = [
  { id: "ada", name: "Ada Lovelace", role: "Mathematician", age: 36 },
  { id: "grace", name: "Grace Hopper", role: "Rear admiral", age: 85 },
  {
    id: "katherine",
    name: "Katherine Johnson",
    role: "Mathematician",
    age: 101,
  },
  { id: "margaret", name: "Margaret Hamilton", role: "Engineer", age: 88 },
];

const render = () => html`
  <pl-data-table
    id="control"
    caption="Pioneers"
    .columns=${columns}
    .rows=${rows}
  ></pl-data-table>
`;

const control = async (canvasElement: HTMLElement) => {
  const el = canvasElement.querySelector<PlDataTable>("#control")!;
  await el.updateComplete;
  return el;
};

// Stories that other tests open as they are have no play function: a play
// function would change the sort or selection before the test starts.
export const Default: Story = { render };

export const Glass: Story = {
  render,
  globals: { material: "glass", theme: "dark", contrast: "more", dir: "ltr" },
};

export const Light: Story = { render, globals: { theme: "light" } };

export const Dark: Story = { render, globals: { theme: "dark" } };

export const MoreContrast: Story = { render, globals: { contrast: "more" } };

/** A sorted column starts the table in that order. */
export const Sorted: Story = {
  render: () => html`
    <pl-data-table
      id="control"
      caption="Pioneers"
      sort-column="age"
      sort-direction="descending"
      .columns=${columns}
      .rows=${rows}
    ></pl-data-table>
  `,
};

/** Each row has a checkbox, and the header selects all or shows mixed. */
export const Selectable: Story = {
  render: () => html`
    <pl-data-table
      id="control"
      caption="Pioneers"
      selectable
      .columns=${columns}
      .rows=${rows}
      .selected=${["grace"]}
    ></pl-data-table>
  `,
};

const roster = [
  ...rows,
  { id: "mary", name: "Mary Jackson", role: "Engineer", age: 76 },
  { id: "hedy", name: "Hedy Lamarr", role: "Inventor", age: 85 },
  { id: "annie", name: "Annie Easley", role: "Computer scientist", age: 72 },
  { id: "radia", name: "Radia Perlman", role: "Network engineer", age: 74 },
  { id: "rene", name: "René Descartes", role: "Philosopher", age: 53 },
];

/** The search field keeps the rows that match any column, ignoring case and accents. */
export const Filterable: Story = {
  render: () => html`
    <pl-data-table
      id="control"
      caption="Pioneers"
      filterable
      .columns=${columns}
      .rows=${roster}
    >
      <span slot="empty">Nobody matches this filter.</span>
    </pl-data-table>
  `,
};

/** With a page size the rows are paged and pagination moves through them. */
export const Paginated: Story = {
  render: () => html`
    <pl-data-table
      id="control"
      caption="Pioneers"
      page-size="4"
      .columns=${columns}
      .rows=${roster}
    ></pl-data-table>
  `,
};

/** With no rows, the empty slot replaces the body. */
export const Empty: Story = {
  render: () => html`
    <pl-data-table
      id="control"
      caption="Pioneers"
      selectable
      .columns=${columns}
    >
      <span slot="empty">Nobody matches this filter.</span>
    </pl-data-table>
  `,
};

/** With a bounded height the headings stay while the rows scroll. */
export const StickyHeader: Story = {
  render: () => html`
    <pl-data-table
      id="control"
      caption="Pioneers"
      sticky-header
      style="max-block-size: calc(var(--pl-spacing) * 50)"
      .columns=${columns}
      .rows=${[...rows, ...rows.map((r) => ({ ...r, id: `${r.id}-2` }))]}
    ></pl-data-table>
  `,
};

/** Under right-to-left the columns and the sort glyphs mirror. */
export const Rtl: Story = { render, globals: { dir: "rtl" } };

/** Enter on a focused heading button sorts by it. */
export const Keyboard: Story = {
  render,
  play: async ({ canvasElement }) => {
    const el = await control(canvasElement);
    el.shadowRoot!.querySelector<HTMLButtonElement>("th button")!.focus();
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(el.sortColumn).toBe("name"));
    expect(el.sortDirection).toBe("ascending");
  },
};
