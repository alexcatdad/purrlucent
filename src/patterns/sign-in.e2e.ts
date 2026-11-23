import { expect, test, type Locator } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
} from "../../e2e/helpers/a11y.ts";
import { gotoStory } from "../../e2e/helpers/story.ts";

const story = (name: string) => `patterns-sign-in--${name}`;

const email = (root: Locator) => root.getByRole("textbox", { name: "Email" });
// A password field has no textbox role: reach its native input by name.
const password = (root: Locator) =>
  root.locator("pl-input[name=password] input");
const code = (root: Locator) =>
  root.getByRole("textbox", { name: "Verification code" });
const button = (root: Locator, name: string) =>
  root.getByRole("button", { name, exact: true });
const toast = (root: Locator) =>
  root.locator("pl-toast", { hasText: "Signed in" });

for (const name of ["default", "code", "error-states", "rtl", "glass"])
  test(`axe finds no WCAG 2.2 AA violations in ${name}`, async ({ page }) => {
    await expectAccessible(await gotoStory(page, story(name)));
  });

for (const name of ["default", "code"])
  test(`no horizontal overflow at 200% text zoom in ${name}`, async ({
    page,
  }) => {
    await expectNoOverflowAtTextZoom(await gotoStory(page, story(name)));
  });

test("step one has the heading, both fields, the checkbox and both buttons", async ({
  page,
}) => {
  const root = await gotoStory(page, story("default"));
  await expect(root.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await expect(email(root)).toBeVisible();
  await expect(password(root)).toHaveAttribute("type", "password");
  await expect(password(root)).toHaveAttribute(
    "autocomplete",
    "current-password",
  );
  await expect(
    root.getByRole("checkbox", { name: "Keep me signed in" }),
  ).toBeVisible();
  await expect(button(root, "Continue")).toBeVisible();
  await expect(button(root, "Forgot password")).toBeVisible();
  await expect(root.locator("form")).toHaveCount(1);
});

test("an empty form shows both field errors and focuses the email", async ({
  page,
}) => {
  const root = await gotoStory(page, story("default"));
  await button(root, "Continue").click();
  await expect(root.getByText("Enter your email address.")).toBeVisible();
  await expect(root.getByText("Use at least 8 characters.")).toBeVisible();
  await expect(email(root)).toBeFocused();
  await expect(code(root)).toHaveCount(0);
});

test("an email without a domain and a short password are rejected", async ({
  page,
}) => {
  const root = await gotoStory(page, story("default"));
  await email(root).fill("hello@example");
  await password(root).fill("1234567");
  await button(root, "Continue").click();
  await expect(
    root.getByText("Enter an email address like name@example.com."),
  ).toBeVisible();
  await expect(root.getByText("Use at least 8 characters.")).toBeVisible();
  await expect(email(root)).toHaveAttribute("aria-invalid", "true");
});

test("only the password is wrong: focus goes to it and the email has no error", async ({
  page,
}) => {
  const root = await gotoStory(page, story("default"));
  await email(root).fill("hello@example.com");
  await password(root).fill("short");
  await button(root, "Continue").click();
  await expect(root.getByText("Use at least 8 characters.")).toBeVisible();
  await expect(password(root)).toBeFocused();
  await expect(email(root)).not.toHaveAttribute("aria-invalid", "true");
});

test("editing a field clears its error", async ({ page }) => {
  const root = await gotoStory(page, story("default"));
  await button(root, "Continue").click();
  await expect(root.getByText("Enter your email address.")).toBeVisible();
  await email(root).fill("a");
  await expect(root.getByText("Enter your email address.")).toBeHidden();
});

test("the keyboard path: type, Enter, then the code field has focus", async ({
  page,
}) => {
  const root = await gotoStory(page, story("default"));
  await root
    .locator("pl-input[name=email]")
    .evaluate((el) => (el as HTMLElement).focus());
  await page.keyboard.type("hello@example.com");
  await page.keyboard.press("Tab");
  await expect(password(root)).toBeFocused();
  await page.keyboard.type("correct horse");
  await page.keyboard.press("Enter");
  await expect(
    root.getByRole("heading", { name: "Enter the code" }),
  ).toBeVisible();
  await expect(root.getByText("hello@example.com.")).toBeVisible();
  await expect(code(root)).toBeFocused();
  await expect(code(root)).toHaveAttribute("autocomplete", "one-time-code");
  // Typing the right code completes the sign-in.
  await page.keyboard.type("123456");
  await expect(toast(root)).toBeVisible();
  await expect(
    root.getByRole("heading", { name: "You are signed in" }),
  ).toBeVisible();
  await expect(button(root, "Sign out")).toBeVisible();
});

test("a wrong code shows an error and keeps focus in the code field", async ({
  page,
}) => {
  const root = await gotoStory(page, story("code"));
  await code(root).click();
  await page.keyboard.type("654321");
  await expect(
    root.getByText("That code is not right. Try again."),
  ).toBeVisible();
  await expect(code(root)).toBeFocused();
  await expect(code(root)).toHaveAttribute("aria-invalid", "true");
  await expect(toast(root)).toHaveCount(0);
  // Editing the code clears the message; the right code then signs in.
  await page.keyboard.press("Backspace");
  await expect(
    root.getByText("That code is not right. Try again."),
  ).toBeHidden();
  await page.keyboard.type("6");
  await expect(
    root.getByText("That code is not right. Try again."),
  ).toBeVisible();
  await page.keyboard.press("ControlOrMeta+A");
  await page.keyboard.type("123456");
  await expect(toast(root)).toBeVisible();
});

test("Verify with an incomplete code asks for all six digits", async ({
  page,
}) => {
  const root = await gotoStory(page, story("code"));
  await code(root).click();
  await page.keyboard.type("123");
  await page.keyboard.press("Enter");
  await expect(root.getByText("Enter the 6-digit code.")).toBeVisible();
  await expect(code(root)).toBeFocused();
  await expect(toast(root)).toHaveCount(0);
});

test("the right code signs in at once and Sign out returns to step one", async ({
  page,
}) => {
  const root = await gotoStory(page, story("code"));
  await code(root).fill("123456");
  await expect(toast(root)).toBeVisible();
  await button(root, "Sign out").click();
  await expect(root.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await expect(email(root)).toBeFocused();
  await expect(email(root)).toHaveValue("");
});

test("Send a new code waits for the countdown, then clears the code", async ({
  page,
}) => {
  await page.clock.install();
  const root = await gotoStory(page, story("code"));
  const resend = button(root, "Send a new code");
  await expect(resend).toHaveAttribute("aria-disabled", "true");
  await expect(root.getByText("You can ask for another in 30s.")).toBeVisible();
  await resend.click({ force: true });
  await expect(root.getByText("A new code is on its way.")).toHaveCount(0);
  await code(root).fill("000");
  await page.clock.runFor(31_000);
  await expect(resend).not.toHaveAttribute("aria-disabled", "true");
  await expect(root.getByText(/You can ask for another/)).toHaveCount(0);
  await resend.click();
  await expect(root.getByText("A new code is on its way.")).toBeVisible();
  await expect(code(root)).toHaveValue("");
  await expect(code(root)).toBeFocused();
  await expect(resend).toHaveAttribute("aria-disabled", "true");
});

test("Forgot password shows a confirmation toast without leaving step one", async ({
  page,
}) => {
  const root = await gotoStory(page, story("default"));
  await button(root, "Forgot password").click();
  await expect(
    root.locator("pl-toast", { hasText: "Check your email" }),
  ).toBeVisible();
  await expect(root.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

test("the error story shows the field errors and the wrong-code message", async ({
  page,
}) => {
  const root = await gotoStory(page, story("error-states"));
  await expect(
    root.getByText("Enter an email address like name@example.com."),
  ).toBeVisible();
  await expect(root.getByText("Use at least 8 characters.")).toBeVisible();
  await expect(
    root.getByText("That code is not right. Try again."),
  ).toBeVisible();
});

test("under rtl the card keeps its fields readable and aligned to the start", async ({
  page,
}) => {
  const root = await gotoStory(page, story("rtl"));
  const frame = (await root.locator("sign-in-demo").boundingBox())!;
  const field = (await email(root).boundingBox())!;
  expect(field.x).toBeGreaterThanOrEqual(frame.x - 1);
  expect(field.x + field.width).toBeLessThanOrEqual(frame.x + frame.width + 1);
});
