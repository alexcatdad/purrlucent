import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { expect, userEvent, waitFor } from "storybook/test";
import "./data-table.ts";
import type {
  PlDataTable,
  PlDataTableColumn,
  PlDataTableModel,
  PlDataTableRow,
  PlModelCell,
  PlModelColumn,
  PlModelRow,
  PlPin,
} from "./data-table.ts";

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

type Person = {
  id: string;
  name: string;
  role: string;
  city: string;
  salary: number;
  score: number;
};

const team: Record<string, { name: string; members: Person[] }> = {
  eng: {
    name: "Engineering",
    members: [
      {
        id: "ada",
        name: "Ada Lovelace",
        role: "Mathematician",
        city: "London",
        salary: 96,
        score: 9.1,
      },
      {
        id: "grace",
        name: "Grace Hopper",
        role: "Rear admiral",
        city: "New York",
        salary: 104,
        score: 8.7,
      },
      {
        id: "margaret",
        name: "Margaret Hamilton",
        role: "Lead engineer",
        city: "Boston",
        salary: 112,
        score: 9.4,
      },
    ],
  },
  design: {
    name: "Design",
    members: [
      {
        id: "hedy",
        name: "Hedy Lamarr",
        role: "Inventor",
        city: "Vienna",
        salary: 88,
        score: 8.2,
      },
      {
        id: "radia",
        name: "Radia Perlman",
        role: "Network designer",
        city: "Seattle",
        salary: 92,
        score: 8.9,
      },
    ],
  },
};

const modelColumns: PlModelColumn[] = [
  {
    key: "name",
    label: "Name",
    visible: true,
    canHide: false,
    pinned: "start",
    width: 200,
  },
  { key: "role", label: "Role", visible: true, canHide: true, width: 200 },
  { key: "city", label: "City", visible: true, canHide: true, width: 160 },
  {
    key: "salary",
    label: "Salary (k)",
    visible: true,
    canHide: true,
    width: 140,
  },
  {
    key: "score",
    label: "Score",
    visible: true,
    canHide: false,
    pinned: "end",
    width: 120,
  },
];

const pins = { name: "start", score: "end" } as const;

const rowCells = (
  id: string,
  values: Record<string, unknown>,
  aggregate = false,
): PlModelCell[] =>
  modelColumns.map(({ key }) => ({
    id: `${id}-${key}`,
    column: key,
    value: values[key] ?? "",
    aggregate: aggregate && key !== "name" && values[key] !== undefined,
    pinned: pins[key as keyof typeof pins],
  }));

const mean = (values: number[]) =>
  values.reduce((sum, value) => sum + value, 0) / values.length;

const everyone = Object.values(team).flatMap((t) => t.members);

/** A hand-written model: spans, groups with aggregates, a pinned row and two pinned columns. */
const groupedModel = (open: ReadonlySet<string>): PlDataTableModel => {
  return {
    columns: modelColumns,
    headerGroups: [
      [
        { id: "h-person", label: "Person", colSpan: 3 },
        { id: "h-numbers", label: "Numbers", colSpan: 2 },
      ],
      modelColumns.map((c) => ({
        id: `h-${c.key}`,
        column: c.key,
        label: c.label,
        colSpan: 1,
        sortable: c.key === "salary",
        sort: c.key === "name" ? ("ascending" as const) : undefined,
        pinned: c.pinned,
        width: c.width,
      })),
    ],
    rows: [
      {
        id: "katherine",
        depth: 0,
        pinned: "top",
        cells: rowCells("katherine", {
          name: "Katherine Johnson",
          role: "Mathematician",
          city: "Hampton",
          salary: 99,
          score: 9.6,
        }),
      },
      ...Object.entries(team).flatMap(([id, { name, members }]) => [
        {
          id,
          depth: 0,
          expandable: true,
          expanded: open.has(id),
          group: { column: "team", value: name, count: members.length },
          cells: rowCells(
            id,
            {
              salary: Math.round(mean(members.map((m) => m.salary))),
              score: mean(members.map((m) => m.score)).toFixed(1),
            },
            true,
          ),
        },
        ...(open.has(id) ? members : []).map((person) => ({
          id: person.id,
          depth: 1,
          cells: rowCells(person.id, person),
        })),
      ]),
    ],
    footer: [
      { id: "f-label", column: "name", value: "Average", colSpan: 3 },
      {
        id: "f-salary",
        column: "salary",
        value: Math.round(mean(everyone.map((p) => p.salary))),
      },
      {
        id: "f-score",
        column: "score",
        value: mean(everyone.map((p) => p.score)).toFixed(1),
        pinned: "end",
      },
    ],
  };
};

const modelGrouped = () => {
  const open = new Set(["eng"]);
  return html`
    <pl-data-table
      id="control"
      caption="Teams"
      style="max-inline-size: calc(var(--pl-spacing) * 120)"
      .model=${groupedModel(open)}
      @pl-expand=${(e: CustomEvent<{ row: string; expanded: boolean }>) => {
        if (e.detail.expanded) open.add(e.detail.row);
        else open.delete(e.detail.row);
        (e.currentTarget as PlDataTable).model = groupedModel(open);
      }}
    ></pl-data-table>
  `;
};

/** The table draws a supplied model: header groups, group rows, aggregates, a pinned row and pinned columns. */
export const ModelGrouped: Story = { render: modelGrouped };

/** In a right-to-left page the start column pins to the right edge. */
export const ModelGroupedRtl: Story = {
  render: modelGrouped,
  globals: { dir: "rtl" },
};

interface InteractiveState {
  columns: PlModelColumn[];
  sort?: { column: string; direction: "ascending" | "descending" };
  role: string;
  rowPins: Record<string, "top" | "bottom">;
  cells: Set<string>;
}

/** The model for the current state: the app, not the table, applies every change. */
const interactiveModel = (state: InteractiveState): PlDataTableModel => {
  const shown = state.columns.filter((c) => c.visible);
  const key = state.sort?.column as keyof Person | undefined;
  const sign = state.sort?.direction === "descending" ? -1 : 1;
  const people = everyone
    .filter((p) => p.role.toLowerCase().includes(state.role.toLowerCase()))
    .sort((a, b) =>
      key
        ? sign *
          String(a[key]).localeCompare(String(b[key]), undefined, {
            numeric: true,
          })
        : 0,
    );
  const pinned = (side: "top" | "bottom" | undefined) =>
    people.filter((p) => state.rowPins[p.id] === side);
  return {
    columns: state.columns,
    headerGroups: [
      shown.map((c) => ({
        id: `h-${c.key}`,
        column: c.key,
        label: c.label,
        colSpan: 1,
        sortable: true,
        sort: state.sort?.column === c.key ? state.sort.direction : undefined,
        filter:
          c.key === "role"
            ? {
                value: state.role,
                facets: [...new Set(everyone.map((p) => p.role))],
              }
            : undefined,
        pinned: c.pinned,
        width: c.width,
        resizable: true,
      })),
    ],
    rows: [...pinned("top"), ...pinned(undefined), ...pinned("bottom")].map(
      (p) => ({
        id: p.id,
        depth: 0,
        pinned: state.rowPins[p.id],
        cells: shown.map((c) => ({
          id: `${p.id}-${c.key}`,
          column: c.key,
          value: p[c.key as keyof Person],
          pinned: c.pinned,
          selected: state.cells.has(`${p.id}-${c.key}`),
        })),
      }),
    ),
  };
};

const modelInteractive = () => {
  const state: InteractiveState = {
    columns: modelColumns.map((c) => ({ ...c, resizable: true })),
    role: "",
    rowPins: {},
    cells: new Set(),
  };
  const column = (key: string) => state.columns.find((c) => c.key === key)!;
  const on =
    <T>(change: (detail: T) => void) =>
    (e: CustomEvent<T>) => {
      change(e.detail);
      (e.currentTarget as PlDataTable).model = interactiveModel(state);
    };
  return html`
    <pl-data-table
      id="control"
      caption="People"
      row-menu
      cell-select
      style="max-inline-size: calc(var(--pl-spacing) * 240)"
      .model=${interactiveModel(state)}
      @pl-sort=${on<NonNullable<InteractiveState["sort"]>>((d) => (state.sort = d))}
      @pl-filter=${on<{ value: string }>((d) => (state.role = d.value))}
      @pl-column-visibility=${on<{ column: string; visible: boolean }>(
        (d) => (column(d.column).visible = d.visible),
      )}
      @pl-column-order=${on<{ column: string; index: number }>((d) => {
        const [moved] = state.columns.splice(
          state.columns.indexOf(column(d.column)),
          1,
        );
        state.columns.splice(d.index, 0, moved!);
      })}
      @pl-column-pin=${on<{ column: string; side: PlPin | null }>(
        (d) => (column(d.column).pinned = d.side ?? undefined),
      )}
      @pl-column-resize=${on<{ column: string; width: number }>(
        (d) => (column(d.column).width = d.width),
      )}
      @pl-column-group=${on<{ column: string; grouped: boolean }>(
        (d) => (column(d.column).grouped = d.grouped),
      )}
      @pl-row-pin=${on<{ row: string; side: "top" | "bottom" | null }>((d) => {
        if (d.side) state.rowPins[d.row] = d.side;
        else delete state.rowPins[d.row];
      })}
      @pl-cell-select=${on<{ cells: string[] }>((d) => (state.cells = new Set(d.cells)))}
    ></pl-data-table>
  `;
};

/** Menus on the headings and rows, a Columns menu, a heading filter, resize handles and a selectable cell range, each answered by the app. */
export const ModelInteractive: Story = { render: modelInteractive };

/** The same table right to left: a leftward drag widens a column. */
export const ModelInteractiveRtl: Story = {
  render: modelInteractive,
  globals: { dir: "rtl" },
};

/** `renderCell` returns a template, a Node or a string in place of a cell's text; returning nothing keeps the text. */
export const RichCells: Story = {
  render: () => html`
    <pl-data-table
      id="control"
      caption="Pioneers"
      .columns=${columns}
      .rows=${rows}
      .renderCell=${(row: PlDataTableRow, column: PlDataTableColumn) => {
        if (column.key === "name")
          return html`<a href="#${row.id}">${row.name}</a>`;
        if (column.key === "role") {
          const node = document.createElement("em");
          node.textContent = String(row.role);
          return node;
        }
        if (column.key === "age")
          return html`<pl-checkbox
            aria-label="Verified ${row.name}"
          ></pl-checkbox>`;
        return undefined;
      }}
    ></pl-data-table>
  `,
};

/** In model mode a cell renderer receives the model row and column; the arrow keys still move between cells, and a button in a cell stays in the tab order. */
export const ModelRichCells: Story = {
  render: () => html`
    <pl-data-table
      id="control"
      caption="People"
      cell-select
      .model=${
        {
          columns: modelColumns.map((c) => ({
            ...c,
            pinned: undefined,
            width: undefined,
          })),
          headerGroups: [
            modelColumns.map((c) => ({
              id: `h-${c.key}`,
              column: c.key,
              label: c.label,
              colSpan: 1,
            })),
          ],
          rows: everyone.map((p) => ({
            id: p.id,
            depth: 0,
            cells: rowCells(p.id, p).map((cell) => ({
              ...cell,
              pinned: undefined,
            })),
          })),
        } satisfies PlDataTableModel
      }
      .renderCell=${(row: PlModelRow, column: PlModelColumn) => {
        const cell = row.cells.find((c) => c.column === column.key);
        if (column.key === "name")
          return html`<a href="#${row.id}">${cell?.value}</a>`;
        if (column.key === "city")
          return html`<pl-button>Map ${cell?.value}</pl-button>`;
        return undefined;
      }}
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

// The height of the scroll area: its border, the caption, the heading row and
// four whole body rows, each made of the same tokens the table pads with, so
// no row is cut off at the bottom at rest.
const bodyRow = "(var(--pl-leading-normal) + var(--pl-space-2) * 2 + 1px)";
const stickyHeight = `calc(2px + var(--pl-leading-normal) + var(--pl-space-3) * 2 + var(--pl-size-hit-min) + var(--pl-space-2) * 2 + 1px + ${bodyRow} * 4)`;

/** With a bounded height the headings stay while the rows scroll. */
export const StickyHeader: Story = {
  render: () => html`
    <pl-data-table
      id="control"
      caption="Pioneers"
      sticky-header
      style="max-block-size: ${stickyHeight}"
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
