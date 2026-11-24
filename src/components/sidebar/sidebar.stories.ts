import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html, type TemplateResult } from "lit";
import { expect } from "storybook/test";
import "../avatar/avatar.ts";
import "../button/button.ts";
import "../menu/menu.ts";
import "./sidebar.ts";
import type { PlSidebar } from "./sidebar.ts";

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

const folders = ({
  size = "md",
  chevron = "end",
}: { size?: "md" | "lg"; chevron?: "end" | "start" } = {}) => html`
  <pl-sidebar id="sidebar" label="Library" size=${size} chevron=${chevron}>
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

/** The group chevron before the icon, as in earlier versions. */
export const ChevronStart: Story = {
  render: () => folders({ chevron: "start" }),
};

/** Larger rows, headings and icons. */
export const Large: Story = { render: () => folders({ size: "lg" }) };

export const SectionsGlassDarkRtl: Story = {
  render: () => folders(),
  globals: { material: "glass", theme: "dark", dir: "rtl" },
};

/** Header and footer slots sit outside the navigation landmark. */
export const HeaderFooter: Story = {
  render: () => html`
    <pl-sidebar id="sidebar" label="Library">
      <span slot="header" id="brand">Acme</span>
      <pl-sidebar-item id="home" href="#home" selected>Home</pl-sidebar-item>
      <pl-sidebar-item id="settings" href="#settings">Settings</pl-sidebar-item>
      <span slot="footer" id="version">Version 1.2.0</span>
    </pl-sidebar>
  `,
  play: async ({ canvasElement }) => {
    const nav = canvasElement
      .querySelector("pl-sidebar")
      ?.shadowRoot?.querySelector("nav");
    await expect(nav?.contains(canvasElement.querySelector("#brand"))).toBe(
      false,
    );
  },
};

/** The sidebar collapses below its own width, here 900px. */
export const CollapseBelow: Story = {
  render: () => html`
    <pl-sidebar id="sidebar" label="Library" collapse-below="900">
      <pl-sidebar-item id="home" href="#home" selected>Home</pl-sidebar-item>
      <pl-sidebar-item id="settings" href="#settings">Settings</pl-sidebar-item>
    </pl-sidebar>
  `,
};

const sidebar = () => document.querySelector<PlSidebar>("#sidebar")!;

/** The built-in toggle is hidden; the app's buttons and the shortcut control the sidebar. */
export const ExternalControl: Story = {
  render: () => html`
    <pl-sidebar
      id="sidebar"
      label="Library"
      no-toggle
      shortcut="mod+b"
      collapse-below="0"
    >
      <pl-sidebar-item id="home" href="#home" selected>Home</pl-sidebar-item>
      <pl-sidebar-item id="settings" href="#settings">Settings</pl-sidebar-item>
    </pl-sidebar>
    <div>
      <pl-button id="toggle" @click=${() => sidebar().toggle()}
        >Toggle</pl-button
      >
      <pl-button id="show" @click=${() => sidebar().show()}>Show</pl-button>
      <pl-button id="hide" @click=${() => sidebar().hide()}>Hide</pl-button>
    </div>
  `,
};

/** Rows of other kinds: an action, a larger item, a description and an avatar. */
export const Rows: Story = {
  render: () => html`
    <pl-sidebar id="sidebar" label="Workspace">
      <pl-sidebar-item id="account" action
        ><pl-avatar slot="icon" name="Ada Lovelace"></pl-avatar>Ada
        Lovelace<span slot="description">ada@example.com</span></pl-sidebar-item
      >
      <pl-sidebar-item id="inbox" href="#inbox" selected
        >${inbox}Inbox<span slot="description">3 unread</span></pl-sidebar-item
      >
      <pl-sidebar-item id="big" href="#big" size="lg"
        >${inbox}Larger</pl-sidebar-item
      >
      <pl-sidebar-item id="new" action>${inbox}New folder</pl-sidebar-item>
    </pl-sidebar>
  `,
};

/** Level 1 items show a grip and can be reordered with a drag or Alt with the arrow keys. */
export const Reorderable: Story = {
  render: () => html`
    <pl-sidebar id="sidebar" label="Library" reorderable>
      <pl-sidebar-item id="first" href="#first" selected>First</pl-sidebar-item>
      <pl-sidebar-item id="second" href="#second">Second</pl-sidebar-item>
      <pl-sidebar-item id="third" href="#third">Third</pl-sidebar-item>
    </pl-sidebar>
  `,
};

/** A label and a description wider than the row end in an ellipsis; the full text shows as a title only then. A reorderable sidebar keeps the same label width while its grip is hidden. */
export const TruncatedLabels: Story = {
  render: () => html`
    <div style="display: flex; gap: var(--pl-space-4)">
      <pl-sidebar id="plain" label="Plain">
        <pl-sidebar-item id="long" href="#long"
          >Compliance Analytics and Regulatory Reporting for Every Region<span
            slot="description"
            >Quarterly filings and audit trails across all business units</span
          ></pl-sidebar-item
        >
        <pl-sidebar-item id="short" href="#short">Home</pl-sidebar-item>
      </pl-sidebar>
      <pl-sidebar id="sortable" label="Sortable" reorderable>
        <pl-sidebar-item id="sortable-long" href="#sortable-long"
          >Compliance Analytics and Regulatory Reporting for Every
          Region</pl-sidebar-item
        >
        <pl-sidebar-item id="sortable-short" href="#sortable-short"
          >Home</pl-sidebar-item
        >
      </pl-sidebar>
    </div>
  `,
};

const withContent = (sidebar: TemplateResult) => html`
  <div id="app" style="display: flex">
    ${sidebar}
    <main
      id="main"
      style="flex: 1; min-inline-size: calc(var(--pl-spacing) * 64)"
    >
      Content
    </main>
  </div>
`;

/** Beside the page's content. On a narrow screen the sidebar is collapsed from the first frame, so the page never overflows sideways. */
export const BesideContent: Story = {
  render: () =>
    withContent(html`
      <pl-sidebar id="sidebar" label="Library">
        <pl-sidebar-item id="home" href="#home" selected
          >${inbox}Home</pl-sidebar-item
        >
        <pl-sidebar-item id="settings" href="#settings"
          >${inbox}Settings</pl-sidebar-item
        >
      </pl-sidebar>
    `),
};

/** Collapsed with `no-toggle`: the sidebar takes no space, not even a strip. */
export const NoToggleCollapsed: Story = {
  render: () =>
    withContent(html`
      <pl-sidebar id="sidebar" label="Library" no-toggle collapsed>
        <pl-sidebar-item id="home" href="#home" selected>Home</pl-sidebar-item>
      </pl-sidebar>
    `),
};

/** An account row in the footer opens a menu upward. Language and Theme are submenus of radio items, and each parent row shows the current choice as its `detail`. */
export const AccountMenu: Story = {
  render: () => html`
    <pl-sidebar id="sidebar" label="Workspace" collapse-below="0">
      <pl-sidebar-item id="home" href="#home" selected>Home</pl-sidebar-item>
      <pl-menu id="menu" slot="footer" label="Account" placement="top-start">
        <pl-sidebar-item id="account" slot="trigger" action
          ><pl-avatar slot="icon" name="Ada Lovelace"></pl-avatar>Ada
          Lovelace</pl-sidebar-item
        >
        <pl-menu-item href="#profile">Profile</pl-menu-item>
        <pl-menu-separator></pl-menu-separator>
        <pl-menu-item detail="English">
          Language
          <pl-menu slot="submenu" label="Language">
            <pl-menu-item type="radio" value="en" checked>English</pl-menu-item>
            <pl-menu-item type="radio" value="sv">Svenska</pl-menu-item>
          </pl-menu>
        </pl-menu-item>
        <pl-menu-item detail="System">
          Theme
          <pl-menu slot="submenu" label="Theme">
            <pl-menu-item type="radio" value="system" checked
              >System</pl-menu-item
            >
            <pl-menu-item type="radio" value="light">Light</pl-menu-item>
            <pl-menu-item type="radio" value="dark">Dark</pl-menu-item>
          </pl-menu>
        </pl-menu-item>
        <pl-menu-separator></pl-menu-separator>
        <pl-menu-item destructive>Sign Out</pl-menu-item>
      </pl-menu>
    </pl-sidebar>
  `,
};

/** An `action` item as the trigger of a `pl-menu`: the button that holds focus carries `aria-haspopup` and `aria-expanded`. */
export const MenuTrigger: Story = {
  render: () => html`
    <pl-sidebar id="sidebar" label="Workspace" collapse-below="0">
      <pl-menu id="menu" label="Account">
        <pl-sidebar-item id="account" slot="trigger" action
          ><pl-avatar slot="icon" name="Ada Lovelace"></pl-avatar>Ada
          Lovelace</pl-sidebar-item
        >
        <pl-menu-item>Profile</pl-menu-item>
        <pl-menu-item>Sign Out</pl-menu-item>
      </pl-menu>
      <pl-sidebar-item id="home" href="#home" selected>Home</pl-sidebar-item>
    </pl-sidebar>
  `,
};
