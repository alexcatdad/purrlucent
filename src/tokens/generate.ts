// Builds src/tokens/tokens.css from design/palette.json and src/tokens/materials.css.
// Run with `bun src/tokens/generate.ts`; `bun run build` does it first.
import { readFileSync, writeFileSync } from "node:fs";

/** Each cell is the argument list of oklch(): "L C H" or "L C H / A". */
interface Role {
  light: string;
  dark: string;
  lightMoreContrast: string;
  darkMoreContrast: string;
}

const dir = import.meta.dirname;
const palette: { roles: Record<string, Role> } = JSON.parse(
  readFileSync(`${dir}/../../design/palette.json`, "utf8"),
);

const kebab = (name: string) =>
  name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
// Stylelint's standard config wants percentage lightness and alpha and a deg hue.
const oklch = (value: string) => {
  const [l, c, h, a] = value.match(/[\d.]+/g)!.map(Number);
  const percent = (n: number) => `${Number((n * 100).toFixed(4))}%`;
  return `oklch(${percent(l!)} ${c} ${h}deg${a === undefined ? "" : ` / ${percent(a)}`})`;
};
const lightDark = (light: string, dark: string) =>
  `light-dark(${light}, ${dark})`;
const declare = (tokens: Record<string, string>) =>
  Object.entries(tokens).map(([name, value]) => `--purr-${name}: ${value};`);
const block = (declarations: string[], indent: number) =>
  declarations.map((d) => `${" ".repeat(indent)}${d}`).join("\n");

const roles = Object.entries(palette.roles);
const colors = (light: keyof Role, dark: keyof Role) =>
  Object.fromEntries(
    roles.map(([name, r]) => [
      `color-${kebab(name)}`,
      lightDark(oklch(r[light]), oklch(r[dark])),
    ]),
  );

// Hover and pressed tones: the base mixed with 6% / 12% black (light) or white (dark).
const tone = (base: string, percent: number) =>
  lightDark(
    `color-mix(in srgb, var(--purr-color-${base}), #000 ${percent}%)`,
    `color-mix(in srgb, var(--purr-color-${base}), #fff ${percent}%)`,
  );
const tones = {
  "color-accent-fill-hover": tone("accent-fill", 6),
  "color-accent-fill-pressed": tone("accent-fill", 12),
  "color-selection-hover": tone("selection", 6),
  "color-selection-pressed": tone("selection", 12),
  "color-destructive-pressed":
    "color-mix(in srgb, var(--purr-color-destructive-fill), var(--purr-color-destructive-text) 12%)",
};

// Size / weight / line height in px at default text size, per pointer class.
type Type = [number, number, number];
const typeStyles: Record<string, { fine: Type; coarse: Type }> = {
  caption: { fine: [10, 400, 13], coarse: [12, 400, 16] },
  footnote: { fine: [10, 400, 13], coarse: [13, 400, 18] },
  body: { fine: [13, 400, 16], coarse: [17, 400, 22] },
  action: { fine: [13, 500, 16], coarse: [17, 500, 22] },
  bodyEmphasized: { fine: [13, 600, 16], coarse: [17, 600, 22] },
  headline: { fine: [13, 700, 16], coarse: [17, 600, 22] },
  title3: { fine: [15, 400, 20], coarse: [20, 400, 25] },
  title2: { fine: [17, 400, 22], coarse: [22, 400, 28] },
  title1: { fine: [22, 400, 26], coarse: [28, 400, 34] },
};
const rem = (px: number) => `${px / 16}rem`;
const type = (pointer: "fine" | "coarse") =>
  Object.fromEntries(
    Object.entries(typeStyles).map(([name, s]) => {
      const [size, weight, line] = s[pointer];
      return [
        `font-${kebab(name)}`,
        `${weight} ${rem(size)}/${rem(line)} var(--purr-font-family)`,
      ];
    }),
  );

const fine = {
  ...type("fine"),
  "radius-control": "8px",
  "radius-control-inner": "6px",
  "hit-min": "28px",
  "hit-absolute-min": "20px",
  "gap-bezeled": rem(12),
};
const coarse = {
  ...type("coarse"),
  "radius-control": "12px",
  "radius-control-inner": "10px",
  "hit-min": "44px",
  "hit-absolute-min": "28px",
  "gap-bezeled": rem(16),
};

const shadow = (alpha: number) =>
  `color-mix(in srgb, var(--purr-color-shadow-color) ${alpha}%, transparent)`;
const boundary = "inset 0 0 0 1px var(--purr-color-control-boundary)";

const base = {
  ...colors("light", "dark"),
  ...tones,
  "font-family": "system-ui, sans-serif",
  ...fine,
  // 4px steps, in rem so spacing follows text zoom.
  ...Object.fromEntries(
    Array.from({ length: 8 }, (_, i) => [`space-${i + 1}`, rem((i + 1) * 4)]),
  ),
  "gap-bezel-less": rem(24),
  "radius-panel": "16px",
  "radius-row": "8px",
  "elevation-control": `0 1px 2px ${shadow(18)}, 0 2px 5px ${shadow(10)}`,
  "elevation-panel": `0 1px 3px ${shadow(15)}, 0 6px 18px ${shadow(12)}`,
  "elevation-sheet": `0 2px 6px ${shadow(18)}, 0 16px 48px ${shadow(18)}`,
  boundary: "none",
  "focus-width": "2px",
  "focus-offset-outside": "2px",
  "focus-offset-inside": "-2px",
  // Inherited hover rule: the surface a control sits on sets these.
  "face-hover": "var(--purr-color-fill-hover)",
  "face-pressed": "var(--purr-color-fill-pressed)",
  "ease-standard": "cubic-bezier(0.2, 0, 0, 1)",
  "ease-spring": "cubic-bezier(0.3, 1.15, 0.5, 1)",
  "duration-press": "60ms",
  "duration-hover": "100ms",
  "duration-release": "120ms",
  "duration-slide": "200ms",
  "press-scale": "0.98",
};

// Increased contrast: no elevation; neutral faces, panels and sheets get a 1px inside outline.
const moreContrast = {
  ...colors("lightMoreContrast", "darkMoreContrast"),
  "elevation-control": "none",
  "elevation-panel": boundary,
  "elevation-sheet": boundary,
  boundary,
};

const reducedMotion = {
  "duration-press": "0ms",
  "duration-hover": "0ms",
  "duration-release": "0ms",
  "duration-slide": "0ms",
};

const media = (query: string, tokens: Record<string, string>) => `
  @media ${query} {
    :root {
${block(declare(tokens), 6)}
    }
  }
`;

const tokens = `/* Generated by src/tokens/generate.ts from design/palette.json. Do not edit. */
@layer purr.tokens {
  :root {
    color-scheme: light dark;

${block(declare(base), 4)}
  }
${media("(pointer: coarse)", coarse)}${media("(prefers-contrast: more)", moreContrast)}${media("(prefers-reduced-motion: reduce)", reducedMotion)}}

`;

const materials = readFileSync(`${dir}/materials.css`, "utf8");
const output = `${dir}/tokens.css`;
writeFileSync(output, tokens + materials);
// Keep the generated file in the repository's formatting so fmt:check stays green.
Bun.spawnSync(["bun", "fmt", output]);
