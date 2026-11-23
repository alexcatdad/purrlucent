import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import "./navigation-menu.ts";

const meta = {
  title: "Navigation/Navigation Menu",
  component: "pl-navigation-menu",
} satisfies Meta;

export default meta;

type Story = StoryObj;

// Room below the bar, so a panel opens where it was asked to.
const stage = (inner: unknown) =>
  html`<div style="min-block-size:calc(var(--pl-spacing) * 80)">${inner}</div>`;

const render = ({ label = "Main", open = false, current = "home" } = {}) =>
  stage(
    html`<pl-navigation-menu id="nav" label=${ifDefined(label || undefined)}>
      <pl-navigation-item id="home" href="#home" ?current=${current === "home"}
        >Home</pl-navigation-item
      >
      <pl-navigation-item
        id="products"
        ?open=${open}
        ?current=${current === "products"}
      >
        Products
        <a slot="panel" href="#overview">Overview</a>
        <a
          slot="panel"
          href="#pricing"
          aria-current=${ifDefined(current === "products" ? "page" : undefined)}
          >Pricing</a
        >
        <a slot="panel" href="#changelog">Changelog</a>
      </pl-navigation-item>
      <pl-navigation-item id="company">
        Company
        <a slot="panel" href="#about">About</a>
        <a slot="panel" href="#careers">Careers</a>
      </pl-navigation-item>
      <pl-navigation-item id="contact" href="#contact"
        >Contact</pl-navigation-item
      >
    </pl-navigation-menu>`,
  );

export const Default: Story = { render: () => render() };

/** A panel that starts open: it shows with the page and takes no focus. */
export const Open: Story = { render: () => render({ open: true }) };

/** The current page is marked on a link, and on the button and link of the section that holds it. */
export const Current: Story = {
  render: () => render({ current: "products", open: true }),
};

export const NoLabel: Story = { render: () => render({ label: "" }) };

export const Rtl: Story = {
  render: () => render({ open: true }),
  globals: { dir: "rtl" },
};

// Every material, theme and direction, each with an open panel.
const matrix = (globals: Record<string, string>): Story => ({
  render: () => render({ open: true, current: "products" }),
  globals,
});

export const SolidDark = matrix({ theme: "dark" });
export const SolidDarkRtl = matrix({ theme: "dark", dir: "rtl" });
export const GlassLight = matrix({ material: "glass", theme: "light" });
export const GlassDarkRtl = matrix({
  material: "glass",
  theme: "dark",
  dir: "rtl",
});
export const GlassContrast = matrix({
  material: "glass",
  theme: "dark",
  contrast: "more",
});
