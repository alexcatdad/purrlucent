import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { expect, waitFor } from "storybook/test";
import "./table.ts";
import type { PlTable } from "./table.ts";
import { underGlass } from "../../../.storybook/under-glass.ts";

const meta = { title: "Data/Table" } satisfies Meta;

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
