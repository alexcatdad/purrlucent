import { expect, test, type Page } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
  spokenPhrases,
} from "../../../e2e/helpers/a11y.ts";
import { forEachViewport } from "../../../e2e/helpers/matrix.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";

const story = (name: string) => `components-switch--${name}`;

/** What the form would submit, as [name, value] pairs. */
const submitted = (page: Page) =>
  page
    .locator("#form")
    .evaluate((form) =>
      [...new FormData(form as HTMLFormElement)].map(([k, v]) => [
        k,
        String(v),
      ]),
    );

test("aria snapshot", async ({ page }) => {
  const root = await gotoStory(page, story("states"));
  await expect(root).toMatchAriaSnapshot(`
    - switch "Bluetooth"
    - switch "Wi-Fi" [checked]
    - switch "AirDrop" [disabled]
    - switch "Hotspot" [checked] [disabled]
    - switch "Notifications"
  `);
});

test("a click and Space turn the switch on and off", async ({ page }) => {
  await gotoStory(page, story("default"));
  const control = page.getByRole("switch", { name: "Wi-Fi" });
  await control.click();
  await expect(control).toBeChecked();
  await page.keyboard.press("Space");
  await expect(control).not.toBeChecked();
});

test("a click on the label text toggles the switch", async ({ page }) => {
  await gotoStory(page, story("default"));
  const control = page.getByRole("switch", { name: "Wi-Fi" });
  const box = (await control.boundingBox())!;
  await page.mouse.click(box.x + box.width - 4, box.y + box.height / 2);
  await expect(control).toBeChecked();
});

test("a disabled switch takes no focus and does not change", async ({
  page,
}) => {
  await gotoStory(page, story("states"));
  const control = page.getByRole("switch", { name: "AirDrop" });
  await control.click({ force: true });
  await expect(control).not.toBeChecked();
  expect(await control.evaluate((el) => (el as HTMLElement).tabIndex)).toBe(-1);
});

test("the form gets the value only while the switch is on", async ({
  page,
}) => {
  await gotoStory(page, story("in-form"));
  expect(await submitted(page)).toEqual([["wifi", "on"]]);
  await page.getByRole("switch", { name: "Sync" }).click();
  await page.getByRole("switch", { name: "Wi-Fi" }).click();
  expect(await submitted(page)).toEqual([["sync", "yes"]]);
});

test("a form reset returns each switch to its checked attribute", async ({
  page,
}) => {
  await gotoStory(page, story("in-form"));
  await page.getByRole("switch", { name: "Sync" }).click();
  await page.getByRole("switch", { name: "Wi-Fi" }).click();
  await page
    .locator("#form")
    .evaluate((form) => (form as HTMLFormElement).reset());
  await expect(page.getByRole("switch", { name: "Wi-Fi" })).toBeChecked();
  await expect(page.getByRole("switch", { name: "Sync" })).not.toBeChecked();
});

test("a required switch makes the form invalid until it is on", async ({
  page,
}) => {
  await gotoStory(page, story("in-form"));
  const valid = () =>
    page
      .locator("#form")
      .evaluate((form) => (form as HTMLFormElement).checkValidity());
  expect(await valid()).toBe(false);
  await page.getByRole("switch", { name: "Sync" }).click();
  expect(await valid()).toBe(true);
});

test("a disabled fieldset disables the switch and submits nothing", async ({
  page,
}) => {
  await gotoStory(page, story("in-form"));
  await page
    .locator("#fieldset")
    .evaluate((el) => ((el as HTMLFieldSetElement).disabled = true));
  const control = page.getByRole("switch", { name: "Wi-Fi" });
  await expect(control).toBeDisabled();
  await control.click({ force: true });
  await expect(control).toBeChecked();
  expect(await submitted(page)).toEqual([]);
});

test("the thumb moves to the other end when on, and mirrors under rtl", async ({
  page,
}) => {
  const offset = async (name: string) => {
    await gotoStory(page, story(name));
    return page
      .locator("purr-switch")
      .first()
      .evaluate((el) => {
        const part = (name: string) =>
          el
            .shadowRoot!.querySelector(`[part="${name}"]`)!
            .getBoundingClientRect();
        const [track, thumb] = [part("track"), part("thumb")];
        return {
          left: thumb.left - track.left,
          right: track.right - thumb.right,
        };
      });
  };
  await page.emulateMedia({ reducedMotion: "reduce" });
  const off = await offset("default");
  expect(off.left).toBeLessThan(off.right);
  const rtl = await offset("rtl");
  // On, under rtl: the thumb sits at the left end.
  expect(rtl.left).toBeLessThan(rtl.right);
  expect(rtl.left).toBeCloseTo(off.left, 1);
});

test("the track keeps its focus ring under forced colors", async ({ page }) => {
  await gotoStory(page, story("default"));
  await page.emulateMedia({ forcedColors: "active" });
  await page.keyboard.press("Tab");
  const control = page.locator("#switch");
  await expect(control).toBeFocused();
  expect(
    await control.evaluate(
      (el) =>
        getComputedStyle(el.shadowRoot!.querySelector('[part="track"]')!)
          .outlineStyle,
    ),
  ).not.toBe("none");
});

for (const name of ["states", "sizes", "in-form", "glass"]) {
  test(`axe finds no WCAG 2.2 AA violations in ${name}`, async ({ page }) => {
    await expectAccessible(await gotoStory(page, story(name)));
  });
}

test("a switch without a label fails axe", async ({ page }) => {
  const root = await gotoStory(page, story("default"));
  await root.evaluate((el) => {
    const bare = document.createElement("purr-switch");
    bare.id = "bare";
    el.append(bare);
  });
  await expect(page.locator("#bare")).toHaveAttribute("role", "switch");
  await expect(expectAccessible(root)).rejects.toThrow();
});

test("no horizontal overflow at 200% text zoom", async ({ page }) => {
  await expectNoOverflowAtTextZoom(await gotoStory(page, story("states")));
});

test("virtual screen reader speaks the role, name and state", async ({
  page,
}) => {
  await gotoStory(page, story("states"));
  const spoken = (await spokenPhrases(page)).join(" | ");
  expect(spoken).toContain("switch, Bluetooth, not checked");
  expect(spoken).toContain("switch, Wi-Fi, checked");
});

test.describe("coarse pointer on a wide screen", () => {
  test.use({ viewport: { width: 1440, height: 900 }, hasTouch: true });

  test("every switch keeps a 44 by 44 hit area", async ({ page }) => {
    await gotoStory(page, story("states"));
    for (const control of await page.locator("purr-switch").all()) {
      const box = (await control.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  });
});

forEachViewport(({ name }) => {
  for (const id of ["states", "sizes", "glass"]) {
    test(`screenshot of ${id} at ${name}`, async ({ page }) => {
      const root = await gotoStory(page, story(id));
      await expect(root).toHaveScreenshot(`${id}-${name}.png`);
    });
  }
});
