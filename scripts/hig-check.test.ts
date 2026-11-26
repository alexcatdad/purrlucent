import { expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  checkCatalog,
  rubricFor,
  type Catalog,
  type Rule,
} from "./hig-check.ts";

const source =
  "https://developer.apple.com/design/human-interface-guidelines/color";

const rule = (over: Partial<Rule> = {}): Rule => ({
  id: "color/1",
  source,
  rule: "Text keeps enough contrast against its background.",
  check: "rubric",
  layer: "tokens",
  ...over,
});

const catalog = (...rules: Rule[]): Catalog => [
  { file: "hig/rules/color.yaml", slug: "color", rules },
];

function root() {
  const dir = mkdtempSync(join(tmpdir(), "hig-"));
  mkdirSync(join(dir, "src"));
  writeFileSync(
    join(dir, "src/a.test.ts"),
    'test("keeps contrast", () => {});\n',
  );
  return dir;
}

test("a valid entry passes", () => {
  expect(checkCatalog(catalog(rule()), root())).toEqual({
    errors: [],
    pending: [],
  });
});

test("an automated entry with a missing test file fails with missing test", () => {
  const { errors } = checkCatalog(
    catalog(
      rule({ check: "automated", test: "src/none.test.ts > keeps contrast" }),
    ),
    root(),
  );
  expect(errors.join("\n")).toContain("missing test");
});

test("an automated entry whose test name is absent from the file fails with missing test", () => {
  const { errors } = checkCatalog(
    catalog(rule({ check: "automated", test: "src/a.test.ts > another name" })),
    root(),
  );
  expect(errors.join("\n")).toContain("missing test");
});

test("an automated entry naming an existing test passes", () => {
  const result = checkCatalog(
    catalog(
      rule({ check: "automated", test: "src/a.test.ts > keeps contrast" }),
    ),
    root(),
  );
  expect(result).toEqual({ errors: [], pending: [] });
});

test("an automated entry without a test or reason fails even when pending rules are allowed", () => {
  const result = checkCatalog(
    catalog(rule({ check: "automated" })),
    root(),
    true,
  );
  expect(result.errors.join("\n")).toContain("missing test or pending reason");
  expect(result.pending).toEqual([{ id: "color/1" }]);
});

test("a pending reason explains the gap and only passes when allowed", () => {
  const pending = "The current contrast test only covers one appearance.";
  const input = catalog(rule({ check: "automated", pending }));
  const dir = root();
  expect(checkCatalog(input, dir).errors.join("\n")).toContain(
    "pending (no test yet)",
  );
  expect(checkCatalog(input, dir, true)).toEqual({
    errors: [],
    pending: [{ id: "color/1", reason: pending }],
  });
});

test("rules with tests and rubric rules reject a pending reason", () => {
  const pending = "The current contrast test only covers one appearance.";
  const result = checkCatalog(
    catalog(
      rule({ pending }),
      rule({
        id: "color/2",
        check: "automated",
        test: "src/a.test.ts > keeps contrast",
        pending,
      }),
    ),
    root(),
    true,
  );
  expect(result.errors).toHaveLength(2);
  for (const error of result.errors)
    expect(error).toContain(
      "only an automated rule without a test can be pending",
    );
});

test("schema violations are reported", () => {
  const bad = rule({
    layer: "pages" as Rule["layer"],
    source: "https://example.com/x",
  });
  expect(
    checkCatalog(catalog(bad), root()).errors.length,
  ).toBeGreaterThanOrEqual(2);
});

test("an id must match its file and be unique", () => {
  const { errors } = checkCatalog(
    catalog(rule(), rule(), rule({ id: "motion/1" })),
    root(),
  );
  expect(errors.join("\n")).toContain("duplicate id");
  expect(errors.join("\n")).toContain("does not match file");
});

test("the source page must match the file", () => {
  const other = rule({
    source:
      "https://developer.apple.com/design/human-interface-guidelines/motion",
  });
  expect(checkCatalog(catalog(other), root()).errors.join("\n")).toContain(
    "source page",
  );
});

test("rule text must not use Apple trademarks", () => {
  const { errors } = checkCatalog(
    catalog(rule({ rule: "Use Liquid Glass only for controls." })),
    root(),
  );
  expect(errors.join("\n")).toContain("trademark");
});

test("rubricFor lists rubric rules for the layers of the touched files", () => {
  const rules = [
    rule(),
    rule({ id: "color/2", layer: "components" }),
    rule({ id: "color/3", layer: "tokens", check: "automated" }),
  ];
  const ids = (files: string[]) => rubricFor(files, rules).map((r) => r.id);
  expect(ids(["src/tokens/color.css.ts"])).toEqual(["color/1"]);
  expect(ids(["src/components/probe/probe.ts"])).toEqual(["color/2"]);
  expect(ids(["README.md"])).toEqual([]);
});
