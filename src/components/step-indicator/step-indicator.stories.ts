import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { expect } from "storybook/test";
import "./step-indicator.ts";

const meta = {
  title: "Navigation/Step Indicator",
  component: "pl-step-indicator",
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj;

const steps = ["Account details", "Workspace", "Review"];
const indicator = (currentStep: number, labels = steps) =>
  html`<pl-step-indicator
    label="Account setup"
    .steps=${labels}
    current-step=${currentStep}
  ></pl-step-indicator>`;

export const Default: Story = {
  render: () => indicator(2),
  play: async ({ canvasElement }) => {
    const component = canvasElement.querySelector("pl-step-indicator")!;
    const list = component.shadowRoot?.querySelector("ol");
    const items = list?.querySelectorAll("li");
    await expect(list).toHaveAccessibleName("Account setup");
    await expect(items).toHaveLength(3);
    await expect(items?.[1]).toHaveAttribute("aria-current", "step");

    component.currentStep = 3;
    await component.updateComplete;
    await expect(items?.[1]).not.toHaveAttribute("aria-current");
    await expect(items?.[2]).toHaveAttribute("aria-current", "step");

    component.removeAttribute("current-step");
    await component.updateComplete;
    await expect(component.currentStep).toBe(1);
    await expect(items?.[0]).toHaveAttribute("aria-current", "step");
    await expect(items?.[2]).not.toHaveAttribute("aria-current");
  },
};

export const Rtl: Story = {
  render: () => indicator(2, ["تفاصيل الحساب", "مساحة العمل", "المراجعة"]),
  globals: { dir: "rtl" },
};

export const Empty: Story = {
  render: () => indicator(1, []),
};
