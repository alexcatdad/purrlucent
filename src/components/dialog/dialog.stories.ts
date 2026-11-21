import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { expect, userEvent } from "storybook/test";
import "../button/button.ts";
import "../input/input.ts";
import "../select/select.ts";
import "./dialog.ts";
import type { PurrDialog } from "./dialog.ts";

const meta = {
  title: "Components/Dialog",
  component: "purr-dialog",
} satisfies Meta;

export default meta;

type Story = StoryObj;

const mail = html`<svg slot="icon" viewBox="0 0 24 24" aria-hidden="true">
  <path
    d="M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10z"
  />
  <path d="M3 7l9 6l9 -6" />
</svg>`;

const file = html`<svg slot="icon" viewBox="0 0 24 24" aria-hidden="true">
  <path d="M14 3v4a1 1 0 0 0 1 1h4" />
  <path
    d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z"
  />
</svg>`;

/** A button that opens the dialog after it, and a dialog that starts closed. */
const scene = (label: string, dialog: unknown) =>
  html`<div style="padding:var(--purr-space-4)">
    <purr-button
      id="trigger"
      @click=${(event: Event) =>
        (
          (event.currentTarget as HTMLElement).nextElementSibling as PurrDialog
        ).show()}
      >${label}</purr-button
    >${dialog}
  </div>`;

const draft = (stacked = false) =>
  html`<purr-dialog id="dialog" variant="alert">
    <h2 slot="title">Save this message as a draft?</h2>
    This message has not been sent and contains unsaved changes. You can save it
    as a draft to work on later.
    ${
      stacked
        ? html`<purr-button
              slot="actions"
              size="lg"
              variant="primary"
              data-close="save"
              >Save</purr-button
            >
            <purr-button
              slot="actions"
              size="lg"
              destructive
              data-close="discard"
              >Don’t Save</purr-button
            >
            <purr-button slot="actions" size="lg" data-close="cancel"
              >Cancel</purr-button
            >`
        : html`<purr-button slot="actions" size="lg" data-close="cancel"
              >Cancel</purr-button
            >
            <purr-button
              slot="actions"
              size="lg"
              variant="primary"
              data-close="save"
              >Save</purr-button
            >`
    }
  </purr-dialog>`;

/*
 * Form rows: a label and its control share a row. The row is a two-column
 * grid, the same label column as the sheet's icon, and the label is hidden from
 * assistive technology because the control carries the name.
 */
const rows = html`<style>
    .rows {
      display: grid;
      gap: var(--purr-gap-form);
    }
    .row {
      display: grid;
      grid-template-columns: calc(var(--purr-spacing) * 23) minmax(0, 1fr);
      gap: var(--purr-gap-form);
      align-items: center;
    }
    .row > span {
      color: var(--purr-color-muted-foreground);
      text-align: end;
    }
    .row > :is(purr-input, purr-select) {
      inline-size: 100%;
    }
  </style>
  <div class="rows">
    <div class="row">
      <span aria-hidden="true">Save As:</span>
      <purr-input label="Save as" value="Untitled" autofocus></purr-input>
    </div>
    <div class="row">
      <span aria-hidden="true">Tags:</span>
      <purr-input label="Tags"></purr-input>
    </div>
    <div class="row">
      <span aria-hidden="true">File Format:</span>
      <purr-select label="File format" value="Rich Text Document">
        <purr-option>Rich Text Document</purr-option>
        <purr-option>Plain Text</purr-option>
      </purr-select>
    </div>
  </div>`;

const save = html`<purr-dialog id="dialog" variant="sheet">
  ${file}
  <h2 slot="title">Do you want to keep this new document “Untitled”?</h2>
  <p slot="description" style="margin:0">
    You can choose to save your changes, or delete this document immediately.
    You can’t undo this action.
  </p>
  ${rows}
  <purr-button slot="actions" destructive data-close="delete"
    >Delete</purr-button
  >
  <purr-button slot="actions" data-close="cancel">Cancel</purr-button>
  <purr-button slot="actions" variant="primary" data-close="save"
    >Save</purr-button
  >
</purr-dialog>`;

const long = html`<purr-dialog id="dialog" variant="sheet" dismissible>
  <h2 slot="title">Terms of use</h2>
  ${Array.from(
    { length: 24 },
    (_, i) =>
      html`<p style="margin:0 0 var(--purr-space-3)">
        ${i + 1}. The content of this section is long enough that the body of
        the dialog has to scroll while the title and the actions stay in view.
      </p>`,
  )}
  <purr-button slot="actions" data-close="decline">Decline</purr-button>
  <purr-button slot="actions" variant="primary" data-close="accept"
    >Accept</purr-button
  >
</purr-dialog>`;

/** Opens the dialog with a real click, as a person would. */
const open = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  await userEvent.click(canvasElement.querySelector("#trigger")!);
  const el = canvasElement.querySelector<PurrDialog>("#dialog")!;
  await el.updateComplete;
  expect(el.open).toBe(true);
};

// Stories that other tests open as they are have no play function.
export const Default: Story = {
  render: () => scene("Show alert", draft()),
};

export const OpenAlert: Story = {
  render: () => scene("Show alert", draft()),
  play: open,
};

export const OpenAlertWithIcon: Story = {
  render: () =>
    scene(
      "Show alert",
      html`<purr-dialog id="dialog" variant="alert">
        ${mail}
        <h2 slot="title">Delete this draft?</h2>
        The draft will be removed from all devices.
        <purr-button slot="actions" size="lg" destructive data-close="delete"
          >Delete</purr-button
        >
        <purr-button slot="actions" size="lg" data-close="cancel"
          >Cancel</purr-button
        >
      </purr-dialog>`,
    ),
  play: open,
};

export const OpenStackedAlert: Story = {
  render: () => scene("Show alert", draft(true)),
  play: open,
};

/** A sheet with form rows. `autofocus` on the first field gives it initial focus. */
export const OpenSheet: Story = {
  render: () => scene("Show sheet", save),
  play: open,
};

/** The body scrolls; the title and the actions stay in view. */
export const OpenLongContent: Story = {
  render: () => scene("Show terms", long),
  play: open,
};

export const Rtl: Story = {
  render: () => scene("Show sheet", save),
  play: open,
  globals: { dir: "rtl" },
};

export const Glass: Story = {
  render: () => scene("Show alert", draft()),
  play: open,
  globals: { material: "glass", theme: "dark", contrast: "more" },
};

export const GlassSheet: Story = {
  render: () => scene("Show sheet", save),
  play: open,
  globals: { material: "glass", theme: "dark", contrast: "more" },
};
