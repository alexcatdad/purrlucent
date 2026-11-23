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

const photo = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 120"><rect width="320" height="120" fill="#cfe3f5"/><circle cx="160" cy="64" r="34" fill="#5b7fa6"/><path d="M132 44 138 16 156 34ZM188 44 182 16 164 34Z" fill="#5b7fa6"/></svg>`,
)}`;

const roles = [
  ["Foreground", "--pl-color-foreground"],
  ["Muted foreground", "--pl-color-muted-foreground"],
  ["Accent text", "--pl-color-accent-text"],
  ["Destructive text", "--pl-color-destructive-text"],
] as const;

const render = () => html`
  <article class="pl-prose" id="prose">
    <h1>Caring for a cat</h1>
    <p class="lead">
      A cat needs food, water and a quiet place to rest. This guide covers the
      first week.
    </p>
    <p>
      A cat needs <strong>food</strong>, water and a quiet place to rest. Read
      the <a href="#care">care notes</a> before the first day, and keep
      <code>vet-contact.txt</code> close. For more, see
      <a href="https://example.com/cats" rel="noreferrer">an outside guide</a>,
      or the <a href="">page you are on</a>.
    </p>
    <h2>Text styles</h2>
    <h3>Third level</h3>
    <h4>Fourth level</h4>
    <h5>Fifth level</h5>
    <h6>Sixth level</h6>
    <p>
      Text can be <strong>strong</strong>, <em>emphasized</em> or
      <strong><em>both</em></strong
      >. Use <mark>mark</mark> to highlight, <del>del</del> for removed and
      <ins>ins</ins> for added text, and <s>s</s> for what no longer applies.
      Water is H<sub>2</sub>O and a cat has nine lives<sup>1</sup>. The
      <abbr title="Veterinarian">vet</abbr> said, <q>Keep calm.</q> See
      <cite>The Cat Handbook</cite>, press <kbd>Space</kbd> to play, and book
      for <time datetime="2026-11-24">24 November 2026</time>.
      <small>Small print belongs in small type.</small>
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
      <li>
        Serve the food.
        <ol>
          <li>Wash the bowl.</li>
          <li>Fill it.</li>
        </ol>
      </li>
    </ol>
    <dl>
      <dt>Wet food</dt>
      <dd>Served in the morning.</dd>
      <dt>Dry food</dt>
      <dd>Served in the evening.</dd>
    </dl>
    <blockquote>
      <p>A cat sleeps for most of the day, and that is normal.</p>
      <footer>The vet, <cite>Cat Handbook</cite></footer>
    </blockquote>
    <h3>Meals</h3>
    <table>
      <caption>
        Feeding times and amounts.
      </caption>
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
    <pre><code>feed --cat Miso
  --food wet
  --amount 1</code></pre>
    <figure>
      <img src=${photo} alt="A grey cat face on a pale blue background" />
      <figcaption>Miso waits for breakfast.</figcaption>
    </figure>
    <hr />
    <address>
      Purrlucent Cat Clinic<br />
      1 Whisker Lane<br />
      Catford
    </address>
    <details>
      <summary>When to call the vet</summary>
      <p>Call if your cat stops eating for a day.</p>
    </details>
    <h2>Text colors</h2>
    <ul>
      ${roles.map(
        ([name, token]) =>
          html`<li><span style="color: var(${token})">${name}</span></li>`,
      )}
    </ul>
  </article>
`;

export const Default: Story = { render };

export const Dark: Story = { render, globals: { theme: "dark" } };

export const Rtl: Story = { render, globals: { dir: "rtl" } };

export const Glass: Story = {
  render,
  globals: { material: "glass", theme: "dark", contrast: "more" },
  play: () => {
    expect(document.documentElement.getAttribute("pl-material")).toBe("glass");
  },
};
