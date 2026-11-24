import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import { expect, userEvent } from "storybook/test";
import "../button/button.ts";
import "../input/input.ts";
import "../select/select.ts";
import "./dialog.ts";
import type { PlDialog } from "./dialog.ts";

const meta = {
  title: "Dialogs/Dialog",
  component: "pl-dialog",
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
  html`<div style="padding:var(--pl-space-4)">
    <pl-button
      id="trigger"
      @click=${(event: Event) =>
        (
          (event.currentTarget as HTMLElement).nextElementSibling as PlDialog
        ).show()}
      >${label}</pl-button
    >${dialog}
  </div>`;

const draft = (stacked = false) =>
  html`<pl-dialog id="dialog" variant="alert">
    <h2 slot="title">Save this message as a draft?</h2>
    This message has not been sent and contains unsaved changes. You can save it
    as a draft to work on later.
    ${
      stacked
        ? html`<pl-button slot="actions" size="lg" default data-close="save"
              >Save</pl-button
            >
            <pl-button slot="actions" size="lg" destructive data-close="discard"
              >Don’t Save</pl-button
            >
            <pl-button slot="actions" size="lg" cancel data-close="cancel"
              >Cancel</pl-button
            >`
        : html`<pl-button slot="actions" size="lg" cancel data-close="cancel"
              >Cancel</pl-button
            >
            <pl-button slot="actions" size="lg" default data-close="save"
              >Save</pl-button
            >`
    }
  </pl-dialog>`;

/*
 * Form rows: a label and its control share a row. The row is a two-column
 * grid, the same label column as the sheet's icon, and the label is hidden from
 * assistive technology because the control carries the name.
 */
const rows = (dir?: "ltr") =>
  html`<style>
      .rows {
        display: grid;
        gap: var(--pl-gap-form);
      }
      .row {
        display: grid;
        grid-template-columns: calc(var(--pl-spacing) * 23) minmax(0, 1fr);
        gap: var(--pl-gap-form);
        align-items: center;
      }
      .row > span {
        color: var(--pl-color-muted-foreground);
        text-align: end;
      }
      .row > :is(pl-input, pl-select) {
        inline-size: 100%;
      }
    </style>
    <div class="rows">
      <div class="row">
        <span aria-hidden="true" dir=${ifDefined(dir)}>Save As:</span>
        <pl-input
          label="Save as"
          value="Untitled"
          dir=${ifDefined(dir)}
          autofocus
        ></pl-input>
      </div>
      <div class="row">
        <span aria-hidden="true" dir=${ifDefined(dir)}>Tags:</span>
        <pl-input label="Tags" dir=${ifDefined(dir)}></pl-input>
      </div>
      <div class="row">
        <span aria-hidden="true" dir=${ifDefined(dir)}>File Format:</span>
        <pl-select
          label="File format"
          value="Rich Text Document"
          dir=${ifDefined(dir)}
        >
          <pl-option>Rich Text Document</pl-option>
          <pl-option>Plain Text</pl-option>
        </pl-select>
      </div>
    </div>`;

/** `dir="ltr"` isolates the English sentences when the story runs right to left. */
const save = (dir?: "ltr") =>
  html`<pl-dialog id="dialog" variant="sheet">
    ${file}
    <h2 slot="title" dir=${ifDefined(dir)}>
      Do you want to keep this new document “Untitled”?
    </h2>
    <p slot="description" style="margin:0" dir=${ifDefined(dir)}>
      You can choose to save your changes, or delete this document immediately.
      You can’t undo this action.
    </p>
    ${rows(dir)}
    <pl-button slot="actions" destructive data-close="delete">Delete</pl-button>
    <pl-button slot="actions" cancel data-close="cancel">Cancel</pl-button>
    <pl-button slot="actions" default data-close="save">Save</pl-button>
  </pl-dialog>`;

const long = html`<pl-dialog id="dialog" variant="sheet" dismissible>
  <h2 slot="title">Terms of use</h2>
  ${Array.from(
    { length: 24 },
    (_, i) =>
      html`<p style="margin:0 0 var(--pl-space-3)">
        ${i + 1}. The content of this section is long enough that the body of
        the dialog has to scroll while the title and the actions stay in view.
      </p>`,
  )}
  <pl-button slot="actions" cancel data-close="decline">Decline</pl-button>
  <pl-button slot="actions" default data-close="accept">Accept</pl-button>
</pl-dialog>`;

/** Opens the dialog with a real click, as a person would. */
const open = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  await userEvent.click(canvasElement.querySelector("#trigger")!);
  const el = canvasElement.querySelector<PlDialog>("#dialog")!;
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
      html`<pl-dialog id="dialog" variant="alert">
        ${mail}
        <h2 slot="title">Delete this draft?</h2>
        The draft will be removed from all devices.
        <pl-button slot="actions" size="lg" destructive data-close="delete"
          >Delete</pl-button
        >
        <pl-button slot="actions" size="lg" cancel data-close="cancel"
          >Cancel</pl-button
        >
      </pl-dialog>`,
    ),
  play: open,
};

export const OpenStackedAlert: Story = {
  render: () => scene("Show alert", draft(true)),
  play: open,
};

/** A sheet with form rows. `autofocus` on the first field gives it initial focus. */
export const OpenSheet: Story = {
  render: () => scene("Show sheet", save()),
  play: open,
};

/** The body scrolls; the title and the actions stay in view. */
export const OpenLongContent: Story = {
  render: () => scene("Show terms", long),
  play: open,
};

export const Rtl: Story = {
  render: () => scene("Show sheet", save("ltr")),
  play: open,
  globals: { dir: "rtl" },
};

export const Glass: Story = {
  render: () => scene("Show alert", draft()),
  play: open,
  globals: { material: "glass", theme: "dark", contrast: "more" },
};

const note = (text: string) => html`<p style="margin:0">${text}</p>`;

/** With a cancel action, the close button clicks it, as Escape does. */
export const OpenClosableWithCancel: Story = {
  render: () =>
    scene(
      "Show sheet",
      html`<pl-dialog id="dialog" variant="sheet" closable>
        <h2 slot="title">Rename file</h2>
        ${note("The new name applies everywhere.")}
        <pl-button slot="actions" cancel data-close="cancel">Cancel</pl-button>
        <pl-button slot="actions" default data-close="save">Save</pl-button>
      </pl-dialog>`,
    ),
  play: open,
};

/** `closable` adds a close button to the header; it cancels like Escape. */
export const OpenClosable: Story = {
  render: () =>
    scene(
      "Show sheet",
      html`<pl-dialog id="dialog" variant="sheet" closable>
        <h2 slot="title">Keyboard shortcuts</h2>
        <p slot="description" style="margin:0">
          Shortcuts work anywhere in the app.
        </p>
        ${note("Press Command-K to search.")}
        <pl-button slot="actions" data-close="done">Done</pl-button>
      </pl-dialog>`,
    ),
  play: open,
};

/** `actions-start` holds status text at the start of the actions row. */
export const OpenActionsStart: Story = {
  render: () =>
    scene(
      "Show sheet",
      html`<pl-dialog id="dialog" variant="sheet">
        <h2 slot="title">Translate</h2>
        ${note("Review the suggested translation before you save it.")}
        <span slot="actions-start">3 of 12 reviewed</span>
        <pl-button slot="actions" cancel data-close="cancel">Cancel</pl-button>
        <pl-button slot="actions" default data-close="save">Save</pl-button>
      </pl-dialog>`,
    ),
  play: open,
};

/** The `description` attribute describes a dialog that has no description slot. */
export const OpenDescribedByAttribute: Story = {
  render: () =>
    scene(
      "Show sheet",
      html`<pl-dialog
        id="dialog"
        variant="sheet"
        description="Changes apply to every project you own."
      >
        <h2 slot="title">Default settings</h2>
        ${note("Choose the defaults for new projects.")}
        <pl-button slot="actions" data-close="done">Done</pl-button>
      </pl-dialog>`,
    ),
  play: open,
};

/** `nonmodal` keeps the page behind interactive: no scrim, no focus trap. */
export const OpenNonmodal: Story = {
  render: () =>
    html`<div style="padding:var(--pl-space-4)">
      <pl-button
        id="trigger"
        @click=${(event: Event) =>
          (
            (event.currentTarget as HTMLElement).nextElementSibling as PlDialog
          ).show()}
        >Show tool</pl-button
      >
      <pl-dialog id="dialog" variant="sheet" nonmodal closable>
        <h2 slot="title">Translation tool</h2>
        ${note("The page behind stays interactive.")}
        <pl-button slot="actions" data-close="done">Done</pl-button>
      </pl-dialog>
      <pl-button id="page-button">Page action</pl-button>
      <div
        id="page-layer"
        style="position:fixed;inset:0;z-index:10;pointer-events:none"
      ></div>
    </div>`,
  play: open,
};

export const GlassSheet: Story = {
  render: () => scene("Show sheet", save()),
  play: open,
  globals: { material: "glass", theme: "dark", contrast: "more" },
};
