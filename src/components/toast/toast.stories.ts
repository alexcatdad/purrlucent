import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { expect, waitFor } from "storybook/test";
import "../button/button.ts";
import "./toast.ts";
import { PlToaster, type PlToast } from "./toast.ts";

import { playground } from "../../../.storybook/playground.ts";

const meta = {
  title: "Feedback/Toast",
  component: "pl-toast",
  tags: ["autodocs"],
  parameters: { controls: { disable: true } },
} satisfies Meta;

export default meta;

type Story = StoryObj;

// The toaster is fixed to the viewport edge, so the page around it is only content.
const page = (content: unknown) =>
  html`<div style="padding:var(--pl-space-4)">
    <pl-button id="before">Before the toasts</pl-button>
    <p style="margin:0">Page content.</p>
    ${content}
  </div>`;

const saved = html`<pl-toast duration="0">
  <strong slot="title">Saved</strong>
  Your changes are saved.
</pl-toast>`;

export const Playground: Story = {
  ...playground(
    {
      heading: "Saved",
      variant: ["default", "success", "warning", "destructive"],
    },
    ["pl-close"],
  ),
  render: ({ heading, variant }) =>
    page(
      html`<pl-toaster
        ><pl-toast duration="0" variant=${variant}
          ><strong slot="title">${heading}</strong>Your changes are
          saved.</pl-toast
        ></pl-toaster
      >`,
    ),
};

// Stories that other tests open as they are have no play function.
export const Default: Story = {
  render: () => page(html`<pl-toaster>${saved}</pl-toaster>`),
};

export const Variants: Story = {
  render: () =>
    page(
      html`<pl-toaster>
        ${saved}
        <pl-toast variant="destructive" duration="0">
          <strong slot="title">The message could not be sent</strong>
          Check the network connection and try again.
        </pl-toast>
        <pl-toast variant="success" duration="0">
          <strong slot="title">Backup complete</strong>
          Every file is backed up.
        </pl-toast>
        <pl-toast variant="warning" duration="0">
          <strong slot="title">Storage almost full</strong>
          Less than 1 GB is left.
        </pl-toast>
      </pl-toaster>`,
    ),
};

/** A toast with an action never dismisses itself; its duration is ignored. */
export const WithAction: Story = {
  render: () =>
    page(
      html`<pl-toaster>
        <pl-toast duration="500">
          <strong slot="title">Message deleted</strong>
          It is gone from every device.
          <pl-button slot="action" variant="tinted">Undo</pl-button>
        </pl-toast>
      </pl-toaster>`,
    ),
};

/** Newest last, nearest the edge. */
export const Stack: Story = {
  render: () =>
    page(
      html`<pl-toaster>
        <pl-toast duration="0"><strong slot="title">First</strong></pl-toast>
        <pl-toast duration="0"><strong slot="title">Second</strong></pl-toast>
        <pl-toast duration="0"><strong slot="title">Third</strong></pl-toast>
      </pl-toaster>`,
    ),
};

/** It dismisses itself after its duration; the tests shorten it. */
export const AutoDismiss: Story = {
  render: () =>
    page(
      html`<pl-toaster>
        <pl-toast duration="60000">
          <strong slot="title">Copied</strong>
          The link is on the clipboard.
        </pl-toast>
      </pl-toaster>`,
    ),
};

/** `show()` on the page's toaster builds toasts from script. */
export const Imperative: Story = {
  render: () =>
    page(
      html`<pl-toaster id="toaster"></pl-toaster>
        <div style="display:flex;gap:var(--pl-space-2)">
          <pl-button
            id="plain"
            @click=${() =>
              PlToaster.show({
                title: "Saved",
                description: "Your changes are saved.",
                duration: 0,
              })}
            >Plain</pl-button
          >
          <pl-button
            id="action"
            @click=${() =>
              PlToaster.show({
                title: "Message deleted",
                action: {
                  label: "Undo",
                  onClick: () => {
                    (window as never as { undone: boolean }).undone = true;
                  },
                },
              })}
            >With action</pl-button
          >
          <pl-button
            id="destructive"
            @click=${() =>
              PlToaster.show({
                title: "Not saved",
                variant: "destructive",
                duration: 0,
              })}
            >Destructive</pl-button
          >
        </div>`,
    ),
};

/** A description past a set height scrolls and can be reached with the keyboard. */
export const LongDescription: Story = {
  render: () =>
    page(
      html`<pl-toaster>
        <pl-toast duration="0">
          <strong slot="title">Import finished</strong>
          <span style="white-space:pre-line"
            >${Array.from(
              { length: 30 },
              (_, i) => `Row ${i + 1} imported`,
            ).join("\n")}</span
          >
        </pl-toast>
      </pl-toaster>`,
    ),
};

/** `show()` takes a node as a description, a repeated `id` replaces a toast in place, and a string keeps its line breaks. */
export const Described: Story = {
  render: () =>
    page(
      html`<pl-toaster id="toaster"></pl-toaster>
        <div style="display:flex;gap:var(--pl-space-2)">
          <pl-button
            id="details"
            @click=${() => {
              const details = document.createElement("details");
              const summary = document.createElement("summary");
              summary.textContent = "Technical details";
              details.append(summary, "Error 503 from the sync service.");
              PlToaster.show({
                title: "Sync failed",
                description: details,
                variant: "destructive",
                duration: 0,
              });
            }}
            >Details</pl-button
          >
          <pl-button
            id="lines"
            @click=${() =>
              PlToaster.show({
                title: "Imported",
                description: "First line\nSecond line",
                variant: "success",
                duration: 0,
              })}
            >Lines</pl-button
          >
          <pl-button
            id="progress"
            @click=${() => {
              const w = window as never as { step: number };
              w.step = (w.step ?? 0) + 1;
              PlToaster.show({
                id: "upload",
                title: `Upload step ${w.step}`,
                variant: "warning",
                duration: 0,
              });
            }}
            >Progress</pl-button
          >
        </div>`,
    ),
};

/** With no toaster on the page, `PlToaster.show()` makes one. */
export const WithoutToaster: Story = {
  render: () =>
    page(
      html`<pl-button
        id="show"
        @click=${() => PlToaster.show({ title: "Saved", duration: 0 })}
        >Show</pl-button
      >`,
    ),
};

export const Rtl: Story = {
  render: () => page(html`<pl-toaster>${saved}</pl-toaster>`),
  globals: { dir: "rtl" },
};

export const Glass: Story = {
  render: () => page(html`<pl-toaster>${saved}</pl-toaster>`),
  globals: { material: "glass", theme: "dark", contrast: "more" },
};

/** The close button closes the toast. */
export const Dismissed: Story = {
  render: () => page(html`<pl-toaster>${saved}</pl-toaster>`),
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector<PlToast>("pl-toast")!;
    await el.updateComplete;
    el.shadowRoot!.querySelector<HTMLElement>("[part=close]")!.click();
    await waitFor(() => expect(el.hidden).toBe(true));
  },
};
