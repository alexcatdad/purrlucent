import { expect, test } from "@playwright/test";
import { gotoStory } from "../../e2e/helpers/story.ts";

const cases = [
  ["forms-checkbox--default", "pl-checkbox", "box"],
  ["forms-switch--default", "pl-switch", "track"],
] as const;

for (const [id, host, glyph] of cases) {
  test(`${host} label text can be selected; only the ${glyph} cannot`, async ({
    page,
  }) => {
    await gotoStory(page, id);
    const control = page.locator(host).first();
    await expect(control).toBeVisible();
    const select = await control.evaluate((el, part) => {
      // WebKit may expose only the prefixed property.
      const of = (node: Element) => {
        const style = getComputedStyle(node) as CSSStyleDeclaration & {
          webkitUserSelect?: string;
        };
        return style.userSelect || style.webkitUserSelect;
      };
      const inner = (selector: string) =>
        of(el.shadowRoot!.querySelector(selector)!);
      return {
        host: of(el),
        label: inner('[part="label"]'),
        glyph: inner(`[part="${part}"]`),
      };
    }, glyph);
    expect(select.host).not.toBe("none");
    expect(select.label).not.toBe("none");
    expect(select.glyph).toBe("none");
  });
}
