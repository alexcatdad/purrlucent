import { expect, test } from "bun:test";
import type {
  PlCellRenderer,
  PlDataTableColumn,
  PlDataTableRow,
} from "./data-table.ts";
import type { PlModelColumn, PlModelRow } from "./data-table-types.ts";

// Checked by `bun run typecheck`: a renderer written for one mode is assignable.
const plain: PlCellRenderer = (
  row: PlDataTableRow,
  column: PlDataTableColumn,
) => row[column.key];
const model: PlCellRenderer = (row: PlModelRow, column: PlModelColumn) =>
  row.id + column.key;

test("a renderer for either mode is a PlCellRenderer", () => {
  expect(typeof plain).toBe("function");
  expect(typeof model).toBe("function");
});
