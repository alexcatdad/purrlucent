import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { LitElement, css, html, type CSSResult } from "lit";
import { expect } from "storybook/test";
import { LensController } from "../behaviors/lens.ts";
import "../components/button/button.ts";
import "../components/toggle-group/toggle-group.ts";
import "../components/toolbar/toolbar.ts";
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

/** A panel that refracts, as a popover or dialog does, for the picture story. */
customElements.define(
  "pl-glass-panel-demo",
  class extends LitElement {
    static override styles = panelSurface;
    constructor() {
      super();
      new LensController(this);
    }
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

/** Bright media with white, color and dark areas: what clear glass sits over. */
const media =
  "display: grid; gap: 16px; padding: 48px 16px; background: linear-gradient(120deg, #fff 0 28%, #e9a23b 28% 46%, #457b9d 46% 64%, #1d3557 64% 82%, #fff 82%)";

/** pl-glass="clear": a dark film over a dimmed backdrop, with light text, for controls over photos and video. */
export const Clear: Story = {
  render: () => html`
    <div style=${media}>
      <pl-bar-demo id="clear-bar" pl-glass="clear">
        <pl-button>Play</pl-button>
        0:42 of 3:10
      </pl-bar-demo>
      <pl-panel-demo id="clear-panel" pl-glass="clear"
        >Captions: English</pl-panel-demo
      >
    </div>
  `,
  globals: { material: "glass" },
};

/** A tint mixed into the glass fill, set on a pl-material="glass" element. Apple tints glass sparingly. */
export const Tinted: Story = {
  render: () => html`
    <div
      pl-material="glass"
      style="--pl-material-tint: var(--pl-color-hot-pink); --pl-material-tint-strength: 18%"
    >
      ${render()}
    </div>
  `,
  globals: { material: "glass" },
};

/** A vivid scene, as an image so its shapes are not page text: stripes,
 * a checkerboard, palette circles and a word, shaded in dark as a photo
 * would be under a dark page. */
const scene = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 560" preserveAspectRatio="xMidYMid slice"><defs><pattern id="s" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="3" height="14" fill="#1d1b1e" fill-opacity=".16"/></pattern><pattern id="c" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="#f7f6f7"/><rect width="20" height="20" fill="#1d1b1e"/><rect x="20" y="20" width="20" height="20" fill="#1d1b1e"/></pattern><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffc2df"/><stop offset=".45" stop-color="#ffd59a"/><stop offset="1" stop-color="#9fe3d0"/></linearGradient></defs><rect width="1200" height="560" fill="url(#g)"/><rect width="1200" height="560" fill="url(#s)"/><rect x="470" y="300" width="260" height="200" fill="url(#c)"/><circle cx="170" cy="150" r="130" fill="#ff69b4"/><circle cx="1030" cy="120" r="110" fill="#7b5cff"/><circle cx="380" cy="470" r="120" fill="#e9a23b"/><circle cx="900" cy="440" r="140" fill="#2d7a4f"/><circle cx="640" cy="120" r="70" fill="#e03e2d"/><text x="600" y="330" text-anchor="middle" font-family="system-ui, sans-serif" font-size="190" font-weight="800" fill="#1d1b1e" fill-opacity=".85" letter-spacing="-8">purrlucent</text></svg>`,
);

/** Glass over a picture: a floating bar, a panel and round buttons that
 * refract (in Chromium) over stripes, letters and a checkerboard. */
export const OverAPicture: Story = {
  render: () => html`
    <div
      style="display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 420px), 1fr)); min-block-size: 460px; border-radius: var(--pl-radius-panel); overflow: hidden; background: linear-gradient(light-dark(transparent, rgb(0 0 0 / 55%)), light-dark(transparent, rgb(0 0 0 / 55%))), url('data:image/svg+xml;utf8,${scene}') center / cover"
    >
      <div></div>
      <div
        style="display: grid; align-content: start; gap: 18px; padding: 20px; min-inline-size: 0"
      >
        <pl-toolbar label="Mail" floating size="md">
          <pl-button variant="ghost">Inbox</pl-button>
          <pl-button variant="ghost">Flagged</pl-button>
          <pl-button variant="ghost">Sent</pl-button>
        </pl-toolbar>
        <pl-glass-panel-demo style="display: grid; gap: 6px; padding: 16px">
          <strong>Trip itinerary</strong>
          <span
            >Train on Friday, coast walk on Saturday, market on Sunday.</span
          >
          <span style="display: flex; gap: 8px; margin-block-start: 6px">
            <pl-button variant="primary">Reply</pl-button>
            <pl-button>Forward</pl-button>
          </span>
        </pl-glass-panel-demo>
        <span
          style="display: flex; flex-wrap: wrap; align-items: center; gap: 14px"
        >
          <pl-button
            icon
            aria-label="Add"
            style="inline-size: 56px; block-size: 56px; min-block-size: 56px"
            >+</pl-button
          >
          <pl-button
            icon
            aria-label="Like"
            style="inline-size: 56px; block-size: 56px; min-block-size: 56px"
            >&#9829;</pl-button
          >
          <pl-toggle-group label="Calendar range">
            <pl-toggle-group-item value="day">Day</pl-toggle-group-item>
            <pl-toggle-group-item value="week" selected
              >Week</pl-toggle-group-item
            >
            <pl-toggle-group-item value="month">Month</pl-toggle-group-item>
          </pl-toggle-group>
        </span>
      </div>
    </div>
  `,
  globals: { material: "glass" },
};

/*
 * The first lensing prototype, with one fixed map; the library's lens
 * (behaviors/lens.ts) sizes its map to each control. The backdrop is displaced at the
 * edges through an SVG filter, as Apple's glass bends what is behind it. The
 * map's red channel runs left to right and its green top to bottom, so the
 * centre (128, 128) does not move and the edges pull outward; a blurred
 * neutral inset keeps the middle still. Chromium renders backdrop-filter with
 * an SVG url(); other engines keep the plain blur declared before it.
 */
const lensMap = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><defs><linearGradient id="x"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#f00"/></linearGradient><linearGradient id="y" x2="0" y2="1"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#0f0"/></linearGradient><filter id="soft"><feGaussianBlur stdDeviation="14"/></filter></defs><rect width="200" height="200" fill="url(#x)"/><rect width="200" height="200" fill="url(#y)" style="mix-blend-mode:screen"/><rect x="34" y="34" width="132" height="132" rx="40" fill="rgb(128,128,0)" filter="url(#soft)"/></svg>`,
);

export const LensingPrototype: Story = {
  render: () => html`
    <svg width="0" height="0" style="position: absolute" aria-hidden="true">
      <filter
        id="pl-lens"
        x="0"
        y="0"
        width="100%"
        height="100%"
        color-interpolation-filters="sRGB"
      >
        <feImage
          href="data:image/svg+xml;utf8,${lensMap}"
          x="0"
          y="0"
          width="100%"
          height="100%"
          preserveAspectRatio="none"
          result="map"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="map"
          scale="-36"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </svg>
    <div
      style="padding: 48px 16px; background: repeating-linear-gradient(90deg, #457b9d 0 12px, #f1faee 12px 24px), #f1faee"
    >
      <div
        id="lens"
        style="display: inline-flex; align-items: center; gap: 12px; padding: 12px 20px; border-radius: 999px; background: var(--pl-material-glass, var(--pl-color-overlay)); box-shadow: var(--pl-material-edge), var(--pl-shadow-lg); backdrop-filter: blur(2px) saturate(160%); backdrop-filter: url(#pl-lens) blur(2px) saturate(160%); color: var(--pl-color-foreground); font: 600 var(--pl-text-base) / var(--pl-leading-body) var(--pl-font-sans)"
      >
        Lensed glass
      </div>
    </div>
  `,
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
