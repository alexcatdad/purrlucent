import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import "../field/field.ts";
import "./file-input.ts";
import type { PlFileInput } from "./file-input.ts";

import { playground } from "../../../.storybook/playground.ts";

const meta = {
  title: "Forms/File Input",
  component: "pl-file-input",
  tags: ["autodocs"],
  parameters: { controls: { disable: true } },
} satisfies Meta;

export default meta;

type Story = StoryObj;

const column = (content: unknown) =>
  html`<div
    style="display:grid;justify-items:start;gap:var(--pl-space-3);padding:var(--pl-space-4)"
  >
    ${content}
  </div>`;

const sample = (name: string, type = "text/plain") =>
  new File(["sample"], name, { type });

export const Playground: Story = {
  ...playground({ label: "Attachment", multiple: false, disabled: false }, [
    "pl-change",
  ]),
  render: ({ label, multiple, disabled }) =>
    html`<pl-file-input
      label=${label}
      ?multiple=${multiple}
      ?disabled=${disabled}
    ></pl-file-input>`,
};

// Stories that other tests open as they are have no play function.
export const Default: Story = {
  render: () =>
    html`<pl-file-input id="file" label="Attachment"></pl-file-input>`,
};

export const Labelled: Story = {
  render: () =>
    column(
      html`<pl-file-input id="file" accept=".pdf,image/*"
        >Resume<span slot="description"
          >A PDF or an image, up to 5 MB.</span
        ></pl-file-input
      >`,
    ),
};

export const Multiple: Story = {
  render: () =>
    column(
      html`<pl-file-input id="file" multiple accept="image/*"
        >Photos</pl-file-input
      >`,
    ),
};

export const States: Story = {
  render: () =>
    column([
      html`<pl-file-input id="empty" label="Empty"></pl-file-input>`,
      html`<pl-file-input id="filled" label="Filled"></pl-file-input>`,
      html`<pl-file-input
        id="several"
        label="Several"
        multiple
      ></pl-file-input>`,
      html`<pl-file-input
        id="disabled"
        label="Disabled"
        disabled
      ></pl-file-input>`,
      html`<pl-file-input
        id="invalid"
        label="Invalid"
        required
      ></pl-file-input>`,
    ]),
  play: async ({ canvasElement }) => {
    const find = (id: string) =>
      canvasElement.querySelector<PlFileInput>(`#${id}`)!;
    find("filled").files = [sample("report.txt")];
    find("several").files = [sample("one.txt"), sample("two.txt")];
    const invalid = find("invalid");
    await invalid.updateComplete;
    // checkValidity fires `invalid` like a blocked submit, without the browser's own bubble.
    invalid.checkValidity();
    await invalid.updateComplete;
  },
};

/** In a form the control submits its files and follows reset, fieldset and validity. */
export const InForm: Story = {
  render: () => html`
    <form id="form" style="padding:var(--pl-space-4)">
      <fieldset
        id="fieldset"
        style="display:grid;justify-items:start;gap:var(--pl-space-3);border:0;padding:0;margin:0"
      >
        <pl-file-input
          id="photos"
          name="photos"
          multiple
          accept="image/*"
          required
          >Photos</pl-file-input
        >
        <pl-file-input id="doc" name="doc">Document</pl-file-input>
      </fieldset>
    </form>
  `,
};

/** The host's `aria-*` attributes reach the button, as they do on `pl-input`. */
export const AriaForwarded: Story = {
  parameters: {
    // The host attributes are forwarded to the inner button, which is where they apply.
    a11y: {
      options: {
        rules: {
          "aria-allowed-attr": { enabled: false },
          "aria-valid-attr-value": { enabled: false },
        },
      },
    },
  },
  render: () =>
    column(html`
      <label for="file">Resume</label>
      <pl-file-input
        id="file"
        aria-required="true"
        aria-invalid="true"
        aria-describedby="hint"
        aria-errormessage="problem"
      ></pl-file-input>
      <span id="hint">A PDF, up to 5 MB.</span>
      <span id="problem">Choose a file.</span>
    `),
};

/** Inside a `pl-field` the field supplies the label, description and error. */
export const InField: Story = {
  render: () =>
    column(
      html`<pl-field id="field" invalid>
        <label slot="label">Resume</label>
        <pl-file-input id="file" accept=".pdf"></pl-file-input>
        <span slot="description">A PDF, up to 5 MB.</span>
        <span slot="error">Choose a file.</span>
      </pl-field>`,
    ),
};

export const Rtl: Story = {
  render: () =>
    column(html`<pl-file-input label="Attachment" multiple></pl-file-input>`),
  globals: { dir: "rtl" },
};

export const Glass: Story = {
  render: () =>
    column(html`<pl-file-input label="Attachment"></pl-file-input>`),
  globals: { material: "glass", theme: "dark", contrast: "more" },
};
