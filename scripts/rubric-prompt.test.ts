import { expect, test } from "bun:test";
import {
  buildPrompt,
  parseRules,
  parseVerdicts,
  pushRanges,
  renderComment,
  scopeRules,
} from "./rubric-prompt.ts";

const zero = "0".repeat(40);
const a = "a".repeat(40);
const b = "b".repeat(40);

test("an update reviews only the commits the remote does not have", () => {
  expect(
    pushRanges(`refs/heads/x ${b} refs/heads/x ${a}\n`, "origin/main"),
  ).toEqual([{ base: a, head: b }]);
});

test("a new branch reviews against the base", () => {
  expect(
    pushRanges(`refs/heads/x ${b} refs/heads/x ${zero}\n`, "origin/main"),
  ).toEqual([{ base: "origin/main", head: b }]);
});

test("a deletion or empty input reviews nothing", () => {
  expect(
    pushRanges(`(delete) ${zero} refs/heads/x ${a}\n`, "origin/main"),
  ).toEqual([]);
  expect(pushRanges("", "origin/main")).toEqual([]);
});

const rules = parseRules(
  [
    "toolbars/8\tAt most one key action is emphasized.\thttps://example.test/toolbars",
    "buttons/3\tThe likeliest action is prominent.\thttps://example.test/buttons",
    "segmented-controls/1\tSegments are few.\thttps://example.test/segmented-controls",
    "layout/1\tImportant content comes first.\thttps://example.test/layout",
    "",
  ].join("\n"),
);

test("parses tab-separated rubric lines", () => {
  expect(rules[0]).toEqual({
    id: "toolbars/8",
    rule: "At most one key action is emphasized.",
    source: "https://example.test/toolbars",
  });
  expect(rules).toHaveLength(4);
});

test("keeps the toolbar rules for a toolbar story and drops the other component rules", () => {
  const ids = scopeRules(rules, [
    "src/components/toolbar/toolbar.stories.ts",
  ]).map((r) => r.id);
  expect(ids).toEqual(["toolbars/8", "layout/1"]);
});

test("matches a hyphenated page to its component folder", () => {
  const ids = scopeRules(rules, [
    "src/components/toggle-group/toggle-group.ts",
  ]).map((r) => r.id);
  expect(ids).toEqual(["segmented-controls/1", "layout/1"]);
});

test("keeps rules from pages that are not a component", () => {
  const ids = scopeRules(rules, ["src/surfaces/surfaces.css.ts"]).map(
    (r) => r.id,
  );
  expect(ids).toEqual(["layout/1"]);
});

test("the prompt lists every rule id and the diff", () => {
  const prompt = buildPrompt(rules, "+<purr-button prominent>");
  for (const r of rules) expect(prompt).toContain(r.id);
  expect(prompt).toContain("+<purr-button prominent>");
});

const ids = ["buttons/3", "layout/1"];

test("valid output gives one verdict per rule", () => {
  const message = JSON.stringify({
    results: [
      { id: "layout/1", verdict: "fail", reason: "Content is last." },
      { id: "buttons/3", verdict: "pass", reason: "Not applicable." },
    ],
  });
  expect(parseVerdicts(message, ids)).toEqual([
    { id: "buttons/3", verdict: "pass", reason: "`Not applicable.`" },
    { id: "layout/1", verdict: "fail", reason: "`Content is last.`" },
  ]);
});

test("a missing rule id fails", () => {
  const message = JSON.stringify({
    results: [{ id: "buttons/3", verdict: "pass", reason: "Fine." }],
  });
  const [, missing] = parseVerdicts(message, ids);
  expect(missing).toEqual({
    id: "layout/1",
    verdict: "fail",
    reason: "No result returned.",
  });
});

test("an unknown verdict fails", () => {
  const message = JSON.stringify({
    results: [
      { id: "buttons/3", verdict: "maybe", reason: "Unsure." },
      { id: "layout/1", verdict: "pass", reason: "Fine." },
    ],
  });
  expect(parseVerdicts(message, ids)[0]?.verdict).toBe("fail");
});

for (const [name, message] of [
  ["non-JSON", "all rules pass"],
  ["an empty object", "{}"],
  ["null results", '{"results":null}'],
  ["non-array results", '{"results":{"id":"buttons/3"}}'],
  ["a null message", "null"],
] as const)
  test(`${name} fails every rule`, () => {
    const verdicts = parseVerdicts(message, ids);
    expect(verdicts.map((v) => v.id)).toEqual(ids);
    expect(verdicts.every((v) => v.verdict === "fail")).toBe(true);
  });

test("reasons are shown as inline code without links, images or table breaks", () => {
  const message = JSON.stringify({
    results: [
      {
        id: "buttons/3",
        verdict: "pass",
        reason: "See [x](http://e.test) ![i](u) `a` | b\nc",
      },
      { id: "layout/1", verdict: "pass", reason: "ok" },
    ],
  });
  const [first] = parseVerdicts(message, ids);
  expect(first?.reason).toBe("`See x http://e.test i u a b c`");
});

test("the comment counts failures", () => {
  const { body, failed } = renderComment([
    { id: "buttons/3", verdict: "pass", reason: "`ok`" },
    { id: "layout/1", verdict: "fail", reason: "`no`" },
  ]);
  expect(failed).toBe(1);
  expect(body).toContain("1 of 2 rules failed.");
  expect(body).toContain("| layout/1 | fail | `no` |");
});
