import { expect, test } from "bun:test";
import { count, cssOf, undefinedTokens } from "./style-check.ts";

test("a typed-in rem or px length is counted", () => {
  expect(count("a { padding: 0.375rem 12px; }").lengths).toBe(2);
});

test("hairlines of 2px or less, em values and tokens are not counted", () => {
  const css =
    "a { border: 1px solid; outline-offset: -2px; letter-spacing: -0.015em; padding: var(--purr-space-3); height: calc(var(--purr-spacing) * 6); }";
  expect(count(css).lengths).toBe(0);
});

test("a length in a media or container condition is not counted", () => {
  expect(
    count("@media (width < 640px) {\n  a { gap: var(--purr-space-2); }\n}")
      .lengths,
  ).toBe(0);
});

test("raw colors are counted, token colors and color-mix of tokens are not", () => {
  const raw =
    "a { color: #fff; background: rgb(0 0 0 / 10%); border-color: black; }";
  expect(count(raw).colors).toBe(3);
  const fine =
    "a { color: var(--purr-color-foreground); background: color-mix(in srgb, var(--purr-color-accent) 20%, transparent); white-space: nowrap; }";
  expect(count(fine).colors).toBe(0);
});

test("only the css templates of a TypeScript file are checked", () => {
  const source =
    'const gap = "12px";\nexport const s = css`a { margin: 4px; }`;';
  expect(count(cssOf("x.css.ts", source)).lengths).toBe(1);
});

test("comments are ignored", () => {
  expect(
    count(cssOf("x.css", "/* was 12px, #fff */ a { margin: 0; }")),
  ).toEqual({ lengths: 0, colors: 0 });
});

test("a token that is read but never defined is reported", () => {
  const sources = {
    "tokens.css": ":root { --purr-space-3: 0.75rem; }",
    "a.css.ts":
      "css`a { gap: var(--purr-space-3); color: var(--purr-color-typo); --purr-face: red; fill: var(--purr-face); }`",
  };
  expect(undefinedTokens(sources)).toEqual([
    "a.css.ts: --purr-color-typo is read but never defined",
  ]);
});

test("a token name completed by a template value is skipped", () => {
  expect(
    undefinedTokens({ "a.ts": "`color: var(--purr-color-${role})`" }),
  ).toEqual([]);
});
