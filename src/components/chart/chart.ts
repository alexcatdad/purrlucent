import { LitElement, html, nothing, type PropertyValues } from "lit";
import {
  defineChartElement,
  type ChartDefinition,
  type ChartPoint,
  type ChartProps,
} from "@tanstack/charts/lit";
import { chartStyles } from "./chart.css.ts";
import {
  buildDefinition,
  chartTypes,
  legendNames,
  tableModel,
  withDefaults,
  type ChartRow,
  type ChartSpec,
  type ChartType,
  type Observation,
  type TableModel,
} from "./chart-model.ts";

defineChartElement();

const isObservation = (value: unknown): value is Observation =>
  typeof value === "object" &&
  value !== null &&
  "row" in value &&
  "series" in value;

// Inputs that change what is drawn. Anything else (legend, show-table) only
// changes the markup around it, and must not give the chart a new definition,
// because a new definition restarts it.
const drawn = [
  "label",
  "description",
  "type",
  "data",
  "x",
  "y",
  "series",
  "xLabel",
  "yLabel",
  "format",
  "aspectRatio",
  "definition",
] as const;

/**
 * A chart that is named, themed and keyboard-operable by default, drawn by
 * TanStack Charts (an optional peer dependency: install `@tanstack/charts`).
 *
 * For the common cases give it a `type`, `data` and the keys to read:
 * `<pl-chart label="Visits by month" type="line" x="month" y="visits">` with
 * `chart.data = [...]`. For anything else pass a TanStack `definition`; it is
 * drawn with the same palette, fonts and tooltip. Either way a native table of
 * the same values is in the page for assistive technology; `show-table` shows
 * it. The tooltip and the arrow keys (the chart is one tab stop) are on by
 * default. Series colors come from `--pl-chart-1` to `--pl-chart-6`, which you
 * can set on the element.
 *
 * `label` is required: it is the chart's accessible name. Say what is measured,
 * for whom, over which period and in which unit.
 *
 * @attr {string} label - The accessible name. Required; without it the chart warns in the console.
 * @attr {string} description - Context a reader needs that is not already nearby, such as how gaps are drawn. It becomes the chart's accessible description.
 * @attr {string} type - `bar`, `line`, `area` or `donut`. Not needed when `definition` is set.
 * @attr {string} x - The key of the category in each row.
 * @attr {string} y - The key of the value in each row. A comma-separated list (`desktop,mobile`) draws one series per key, for rows that hold several values.
 * @attr {string} series - The key that names the series, for rows with one value each.
 * @attr {string} x-label - The name of the categories: an axis title and the table's first column heading.
 * @attr {string} y-label - The name and unit of the values: an axis title and the heading of a single series.
 * @attr {number} aspect-ratio - Width over height. Defaults to 16/9, and 1 for a donut.
 * @attr {boolean} legend - Lists the series, or a donut's slices, with their colors under the chart.
 * @attr {boolean} show-table - Shows the table of values under the chart. It is always in the page for assistive technology.
 * @prop {ChartRow[]} data - The rows to draw. Assign a new array to redraw.
 * @prop {ChartDefinition} definition - A TanStack chart definition, for charts the simple form cannot describe.
 * @prop {(value: number) => string} format - Formats a value for the ticks, the tooltip and the table. Defaults to the locale's number format.
 * @csspart legend - The list of series.
 * @csspart swatch - A series' color chip in the legend.
 * @csspart data - The wrapper of the table of values.
 * @cssprop --pl-chart-1 - The first series color. Up to `--pl-chart-6`.
 * @fires {CustomEvent<{ x: string | number | Date | null, y: number | null, series: string | null, datum: unknown }>} pl-select - A point was activated with a click, Enter or Space. `detail.datum` is the row it came from.
 */
export class PlChart extends LitElement {
  static override styles = chartStyles;
  static override properties = {
    label: {},
    description: {},
    type: { reflect: true },
    data: { attribute: false },
    x: {},
    y: {},
    series: {},
    xLabel: { attribute: "x-label" },
    yLabel: { attribute: "y-label" },
    aspectRatio: { type: Number, attribute: "aspect-ratio" },
    legend: { type: Boolean, reflect: true },
    showTable: { type: Boolean, reflect: true, attribute: "show-table" },
    definition: { attribute: false },
    format: { attribute: false },
  };

  declare label: string | undefined;
  declare description: string | undefined;
  declare type: ChartType | undefined;
  declare data: readonly ChartRow[] | undefined;
  declare x: string | undefined;
  declare y: string | undefined;
  declare series: string | undefined;
  declare xLabel: string | undefined;
  declare yLabel: string | undefined;
  declare aspectRatio: number | undefined;
  declare legend: boolean;
  declare showTable: boolean;
  declare definition: ChartDefinition | undefined;
  declare format: ((value: number) => string) | undefined;

  #options: ChartProps | undefined;
  #table: TableModel | undefined;
  #names: string[] = [];
  #spec: ChartSpec | undefined;
  #role = "";
  #warned = false;

  constructor() {
    super();
    this.legend = false;
    this.showTable = false;
  }

  /** The rows and keys, when they are all there. Without a type they still make the table and the legend. */
  #specOf(): ChartSpec | undefined {
    const { type, data, x, y } = this;
    if (!Array.isArray(data) || !x || !y) return;
    return {
      type: type && chartTypes.includes(type) ? type : "line",
      data,
      x,
      y,
      series: this.series || undefined,
      xLabel: this.xLabel || undefined,
      yLabel: this.yLabel || undefined,
      format: this.format,
      fontSize: Number.parseFloat(getComputedStyle(this).fontSize) || undefined,
      reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
    };
  }

  #build() {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.#spec = this.#specOf();
    this.#table = undefined;
    this.#names = [];
    let definition: ChartDefinition | undefined;
    if (this.definition) definition = withDefaults(this.definition, reduced);
    else if (this.#spec && this.type && chartTypes.includes(this.type)) {
      try {
        definition = buildDefinition(this.#spec);
      } catch (error) {
        console.error("pl-chart: the chart could not be drawn.", error);
      }
    }
    // The table and the legend list the same values as the drawing, whichever
    // form drew it, as long as the rows and their keys are given.
    if (this.#spec) {
      this.#table = tableModel(this.#spec);
      this.#names = legendNames(this.#spec);
    }
    this.#options = definition && {
      definition,
      ariaLabel: this.label ?? "",
      ...(this.description ? { ariaDescription: this.description } : {}),
      aspectRatio: this.aspectRatio || (this.type === "donut" ? 1 : 16 / 9),
      onSelect: (point) => this.#select(point),
    };
  }

  #select(point: ChartPoint | null) {
    if (!point) return;
    const o = this.#spec && isObservation(point.datum) ? point.datum : null;
    this.dispatchEvent(
      new CustomEvent("pl-select", {
        bubbles: true,
        composed: true,
        detail: {
          x: o ? o.x : point.xValue,
          y: o ? o.y : typeof point.yValue === "number" ? point.yValue : null,
          series: o ? o.series : null,
          datum: o ? o.row : point.datum,
        },
      }),
    );
  }

  // The chart's name sits on the host as well, so the figure is named for every
  // engine. A role the author set is kept; only our own value is replaced.
  protected override willUpdate(changed: PropertyValues<this>) {
    if (!this.hasUpdated && !this.label && !this.#warned) {
      this.#warned = true;
      console.warn(
        'pl-chart: set the "label" attribute. It is the chart\'s accessible name: say what is measured, for whom, over which period and in which unit.',
      );
    }
    if (changed.has("label")) {
      if (this.label) this.setAttribute("aria-label", this.label);
      else this.removeAttribute("aria-label");
    }
    if (
      !this.hasAttribute("role") ||
      this.getAttribute("role") === this.#role
    ) {
      this.#role = "figure";
      this.setAttribute("role", this.#role);
    }
    if (drawn.some((key) => changed.has(key))) this.#build();
  }

  override render() {
    const table = this.#table;
    return html`<tanstack-chart .options=${this.#options}></tanstack-chart> ${
        this.legend && this.#names.length
          ? html`<ul part="legend" role="list">
              ${this.#names.map(
                (name) =>
                  html`<li>
                    <span part="swatch" aria-hidden="true"></span>${name}
                  </li>`,
              )}
            </ul>`
          : nothing
      }
      ${
        table && table.rows.length
          ? html`<div part="data">
              <table>
                <caption>
                  ${this.label}
                </caption>
                <thead>
                  <tr>
                    ${table.headers.map(
                      (header) => html`<th scope="col">${header}</th>`,
                    )}
                  </tr>
                </thead>
                <tbody>
                  ${table.rows.map(
                    ([head, ...cells]) =>
                      html`<tr>
                        <th scope="row">${head}</th>
                        ${cells.map((cell) => html`<td>${cell}</td>`)}
                      </tr>`,
                  )}
                </tbody>
              </table>
            </div>`
          : nothing
      }`;
  }
}

customElements.define("pl-chart", PlChart);

declare global {
  interface HTMLElementTagNameMap {
    "pl-chart": PlChart;
  }
}
