import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { expect } from "storybook/test";
import "./sidebar.ts";

const meta = { title: "Navigation/Sidebar" } satisfies Meta;

export default meta;

type Story = StoryObj;

// Links point at "#" targets so activating one never leaves the story.
const render = ({
  collapsed = false,
  open = false,
  child = false,
}: { collapsed?: boolean; open?: boolean; child?: boolean } = {}) => html`
  <pl-sidebar id="sidebar" label="Library" ?collapsed=${collapsed}>
    <pl-sidebar-item id="home" href="#home" ?selected=${!child}
      >Home</pl-sidebar-item
    >
    <pl-sidebar-item id="albums" ?expanded=${open}>Albums</pl-sidebar-item>
    <pl-sidebar-item id="recent" level="2" href="#recent"
      >Recently added</pl-sidebar-item
    >
    <pl-sidebar-item
      id="favorites"
      level="2"
      href="#favorites"
      ?selected=${child}
      >Favorites</pl-sidebar-item
    >
    <pl-sidebar-item id="settings" href="#settings">Settings</pl-sidebar-item>
  </pl-sidebar>
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

/** A parent row with an href is a link that selects, with its own disclosure button. */
export const ParentLink: Story = {
  render: () => html`
    <pl-sidebar id="sidebar" label="Library">
      <pl-sidebar-item id="home" href="#home" selected>Home</pl-sidebar-item>
      <pl-sidebar-item id="albums" href="#albums">Albums</pl-sidebar-item>
      <pl-sidebar-item id="recent" level="2" href="#recent"
        >Recently added</pl-sidebar-item
      >
      <pl-sidebar-item id="favorites" level="2" href="#favorites"
        >Favorites</pl-sidebar-item
      >
      <pl-sidebar-item id="settings" href="#settings">Settings</pl-sidebar-item>
    </pl-sidebar>
  `,
  play: async ({ canvasElement }) => {
    const albums = canvasElement.querySelector("#albums");
    await expect(albums?.shadowRoot?.querySelector("a")).not.toBeNull();
    await expect(
      albums?.shadowRoot?.querySelector(".disclosure")?.ariaExpanded,
    ).toBe("false");
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

// Icons come from design/icons.
const inbox = html`<svg
  slot="icon"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
>
  <path d="M4 13h4l1.5 3h5l1.5-3h4M5 5h14l2 8v6H3v-6z" />
</svg>`;

const folders = ({ size = "md" }: { size?: "md" | "lg" } = {}) => html`
  <pl-sidebar id="sidebar" label="Library" size=${size}>
    <pl-sidebar-section id="library" label="Library">
      <pl-sidebar-item id="inbox" href="#inbox" selected
        >${inbox}Inbox<span slot="detail">Detail</span></pl-sidebar-item
      >
      <pl-sidebar-item id="today" href="#today"
        >${inbox}Today<span slot="detail">12</span></pl-sidebar-item
      >
      <pl-sidebar-item id="plain" href="#plain">Plain</pl-sidebar-item>
    </pl-sidebar-section>
    <pl-sidebar-section id="folders" label="Folders">
      <pl-sidebar-item id="work" expanded>${inbox}Work</pl-sidebar-item>
      <pl-sidebar-item id="reports" level="2" href="#reports"
        >${inbox}Reports</pl-sidebar-item
      >
      <pl-sidebar-item id="archive" href="#archive"
        >${inbox}Archive<span slot="detail">3</span></pl-sidebar-item
      >
    </pl-sidebar-section>
  </pl-sidebar>
`;

/** Sections with headings, a leading icon and trailing detail text. */
export const Sections: Story = {
  render: () => folders(),
  play: async ({ canvasElement }) => {
    const groups = canvasElement.querySelectorAll("pl-sidebar-section");
    await expect(
      [...groups].map((group) => group.getAttribute("aria-label")),
    ).toEqual(["Library", "Folders"]);
    await expect(
      canvasElement.querySelector("#work")?.hasAttribute("expandable"),
    ).toBe(true);
    await expect(
      canvasElement.querySelector("#archive")?.hasAttribute("expandable"),
    ).toBe(false);
  },
};

/** Larger rows, headings and icons. */
export const Large: Story = { render: () => folders({ size: "lg" }) };

export const SectionsGlassDarkRtl: Story = {
  render: () => folders(),
  globals: { material: "glass", theme: "dark", dir: "rtl" },
};
