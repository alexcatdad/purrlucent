import { expect, test } from "bun:test";
import { prominentIssue } from "./toolbar-rules.ts";

test("no prominent item is fine", () => {
  expect(prominentIssue([])).toBeUndefined();
  expect(prominentIssue([false, false])).toBeUndefined();
});

test("one prominent item at the trailing end is fine", () => {
  expect(prominentIssue([false, false, true])).toBeUndefined();
  expect(prominentIssue([true])).toBeUndefined();
});

test("a prominent item that is not last is reported", () => {
  expect(prominentIssue([true, false])).toContain("trailing end");
});

test("two prominent items are reported", () => {
  expect(prominentIssue([false, true, true])).toContain("at most one");
});
