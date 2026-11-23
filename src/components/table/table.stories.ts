import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { expect, waitFor } from "storybook/test";
import "./table.ts";
import type { PlTable } from "./table.ts";

const meta = { title: "Components/Table" } satisfies Meta;

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
  render,
  globals: { material: "glass", theme: "dark", contrast: "more", dir: "ltr" },
};

export const Light: Story = { render, globals: { theme: "light" } };

export const Dark: Story = { render, globals: { theme: "dark" } };

export const MoreContrast: Story = { render, globals: { contrast: "more" } };

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
