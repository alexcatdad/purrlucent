import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { generateNotices } from "./third-party-notices.ts";

const notices = generateNotices(process.cwd());

test("includes Lit's BSD-3-Clause notice", () => {
  expect(notices).toContain("lit ");
  expect(notices).toContain("License: BSD-3-Clause");
  expect(notices).toContain("Copyright (c) 2017 Google LLC");
  expect(notices).toContain("Neither the name of the copyright holder");
});

test("covers every production dependency Lit pulls in", () => {
  for (const name of ["@lit/reactive-element", "lit-element", "lit-html"]) {
    expect(notices).toContain(name);
  }
});

test("leaves out development dependencies", () => {
  expect(notices).not.toContain("storybook");
  expect(notices).not.toContain("vitest");
});

test("the committed THIRD_PARTY_NOTICES is up to date", () => {
  expect(readFileSync("THIRD_PARTY_NOTICES", "utf8")).toBe(notices);
});
