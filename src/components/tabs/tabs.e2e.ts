import { expect, test, type Page } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
  spokenPhrases,
} from "../../../e2e/helpers/a11y.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";

const story = "components-tabs--default";

const selectedValue = (page: Page) =>
  page.locator("#control").evaluate((el) => (el as HTMLInputElement).value);

const open = async (page: Page, id = story, globals = "") => {
  const root = await gotoStory(page, id, globals);
  await expect(page.locator("pl-tab[selected]")).toHaveCount(1);
  return root;
};

const tab = (page: Page, name: string) => page.getByRole("tab", { name });

test("aria snapshot", async ({ page }) => {
  const root = await open(page);
  await expect(root).toMatchAriaSnapshot(`
    - tablist "Account":
      - tab "Profile" [selected]
      - tab "Security"
      - tab "Billing"
    - tabpanel "Profile": Your name and photo.
  `);
});

test("Tab enters on the selected tab, arrows move and select, and wrap", async ({
  page,
}) => {
  await open(page, "components-tabs--preselected");
  await page.keyboard.press("Tab");
  await expect(tab(page, "Billing")).toBeFocused();
  await page.keyboard.press("ArrowRight"); // wraps to the first
  await expect(tab(page, "Profile")).toBeFocused();
  expect(await selectedValue(page)).toBe("profile");
  await expect(page.getByRole("tabpanel")).toHaveText("Your name and photo.");
  await page.keyboard.press("ArrowLeft"); // wraps to the last
  expect(await selectedValue(page)).toBe("billing");
  await page.keyboard.press("Home");
  expect(await selectedValue(page)).toBe("profile");
  await page.keyboard.press("End");
  expect(await selectedValue(page)).toBe("billing");
});

test("only the selected tab is a tab stop, and Tab moves on to the panel", async ({
  page,
}) => {
  await open(page);
  await page.keyboard.press("Tab");
  await expect(tab(page, "Profile")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("tabpanel")).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(tab(page, "Profile")).toBeFocused();
});

test("a click selects a tab and shows only its panel", async ({ page }) => {
  await open(page);
  await tab(page, "Security").click();
  await expect(tab(page, "Security")).toHaveAttribute("aria-selected", "true");
  await expect(tab(page, "Profile")).toHaveAttribute("aria-selected", "false");
  await expect(page.getByRole("tabpanel")).toHaveText("Password and sign-in.");
  await expect(page.locator("pl-tab-panel:not([hidden])")).toHaveCount(1);
});

test("the tab and its panel name each other", async ({ page }) => {
  await open(page);
  const ids = await page.evaluate(() => {
    const t = document.querySelector("pl-tab[selected]")!;
    const p = document.querySelector("pl-tab-panel:not([hidden])")!;
    return [
      t.getAttribute("aria-controls") === p.id,
      p.getAttribute("aria-labelledby") === t.id,
    ];
  });
  expect(ids).toEqual([true, true]);
});

test("a user selection fires pl-change once with the value, then input and change", async ({
  page,
}) => {
  await open(page);
  await page.locator("#control").evaluate((el) => {
    const log: string[] = [];
    (window as unknown as { log: string[] }).log = log;
    el.addEventListener("pl-change", (e) =>
      log.push(
        `pl-change:${(e as CustomEvent<{ value: string }>).detail.value}`,
      ),
    );
    el.addEventListener("input", () => log.push("input"));
    el.addEventListener("change", () => log.push("change"));
  });
  await tab(page, "Security").click();
  await tab(page, "Security").click();
  expect(
    await page.evaluate(() => (window as unknown as { log: string[] }).log),
  ).toEqual(["pl-change:security", "input", "change"]);
});

test("a programmatic value change moves the selection without pl-change", async ({
  page,
}) => {
  await open(page);
  const changes = await page.locator("#control").evaluate(async (el) => {
    let count = 0;
    el.addEventListener("pl-change", () => count++);
    (el as HTMLInputElement).value = "billing";
    await (el as unknown as { updateComplete: Promise<boolean> })
      .updateComplete;
    return count;
  });
  expect(changes).toBe(0);
  await expect(tab(page, "Billing")).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel")).toHaveText("Plan and invoices.");
});

test("a value no tab has selects the first tab", async ({ page }) => {
  await open(page);
  await page.locator("#control").evaluate((el) => {
    (el as HTMLInputElement).value = "nonsense";
  });
  await expect.poll(() => selectedValue(page)).toBe("profile");
});

test("a disabled tab is skipped by arrows and ignores clicks", async ({
  page,
}) => {
  await open(page, "components-tabs--disabled-tab");
  await expect(tab(page, "Security")).toBeDisabled();
  await page.keyboard.press("Tab");
  await expect(tab(page, "Profile")).toBeFocused();
  await page.keyboard.press("ArrowRight"); // skips Security
  await expect(tab(page, "Billing")).toBeFocused();
  expect(await selectedValue(page)).toBe("billing");
  // Last: a click moves where the next Tab starts from.
  await tab(page, "Security").click({ force: true });
  expect(await selectedValue(page)).toBe("billing");
});

test("vertical tabs move with Up and Down, not Left and Right", async ({
  page,
}) => {
  await open(page, "components-tabs--vertical");
  await expect(page.getByRole("tablist")).toHaveAttribute(
    "aria-orientation",
    "vertical",
  );
  await page.keyboard.press("Tab");
  await page.keyboard.press("ArrowRight");
  expect(await selectedValue(page)).toBe("profile");
  await page.keyboard.press("ArrowDown");
  expect(await selectedValue(page)).toBe("security");
  await page.keyboard.press("ArrowUp");
  expect(await selectedValue(page)).toBe("profile");
  const [first, second] = await Promise.all(
    ["Profile", "Security"].map((name) => tab(page, name).boundingBox()),
  );
  expect(second!.y).toBeGreaterThan(first!.y);
});

test("under rtl, ArrowLeft selects the next tab and ArrowRight the previous", async ({
  page,
}) => {
  await open(page, "components-tabs--rtl");
  await page.keyboard.press("Tab");
  await page.keyboard.press("ArrowLeft");
  expect(await selectedValue(page)).toBe("security");
  await page.keyboard.press("ArrowRight");
  expect(await selectedValue(page)).toBe("profile");
  const [profile, billing] = await Promise.all(
    ["Profile", "Billing"].map((name) => tab(page, name).boundingBox()),
  );
  expect(profile!.x).toBeGreaterThan(billing!.x);
});

test("the selected tab stays visible under forced colors", async ({ page }) => {
  await open(page);
  await page.emulateMedia({ forcedColors: "active" });
  const background = (name: string) =>
    tab(page, name).evaluate((el) => getComputedStyle(el).backgroundColor);
  const highlight = await page.evaluate(() => {
    const probe = document.body.appendChild(document.createElement("div"));
    probe.style.cssText = "background: Highlight; forced-color-adjust: none";
    const color = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return color;
  });
  await expect.poll(() => background("Profile")).toBe(highlight);
  expect(await background("Security")).not.toBe(highlight);
});

test("the indicator does not animate under reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page);
  const duration = await tab(page, "Profile").evaluate(
    (el) => getComputedStyle(el, "::after").transitionDuration,
  );
  expect(duration).toBe("0s");
});

test.describe("coarse pointer on a wide screen", () => {
  test.use({ viewport: { width: 1440, height: 900 }, hasTouch: true });

  test("a coarse pointer keeps each tab at 44 by 44", async ({ page }) => {
    await open(page);
    for (const name of ["Profile", "Security", "Billing"]) {
      const box = await tab(page, name).boundingBox();
      expect(box!.width).toBeGreaterThanOrEqual(44);
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
  });
});

for (const globals of ["", "material:glass", "theme:dark", "contrast:more"]) {
  test(`axe finds no WCAG 2.2 AA violations (${globals || "default"})`, async ({
    page,
  }) => {
    await expectAccessible(await open(page, story, globals));
  });
}

test("no horizontal overflow at 200% text zoom", async ({ page }) => {
  await expectNoOverflowAtTextZoom(await open(page));
});

test("virtual screen reader speaks the tabs and the panel", async ({
  page,
}) => {
  await open(page);
  expect(await spokenPhrases(page)).toEqual([
    "document",
    "tablist, Account",
    "tab, Profile, selected, position 1, set size 3",
    "tab, Security, not selected, position 2, set size 3",
    "tab, Billing, not selected, position 3, set size 3",
    "end of tablist, Account",
    "tabpanel, Profile",
    "Your name and photo.",
    "end of tabpanel, Profile",
    "end of document",
  ]);
});
