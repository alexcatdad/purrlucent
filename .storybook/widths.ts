import { html, type TemplateResult } from "lit";

/** Four instances of a form control: 24, 40 and 60 spacing units wide, then the full width. */
export const widths = (
  item: (style: string, label: string) => TemplateResult,
) =>
  html`<div
    style="display:grid;justify-items:start;gap:var(--pl-space-3);padding:var(--pl-space-4)"
  >
    ${[24, 40, 60].map((n) =>
      item(`inline-size: calc(var(--pl-spacing) * ${n})`, `Width ${n}`),
    )}
    ${item("inline-size: 100%", "Full width")}
  </div>`;
