import type { StorybookConfig } from "@storybook/web-components-vite";
import { STORY_GROUPS } from "./groups.ts";

const config: StorybookConfig = {
  framework: "@storybook/web-components-vite",
  storySorts: [{ order: [...STORY_GROUPS] }],
  stories: ["../docs/*.mdx", "../src/**/*.stories.ts"],
  core: { disableTelemetry: true },
  addons: [
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-vitest",
  ],
};

export default config;
