import type { Preview } from "@storybook/web-components-vite";
import "../src/tokens/tokens.css";

const toolbar = (description: string, items: string[]) => ({
  description,
  toolbar: { items, dynamicTitle: true },
});

// Each global becomes an attribute on the document root. The tokens layer reads
// purr-material. Theme "light" or "dark" sets an inline color-scheme on <html>,
// where the tokens' light-dark() values resolve; "system" leaves the shipped
// behavior (follow the OS). Storybook only: shipped tokens are unchanged. The
// tokens offer no hook for contrast (it follows prefers-contrast), so the
// contrast global stays inert.
const attributes = {
  material: "purr-material",
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
  },
  initialGlobals: {
    material: "solid",
    theme: "system",
    contrast: "normal",
    dir: "ltr",
  },
  parameters: { a11y: { test: "error" } },
  decorators: [
    (story, { globals }) => {
      for (const [global, attribute] of Object.entries(attributes)) {
        document.documentElement.setAttribute(attribute, globals[global]);
      }
      document.documentElement.style.colorScheme =
        globals.theme === "system" ? "" : globals.theme;
      // Control fills are translucent and tint whatever is behind them, so the
      // page paints the background token, as an app does.
      document.body.style.background = "var(--purr-color-background)";
      return story();
    },
  ],
};

export default preview;
