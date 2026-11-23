import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html, type TemplateResult } from "lit";

const meta = { title: "Foundations/Tokens" } satisfies Meta;

export default meta;

type Story = StoryObj;

// Every token group is read from the stylesheets (rules whose selector is
// :root), so a token added to tokens.css shows up here without editing the story.
const tokens = (prefix: string): string[] => {
  const names = new Set<string>();
  const walk = (rules: CSSRuleList) => {
    for (const rule of rules) {
      if (rule instanceof CSSStyleRule) {
        if (rule.selectorText === ":root")
          for (const name of rule.style)
            if (name.startsWith(prefix)) names.add(name);
      } else if ("cssRules" in rule) walk(rule.cssRules as CSSRuleList);
    }
  };
  for (const sheet of document.styleSheets)
    try {
      walk(sheet.cssRules);
    } catch {
      // A cross-origin stylesheet hides its rules.
    }
  return [...names];
};

const label =
  "font: var(--pl-text-xs) / var(--pl-leading-normal) var(--pl-font-mono); overflow-wrap: anywhere;";
const list =
  "display: grid; gap: var(--pl-space-2); padding: var(--pl-space-4); font-family: var(--pl-font-sans);";
const grid =
  "display: flex; flex-wrap: wrap; gap: var(--pl-space-4); align-items: end;";
const box = "border: 1px solid var(--pl-color-border);";

const cell = (name: string, shape: TemplateResult) => html`
  <figure
    style="margin: 0; display: grid; gap: var(--pl-space-1); justify-items: start;"
  >
    ${shape}
    <figcaption style=${label}>${name}</figcaption>
  </figure>
`;

const scheme = (name: "light" | "dark") => html`
  <div
    style="color-scheme: ${name}; background: var(--pl-color-background); color: var(--pl-color-foreground); padding: var(--pl-space-4); font-family: var(--pl-font-sans);"
  >
    <p style="margin: 0 0 var(--pl-space-3); font-weight: 600;">${name}</p>
    <div style=${grid}>
      ${tokens("--pl-color-").map(
        (token) => html`
          <div data-swatch style="inline-size: calc(var(--pl-spacing) * 24);">
            ${cell(
              token.replace("--pl-color-", ""),
              html`<div
                style="${box} inline-size: 100%; block-size: var(--pl-space-8); background: var(${token});"
              ></div>`,
            )}
          </div>
        `,
      )}
    </div>
  </div>
`;

export const Colors: Story = {
  render: () => html`
    <div
      style="display: grid; grid-template-columns: repeat(auto-fit, minmax(calc(var(--pl-spacing) * 80), 1fr));"
    >
      ${scheme("light")} ${scheme("dark")}
    </div>
  `,
};

export const Spacing: Story = {
  render: () => html`
    <div style=${list}>
      ${tokens("--pl-space-").map(
        (token) => html`
          <div
            style="display: flex; align-items: center; gap: var(--pl-space-3);"
          >
            <div
              style="background: var(--pl-color-accent); block-size: var(--pl-space-3); inline-size: var(${token});"
            ></div>
            <span style=${label}>${token}</span>
          </div>
        `,
      )}
    </div>
  `,
};

export const Radii: Story = {
  render: () => html`
    <div style="${list} ${grid}">
      ${tokens("--pl-radius").map((token) =>
        cell(
          token,
          html`<div
            style="${box} inline-size: var(--pl-size-xl); block-size: var(--pl-size-xl); background: var(--pl-color-surface); border-radius: var(${token});"
          ></div>`,
        ),
      )}
    </div>
  `,
};

export const Sizes: Story = {
  render: () => html`
    <div style="${list} ${grid}">
      ${[...tokens("--pl-size-"), ...tokens("--pl-touch-min")].map((token) =>
        cell(
          token,
          html`<div
            style="${box} inline-size: var(${token}); block-size: var(${token}); background: var(--pl-color-surface);"
          ></div>`,
        ),
      )}
    </div>
  `,
};

export const Text: Story = {
  render: () => html`
    <div style=${list}>
      ${tokens("--pl-text-").map(
        (size) => html`
          <div style=${grid}>
            ${tokens("--pl-leading-").map(
              (leading) => html`
                <div style="inline-size: calc(var(--pl-spacing) * 40);">
                  <p
                    style="margin: 0; font-size: var(${size}); line-height: var(${leading});"
                  >
                    Quick foxes jump over lazy dogs, again and again.
                  </p>
                  <span style=${label}>${size} / ${leading}</span>
                </div>
              `,
            )}
          </div>
        `,
      )}
    </div>
  `,
};

export const Icons: Story = {
  render: () => html`
    <div style="${list} ${grid}">
      ${tokens("--pl-icon-").map((token) =>
        cell(
          token,
          html`<div
            style="inline-size: var(${token}); block-size: var(${token}); background: var(--pl-color-accent);"
          ></div>`,
        ),
      )}
    </div>
  `,
};

// Each material with its own filter and the shared edge, over the glass backdrop.
const materials = ["bar", "sidebar", "panel", "sheet"] as const;

export const Materials: Story = {
  render: () => html`
    <div style="${list} max-inline-size: calc(var(--pl-spacing) * 100);">
      ${materials.map(
        (name) => html`
          <div
            id=${name === "bar" ? "bar" : `material-${name}`}
            style="padding: var(--pl-space-4); font-family: var(--pl-font-sans); color: var(--pl-color-foreground); background: var(--pl-material-${name}); backdrop-filter: var(--pl-material-${name}-filter); box-shadow: var(--pl-material-edge);"
          >
            ${name}
          </div>
        `,
      )}
      <div
        id="material-control"
        style="padding: var(--pl-space-3); font-family: var(--pl-font-sans); color: var(--pl-color-foreground); background: var(--pl-material-control); backdrop-filter: var(--pl-material-control-filter); box-shadow: var(--pl-material-edge), var(--pl-elevation-control); border-radius: var(--pl-radius-full); inline-size: max-content;"
      >
        control
      </div>
    </div>
  `,
  globals: { material: "glass" },
};

export const Elevation: Story = {
  render: () => html`
    <div style="${list} ${grid}">
      ${tokens("--pl-elevation-").map((token) =>
        cell(
          token,
          html`<div
            style="inline-size: calc(var(--pl-spacing) * 30); block-size: var(--pl-size-xl); background: var(--pl-color-surface); box-shadow: var(${token});"
          ></div>`,
        ),
      )}
    </div>
  `,
};

// A dot crosses its track in each duration. The tokens already fall to 0s under
// reduced motion; the animation is also paused there.
export const Motion: Story = {
  render: () => html`
    <style>
      @keyframes pl-token-slide {
        to {
          inset-inline-start: calc(100% - var(--pl-icon-md));
        }
      }
      [data-dot] {
        position: absolute;
        inset-inline-start: 0;
        inline-size: var(--pl-icon-md);
        block-size: var(--pl-icon-md);
        border-radius: var(--pl-radius-full);
        background: var(--pl-color-accent);
        animation: pl-token-slide var(--duration) var(--pl-ease-out) infinite
          alternate;
      }
      @media (prefers-reduced-motion: reduce) {
        [data-dot] {
          animation-play-state: paused;
        }
      }
    </style>
    <div style=${list}>
      ${tokens("--pl-duration").map(
        (token) => html`
          <div style="display: grid; gap: var(--pl-space-1);">
            <span style=${label}>${token}</span>
            <div
              style="position: relative; block-size: var(--pl-icon-md); ${box}"
            >
              <span data-dot style="--duration: var(${token});"></span>
            </div>
          </div>
        `,
      )}
    </div>
  `,
};
