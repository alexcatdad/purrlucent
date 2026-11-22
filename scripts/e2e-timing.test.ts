import { expect, test } from "bun:test";
import type { JSONReport } from "@playwright/test/reporter";
import { rows, summary } from "./e2e-timing.ts";

const spec = (file: string, title: string, durations: number[]) => ({
  file,
  title,
  tests: [{ results: durations.map((duration) => ({ duration })) }],
});

// Only the fields the summary reads.
const report = {
  suites: [
    {
      title: "a.e2e.ts",
      specs: [spec("a.e2e.ts", "keyboard", [1000])],
      suites: [
        {
          title: "phone",
          specs: [spec("a.e2e.ts", "screenshot", [2000, 3000])],
        },
      ],
    },
    { title: "b.e2e.ts", specs: [spec("b.e2e.ts", "axe", [4000])] },
  ],
} as unknown as JSONReport;

test("each test counts all of its attempts and keeps its describe path", () => {
  expect(rows(report)).toEqual([
    { file: "a.e2e.ts", title: "keyboard", ms: 1000 },
    { file: "a.e2e.ts", title: "phone › screenshot", ms: 5000 },
    { file: "b.e2e.ts", title: "axe", ms: 4000 },
  ]);
});

test("the summary splits time by file, slowest first", () => {
  const text = summary(rows(report));
  expect(text).toContain("10s of test time in 3 tests");
  expect(text).toContain("| a.e2e.ts | 2 | 6s | 60% |");
  expect(text.indexOf("phone › screenshot | 5s")).toBeLessThan(
    text.indexOf("b.e2e.ts: axe | 4s"),
  );
});
