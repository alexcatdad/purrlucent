import { createElement as h, Fragment } from "react";
import { addons, types, useGlobals } from "storybook/manager-api";
import { knobs, type Knob } from "./knobs.ts";

// Storybook only: a "Tokens" panel of sliders and color pickers for the token
// knobs in knobs.ts. A knob left alone keeps the shipped value; Reset clears all.

const row = {
  display: "grid",
  gridTemplateColumns: "9rem 1fr 7rem",
  gap: 8,
  alignItems: "center",
};

const Panel = () => {
  const [globals, updateGlobals] = useGlobals();
  const set = (key: string, value: string) => updateGlobals({ [key]: value });
  const value = (knob: Knob) => {
    const v = globals[knob.key];
    return v === undefined || v === "" ? undefined : String(v);
  };
  const control = (knob: Knob) => {
    const current = value(knob);
    const shown = current ?? String(knob.shipped);
    const input =
      knob.kind === "range"
        ? h("input", {
            type: "range",
            id: knob.key,
            min: knob.min,
            max: knob.max,
            step: knob.step,
            value: shown,
            onChange: (e: { target: { value: string } }) =>
              set(knob.key, e.target.value),
          })
        : h("input", {
            type: "color",
            id: knob.key,
            value: shown,
            onChange: (e: { target: { value: string } }) =>
              set(knob.key, e.target.value),
          });
    const readout =
      knob.kind === "range" ? `${shown}${knob.unit}` : shown.toLowerCase();
    return h(
      "div",
      { key: knob.key, style: row },
      h("label", { htmlFor: knob.key }, knob.label),
      input,
      h(
        "span",
        {
          style: {
            opacity: current ? 1 : 0.6,
            fontVariantNumeric: "tabular-nums",
          },
        },
        current ? readout : `${readout} (shipped)`,
      ),
    );
  };
  const groups = [...new Set(knobs.map((knob) => knob.group))];
  return h(
    "div",
    { style: { padding: "12px 16px", fontSize: 13, display: "grid", gap: 12 } },
    h(
      "p",
      { style: { margin: 0, opacity: 0.8 } },
      "Overrides the tokens on every story. The knobs do not check contrast. Glass knobs show with the material set to glass.",
    ),
    ...groups.map((group) =>
      h(
        Fragment,
        { key: group },
        h("strong", null, group),
        ...knobs.filter((knob) => knob.group === group).map(control),
      ),
    ),
    h(
      "button",
      {
        type: "button",
        style: { justifySelf: "start", padding: "4px 12px" },
        onClick: () =>
          updateGlobals(
            Object.fromEntries(knobs.map((knob) => [knob.key, ""])),
          ),
      },
      "Reset all",
    ),
  );
};

addons.register("purrlucent/tokens", () => {
  addons.add("purrlucent/tokens/panel", {
    type: types.PANEL,
    title: "Tokens",
    render: ({ active }) => (active ? h(Panel) : null),
  });
});
