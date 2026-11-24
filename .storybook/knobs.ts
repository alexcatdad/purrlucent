// Storybook only: token knobs for trying radii, color, sizes and glass on
// every story at once. Each knob is a global. While set, the preview writes it
// to the document root as custom properties, which override the shipped
// tokens in the pl.tokens layer; unset, the shipped value applies. Knobs do not
// check contrast, so a value away from the shipped one can make text illegible.

export type Knob = {
  key: string;
  label: string;
  group: "Shape" | "Color" | "Size" | "Glass";
} & (
  | {
      kind: "range";
      min: number;
      max: number;
      step: number;
      unit: string;
      /** The shipped value, shown when the knob is unset. */
      shipped: number;
      apply: (value: number) => Record<string, string>;
    }
  | {
      kind: "color";
      shipped: string;
      apply: (value: string) => Record<string, string>;
    }
);

// Both fill knobs write the whole thin fill (bars, capsules, controls), which
// reads whichever is set.
const thin =
  "light-dark(rgb(240 240 240 / var(--sb-glass-light, 60%)), color-mix(in srgb, var(--pl-color-ink) var(--sb-glass-dark, 66%), transparent))";

export const knobs: Knob[] = [
  {
    key: "knobRadius",
    label: "Control radius",
    group: "Shape",
    kind: "range",
    min: 0,
    max: 20,
    step: 1,
    unit: "px",
    shipped: 8,
    apply: (v) => ({ "--pl-radius-control": `${v}px` }),
  },
  {
    key: "knobPanelRadius",
    label: "Panel radius",
    group: "Shape",
    kind: "range",
    min: 0,
    max: 32,
    step: 1,
    unit: "px",
    shipped: 16,
    apply: (v) => ({ "--pl-radius-panel": `${v}px` }),
  },
  {
    key: "knobAccent",
    label: "Accent",
    group: "Color",
    kind: "color",
    shipped: "#ff69b4",
    apply: (v) => ({ "--pl-color-hot-pink": v }),
  },
  {
    key: "knobSpacing",
    label: "Spacing base",
    group: "Size",
    kind: "range",
    min: 3,
    max: 6,
    step: 0.5,
    unit: "px",
    shipped: 4,
    apply: (v) => ({ "--pl-spacing": `${v}px` }),
  },
  {
    key: "knobControl",
    label: "Control height",
    group: "Size",
    kind: "range",
    min: 20,
    max: 44,
    step: 2,
    unit: "px",
    shipped: 32,
    apply: (v) => ({ "--pl-visual-md": `${v}px` }),
  },
  {
    key: "knobGlassLight",
    label: "Thin fill, light",
    group: "Glass",
    kind: "range",
    min: 0,
    max: 100,
    step: 1,
    unit: "%",
    shipped: 60,
    apply: (v) => ({
      "--sb-glass-light": `${v}%`,
      "--pl-material-fill-thin": thin,
    }),
  },
  {
    key: "knobGlassDark",
    label: "Thin fill, dark",
    group: "Glass",
    kind: "range",
    min: 0,
    max: 100,
    step: 1,
    unit: "%",
    shipped: 66,
    apply: (v) => ({
      "--sb-glass-dark": `${v}%`,
      "--pl-material-fill-thin": thin,
    }),
  },
  {
    key: "knobBlur",
    label: "Blur, thin",
    group: "Glass",
    kind: "range",
    min: 0,
    max: 40,
    step: 1,
    unit: "px",
    shipped: 10,
    apply: (v) => ({
      "--pl-blur-sm": `${v}px`,
      "--pl-blur-md": `${v * 2}px`,
      "--pl-blur-lg": `${v * 3}px`,
    }),
  },
  {
    key: "knobSaturate",
    label: "Color boost",
    group: "Glass",
    kind: "range",
    min: 100,
    max: 300,
    step: 10,
    unit: "%",
    shipped: 180,
    apply: (v) => ({ "--pl-material-saturate": `saturate(${v}%)` }),
  },
  {
    key: "knobTint",
    label: "Tint",
    group: "Glass",
    kind: "color",
    shipped: "#ff69b4",
    apply: (v) => ({ "--pl-material-tint": v }),
  },
  {
    key: "knobTintStrength",
    label: "Tint strength",
    group: "Glass",
    kind: "range",
    min: 0,
    max: 60,
    step: 1,
    unit: "%",
    shipped: 0,
    apply: (v) => ({ "--pl-material-tint-strength": `${v}%` }),
  },
];

/** Every custom property any knob can write, so an unset knob's are removed. */
const written = new Set(
  knobs.flatMap((knob) =>
    Object.keys(
      knob.kind === "range"
        ? knob.apply(knob.shipped)
        : knob.apply(knob.shipped),
    ),
  ),
);

/** Writes the set knobs to `root` and removes what unset ones wrote. */
export const applyKnobs = (
  root: HTMLElement,
  globals: Record<string, unknown>,
) => {
  const props: Record<string, string> = {};
  for (const knob of knobs) {
    const value = globals[knob.key];
    if (value === undefined || value === "") continue;
    Object.assign(
      props,
      knob.kind === "range"
        ? knob.apply(Number(value))
        : knob.apply(String(value)),
    );
  }
  for (const name of written)
    if (name in props) root.style.setProperty(name, props[name]!);
    else root.style.removeProperty(name);
};
