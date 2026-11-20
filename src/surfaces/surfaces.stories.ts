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
            font-family: var(--purr-font-family);
          }
        `,
      ];
      override render() {
        return html`<slot></slot>`;
      }
    },
  );

defineDemo("purr-bar-demo", barSurface);
defineDemo("purr-panel-demo", panelSurface);
defineDemo("purr-sheet-demo", sheetSurface);
defineDemo("purr-list-row-demo", listRowSurface);
defineDemo("purr-field-demo", fieldShell);

const meta = { title: "Surfaces" } satisfies Meta;

export default meta;

type Story = StoryObj;

const render = () => html`
  <purr-bar-demo id="bar">Bar</purr-bar-demo>
  <purr-panel-demo id="panel">Panel</purr-panel-demo>
  <purr-sheet-demo id="sheet">Sheet</purr-sheet-demo>
  <purr-list-row-demo id="list-row">List row</purr-list-row-demo>
  <purr-field-demo id="field"
    ><input aria-label="Name" value="Whiskers"
  /></purr-field-demo>
`;

export const Default: Story = { render };

/** The text surfaces without the field's text input, for real screen readers.
 * A focused text input puts NVDA into focus mode, which stops reading the page,
 * and a page with nothing focusable lets Guidepup's Tab move NVDA into the
 * browser toolbar, so the story starts with one plain button. */
export const TextOnly: Story = {
  render: () => html`
    <button type="button">Start</button>
    <purr-bar-demo>Bar</purr-bar-demo>
    <purr-panel-demo>Panel</purr-panel-demo>
    <purr-sheet-demo>Sheet</purr-sheet-demo>
    <purr-list-row-demo>List row</purr-list-row-demo>
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
    expect(root.getAttribute("purr-material")).toBe("glass");
    expect(root.getAttribute("data-theme")).toBe("dark");
    expect(root.getAttribute("data-contrast")).toBe("more");
    expect(root.getAttribute("dir")).toBe("rtl");
  },
};
