import { defineConfig } from "eslint/config";
import { configs as lit } from "eslint-plugin-lit";
import tseslint from "typescript-eslint";

export default defineConfig({
  files: ["src/**/*.ts", "e2e/**/*.ts", "playwright.config.ts"],
  extends: [tseslint.configs.recommended, lit["flat/recommended"]],
});
