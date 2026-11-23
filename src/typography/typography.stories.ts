import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { expect } from "storybook/test";
import { proseStyles } from "./typography.css.ts";

// The prose styles are plain page styles, so the story adds them to the document.
const sheet = proseStyles.styleSheet!;
if (!document.adoptedStyleSheets.includes(sheet))
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];

const meta = { title: "Foundations/Typography" } satisfies Meta;

export default meta;

type Story = StoryObj;

const render = () => html`
  <article class="pl-prose" id="prose">
    <h1>Caring for a cat</h1>
    <p>
      A cat needs <strong>food</strong>, water and a quiet place to rest. Read
      the <a href="#care">care notes</a> before the first day, and keep
      <code>vet-contact.txt</code> close.
    </p>
    <h2>Daily routine</h2>
    <ul>
      <li>Fresh water in the morning.</li>
      <li>
        Two meals a day:
        <ul>
          <li>Breakfast</li>
          <li>Dinner</li>
        </ul>
      </li>
      <li>Play for ten minutes.</li>
    </ul>
    <ol>
      <li>Open the tin.</li>
      <li>Serve the food.</li>
    </ol>
    <blockquote>
      <p>A cat sleeps for most of the day, and that is normal.</p>
    </blockquote>
    <h3>Meals</h3>
    <table>
      <thead>
        <tr>
          <th>Time</th>
          <th>Food</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Morning</td>
          <td>Wet food</td>
          <td>One tin</td>
        </tr>
        <tr>
          <td>Evening</td>
          <td>Dry food</td>
          <td>One scoop</td>
        </tr>
      </tbody>
    </table>
    <h4>Notes</h4>
    <p>Wash the bowls after every meal.</p>
  </article>
`;

export const Default: Story = { render };

export const Rtl: Story = { render, globals: { dir: "rtl" } };

export const Glass: Story = {
  // Prose is content: it sits on a solid page surface, not on the glass backdrop.
  render: () =>
    html`<div style="background: var(--pl-color-background)">${render()}</div>`,
  globals: { material: "glass", theme: "dark", contrast: "more" },
  play: () => {
    expect(document.documentElement.getAttribute("pl-material")).toBe("glass");
  },
};
