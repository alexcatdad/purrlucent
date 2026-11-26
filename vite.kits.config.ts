import { resolve } from "node:path";
import type { UserConfig } from "vite";
import portable from "./kits/vite.config.ts";

const project = import.meta.dirname;
export const kitPreviewDir = resolve(
  project,
  "node_modules/.cache/purrlucent-kits",
);

// Build the editable HTML files as ordinary Vite pages, using the component
// sources even on a clean checkout where the published dist does not exist.
export default {
  ...portable,
  server: {
    port: process.env.PORT ? Number(process.env.PORT) : undefined,
    allowedHosts: process.env.APP_DOMAIN ? [process.env.APP_DOMAIN] : undefined,
  },
  resolve: {
    alias: [
      {
        find: "purrlucent/tokens.css",
        replacement: resolve(project, "src/tokens/tokens.css"),
      },
      {
        find: "purrlucent/typography",
        replacement: resolve(project, "src/typography/typography.css.ts"),
      },
      {
        find: /^purrlucent\/([\w-]+)$/,
        replacement: resolve(project, "src/components/$1/$1.ts"),
      },
    ],
  },
  build: {
    ...portable.build,
    outDir: kitPreviewDir,
    emptyOutDir: true,
  },
} satisfies UserConfig;
