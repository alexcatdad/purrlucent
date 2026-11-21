import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import schema from "../hig/schema.json" with { type: "json" };

export type Rule = {
  id: string;
  source: string;
  rule: string;
  check: "automated" | "rubric";
  test?: string;
  layer: "tokens" | "behaviors" | "surfaces" | "components";
};
export type Catalog = { file: string; slug: string; rules: Rule[] }[];

type Schema = {
  type?: string;
  enum?: unknown[];
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  required?: string[];
  additionalProperties?: boolean;
  properties?: Record<string, Schema>;
};

export const TRADEMARKS =
  /\b(Liquid Glass|Aqua|Cupertino|SF Symbols?|Human Interface)\b/i;

/** Checks a value against the subset of JSON Schema that hig/schema.json uses. */
function validate(value: unknown, s: Schema, path: string): string[] {
  if (s.enum)
    return s.enum.includes(value)
      ? []
      : [`${path}: must be one of ${s.enum.join(", ")}`];
  if (s.type === "string") {
    if (typeof value !== "string") return [`${path}: must be a string`];
    const errors: string[] = [];
    if (s.pattern && !new RegExp(s.pattern).test(value))
      errors.push(`${path}: must match ${s.pattern}`);
    if (s.minLength && value.length < s.minLength)
      errors.push(`${path}: shorter than ${s.minLength}`);
    if (s.maxLength && value.length > s.maxLength)
      errors.push(`${path}: longer than ${s.maxLength}`);
    return errors;
  }
  if (s.type !== "object") return [];
  if (typeof value !== "object" || value === null)
    return [`${path}: must be an object`];
  const props = s.properties ?? {};
  const record = value as Record<string, unknown>;
  return [
    ...(s.required ?? [])
      .filter((k) => !(k in record))
      .map((k) => `${path}: missing ${k}`),
    ...Object.keys(record)
      .filter((k) => s.additionalProperties === false && !(k in props))
      .map((k) => `${path}: unknown field ${k}`),
    ...Object.entries(props).flatMap(([k, p]) =>
      k in record ? validate(record[k], p, `${path}.${k}`) : [],
    ),
  ];
}

function testExists(root: string, test: string): boolean {
  const [file = "", name = ""] = test.split(" > ").map((s) => s.trim());
  const path = join(root, file);
  const quoted = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return (
    existsSync(path) &&
    new RegExp(`\\b(?:test|it)\\(\\s*(["'\`])${quoted}\\1`).test(
      readFileSync(path, "utf8"),
    )
  );
}

export function checkCatalog(
  catalog: Catalog,
  root = ".",
): { errors: string[]; pending: string[] } {
  const errors: string[] = [];
  const pending: string[] = [];
  const seen = new Set<string>();
  for (const { file, slug, rules } of catalog) {
    if (!Array.isArray(rules)) {
      errors.push(`${file}: must be a list of rules`);
      continue;
    }
    for (const rule of rules) {
      const at = `${file}: ${(rule as Partial<Rule>).id ?? "?"}`;
      const schemaErrors = validate(rule, schema.$defs.rule as Schema, at);
      errors.push(...schemaErrors);
      if (schemaErrors.length) continue;
      if (seen.has(rule.id)) errors.push(`${at}: duplicate id`);
      seen.add(rule.id);
      if (!rule.id.startsWith(`${slug}/`))
        errors.push(`${at}: id does not match file ${slug}`);
      if (basename(rule.source.split("#")[0]!) !== slug)
        errors.push(`${at}: source page does not match file`);
      if (TRADEMARKS.test(rule.rule))
        errors.push(`${at}: rule text uses an Apple trademark`);
      if (rule.check === "rubric" && rule.test)
        errors.push(`${at}: a rubric rule has no test`);
      if (rule.check === "automated") {
        if (!rule.test) pending.push(rule.id);
        else if (!testExists(root, rule.test))
          errors.push(`${at}: missing test "${rule.test}"`);
      }
    }
  }
  return { errors, pending };
}

/** Rubric rules for the layers that the given files belong to. */
export function rubricFor(files: string[], rules: Rule[]): Rule[] {
  const layers = new Set(
    files.map(
      (f) => /^src\/(tokens|behaviors|surfaces|components)\//.exec(f)?.[1],
    ),
  );
  return rules.filter((r) => r.check === "rubric" && layers.has(r.layer));
}

function loadCatalog(dir = "hig/rules"): Catalog {
  return readdirSync(dir)
    .filter((f) => f.endsWith(".yaml"))
    .sort()
    .map((f) => ({
      file: join(dir, f),
      slug: basename(f, ".yaml"),
      rules: Bun.YAML.parse(readFileSync(join(dir, f), "utf8")) as Rule[],
    }));
}

function checkOutOfScope(path = "hig/out-of-scope.yaml"): string[] {
  const items = Bun.YAML.parse(readFileSync(path, "utf8")) as {
    section?: string;
    reason?: string;
  }[];
  return items.flatMap((item, i) =>
    item?.section && item?.reason
      ? []
      : [`${path}: entry ${i + 1} needs a section and a reason`],
  );
}

if (import.meta.main) {
  const [command, ...args] = process.argv.slice(2);
  if (command === "rubric") {
    const rules = loadCatalog().flatMap((c) => c.rules);
    for (const r of rubricFor(args, rules))
      console.log(`${r.id}\t${r.rule}\t${r.source}`);
  } else {
    const { errors, pending } = checkCatalog(loadCatalog());
    errors.push(...checkOutOfScope());
    if (!args.includes("--allow-pending"))
      errors.push(...pending.map((id) => `${id}: pending (no test yet)`));
    for (const e of errors) console.error(e);
    console.log(
      `hig:check: ${errors.length} errors, ${pending.length} pending`,
    );
    process.exit(errors.length ? 1 : 0);
  }
}
