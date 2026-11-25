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
    const select = await control.evaluate(
      (el, part) => ({
        host: getComputedStyle(el).userSelect,
        label: getComputedStyle(el.shadowRoot!.querySelector('[part="label"]')!)
          .userSelect,
        glyph: getComputedStyle(
          el.shadowRoot!.querySelector(`[part="${part}"]`)!,
        ).userSelect,
      }),
      glyph,
    );
    expect(select.host).not.toBe("none");
    expect(select.label).not.toBe("none");
    expect(select.glyph).toBe("none");
  });
}
