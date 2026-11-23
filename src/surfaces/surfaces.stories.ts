import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { LitElement, css, html, type CSSResult } from "lit";
import { expect } from "storybook/test";
import {
  barSurface,
  fieldShell,
  listRowSurface,
  panelSurface,
  sheetSurface,
} from "./surfaces.css.ts";

/** Defines a bare host that wears one surface, so each surface is tested on its own. */
const defineDemo = (tag: string, surface: CSSResult) =>
  customElements.define(
    tag,
    class extends LitElement {
      static override styles = [
        surface,
        css`
          :host {
            font-family: var(--pl-font-sans);
          }
        `,
      ];
      override render() {
        return html`<slot></slot>`;
      }
    },
  );

defineDemo("pl-bar-demo", barSurface);
defineDemo("pl-panel-demo", panelSurface);
defineDemo("pl-sheet-demo", sheetSurface);
defineDemo("pl-list-row-demo", listRowSurface);
defineDemo("pl-field-demo", fieldShell);

const meta = { title: "Foundations/Surfaces" } satisfies Meta;

export default meta;

type Story = StoryObj;

const render = () => html`
  <pl-bar-demo id="bar">Bar</pl-bar-demo>
  <pl-panel-demo id="panel">Panel</pl-panel-demo>
  <pl-sheet-demo id="sheet">Sheet</pl-sheet-demo>
  <pl-list-row-demo id="list-row">List row</pl-list-row-demo>
  <pl-field-demo id="field"
    ><input aria-label="Name" value="Whiskers"
  /></pl-field-demo>
`;

export const Default: Story = { render };

/** The text surfaces without the field's text input, for real screen readers.
 * A focused text input puts NVDA into focus mode, which stops reading the page,
 * and a page with nothing focusable lets Guidepup's Tab move NVDA into the
 * browser toolbar, so the story starts with one plain button. */
export const TextOnly: Story = {
  render: () => html`
    <button type="button">Start</button>
    <pl-bar-demo>Bar</pl-bar-demo>
    <pl-panel-demo>Panel</pl-panel-demo>
    <pl-sheet-demo>Sheet</pl-sheet-demo>
    <pl-list-row-demo>List row</pl-list-row-demo>
  `,
};

/** The surfaces over a high-contrast checkerboard, the hardest backdrop for text and edges. */
export const PatternedBackdrop: Story = {
  render: () =>
    html`<div
      style="padding: 16px; background: repeating-conic-gradient(#000 0 25%, #fff 0 50%) 0 0 / 24px 24px"
    >
      ${render()}
    </div>`,
  globals: { material: "glass" },
};

export const Glass: Story = {
  render,
  globals: { material: "glass", theme: "dark", contrast: "more", dir: "rtl" },
  // Doubles as the check that every Storybook global reaches the document root.
  play: () => {
    const root = document.documentElement;
    expect(root.getAttribute("pl-material")).toBe("glass");
    expect(root.getAttribute("data-theme")).toBe("dark");
    expect(root.getAttribute("data-contrast")).toBe("more");
    expect(root.getAttribute("dir")).toBe("rtl");
  },
};
