import { defineConfig } from "eslint/config";
import { configs as lit } from "eslint-plugin-lit";
import tseslint from "typescript-eslint";

export default defineConfig({
  files: ["src/**/*.ts"],
  extends: [tseslint.configs.recommended, lit["flat/recommended"]],
});
