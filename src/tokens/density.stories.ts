import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import "../components/button/button.ts";
import "../components/input/input.ts";
import "../components/menu/menu.ts";
import "../components/select/select.ts";
import "../components/table/table.ts";

const meta = { title: "Foundations/Density" } satisfies Meta;

export default meta;

type Story = StoryObj;

/**
 * Controls, a menu row and a table row at the page's density. Switch the
 * Density toolbar item to `comfortable` to raise their heights, line heights
 * and vertical padding; widths and font sizes stay as they are.
 */
export const Controls: Story = {
  render: () => html`
    <div
      style="display:grid;justify-items:start;align-content:start;align-items:start;gap:var(--pl-space-3);padding:var(--pl-space-4);min-block-size:calc(var(--pl-spacing) * 90)"
    >
      <pl-button>Button</pl-button>
      <pl-input label="Name"></pl-input>
      <pl-select label="Apple variety" value="Fuji">
        <pl-option>McIntosh</pl-option>
        <pl-option>Fuji</pl-option>
      </pl-select>
      <pl-menu label="Edit">
        <pl-button slot="trigger">Edit</pl-button>
        <pl-menu-item>Undo</pl-menu-item>
        <pl-menu-item>Redo</pl-menu-item>
      </pl-menu>
      <pl-table label="Pioneers">
        <table>
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Role</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Ada Lovelace</td>
              <td>Mathematician</td>
            </tr>
            <tr>
              <td>Grace Hopper</td>
              <td>Computer scientist</td>
            </tr>
          </tbody>
        </table>
      </pl-table>
    </div>
  `,
};
