import { screenReaderTest as test } from "@guidepup/playwright";
import { expect } from "@playwright/test";
import { addClickSpacer } from "./setup.ts";

test("onboarding exposes progress and announces focused form errors", async ({
  page,
  screenReader,
}) => {
  await page.goto("/kits/onboarding/index.html#create-account");
  const steps = page.getByRole("list", { name: "Account creation" });
  await expect(steps.getByRole("listitem").first()).toHaveAttribute(
    "aria-current",
    "step",
  );

  await addClickSpacer(page);
  await screenReader.navigateToWebContent();
  await page.getByRole("button", { name: "Continue" }).focus();
  await screenReader.press("Enter");

  const summary = page.getByRole("group", { name: "Check the form" });
  await expect(summary).toBeFocused();
  const spoken = async () => (await screenReader.spokenPhraseLog()).join(" ");
  await expect.poll(spoken).toContain("Check the form");

  await summary.getByRole("link", { name: "Enter your full name." }).focus();
  await screenReader.press("Enter");
  const name = page.getByRole("textbox", { name: "Full name" });
  await expect(name).toBeFocused();
  await expect(name).toHaveAttribute("aria-invalid", "true");
});
