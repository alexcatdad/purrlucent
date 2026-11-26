import type { StorybookConfig } from "@storybook/web-components-vite";
import { STORY_GROUPS } from "./groups.ts";

const config: StorybookConfig = {
  framework: "@storybook/web-components-vite",
  storySorts: [{ order: [...STORY_GROUPS] }],
  stories: ["../docs/*.mdx", "../src/**/*.stories.ts"],
  core: { disableTelemetry: true },
  // Set the route before the manager selects its first story.
  managerHead: (head) => `${head}
    <script>
      {
        const url = new URL(location.href);
        if (!url.searchParams.get("path")) {
          url.searchParams.set("path", "/docs/install--docs");
          history.replaceState(history.state, "", url);
        }
      }
    </script>`,
  addons: [
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-vitest",
  ],
};

export default config;
