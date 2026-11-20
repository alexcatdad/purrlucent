import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

type Pkg = { name: string; version: string; license: string; text: string };

const readJson = (file: string) => JSON.parse(readFileSync(file, "utf8"));

// Finds node_modules/<name> the way Node does: this folder, then each parent.
function findDir(from: string, name: string): string {
  for (let dir = from; ; dir = dirname(dir)) {
    const candidate = join(dir, "node_modules", name);
    if (existsSync(join(candidate, "package.json"))) return candidate;
    if (dirname(dir) === dir) throw new Error(`Cannot find ${name}`);
  }
}

// Removes the indentation some packages put in front of their license text.
function dedent(text: string): string {
  const lines = text.replace(/\r\n/g, "\n").trim().split("\n");
  const indents = lines
    .filter((line) => line.trim())
    .map((line) => line.length - line.trimStart().length);
  const cut = Math.min(...indents);
  return lines.map((line) => line.slice(cut).trimEnd()).join("\n");
}

function licenseText(dir: string): string | undefined {
  const file = readdirSync(dir).find((f) =>
    /^(licen[cs]e|copying)(\.|$)/i.test(f),
  );
  return file ? dedent(readFileSync(join(dir, file), "utf8")) : undefined;
}

// Packages from one monorepo (Lit) can share a license file kept in a sibling.
const repoOf = (json: { repository?: { url?: string } | string }) =>
  typeof json.repository === "string" ? json.repository : json.repository?.url;

// Production dependencies of the root package and everything they pull in.
function productionPackages(root: string): Pkg[] {
  const seen = new Map<string, Pkg & { repo?: string }>();
  const missing: string[] = [];
  const visit = (from: string, names: string[]) => {
    for (const name of names) {
      const dir = findDir(from, name);
      const json = readJson(join(dir, "package.json"));
      const key = `${json.name}@${json.version}`;
      if (seen.has(key)) continue;
      const text = licenseText(dir);
      if (!text) missing.push(key);
      seen.set(key, {
        name: json.name,
        version: json.version,
        license: String(json.license),
        text: text ?? "",
        repo: repoOf(json),
      });
      visit(dir, Object.keys(json.dependencies ?? {}));
    }
  };
  visit(
    root,
    Object.keys(readJson(join(root, "package.json")).dependencies ?? {}),
  );
  const all = [...seen.values()];
  for (const key of missing) {
    const pkg = seen.get(key)!;
    const donor = all.find(
      (p) =>
        p.text && p.license === pkg.license && p.repo && p.repo === pkg.repo,
    );
    if (!donor) throw new Error(`${key} has no license file`);
    pkg.text = donor.text;
  }
  return all.sort((a, b) => a.name.localeCompare(b.name));
}

export function generateNotices(root: string): string {
  const groups = new Map<string, Pkg[]>();
  for (const pkg of productionPackages(root)) {
    const key = `${pkg.license}\n${pkg.text}`;
    groups.set(key, [...(groups.get(key) ?? []), pkg]);
  }
  const sections = [...groups.values()].map(
    (pkgs) =>
      `${pkgs.map((p) => `${p.name} ${p.version}`).join(", ")}\n` +
      `License: ${pkgs[0]!.license}\n\n${pkgs[0]!.text}`,
  );
  return `Third-party notices for production dependencies.\n\n${sections.join("\n\n")}\n`;
}

if (import.meta.main) {
  const root = process.cwd();
  writeFileSync(join(root, "THIRD_PARTY_NOTICES"), generateNotices(root));
}
