import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { LitElement, html } from "lit";
import { interactionStyles } from "./interaction.css.ts";
import { PressableController } from "./pressable.ts";

/** A bare pressable control that the interaction behaviors are tested on. */
class PurrInteractionHost extends LitElement {
  static override styles = [interactionStyles];
  static override properties = { disabled: { type: Boolean, reflect: true } };
  declare disabled: boolean;
  readonly pressable = new PressableController(this, {
    disabled: () => this.disabled,
  });

  constructor() {
    super();
    this.disabled = false;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.setAttribute("role", "button");
    this.tabIndex = 0;
  }

  override render() {
    return html`<slot></slot>`;
  }
}

customElements.define("purr-interaction-host", PurrInteractionHost);

const meta = { title: "Behaviors/Interaction" } satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {
  render: () =>
    html`<purr-interaction-host id="host">Press</purr-interaction-host>`,
};
