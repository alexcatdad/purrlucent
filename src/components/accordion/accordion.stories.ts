import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { expect, userEvent, waitFor } from "storybook/test";
import "./accordion.ts";
import type { PlAccordion } from "./accordion.ts";

const meta = { title: "Containers/Accordion" } satisfies Meta;

export default meta;

type Story = StoryObj;

const render = () => html`
  <pl-accordion id="control">
    <pl-accordion-item value="shipping" heading="Shipping">
      <p>Orders leave the warehouse within two working days.</p>
    </pl-accordion-item>
    <pl-accordion-item value="returns" heading="Returns">
      <p>Send an item back within thirty days for a full refund.</p>
    </pl-accordion-item>
    <pl-accordion-item value="warranty" heading="Warranty">
      <p>Every product has a two year warranty.</p>
    </pl-accordion-item>
  </pl-accordion>
`;

const control = async (canvasElement: HTMLElement) => {
  const el = canvasElement.querySelector<PlAccordion>("#control")!;
  await el.updateComplete;
  return el;
};

// Stories that other tests open as they are have no play function: a play
// function would change which sections are open before the test starts.
export const Default: Story = { render };

/** An item marked `open` starts open. */
export const Preselected: Story = {
  render: () => html`
    <pl-accordion id="control">
      <pl-accordion-item value="shipping" heading="Shipping">
        <p>Orders leave the warehouse within two working days.</p>
      </pl-accordion-item>
      <pl-accordion-item value="returns" heading="Returns" open>
        <p>Send an item back within thirty days for a full refund.</p>
      </pl-accordion-item>
      <pl-accordion-item value="warranty" heading="Warranty">
        <p>Every product has a two year warranty.</p>
      </pl-accordion-item>
    </pl-accordion>
  `,
};

/** With `multiple`, opening a section leaves the others as they are. */
export const Multiple: Story = {
  render: () => html`
    <pl-accordion id="control" multiple>
      <pl-accordion-item value="shipping" heading="Shipping" open>
        <p>Orders leave the warehouse within two working days.</p>
      </pl-accordion-item>
      <pl-accordion-item value="returns" heading="Returns" open>
        <p>Send an item back within thirty days for a full refund.</p>
      </pl-accordion-item>
      <pl-accordion-item value="warranty" heading="Warranty">
        <p>Every product has a two year warranty.</p>
      </pl-accordion-item>
    </pl-accordion>
  `,
};

/** `level` sets the heading level, so the sections fit the page outline. */
export const HeadingLevel: Story = {
  render: () => html`
    <pl-accordion id="control" level="2">
      <pl-accordion-item value="shipping" heading="Shipping">
        <p>Orders leave the warehouse within two working days.</p>
      </pl-accordion-item>
      <pl-accordion-item value="returns" heading="Returns">
        <p>Send an item back within thirty days for a full refund.</p>
      </pl-accordion-item>
    </pl-accordion>
  `,
};

/** A disabled section takes no focus, and the arrow keys skip it. */
export const DisabledItem: Story = {
  render: () => html`
    <pl-accordion id="control">
      <pl-accordion-item value="shipping" heading="Shipping">
        <p>Orders leave the warehouse within two working days.</p>
      </pl-accordion-item>
      <pl-accordion-item value="returns" heading="Returns" disabled>
        <p>Send an item back within thirty days for a full refund.</p>
      </pl-accordion-item>
      <pl-accordion-item value="warranty" heading="Warranty">
        <p>Every product has a two year warranty.</p>
      </pl-accordion-item>
    </pl-accordion>
  `,
};

/** The `heading` slot holds richer button content than plain text. */
export const RichHeading: Story = {
  render: () => html`
    <pl-accordion id="control">
      <pl-accordion-item value="shipping">
        <span slot="heading">Shipping <em>(free over 50)</em></span>
        <p>Orders leave the warehouse within two working days.</p>
      </pl-accordion-item>
    </pl-accordion>
  `,
};

export const Glass: Story = {
  render,
  globals: { material: "glass", theme: "dark", contrast: "more", dir: "ltr" },
};

export const Light: Story = { render, globals: { theme: "light" } };

export const Dark: Story = { render, globals: { theme: "dark" } };

export const MoreContrast: Story = { render, globals: { contrast: "more" } };

/** Under right-to-left the arrow mirrors and the text starts on the right. */
export const Rtl: Story = { render, globals: { dir: "rtl" } };

/** Tab reaches a button, Enter opens its section and ArrowDown moves on. */
export const Keyboard: Story = {
  render,
  play: async ({ canvasElement }) => {
    const el = await control(canvasElement);
    const [shipping, returns] = el.items;
    // The item delegates focus to its button, as Tab would reach it.
    shipping!.focus();
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(shipping!.open).toBe(true));
    await userEvent.keyboard("{ArrowDown}");
    expect(returns).toHaveFocus();
  },
};
