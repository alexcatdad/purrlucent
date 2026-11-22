import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html, svg, type SVGTemplateResult } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import { backGlyph, closeGlyph } from "../../behaviors/glyphs.ts";
import "../button/button.ts";
import "../input/input.ts";
import "./toolbar.ts";

const meta = {
  title: "Components/Toolbar",
  component: "purr-toolbar",
} satisfies Meta;

export default meta;

type Story = StoryObj;

// Icons come from design/icons.
const icon = (paths: SVGTemplateResult) =>
  html`<svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    ${paths}
  </svg>`;

const search = svg`<circle cx="10" cy="10" r="6.5" /><path d="m14.65 14.65 4.5 4.5q1.1 1.1 2.1.35" />`;
const plus = svg`<path d="M12 4.75v14.5M4.75 12h14.5" />`;
const more = svg`<circle cx="5" cy="12" r="1.45" /><circle cx="12" cy="12" r="1.45" /><circle cx="19" cy="12" r="1.45" />`;

const items = [
  { label: "Search", icon: search },
  { label: "Add", icon: plus },
  { label: "More", icon: more },
  { label: "Done" },
];

// `disabled` and `prominent` are item indexes. Symbol items that are not
// prominent share one group; in these stories they are always adjacent.
const render = ({
  disabled = [] as number[],
  prominent = [3],
  label = "Document actions",
  scrolled = false,
} = {}) => {
  const grouped = items.map((item, i) => !!item.icon && !prominent.includes(i));
  const first = grouped.indexOf(true);
  const parts = items.map(
    (item, i) =>
      html`<purr-button
        aria-label=${ifDefined(item.icon ? item.label : undefined)}
        variant=${prominent.includes(i) ? "primary" : "ghost"}
        size=${item.icon ? "md" : "xl"}
        ?icon=${!!item.icon}
        ?disabled=${disabled.includes(i)}
      >
        ${item.icon ? icon(item.icon) : item.label}
      </purr-button>`,
  );
  return html`<style>
      purr-toolbar svg {
        display: block;
      }
    </style>
    <purr-toolbar
      id="toolbar"
      label=${ifDefined(label || undefined)}
      ?scrolled=${scrolled}
    >
      ${parts.filter((_, i) => i < first)}
      <purr-toolbar-group
        >${parts.filter((_, i) => grouped[i])}</purr-toolbar-group
      >
      ${parts.filter((_, i) => i > first && !grouped[i])}
    </purr-toolbar>`;
};

export const Default: Story = { render: () => render() };

export const DisabledItem: Story = {
  render: () => render({ disabled: [1] }),
};

export const DisabledFirstItem: Story = {
  render: () => render({ disabled: [0] }),
};

export const TwoProminent: Story = {
  render: () => render({ prominent: [2, 3] }),
};

export const ProminentFirst: Story = {
  render: () => render({ prominent: [0] }),
};

// Content scrolled beneath the bar: the scroll edge shows.
export const Scrolled: Story = {
  render: () => render({ scrolled: true }),
};

export const NoLabel: Story = { render: () => render({ label: "" }) };

export const Rtl: Story = { render: () => render(), globals: { dir: "rtl" } };

// Every material, theme and direction, each with a disabled item.
const matrix = (globals: Record<string, string>): Story => ({
  render: () => render({ disabled: [1] }),
  globals,
});

export const SolidDark = matrix({ theme: "dark" });
export const SolidDarkRtl = matrix({ theme: "dark", dir: "rtl" });
export const SolidRtlDisabled = matrix({ dir: "rtl" });
export const GlassLight = matrix({ material: "glass" });
export const GlassLightRtl = matrix({ material: "glass", dir: "rtl" });
export const GlassDark = matrix({ material: "glass", theme: "dark" });

const forward = svg`<path d="m9.5 5.5 6 6.5-6 6.5" />`;

const iconButton = (label: string, paths: SVGTemplateResult) =>
  html`<purr-button aria-label=${label} variant="ghost" icon
    >${icon(paths)}</purr-button
  >`;

// Every part of a window toolbar; `size` is the toolbar's and its controls'.
const chrome = (size: "md" | "xl") =>
  html`<style>
      purr-toolbar svg {
        display: block;
      }
      /* Back points toward the start of the line and Forward toward the end. */
      purr-toolbar:dir(rtl) [aria-label="Back"] svg,
      purr-toolbar:dir(rtl) [aria-label="Forward"] svg {
        transform: scaleX(-1);
      }
    </style>
    <purr-toolbar id="toolbar" label="Window" size=${size}>
      <purr-toolbar-group>
        <purr-button aria-label="Back" variant="ghost" icon
          >${backGlyph}</purr-button
        >${iconButton("Forward", forward)}
      </purr-toolbar-group>
      <purr-toolbar-title
        >Window Title<span slot="subtitle"
          >Subtitle, edited</span
        ></purr-toolbar-title
      >
      <purr-toolbar-group>
        ${iconButton("Add", plus)}
        <purr-toolbar-separator></purr-toolbar-separator>
        ${iconButton("More", more)}
      </purr-toolbar-group>
      <purr-input
        id="search"
        type="search"
        size=${size}
        label="Search"
        placeholder="Search"
      ></purr-input>
      <purr-button variant="primary" size=${size}>Done</purr-button>
    </purr-toolbar>`;

/** A title with a subtitle, groups, a separator, a search field and the prominent item. */
export const Chrome: Story = { render: () => chrome("xl") };

/** The compact bar: md controls, the subtitle beside the title. */
export const Compact: Story = { render: () => chrome("md") };

/** A spacer gives a leading, a center and a trailing area; the Close item and the prominent item share the trailing one. */
export const Spacers: Story = {
  render: () =>
    html`<style>
        purr-toolbar svg {
          display: block;
        }
        purr-toolbar:dir(rtl) [aria-label="Back"] svg {
          transform: scaleX(-1);
        }
      </style>
      <purr-toolbar id="toolbar" label="Window">
        <purr-button aria-label="Back" variant="ghost" icon
          >${backGlyph}</purr-button
        >
        <purr-toolbar-spacer></purr-toolbar-spacer>
        <purr-toolbar-title>Window Title</purr-toolbar-title>
        <purr-toolbar-spacer></purr-toolbar-spacer>
        <purr-button aria-label="Close" variant="ghost" icon
          >${closeGlyph}</purr-button
        >
        <purr-button variant="primary" size="xl">Done</purr-button>
      </purr-toolbar>`,
};

/** A title too long for the bar ends in an ellipsis and keeps its full text as its name. */
export const LongTitle: Story = {
  render: () =>
    html`<div style="inline-size: 20rem">
      <purr-toolbar id="toolbar" label="Window">
        <purr-toolbar-title
          >A document title much too long to fit beside the other
          items</purr-toolbar-title
        >
        <purr-button variant="primary" size="xl">Done</purr-button>
      </purr-toolbar>
    </div>`,
};

export const ChromeGlassDarkRtl: Story = {
  render: () => chrome("xl"),
  globals: { material: "glass", theme: "dark", dir: "rtl" },
};

/** A search field takes the toolbar's capsule material and is one stop. */
export const SearchField: Story = {
  render: () =>
    html`<purr-toolbar id="toolbar" label="Find">
      <purr-input
        id="search"
        type="search"
        size="xl"
        label="Search"
        placeholder="Search"
        value="Search term"
      ></purr-input>
      <purr-toolbar-separator></purr-toolbar-separator>
      <purr-button size="xl" variant="primary">Done</purr-button>
    </purr-toolbar>`,
};

export const Glass: Story = {
  render: () => render({ disabled: [1] }),
  globals: { material: "glass", theme: "dark", contrast: "more", dir: "rtl" },
};
