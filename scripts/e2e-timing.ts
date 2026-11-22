// Writes a Markdown summary of where an e2e run spent its time, from
// Playwright's JSON report: per file, screenshot tests against the rest, and
// the slowest tests. CI appends it to the job summary.
//
// Usage: bun scripts/e2e-timing.ts <report.json>
import type { JSONReport, JSONReportSuite } from "@playwright/test/reporter";

interface Row {
  file: string;
  title: string;
  ms: number;
}

/** One row per test, with the time of all its attempts. */
export function rows(report: JSONReport): Row[] {
  const out: Row[] = [];
  const walk = (suite: JSONReportSuite, path: string[]) => {
    for (const spec of suite.specs)
      for (const test of spec.tests)
        out.push({
          file: spec.file,
          title: [...path, spec.title].join(" › "),
          ms: test.results.reduce((sum, result) => sum + result.duration, 0),
        });
    for (const child of suite.suites ?? []) walk(child, [...path, child.title]);
  };
  for (const suite of report.suites) walk(suite, []);
  return out;
}

const seconds = (ms: number) => `${Math.round(ms / 1000)}s`;
const sum = (list: Row[]) => list.reduce((total, row) => total + row.ms, 0);

export function summary(list: Row[]): string {
  const total = sum(list);
  const share = (ms: number) =>
    `${total ? Math.round((ms / total) * 100) : 0}%`;
  const files = new Map<string, Row[]>();
  for (const row of list)
    files.set(row.file, [...(files.get(row.file) ?? []), row]);
  const byFile = [...files]
    .map(([file, tests]) => ({ file, count: tests.length, ms: sum(tests) }))
    .sort((a, b) => b.ms - a.ms);
  const shots = sum(list.filter((row) => /screenshot/i.test(row.title)));
  const slowest = list.toSorted((a, b) => b.ms - a.ms).slice(0, 10);
  return [
    `### E2E time: ${seconds(total)} of test time in ${list.length} tests`,
    "",
    `Screenshot tests: ${seconds(shots)} (${share(shots)}).`,
    "",
    "| File | Tests | Time | Share |",
    "| --- | --- | --- | --- |",
    ...byFile.map(
      (f) => `| ${f.file} | ${f.count} | ${seconds(f.ms)} | ${share(f.ms)} |`,
    ),
    "",
    "| Slowest tests | Time |",
    "| --- | --- |",
    ...slowest.map(
      (row) => `| ${row.file}: ${row.title} | ${seconds(row.ms)} |`,
    ),
    "",
  ].join("\n");
}

if (import.meta.main) {
  const report = (await Bun.file(Bun.argv[2]!).json()) as JSONReport;
  console.log(summary(rows(report)));
}
