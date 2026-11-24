import type { Preview } from "@storybook/web-components-vite";
import "../src/tokens/tokens.css";
import { backdrop } from "./backdrop.css.ts";
import { applyKnobs, knobs } from "./knobs.ts";

if (backdrop.styleSheet)
  document.adoptedStyleSheets = [
    ...document.adoptedStyleSheets,
    backdrop.styleSheet,
  ];

const toolbar = (description: string, items: string[]) => ({
  description,
  toolbar: { items, dynamicTitle: true },
});

// Each global becomes an attribute on the document root. The tokens layer reads
// pl-material. Theme "light" or "dark" sets an inline color-scheme on <html>,
// where the tokens' light-dark() values resolve; "system" leaves the shipped
// behavior (follow the OS). Storybook only: shipped tokens are unchanged. The
// tokens offer no hook for contrast (it follows prefers-contrast), so the
// contrast global stays inert.
const attributes = {
  material: "pl-material",
  theme: "data-theme",
  contrast: "data-contrast",
  dir: "dir",
} as const;

const preview: Preview = {
  globalTypes: {
    material: toolbar("Surface material", ["solid", "glass"]),
    theme: toolbar("Color theme", ["system", "light", "dark"]),
    contrast: toolbar("Contrast", ["normal", "more"]),
    dir: toolbar("Text direction", ["ltr", "rtl"]),
    // The token knobs live in the Tokens panel (manager.ts), not the toolbar.
    ...Object.fromEntries(
      knobs.map((knob) => [knob.key, { description: knob.label }]),
    ),
  },
  initialGlobals: {
    material: "solid",
    theme: "system",
    contrast: "normal",
    dir: "ltr",
    ...Object.fromEntries(knobs.map((knob) => [knob.key, ""])),
  },
  parameters: {
    // Storybook reads storySort statically, so the order is a literal here;
    // scripts/story-titles.test.ts keeps it equal to STORY_GROUPS.
    options: {
      storySort: {
        order: [
          "Foundations",
          "Actions",
          "Forms",
          "Text",
          "Navigation",
          "Menus",
          "Dialogs",
          "Feedback",
          "Cards & Lists",
          "Containers",
          "Data",
          "AI & Chat",
          "Patterns",
        ],
      },
    },
    a11y: {
      test: "error",
      // Axe ships the WCAG 2.2 AA target-size rule (24px) switched off.
      options: { rules: { "target-size": { enabled: true } } },
    },
  },
  decorators: [
    (story, { globals }) => {
      for (const [global, attribute] of Object.entries(attributes)) {
        document.documentElement.setAttribute(attribute, globals[global]);
      }
      document.documentElement.style.colorScheme =
        globals.theme === "system" ? "" : globals.theme;
      applyKnobs(document.documentElement, globals);
      // Control fills are translucent and tint whatever is behind them, so the
      // page paints the background token, as an app does. Glass paints the
      // backdrop scene instead (backdrop.css.ts), so the inline paint steps aside.
      const glass = globals.material === "glass";
      document.body.toggleAttribute("data-backdrop", glass);
      document.body.style.background = glass
        ? ""
        : "var(--pl-color-background)";
      // Story text outside components renders in the library's type, not the
      // browser's default serif.
      document.body.style.font =
        "var(--pl-text-base) / var(--pl-leading-normal) var(--pl-font-sans)";
      document.body.style.color = "var(--pl-color-foreground)";
      return story();
    },
  ],
};

export default preview;
