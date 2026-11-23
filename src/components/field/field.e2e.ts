import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
} from "../../../e2e/helpers/a11y.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";

const story = (name: string) => `forms-field--${name}`;

const box = async (locator: Locator) => (await locator.boundingBox())!;

test("a pl-input is named by the label and described by the description", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  const input = page.getByRole("textbox", { name: "Email" });
  await expect(input).toHaveAccessibleDescription(
    "We only use it to send your receipt.",
  );
});

test("the control gets an id and the label points at it", async ({ page }) => {
  await gotoStory(page, story("textarea"));
  // The label and description name and describe the control as text (see
  // field.ts), so only the control needs an id, for the label's `for`.
  const ids = await page.locator("#field").evaluate((el) => ({
    forAttr: el.querySelector('[slot="label"]')!.getAttribute("for"),
    control: el.querySelector("pl-textarea")!.id,
  }));
  expect(ids.control).not.toBe("");
  expect(ids.forAttr).toBe(ids.control);
});

test("a field around an input group wires the input, not the addon button", async ({
  page,
}) => {
  await gotoStory(page, story("input-group"));
  const input = page.getByRole("textbox", { name: "Invite link" });
  await expect(input).toHaveAccessibleDescription(
    /Anyone with the link can join\./,
  );
  await expect(page.locator("#addon")).not.toHaveAttribute("aria-invalid");
  await page.locator("#label").click();
  await expect(input).toBeFocused();
});

test("clicking the label focuses a pl-input", async ({ page }) => {
  await gotoStory(page, story("default"));
  await page.locator("#label").click();
  await expect(page.getByRole("textbox", { name: "Email" })).toBeFocused();
});

test("a label that is not a label element still names and focuses the control", async ({
  page,
}) => {
  await gotoStory(page, story("span-label"));
  const input = page.getByRole("textbox", { name: "Display name" });
  await expect(input).toBeVisible();
  await page.locator("#label").click();
  await expect(input).toBeFocused();
});

test("the error shows and marks the control only while the field is invalid", async ({
  page,
}) => {
  await gotoStory(page, story("invalid"));
  const input = page.getByRole("textbox", { name: "Email" });
  await expect(page.locator("#error")).toBeVisible();
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await expect(input).toHaveAccessibleDescription(
    "We only use it to send your receipt. Enter an address such as name@example.com.",
  );
  await page.locator("#field").evaluate((el) => el.removeAttribute("invalid"));
  await expect(page.locator("#error")).toBeHidden();
  await expect(input).not.toHaveAttribute("aria-invalid", "true");
  await expect(input).toHaveAccessibleDescription(
    "We only use it to send your receipt.",
  );
});

test("a checkbox and a switch are named and described by their label, and the label toggles them once", async ({
  page,
}) => {
  await gotoStory(page, story("toggles"));
  const checkbox = page.getByRole("checkbox", { name: "Accept the terms" });
  await expect(checkbox).toHaveAccessibleDescription(
    "You can read them before you agree.",
  );
  await page.locator("#checkbox [slot=label]").click();
  await expect(checkbox).toBeChecked();
  await page.locator("#checkbox [slot=label]").click();
  await expect(checkbox).not.toBeChecked();

  const toggle = page.getByRole("switch", { name: "Notifications" });
  await page.locator("#switch [slot=label]").click();
  await expect(toggle).toBeChecked();
});

test("an invalid checkbox points at the error with aria-errormessage", async ({
  page,
}) => {
  await gotoStory(page, story("toggles"));
  await page.locator("#checkbox").evaluate((el) => {
    const error = document.createElement("span");
    error.slot = "error";
    error.textContent = "Accept the terms to continue.";
    el.append(error);
    el.setAttribute("invalid", "");
  });
  const checkbox = page.getByRole("checkbox", { name: "Accept the terms" });
  await expect(checkbox).toHaveAttribute("aria-invalid", "true");
  const ids = await checkbox.evaluate((el) => ({
    error: el.getAttribute("aria-errormessage"),
    errorId: document.querySelector("#checkbox [slot=error]")!.id,
  }));
  expect(ids.error).toBe(ids.errorId);
  await expect(checkbox).toHaveAccessibleDescription(
    "You can read them before you agree. Accept the terms to continue.",
  );
});

test("a native input is named, described and focused by the label", async ({
  page,
}) => {
  const root = await gotoStory(page, story("default"));
  await root.evaluate((el) => {
    const field = document.createElement("pl-field");
    field.id = "native";
    field.innerHTML =
      '<label slot="label">Phone</label><input /><span slot="description">With area code.</span>';
    el.append(field);
  });
  const input = page.getByRole("textbox", { name: "Phone" });
  await expect(input).toHaveAccessibleDescription("With area code.");
  await page.locator("#native label").click();
  await expect(input).toBeFocused();
  await page.locator("#native").evaluate((el) => {
    const error = document.createElement("span");
    error.slot = "error";
    error.textContent = "Too short.";
    el.append(error);
    el.setAttribute("invalid", "");
  });
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await expect(input).toHaveAccessibleDescription("With area code. Too short.");
});

test("horizontal puts the label beside the control", async ({ page }) => {
  await gotoStory(page, story("horizontal"));
  const label = await box(page.locator("#field [slot=label]"));
  const control = await box(page.locator("pl-input#control"));
  expect(label.x + label.width).toBeLessThanOrEqual(control.x + 1);
  expect(Math.abs(label.y - control.y)).toBeLessThan(control.height);
});

test("a checkbox or switch field puts the control first", async ({ page }) => {
  await gotoStory(page, story("toggles"));
  for (const id of ["#checkbox", "#switch"]) {
    const label = await box(page.locator(`${id} [slot=label]`));
    const control = await box(
      page.locator(`${id} > :is(pl-checkbox, pl-switch)`),
    );
    expect(control.x + control.width).toBeLessThanOrEqual(label.x + 1);
  }
});

test("responsive stacks in a narrow container and goes beside the control in a wide one", async ({
  page,
}) => {
  await gotoStory(page, story("responsive"));
  const narrowLabel = await box(page.locator("#narrow [slot=label]"));
  const narrowControl = await box(page.locator("#narrow pl-input"));
  expect(narrowControl.y).toBeGreaterThanOrEqual(
    narrowLabel.y + narrowLabel.height - 1,
  );
  const wideLabel = await box(page.locator("#wide [slot=label]"));
  const wideControl = await box(page.locator("#wide pl-input"));
  expect(wideLabel.x + wideLabel.width).toBeLessThanOrEqual(wideControl.x + 1);
});

test("the field mirrors under rtl", async ({ page }) => {
  await gotoStory(page, story("rtl"));
  const label = await box(page.locator("#field [slot=label]"));
  const control = await box(page.locator("pl-input#control"));
  expect(label.x).toBeGreaterThan(control.x);
});

test("a fieldset is a group named by its legend and described by its description", async ({
  page,
}) => {
  await gotoStory(page, story("fieldset"));
  const group = page.getByRole("group", { name: "Profile" });
  await expect(group).toHaveAccessibleDescription(
    "This appears on your public page.",
  );
  await expect(page.getByRole("textbox", { name: "Name" })).toBeVisible();
});

test("a disabled fieldset disables the controls inside, also ones added later, and restores only those it disabled", async ({
  page,
}) => {
  await gotoStory(page, story("disabled-fieldset"));
  const name = page.getByRole("textbox", { name: "Card holder" });
  await expect(name).toBeDisabled();
  await expect(
    page.getByRole("checkbox", { name: "Save this card" }),
  ).toHaveAttribute("aria-disabled", "true");
  await page.locator("#fieldset").evaluate((el) => {
    const added = document.createElement("pl-input");
    added.id = "added";
    el.append(added);
  });
  await expect(page.locator("#added")).toHaveAttribute("disabled", "");
  const fieldset = page.locator("#fieldset");
  await fieldset.evaluate((el) => el.removeAttribute("disabled"));
  await expect(name).toBeEnabled();
  // Disabled by its author, so a later round of the fieldset must leave it.
  await page.locator("#save").evaluate((el) => el.setAttribute("disabled", ""));
  await fieldset.evaluate((el) => el.setAttribute("disabled", ""));
  await expect(name).toBeDisabled();
  await fieldset.evaluate((el) => el.removeAttribute("disabled"));
  await expect(name).toBeEnabled();
  await expect(page.locator("#added")).not.toHaveAttribute("disabled", "");
  await expect(page.locator("#save")).toHaveAttribute("disabled", "");
});

test("under forced colors the error keeps its icon and system text color", async ({
  page,
}) => {
  await gotoStory(page, story("invalid"));
  await page.emulateMedia({ forcedColors: "active" });
  const part = page.locator("#field").locator('[part="error"]');
  await expect(part).toBeVisible();
  await expect(part.locator("svg")).toBeVisible();
  const same = await page.locator("#field").evaluate((el) => {
    const probe = document.body.appendChild(document.createElement("div"));
    probe.style.color = "CanvasText";
    const expected = getComputedStyle(probe).color;
    probe.remove();
    return (
      getComputedStyle(el.shadowRoot!.querySelector('[part="error"]')!)
        .color === expected
    );
  });
  expect(same).toBe(true);
});

test("nothing animates, so reduced motion changes nothing", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await gotoStory(page, story("invalid"));
  const durations = await page
    .locator("#field")
    .evaluate((el) =>
      [...el.shadowRoot!.querySelectorAll("[part]")].map(
        (part) => getComputedStyle(part).transitionDuration,
      ),
    );
  expect(durations.every((d) => d === "0s")).toBe(true);
});

test("no horizontal overflow at 200% text zoom", async ({ page }) => {
  await expectNoOverflowAtTextZoom(await gotoStory(page, story("invalid")));
});

test("no horizontal overflow at 200% text zoom with the label beside the control", async ({
  page,
}) => {
  await expectNoOverflowAtTextZoom(await gotoStory(page, story("toggles")));
});

test("axe finds no WCAG 2.2 AA violations", async ({ page }) => {
  await expectAccessible(await gotoStory(page, story("invalid")));
});

test("axe finds no violations in toggle fields", async ({ page }) => {
  await expectAccessible(await gotoStory(page, story("toggles")));
});

test("axe finds no violations in a fieldset", async ({ page }) => {
  await expectAccessible(await gotoStory(page, story("fieldset")));
});

test.describe("coarse pointer on a wide screen", () => {
  test.use({ viewport: { width: 1440, height: 900 }, hasTouch: true });

  test("the controls and a toggle's label keep a 44 high hit area", async ({
    page,
  }: {
    page: Page;
  }) => {
    await gotoStory(page, story("toggles"));
    for (const id of ["#checkbox", "#switch"]) {
      expect(
        (await box(page.locator(`${id} [slot=label]`))).height,
      ).toBeGreaterThanOrEqual(44);
      expect(
        (await box(page.locator(`${id} > :is(pl-checkbox, pl-switch)`))).height,
      ).toBeGreaterThanOrEqual(44);
    }
    await gotoStory(page, story("default"));
    expect(
      (await box(page.locator("pl-input#control"))).height,
    ).toBeGreaterThanOrEqual(44);
  });
});
