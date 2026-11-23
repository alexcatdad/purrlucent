import { html, type TemplateResult } from "lit";
import "../src/components/toolbar/toolbar.ts";

// Storybook only. Content stays solid; a glass toolbar sits above it in a
// scrolling region, so the content scrolls beneath the bar.
export const underGlass = (content: TemplateResult): TemplateResult => html`
  <div
    role="region"
    aria-label="Content under a glass toolbar"
    tabindex="0"
    style="max-block-size: calc(var(--pl-spacing) * 120); overflow: auto;"
    @scroll=${(event: Event) => {
      const region = event.currentTarget as HTMLElement;
      const bar = region.querySelector("pl-toolbar");
      if (bar) bar.scrolled = region.scrollTop > 0;
    }}
  >
    <pl-toolbar
      label="Glass toolbar"
      style="position: sticky; inset-block-start: 0; z-index: 1;"
    >
      <pl-toolbar-title>Glass toolbar</pl-toolbar-title>
    </pl-toolbar>
    ${content}
  </div>
`;
