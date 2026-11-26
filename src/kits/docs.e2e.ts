import { expect, test } from "@playwright/test";
import { expectAccessible } from "../../e2e/helpers/a11y.ts";

const docs = "/kits/docs/index.html";

test("the installation guide links its sections and adjacent pages", async ({
  page,
}) => {
  await page.goto(docs);
  await expect(
    page.getByRole("navigation", { name: "Breadcrumb" }),
  ).toBeVisible();
  const guides = page.getByRole("navigation", { name: "Guides" });
  await expect(
    guides.getByRole("link", { name: "Installation" }),
  ).toHaveAttribute("aria-current", "page");
  const contents = page.getByRole("navigation", { name: "On this page" });
  await contents.getByRole("link", { name: "Add a component" }).click();
  await expect(page).toHaveURL(/#first-component$/);
  await expectAccessible(page.locator("body"));

  const pagination = page.getByRole("navigation", {
    name: "Previous and next",
  });
  await pagination.getByRole("link", { name: /Next.*Theming/ }).click();
  await expect(page).toHaveURL(/\/kits\/docs\/theming\.html$/);
  await expect(
    page.getByRole("heading", { name: "Theme Purrlucent" }),
  ).toBeVisible();
  await pagination
    .getByRole("link", { name: /Previous.*Installation/ })
    .click();
  await expect(page).toHaveURL(/\/kits\/docs\/index\.html$/);
});

test("the copy button writes the exact install command and announces success", async ({
  page,
  context,
  browserName,
}) => {
  test.skip(
    browserName !== "chromium",
    "Clipboard permission is available in Chromium.",
  );
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto(docs);

  const copy = page.getByRole("button", { name: "Copy install command" });
  await copy.press("Enter");
  await expect(page.locator("#install + p + figure [role=status]")).toHaveText(
    "Copied to clipboard.",
  );
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    "npm install purrlucent",
  );
  await expect(copy).toBeFocused();
});

test("mobile contents reach a heading and a clipboard rejection gives manual instructions", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: () => Promise.reject(new Error("Clipboard unavailable")),
      },
    });
  });
  await page.goto(docs);

  const contents = page.locator(".docs-mobile-contents");
  await contents.locator("summary").press("Enter");
  await contents.getByRole("link", { name: "Install the package" }).click();
  await expect(page).toHaveURL(/#install$/);
  await expect(contents).not.toHaveAttribute("open");
  await page.getByRole("button", { name: "Copy install command" }).click();
  await expect(page.locator("#install + p + figure [role=status]")).toHaveText(
    "Clipboard unavailable. Select and copy the code manually.",
  );
});
