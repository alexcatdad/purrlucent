import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { expect } from "storybook/test";
import "./sidebar.ts";

const meta = { title: "Components/Sidebar" } satisfies Meta;

export default meta;

type Story = StoryObj;

// Links point at "#" targets so activating one never leaves the story.
const render = ({
  collapsed = false,
  open = false,
  child = false,
}: { collapsed?: boolean; open?: boolean; child?: boolean } = {}) => html`
  <purr-sidebar id="sidebar" label="Library" ?collapsed=${collapsed}>
    <purr-sidebar-item id="home" href="#home" ?selected=${!child}
      >Home</purr-sidebar-item
    >
    <purr-sidebar-item id="albums" ?expanded=${open}>Albums</purr-sidebar-item>
    <purr-sidebar-item id="recent" level="2" href="#recent"
      >Recently added</purr-sidebar-item
    >
    <purr-sidebar-item
      id="favorites"
      level="2"
      href="#favorites"
      ?selected=${child}
      >Favorites</purr-sidebar-item
    >
    <purr-sidebar-item id="settings" href="#settings"
      >Settings</purr-sidebar-item
    >
  </purr-sidebar>
`;

/** A selected top-level item and a closed group. */
export const Default: Story = { render: () => render() };

/** A group opened to show its level 2 items. */
export const GroupOpen: Story = { render: () => render({ open: true }) };

/** Selection inside a group opens the group. */
export const ChildSelected: Story = {
  render: () => render({ child: true }),
  play: async ({ canvasElement }) => {
    const albums = canvasElement.querySelector("#albums");
    await expect(albums?.hasAttribute("expanded")).toBe(true);
  },
};

/** The sidebar hidden, leaving only its toggle. */
export const Collapsed: Story = { render: () => render({ collapsed: true }) };

/** Glass material, dark theme, right-to-left. */
export const GlassDarkRtl: Story = {
  render: () => render({ open: true }),
  globals: { material: "glass", theme: "dark", dir: "rtl" },
};

/** Increased contrast. */
export const MoreContrast: Story = {
  render: () => render({ open: true }),
  globals: { contrast: "more" },
};
