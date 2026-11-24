// Static checks on the styles in src. Runs as part of `bun run lint`.
//
// 1. Component styles hold no typed-in lengths and no raw colors: every value
//    is a token or a calc() from tokens.
// 2. Every --pl-* token that is read is defined, in tokens.css or in src.
// 3. No Apple trademark or design-kit wording in src.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { TRADEMARKS } from "./hig-check.ts";

const KIT_WORDS = /\bSFPro\b|\bSF Pro\b|Sketch kit|UI Kit|macOS \d/;
const COLOR =
  /#[0-9a-f]{3,8}\b|(?<![\w-])(?:rgba?|hsla?|hwb|oklch|oklab|lab|lch|color)\(|(?<![\w-])(?:black|white)(?![\w-])/gi;
const LENGTH = /(?<![\w.-])(-?\d*\.?\d+)(rem|px)\b/g;

/** The CSS in a file: the whole of a .css file, or the css`…` templates of a .ts file. */
export function cssOf(path: string, source: string): string {
  const css = path.endsWith(".css")
    ? source
    : [...source.matchAll(/\bcss`([\s\S]*?)`/g)].map((m) => m[1]).join("\n");
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

/** Typed-in lengths (hairlines of 2px or less are fine) and raw colors. */
export function count(css: string): { lengths: number; colors: number } {
  // Media, container and supports conditions are not component values.
  const body = css.replace(/@(media|container|supports)\b[^{]*/g, "");
  const lengths = [...body.matchAll(LENGTH)].filter(
    ([, n, unit]) => !(unit === "px" && Math.abs(Number(n)) <= 2),
  ).length;
  return { lengths, colors: body.match(COLOR)?.length ?? 0 };
}

/** --pl-* tokens that are read somewhere but defined nowhere. A registered
 * property (@property) counts as defined. */
export function undefinedTokens(sources: Record<string, string>): string[] {
  const assigned = new Set<string>();
  for (const source of Object.values(sources))
    for (const m of source.matchAll(/(?:@property\s+)?--pl-([\w-]+)\s*[:{]/g))
      assigned.add(m[1]!);
  const missing = new Set<string>();
  for (const [file, source] of Object.entries(sources))
    // A name that ends in "-" is completed by a template value; it cannot be checked here.
    for (const m of source.matchAll(/var\(\s*--pl-([\w-]+)/g))
      if (!m[1]!.endsWith("-") && !assigned.has(m[1]!))
        missing.add(`${file}: --pl-${m[1]} is read but never defined`);
  return [...missing].sort();
}

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });

if (import.meta.main) {
  const tokensPath = "src/tokens/tokens.css";
  const files = [...walk("src"), ...walk("e2e"), ...walk(".storybook")].filter(
    (f) => /\.(ts|css)$/.test(f),
  );
  const sources = Object.fromEntries(
    files.map((f) => [f, readFileSync(f, "utf8")]),
  );
  const errors = undefinedTokens(sources);

  for (const [file, source] of Object.entries(sources)) {
    const word = TRADEMARKS.exec(source) ?? KIT_WORDS.exec(source);
    if (word) errors.push(`${file}: uses "${word[0]}"`);
    // Styles only: the token file itself is where base values live.
    if (
      !file.startsWith("src/") ||
      file === tokensPath ||
      !/\.css(\.ts)?$/.test(file)
    )
      continue;
    const { lengths, colors } = count(cssOf(file, source));
    if (lengths)
      errors.push(
        `${file}: ${lengths} typed-in lengths. Use tokens and calc() from tokens.`,
      );
    if (colors) errors.push(`${file}: ${colors} raw colors. Use color tokens.`);
  }
  for (const e of errors) console.error(e);
  console.log(`style-check: ${errors.length} errors`);
  process.exit(errors.length ? 1 : 0);
}
