import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { expect } from "storybook/test";
import "../input/input.ts";
import "./error-summary.ts";

const meta = {
  title: "Feedback/Error Summary",
  component: "pl-error-summary",
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj;

const errors = [
  { name: "email", message: "Enter your email address." },
  { name: "workspace", message: "Enter a workspace name." },
];

const fields = html`
  <div>
    <label for="summary-email">Email address</label>
    <input id="summary-email" type="email" name="email" required />
  </div>
  <pl-input id="summary-workspace" name="workspace" required
    >Workspace</pl-input
  >
`;

export const Default: Story = {
  render: () => html`
    <form>
      <pl-error-summary
        .errors=${[
          ...errors,
          { name: "region", message: "Choose a region." },
          { name: "phone", message: "Enter a phone number." },
        ]}
      ></pl-error-summary>
      <input
        id="hidden-email"
        name="email"
        aria-label="Alternate email address"
        required
        style="visibility: hidden"
      />
      <input name="region" aria-label="Region" disabled />
      ${fields}
    </form>
  `,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const component = canvasElement.querySelector("pl-error-summary")!;
    const summary = component.shadowRoot!;
    const group = summary.querySelector('[role="group"]');
    const links = summary.querySelectorAll("a");
    await expect(links).toHaveLength(2);
    await expect(summary.querySelector("ul")).toHaveTextContent(
      "Choose a region.",
    );
    await expect(summary.querySelector("ul")).toHaveTextContent(
      "Enter a phone number.",
    );
    const [emailLink, workspaceLink] = links;
    await expect(emailLink).toHaveAttribute("href", "#summary-email");

    component.focus();
    await expect(summary.activeElement).toBe(group);
    await userEvent.click(emailLink!);
    await expect(
      canvas.getByRole("textbox", { name: "Email address" }),
    ).toHaveFocus();

    await userEvent.click(workspaceLink!);
    const workspace = canvasElement.querySelector("pl-input");
    await expect(workspace?.shadowRoot?.activeElement).toBe(
      workspace?.shadowRoot?.querySelector("input"),
    );
  },
};

export const SeparateForm: Story = {
  render: () => html`
    <pl-error-summary
      form="team-settings"
      heading="Review your team settings"
      .errors=${errors}
    ></pl-error-summary>
    <form id="team-settings">${fields}</form>
  `,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const link = canvasElement
      .querySelector("pl-error-summary")
      ?.shadowRoot?.querySelector("a");
    await userEvent.click(link!);
    await expect(
      canvas.getByRole("textbox", { name: "Email address" }),
    ).toHaveFocus();
  },
};

export const Empty: Story = {
  render: () => html`
    <form>
      <pl-error-summary></pl-error-summary>
      ${fields}
    </form>
  `,
};
