import { expect, test, type Page } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
} from "../../../e2e/helpers/a11y.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";

const story = (name: string) => `feedback-toast--${name}`;

const toasts = (page: Page) => page.locator("pl-toast");
const close = (page: Page) =>
  toasts(page).first().getByRole("button", { name: "Dismiss" });

/** Records the reason of every pl-close, in order, on window. */
const recordCloses = (page: Page) =>
  page.evaluate(() => {
    const w = window as never as { reasons: string[] };
    w.reasons = [];
    document.addEventListener("pl-close", (event) =>
      w.reasons.push((event as CustomEvent<{ reason: string }>).detail.reason),
    );
  });
const reasons = (page: Page) =>
  page.evaluate(() => (window as never as { reasons: string[] }).reasons);

/** Shortens the countdown, which restarts it. */
const setDuration = (page: Page, ms: number) =>
  toasts(page)
    .first()
    .evaluate((el, value) => {
      (el as never as { duration: number }).duration = value;
    }, ms);

test("aria snapshot", async ({ page }) => {
  const root = await gotoStory(page, story("default"));
  await expect(root).toMatchAriaSnapshot(`
    - paragraph: Page content.
    - status:
      - strong: Saved
      - text: Your changes are saved.
      - button "Dismiss"
  `);
});

test("the toaster is a polite status region that reads each addition alone", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  const toaster = page.locator("pl-toaster");
  await expect(toaster).toHaveAttribute("role", "status");
  await expect(toaster).toHaveAttribute("aria-atomic", "false");
});

test("a destructive toast is an alert and a neutral one adds no role of its own", async ({
  page,
}) => {
  await gotoStory(page, story("variants"));
  await expect(page.getByRole("status")).toHaveCount(1);
  await expect(page.getByRole("alert")).toHaveCount(1);
  expect(await toasts(page).first().getAttribute("role")).toBeNull();
});

test("a toast outside a toaster is a status itself", async ({ page }) => {
  await gotoStory(page, story("default"));
  await page.evaluate(() => {
    const solo = document.createElement("pl-toast");
    solo.id = "solo";
    document.body.append(solo);
  });
  await expect(page.locator("#solo")).toHaveAttribute("role", "status");
});

test("the close button closes the toast and fires pl-close once with reason close", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await recordCloses(page);
  await close(page).click();
  await expect(toasts(page)).toBeHidden();
  // A duplicate would follow right after the first event.
  await page.waitForTimeout(300);
  expect(await reasons(page)).toEqual(["close"]);
});

test("Escape closes the focused toast and focus returns to where it was", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await recordCloses(page);
  await page.locator("#before").focus();
  await close(page).focus();
  await page.keyboard.press("Escape");
  await expect(toasts(page)).toBeHidden();
  await expect(page.locator("#before")).toBeFocused();
  expect(await reasons(page)).toEqual(["escape"]);
});

test("Escape does nothing while focus is outside the toast", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await page.locator("#before").focus();
  await page.keyboard.press("Escape");
  await expect(toasts(page)).toBeVisible();
});

test("a toast does not take focus when it appears", async ({ page }) => {
  await gotoStory(page, story("imperative"));
  await page.locator("#plain").click();
  await expect(toasts(page)).toBeVisible();
  expect(await toasts(page).evaluate((el) => el.matches(":focus-within"))).toBe(
    false,
  );
});

test("the default duration is 6000 milliseconds", async ({ page }) => {
  await gotoStory(page, story("default"));
  expect(
    await page.evaluate(
      () =>
        (document.createElement("pl-toast") as never as { duration: number })
          .duration,
    ),
  ).toBe(6000);
});

test("a toast without an action dismisses itself with reason timeout", async ({
  page,
}) => {
  await gotoStory(page, story("auto-dismiss"));
  await recordCloses(page);
  await setDuration(page, 400);
  await expect(toasts(page)).toBeHidden();
  expect(await reasons(page)).toEqual(["timeout"]);
});

test("a toast with an action never dismisses itself", async ({ page }) => {
  await gotoStory(page, story("with-action"));
  await page.waitForTimeout(1500);
  await expect(toasts(page)).toBeVisible();
});

test("pressing the action closes the toast with reason action", async ({
  page,
}) => {
  await gotoStory(page, story("with-action"));
  await recordCloses(page);
  await toasts(page).getByRole("button", { name: "Undo" }).click();
  await expect(toasts(page)).toBeHidden();
  expect(await reasons(page)).toEqual(["action"]);
});

test("a duration of 0 keeps the toast", async ({ page }) => {
  await gotoStory(page, story("auto-dismiss"));
  await setDuration(page, 300);
  await setDuration(page, 0);
  await page.waitForTimeout(1000);
  await expect(toasts(page)).toBeVisible();
});

test("the countdown pauses while the pointer is over the toast", async ({
  page,
}) => {
  await gotoStory(page, story("auto-dismiss"));
  await setDuration(page, 1500);
  await toasts(page).hover();
  await page.waitForTimeout(2500);
  await expect(toasts(page)).toBeVisible();
  await page.mouse.move(0, 0);
  await expect(toasts(page)).toBeHidden({ timeout: 5000 });
});

test("the countdown pauses while focus is inside the toast", async ({
  page,
}) => {
  await gotoStory(page, story("auto-dismiss"));
  await setDuration(page, 1500);
  await close(page).focus();
  await page.waitForTimeout(2500);
  await expect(toasts(page)).toBeVisible();
  await close(page).blur();
  await expect(toasts(page)).toBeHidden({ timeout: 5000 });
});

test("the countdown still ends under reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await gotoStory(page, story("auto-dismiss"));
  await setDuration(page, 400);
  await expect(toasts(page)).toBeHidden();
});

test("a toast has no transition under reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await gotoStory(page, story("default"));
  const durations = await toasts(page).evaluate((el) =>
    getComputedStyle(el)
      .transitionDuration.split(",")
      .map((value) => value.trim()),
  );
  expect(durations.every((value) => value === "0s")).toBe(true);
});

test("toasts stack with the newest last, at the bottom inline-end corner", async ({
  page,
}) => {
  await gotoStory(page, story("stack"));
  const view = page.viewportSize()!;
  const [first, second, last] = (
    await Promise.all([0, 1, 2].map((i) => toasts(page).nth(i).boundingBox()))
  ).map((box) => box!) as [
    { y: number },
    { y: number },
    { x: number; y: number; width: number; height: number },
  ];
  expect(second.y).toBeGreaterThan(first.y);
  expect(last.y).toBeGreaterThan(second.y);
  expect(view.height - (last.y + last.height)).toBeGreaterThanOrEqual(0);
  expect(view.height - (last.y + last.height)).toBeLessThan(32);
  expect(view.width - (last.x + last.width)).toBeGreaterThanOrEqual(0);
  expect(view.width - (last.x + last.width)).toBeLessThan(32);
});

test("under rtl the stack sits at the left edge", async ({ page }) => {
  await gotoStory(page, story("rtl"));
  const box = (await toasts(page).boundingBox())!;
  expect(box.x).toBeLessThan(page.viewportSize()!.width / 2);
});

test("close-label names the close button", async ({ page }) => {
  await gotoStory(page, story("default"));
  await toasts(page).evaluate((el) => el.setAttribute("close-label", "Fermer"));
  await expect(page.getByRole("button", { name: "Fermer" })).toBeVisible();
});

test("PlToaster.show adds a toast to the page's toaster and the close button removes it", async ({
  page,
}) => {
  await gotoStory(page, story("imperative"));
  await expect(page.locator("#toaster")).toHaveAttribute("role", "status");
  await page.locator("#plain").click();
  await expect(toasts(page)).toHaveCount(1);
  await expect(toasts(page)).toContainText("Your changes are saved.");
  await expect(toasts(page).locator("strong")).toHaveText("Saved");
  await close(page).click();
  await expect(toasts(page)).toHaveCount(0);
});

test("PlToaster.show builds an action that runs its handler and closes the toast", async ({
  page,
}) => {
  await gotoStory(page, story("imperative"));
  await page.locator("#action").click();
  await toasts(page).getByRole("button", { name: "Undo" }).click();
  await expect(toasts(page)).toHaveCount(0);
  expect(
    await page.evaluate(() => (window as never as { undone: boolean }).undone),
  ).toBe(true);
});

test("PlToaster.show with the destructive variant makes an alert", async ({
  page,
}) => {
  await gotoStory(page, story("imperative"));
  await page.locator("#destructive").click();
  await expect(page.getByRole("alert")).toHaveCount(1);
});

test("PlToaster.show makes a toaster when the page has none", async ({
  page,
}) => {
  await gotoStory(page, story("without-toaster"));
  await expect(page.locator("pl-toaster")).toHaveCount(0);
  await page.locator("#show").click();
  await expect(page.locator("body > pl-toaster")).toHaveCount(1);
  await expect(toasts(page)).toBeVisible();
});

test("the focus ring is visible and the toast keeps an edge under forced colors", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await page.emulateMedia({ forcedColors: "active" });
  await close(page).focus();
  expect(
    await close(page).evaluate((el) => getComputedStyle(el).outlineStyle),
  ).not.toBe("none");
  expect(
    await toasts(page).evaluate((el) => getComputedStyle(el).borderTopStyle),
  ).toBe("solid");
});

test("the variants have no axe violations", async ({ page }) => {
  await expectAccessible(await gotoStory(page, story("variants")));
});

test("the variants have no axe violations in dark mode", async ({ page }) => {
  await expectAccessible(
    await gotoStory(page, story("variants"), "theme:dark"),
  );
});

test("a toast with an action has no axe violations", async ({ page }) => {
  await expectAccessible(await gotoStory(page, story("with-action")));
});

test("no horizontal overflow at 200% text zoom", async ({ page }) => {
  await expectNoOverflowAtTextZoom(await gotoStory(page, story("variants")));
});

test("no horizontal overflow at 200% text zoom with an action", async ({
  page,
}) => {
  await expectNoOverflowAtTextZoom(await gotoStory(page, story("with-action")));
});

test.describe("coarse pointer on a wide screen", () => {
  test.use({ viewport: { width: 1440, height: 900 }, hasTouch: true });

  test("the close button and the action are at least 44 by 44", async ({
    page,
  }) => {
    await gotoStory(page, story("with-action"));
    for (const target of [
      close(page),
      toasts(page).getByRole("button", { name: "Undo" }),
    ]) {
      const box = (await target.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  });
});
