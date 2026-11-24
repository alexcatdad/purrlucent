import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { expect, userEvent, waitFor } from "storybook/test";
import "../button/button.ts";
import "./carousel.ts";
import type { PlCarousel } from "./carousel.ts";

const meta = { title: "Containers/Carousel" } satisfies Meta;

export default meta;

type Story = StoryObj;

const slide = (n: number) => html`
  <pl-carousel-item>
    <div
      style="display: grid; place-items: center; block-size: calc(var(--pl-spacing) * 40); background: var(--pl-color-muted-1); color: var(--pl-color-foreground); font-size: var(--pl-text-xl); text-align: center; white-space: nowrap;"
    >
      Slide ${n}
    </div>
  </pl-carousel-item>
`;

const render = () => html`
  <pl-carousel id="control" label="Featured">
    ${[1, 2, 3, 4, 5].map(slide)}
  </pl-carousel>
`;

const control = async (canvasElement: HTMLElement) => {
  const el = canvasElement.querySelector<PlCarousel>("#control")!;
  await el.updateComplete;
  return el;
};

// Stories that other tests open as they are have no play function: a play
// function would change the page before the test starts.
export const Default: Story = { render };

export const Glass: Story = {
  render,
  globals: { material: "glass", theme: "dark", contrast: "more", dir: "ltr" },
};

export const Light: Story = { render, globals: { theme: "light" } };

export const Dark: Story = { render, globals: { theme: "dark" } };

export const MoreContrast: Story = {
  render,
  globals: { contrast: "more" },
};

/** Slides may hold focusable content; focusing it scrolls its slide into view. */
export const WithButtons: Story = {
  render: () => html`
    <pl-carousel id="control" label="Offers">
      ${[1, 2, 3].map(
        (n) =>
          html`<pl-carousel-item>
            <div
              style="display: grid; place-items: center; gap: var(--pl-space-3); block-size: calc(var(--pl-spacing) * 40); background: var(--pl-color-muted-1); color: var(--pl-color-foreground);"
            >
              Offer ${n}
              <pl-button>Read more</pl-button>
            </div>
          </pl-carousel-item>`,
      )}
    </pl-carousel>
  `,
};

/** With one slide there is nothing to page through, so the controls are hidden. */
export const SingleSlide: Story = {
  render: () => html`
    <pl-carousel id="control" label="Single">${slide(1)}</pl-carousel>
  `,
};

/** Under right-to-left the slides run from the right and the arrows swap sides. */
export const Rtl: Story = { render, globals: { dir: "rtl" } };

/** Focus the scrolling area and press the arrow keys: the page changes. */
export const Keyboard: Story = {
  render,
  play: async ({ canvasElement }) => {
    const el = await control(canvasElement);
    expect(el.index).toBe(0);
    // Tab does not reliably reach a control inside a shadow root here: focus it.
    el.shadowRoot!.querySelector<HTMLElement>('[part="viewport"]')!.focus();
    await userEvent.keyboard("{ArrowRight}");
    await waitFor(() => expect(el.index).toBe(1));
  },
};
