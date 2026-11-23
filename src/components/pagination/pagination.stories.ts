import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { expect, userEvent } from "storybook/test";
import "./pagination.ts";
import type { PlPagination } from "./pagination.ts";

const meta = { title: "Components/Pagination" } satisfies Meta;

export default meta;

type Story = StoryObj;

const render = () => html`
  <pl-pagination id="control" page="1" total="5"></pl-pagination>
`;

const long = () => html`
  <pl-pagination id="control" page="10" total="20"></pl-pagination>
`;

const control = async (canvasElement: HTMLElement) => {
  const el = canvasElement.querySelector<PlPagination>("#control")!;
  await el.updateComplete;
  return el;
};

// Stories that other tests open as they are have no play function: a play
// function would change the page before the test starts.
export const Default: Story = { render };

/** More pages than fit: the first and last stay, and the middle gives way to ellipses. */
export const Many: Story = { render: long };

export const Glass: Story = {
  render: long,
  globals: { material: "glass", theme: "dark", contrast: "more", dir: "ltr" },
};

export const Light: Story = { render: long, globals: { theme: "light" } };

export const Dark: Story = { render: long, globals: { theme: "dark" } };

export const MoreContrast: Story = {
  render: long,
  globals: { contrast: "more" },
};

/** At the last page Next is disabled. */
export const LastPage: Story = {
  render: () => html`
    <pl-pagination id="control" page="20" total="20"></pl-pagination>
  `,
};

/** With `href-template` the pages are links, so each has an address. */
export const Links: Story = {
  render: () => html`
    <pl-pagination
      id="control"
      page="3"
      total="12"
      href-template="#/posts?page={page}"
    ></pl-pagination>
  `,
};

/** Under right-to-left the row mirrors and the arrows swap sides. */
export const Rtl: Story = { render: long, globals: { dir: "rtl" } };

/** Tab to a page and press Enter: the page changes. */
export const Keyboard: Story = {
  render,
  play: async ({ canvasElement }) => {
    const el = await control(canvasElement);
    expect(el.page).toBe(1);
    await userEvent.tab(); // Previous is disabled: page 1, the current page
    await userEvent.tab();
    await userEvent.keyboard("{Enter}");
    await el.updateComplete;
    expect(el.page).toBe(2);
  },
};
