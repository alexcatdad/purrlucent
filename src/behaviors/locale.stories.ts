import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import "../components/banner/banner.ts";
import "../components/checkbox/checkbox.ts";
import "../components/combobox/combobox.ts";
import "../components/date-picker/date-picker.ts";
import "../components/pagination/pagination.ts";
import { setMessages, type PlMessages } from "./locale.ts";

const meta = {
  title: "Foundations/Localization",
  parameters: {
    docs: {
      description: {
        component:
          'The library ships its built-in text in English. An app registers another language once, with `setMessages("sv", { … })`, and every component inside an element with that `lang` uses it, also inside other components. Changing `lang` or calling `setMessages` later updates the components already on the page. An attribute such as `close-label` still wins.',
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj;

// Part of a Swedish table; an app passes every key, so a missing one fails its build.
const swedish = {
  dismiss: "Stäng",
  showOptionsFor: "{label}, visa alternativ",
  noResults: "Inga resultat",
  chooseDate: "Välj datum",
  previousMonth: "Föregående månad",
  nextMonth: "Nästa månad",
  pagination: "Sidnumrering",
  previousPage: "Föregående sida",
  nextPage: "Nästa sida",
  checkRequired: "Markera rutan för att fortsätta.",
} as PlMessages;

// Registered after the page has rendered, by the button in the story.
const german = { dismiss: "Schließen" } as PlMessages;

export const Swedish: Story = {
  render: () => {
    setMessages("sv", swedish);
    return html`<div
      id="lang"
      lang="sv"
      style="display:grid;justify-items:start;gap:var(--pl-space-3);padding:var(--pl-space-4)"
    >
      <pl-banner open>
        <strong slot="title">Sparat</strong>
        Ändringarna är sparade.
      </pl-banner>
      <pl-combobox label="Frukt">
        <pl-option>Äpple</pl-option>
        <pl-option>Päron</pl-option>
      </pl-combobox>
      <pl-date-picker
        id="date"
        label="Datum"
        value="2026-11-18"
      ></pl-date-picker>
      <pl-pagination total="5"></pl-pagination>
      <pl-checkbox id="terms" required>Villkor</pl-checkbox>
      <button
        id="add-german"
        type="button"
        @click=${() => setMessages("de", german)}
      >
        Register German
      </button>
    </div>`;
  },
};
