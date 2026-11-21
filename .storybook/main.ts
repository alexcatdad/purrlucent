import type { StorybookConfig } from "@storybook/web-components-vite";

const config: StorybookConfig = {
  framework: "@storybook/web-components-vite",
  stories: ["../docs/*.mdx", "../src/**/*.stories.ts"],
  core: { disableTelemetry: true },
  addons: [
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-vitest",
  ],
};

export default config;
