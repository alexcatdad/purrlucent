import type { StorybookConfig } from "@storybook/web-components-vite";
import { STORY_GROUPS } from "./groups.ts";
import kitConfig, { kitPreviewDir } from "../vite.kits.config.ts";

let kitBuild: Promise<unknown> | undefined;

const config: StorybookConfig = {
  framework: "@storybook/web-components-vite",
  storySorts: [{ order: [...STORY_GROUPS] }],
  stories: ["../docs/*.mdx", "../src/**/*.stories.ts"],
  staticDirs: async (dirs = []) => {
    kitBuild ??= import("vite").then(({ build }) =>
      build({ ...kitConfig, configFile: false, logLevel: "warn" }),
    );
    await kitBuild;
    return [...dirs, { from: kitPreviewDir, to: "/kits" }];
  },
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
