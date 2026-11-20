import type { Preview } from "@storybook/web-components-vite";
import "../src/tokens/tokens.css";

const toolbar = (description: string, items: string[]) => ({
  description,
  toolbar: { items, dynamicTitle: true },
});

// Each global becomes an attribute on the story root. The tokens layer reads
// purr-material; theme and contrast follow the system preference, so the
// theme and contrast attributes are inert (the library has no appearance switch).
const attributes = {
  material: "purr-material",
  theme: "data-theme",
  contrast: "data-contrast",
  dir: "dir",
} as const;

const preview: Preview = {
  globalTypes: {
    material: toolbar("Surface material", ["solid", "glass"]),
    theme: toolbar("Color theme", ["light", "dark"]),
    contrast: toolbar("Contrast", ["normal", "more"]),
    dir: toolbar("Text direction", ["ltr", "rtl"]),
  },
  initialGlobals: {
    material: "solid",
    theme: "light",
    contrast: "normal",
    dir: "ltr",
  },
  parameters: { a11y: { test: "error" } },
  decorators: [
    (story, { globals }) => {
      for (const [global, attribute] of Object.entries(attributes)) {
        document.documentElement.setAttribute(attribute, globals[global]);
      }
      return story();
    },
  ],
};

export default preview;
