import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import { expect, waitFor } from "storybook/test";
import "./table.ts";
import type { PlTable } from "./table.ts";
import { underGlass } from "../../../.storybook/under-glass.ts";

import { playground } from "../../../.storybook/playground.ts";

const meta = {
  title: "Data/Table",
  component: "pl-table",
  tags: ["autodocs"],
  parameters: { controls: { disable: true } },
} satisfies Meta;

export default meta;

type Story = StoryObj;

const people = [
  ["Ada Lovelace", "Mathematician", "36"],
  ["Grace Hopper", "Rear admiral", "85"],
  ["Katherine Johnson", "Mathematician", "101"],
  ["Margaret Hamilton", "Engineer", "88"],
  ["Annie Easley", "Computer scientist", "75"],
  ["Mary Jackson", "Engineer", "76"],
];

const table = (caption = "Pioneers", wide = false) => html`
  <table style=${wide ? "min-inline-size: calc(var(--pl-spacing) * 150)" : ""}>
    ${
      caption
        ? html`<caption>
            ${caption}
          </caption>`
        : ""
    }
    <thead>
      <tr>
        <th scope="col">Name</th>
        <th scope="col">Role</th>
        <th scope="col" align="end">Age</th>
      </tr>
    </thead>
    <tbody>
      ${people.map(
        ([name, role, age]) =>
          html`<tr>
            <th scope="row">${name}</th>
            <td>${role}</td>
            <td align="end">${age}</td>
          </tr>`,
      )}
    </tbody>
  </table>
`;

const render = () => html`<pl-table id="control">${table()}</pl-table>`;

const control = async (canvasElement: HTMLElement) => {
  const el = canvasElement.querySelector<PlTable>("#control")!;
  await el.updateComplete;
  return el;
};

export const Playground: Story = {
  ...playground({ caption: "Pioneers", striped: false }),
  render: ({ caption, striped }) =>
    html`<pl-table ?striped=${striped}>${table(caption)}</pl-table>`,
};

/** The caption names the table, and the table keeps its native semantics. */
export const Default: Story = { render };

export const Glass: Story = {
  render: () => underGlass(render()),
  globals: { material: "glass", theme: "dark", contrast: "more", dir: "ltr" },
};

export const Light: Story = { render, globals: { theme: "light" } };

export const Dark: Story = { render, globals: { theme: "dark" } };

export const MoreContrast: Story = { render, globals: { contrast: "more" } };

/** A two-row heading: the group headers span their columns with `colspan`. */
export const GroupedHeaders: Story = {
  render: () => html`
    <pl-table id="control">
      <table>
        <caption>
          Pioneers by field
        </caption>
        <thead>
          <tr>
            <th scope="col" rowspan="2">Name</th>
            <th scope="colgroup" colspan="2">Career</th>
            <th scope="colgroup" colspan="2">Life</th>
          </tr>
          <tr>
            <th scope="col">Role</th>
            <th scope="col">Years active</th>
            <th scope="col" align="end">Age</th>
            <th scope="col">Born</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Ada Lovelace</th>
            <td>Mathematician</td>
            <td>1833 to 1852</td>
            <td align="end">36</td>
            <td>London</td>
          </tr>
          <tr>
            <th scope="row">Grace Hopper</th>
            <td>Rear admiral</td>
            <td>1943 to 1986</td>
            <td align="end">85</td>
            <td>New York</td>
          </tr>
        </tbody>
      </table>
    </pl-table>
  `,
};

/** A cell spans rows with `rowspan`, so one group label covers several rows. */
export const MergedCells: Story = {
  render: () => html`
    <pl-table id="control">
      <table>
        <caption>
          Pioneers by role
        </caption>
        <thead>
          <tr>
            <th scope="col">Role</th>
            <th scope="col">Name</th>
            <th scope="col" align="end">Age</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row" rowspan="2">Mathematician</th>
            <td>Ada Lovelace</td>
            <td align="end">36</td>
          </tr>
          <tr>
            <td>Katherine Johnson</td>
            <td align="end">101</td>
          </tr>
          <tr>
            <th scope="row" rowspan="2">Engineer</th>
            <td>Margaret Hamilton</td>
            <td align="end">88</td>
          </tr>
          <tr>
            <td>Mary Jackson</td>
            <td align="end">76</td>
          </tr>
        </tbody>
      </table>
    </pl-table>
  `,
};

/** A table wider than its space scrolls, and the scroll area takes a tab stop. */
export const Overflow: Story = {
  render: () => html`
    <pl-table id="control" style="inline-size: calc(var(--pl-spacing) * 80)"
      >${table("Pioneers", true)}</pl-table
    >
  `,
  play: async ({ canvasElement }) => {
    const el = await control(canvasElement);
    const scroller =
      el.shadowRoot!.querySelector<HTMLElement>("[part=scroller]")!;
    await waitFor(() => expect(scroller.tabIndex).toBe(0));
  },
};

/** With a bounded height the heading stays while the rows scroll. */
export const StickyHeader: Story = {
  render: () => html`
    <pl-table
      id="control"
      sticky-header
      style="max-block-size: calc(var(--pl-spacing) * 50)"
      >${table()}</pl-table
    >
  `,
};

/** Without a caption, `label` names the scroll area. */
export const Labelled: Story = {
  render: () => html`
    <pl-table
      id="control"
      label="Pioneers"
      style="inline-size: calc(var(--pl-spacing) * 80)"
      >${table("", true)}</pl-table
    >
  `,
};

/** Under right-to-left the columns and the scroll origin mirror. */
export const Rtl: Story = {
  render: () => html`
    <pl-table id="control" style="inline-size: calc(var(--pl-spacing) * 80)"
      >${table("Pioneers", true)}</pl-table
    >
  `,
  globals: { dir: "rtl" },
};

/** A row with `data-interactive`, or a stretched link, tints on hover and rings on focus. */
export const InteractiveRows: Story = {
  render: () => html`
    <pl-table id="control" label="Pioneers">
      <table>
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Role</th>
          </tr>
        </thead>
        <tbody>
          <tr data-interactive tabindex="0" id="row-interactive">
            <th scope="row">Ada Lovelace</th>
            <td>Mathematician</td>
          </tr>
          <tr id="row-linked">
            <th scope="row">
              <a href="#grace" data-stretched id="row-link">Grace Hopper</a>
            </th>
            <td>Rear admiral</td>
          </tr>
          <tr id="row-plain">
            <th scope="row">Mary Jackson</th>
            <td>Engineer</td>
          </tr>
        </tbody>
      </table>
    </pl-table>
  `,
};

const body = (selectedRow = -1) =>
  people.map(
    ([name, role, age], i) =>
      html`<tr
        id=${`row-${i + 1}`}
        aria-selected=${ifDefined(i === selectedRow ? "true" : undefined)}
      >
        <th scope="row">${name}</th>
        <td>${role}</td>
        <td data-numeric>${age}</td>
      </tr>`,
  );

const header = html`<thead>
  <tr>
    <th scope="col">Name</th>
    <th scope="col">Role</th>
    <th scope="col" data-numeric>Age</th>
  </tr>
</thead>`;

/** Even body rows get a faint fill; hover and selection override it. */
export const Striped: Story = {
  render: () => html`
    <pl-table id="control" striped label="Pioneers">
      <table>
        ${header}
        <tbody>
          ${body(3)}
        </tbody>
      </table>
    </pl-table>
  `,
};

/** `aria-selected="true"` and `data-selected` give the same selection tint. */
export const SelectedRows: Story = {
  render: () => html`
    <pl-table id="control" label="Pioneers">
      <table>
        ${header}
        <tbody>
          <tr id="row-aria" aria-selected="true">
            <th scope="row">Ada Lovelace</th>
            <td>Mathematician</td>
            <td data-numeric>36</td>
          </tr>
          <tr id="row-data" data-selected>
            <th scope="row">Grace Hopper</th>
            <td>Rear admiral</td>
            <td data-numeric>85</td>
          </tr>
          <tr id="row-plain">
            <th scope="row">Mary Jackson</th>
            <td>Engineer</td>
            <td data-numeric>76</td>
          </tr>
        </tbody>
      </table>
    </pl-table>
  `,
};

/** Plain links take the accent and underline on hover; a stretched link keeps the row. */
export const Links: Story = {
  render: () => html`
    <pl-table id="control" label="Pioneers">
      <table>
        ${header}
        <tbody>
          <tr>
            <th scope="row">
              <a href="#ada" id="plain-link">Ada Lovelace</a>
            </th>
            <td>Mathematician</td>
            <td data-numeric>36</td>
          </tr>
          <tr id="row-linked">
            <th scope="row">
              <a href="#grace" data-stretched id="row-link">Grace Hopper</a>
            </th>
            <td>Rear admiral</td>
            <td data-numeric>85</td>
          </tr>
        </tbody>
      </table>
    </pl-table>
  `,
};

/** `density="compact"` tightens the row height and padding. */
export const Compact: Story = {
  render: () => html`
    <pl-table id="control" density="compact" label="Pioneers">
      <table>
        ${header}
        <tbody>
          ${body()}
        </tbody>
      </table>
    </pl-table>
  `,
};

/** The default density, for comparison. */
export const Regular: Story = {
  render: () => html`
    <pl-table id="control" label="Pioneers">
      <table>
        ${header}
        <tbody>
          ${body()}
        </tbody>
      </table>
    </pl-table>
  `,
};

/** Visually hidden text in a header cell stays inside the scroll area, so the page does not scroll sideways. */
/** A column of short words beside a wide one keeps its words whole. */
export const WordWidths: Story = {
  render: () => html`
    <pl-table id="control" label="Invoices">
      <table>
        <thead>
          <tr>
            <th scope="col">Invoice</th>
            <th scope="col">Status</th>
            <th scope="col">Vendor</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">
              Invoice 2026000418 settled against the October purchase order for
              the warehouse refit, second instalment of four
            </th>
            <td>Approved</td>
            <td>Presto AB</td>
          </tr>
        </tbody>
      </table>
    </pl-table>
  `,
};

export const ScreenReaderCell: Story = {
  render: () => html`
    <pl-table id="control" label="Pioneers">
      <table style="min-inline-size: calc(var(--pl-spacing) * 150)">
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Role</th>
            <th scope="col">
              <span
                style="position: absolute; inline-size: 1px; block-size: 1px; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap"
                >Actions</span
              >
            </th>
          </tr>
        </thead>
        <tbody>
          ${people.map(
            ([name, role]) =>
              html`<tr>
                <th scope="row">${name}</th>
                <td>${role}</td>
                <td><a href="#edit">Edit</a></td>
              </tr>`,
          )}
        </tbody>
      </table>
    </pl-table>
  `,
};

/** A `th[aria-sort]` holding a button is a sort control; the glyph follows `aria-sort`. */
export const SortableHeaders: Story = {
  render: () => html`
    <pl-table id="control" label="Pioneers">
      <table>
        <thead>
          <tr>
            <th scope="col" aria-sort="ascending">
              <button type="button" id="sort-name">Name</button>
            </th>
            <th scope="col" aria-sort="none">
              <button type="button" id="sort-role">Role</button>
            </th>
            <th scope="col" aria-sort="descending" align="end">
              <button type="button" id="sort-age">Age</button>
            </th>
          </tr>
        </thead>
        <tbody>
          ${people.map(
            ([name, role, age]) =>
              html`<tr>
                <th scope="row">${name}</th>
                <td>${role}</td>
                <td align="end">${age}</td>
              </tr>`,
          )}
        </tbody>
      </table>
    </pl-table>
  `,
};
