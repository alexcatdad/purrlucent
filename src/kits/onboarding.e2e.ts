import { expect, test } from "@playwright/test";

const kit = "/kits/onboarding/index.html";

test.describe("with JavaScript disabled", () => {
  test.use({ javaScriptEnabled: false });

  test("the form never posts its entries", async ({ page }) => {
    let posted = false;
    await page.route("**/*", (route) => {
      if (route.request().method() !== "POST") return route.continue();
      posted = true;
      return route.abort();
    });
    await page.goto(kit);
    const originalUrl = page.url();
    await expect(
      page.getByText("Enable JavaScript to try the forms."),
    ).toBeVisible();
    await page.getByRole("textbox", { name: "Full name" }).fill("Sam Avery");
    await page
      .getByRole("textbox", { name: "Email address" })
      .fill("sam@example.com");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page).toHaveURL(originalUrl);
    expect(posted).toBe(false);
  });
});

test("account creation links errors, keeps details on Back, and clears passwords", async ({
  page,
}) => {
  await page.goto(kit);
  await expect(page.locator("#onboarding-unavailable")).toBeHidden();
  const name = page.getByRole("textbox", { name: "Full name" });
  const email = page.getByRole("textbox", { name: "Email address" });
  await page.getByRole("button", { name: "Continue" }).click();

  const summary = page.getByRole("group", { name: "Check the form" });
  const nameError = summary.getByRole("link", {
    name: "Enter your full name.",
  });
  await expect(summary).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(nameError).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(name).toBeFocused();
  await expect(name).toHaveAttribute("aria-invalid", "true");

  await name.fill("Sam Avery");
  await email.fill("sam@example.com");
  await email.press("Enter");
  await expect(
    page.getByRole("heading", { name: "Choose a password" }),
  ).toBeFocused();
  const steps = page
    .locator("#password-title + pl-step-indicator")
    .getByRole("list", { name: "Account creation" });
  await expect(
    steps.getByRole("listitem").filter({ hasText: "Password" }),
  ).toHaveAttribute("aria-current", "step");

  await page.getByLabel("Password", { exact: true }).fill("sample-password");
  await page.getByRole("link", { name: "Back", exact: true }).click();
  await expect(name).toHaveValue("Sam Avery");
  await expect(email).toHaveValue("sam@example.com");
  await expect(page.locator("#account-password")).toHaveValue("");

  await page.goBack();
  await expect(
    page.getByRole("heading", { name: "Choose a password" }),
  ).toBeFocused();
  await page.getByLabel("Password", { exact: true }).fill("sample-password");
  await page.getByLabel("Confirm your password").fill("sample-password");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(
    page.getByRole("heading", { name: "Your demo account is ready" }),
  ).toBeFocused();
  await expect(page.locator("#account-password")).toHaveValue("");
  await expect(page.locator("#account-confirm")).toHaveValue("");

  await page.goBack();
  await expect(
    page.getByRole("heading", { name: "Choose a password" }),
  ).toBeFocused();
  await page.goBack();
  await expect(name).toHaveValue("Sam Avery");
  await name.fill("");
  await page.goForward();
  await expect(page).toHaveURL(/#create-account$/);
  await expect(name).toHaveValue("");
  await page.evaluate(() => {
    location.hash = "account-created";
  });
  await expect(page).toHaveURL(/#create-account$/);
  await expect(
    page.getByRole("heading", { name: "Your demo account is ready" }),
  ).toBeHidden();
});

test("password reset and invitation open directly and reach confirmation", async ({
  page,
}) => {
  await page.goto(`${kit}#reset-password`);
  const password = page.getByLabel("New password", { exact: true });
  const confirm = page.getByLabel("Confirm your new password");
  await password.fill("sample-password");
  await confirm.fill("different-password");
  await page.getByRole("button", { name: "Reset password" }).click();
  await page
    .getByRole("link", { name: "Enter the same password again." })
    .click();
  await expect(confirm).toBeFocused();
  await confirm.fill("sample-password");
  await confirm.press("Enter");
  await expect(
    page.getByRole("heading", { name: "Password reset complete" }),
  ).toBeFocused();

  await page.getByRole("link", { name: "Accept an invitation" }).click();
  await expect(page).toHaveURL(/#accept-invite$/);
  await expect(
    page.getByRole("heading", { name: "Join Harbor Studio" }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Accept invitation" }).click();
  await expect(
    page.getByRole("heading", { name: "You joined Harbor Studio" }),
  ).toBeFocused();
});

test("first-run setup keeps the profile when revisiting the prior step", async ({
  page,
}) => {
  await page.goto(`${kit}#first-run`);
  await page.getByRole("textbox", { name: "Display name" }).fill("Sam Avery");
  await page.getByRole("button", { name: "Continue" }).click();
  const workspace = page.getByRole("textbox", { name: "Workspace name" });
  await workspace.fill("Harbor Studio");
  await page.getByRole("link", { name: "Back", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Display name" })).toHaveValue(
    "Sam Avery",
  );
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(workspace).toHaveValue("Harbor Studio");
  await page.getByRole("button", { name: "Create workspace" }).click();
  await expect(
    page.getByRole("heading", { name: "Your demo workspace is ready" }),
  ).toBeFocused();
});
