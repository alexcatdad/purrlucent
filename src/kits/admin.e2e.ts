import { expect, test } from "@playwright/test";

const kit = "/kits/admin/index.html";
test.use({ viewport: { width: 1280, height: 900 } });

test("loads, recovers from a failed request, and clears an empty search", async ({
  page,
}) => {
  await page.goto(`${kit}?state=error`);
  await expect(page.getByText("Couldn’t load requests")).toBeVisible();
  await page.getByRole("button", { name: "Retry" }).press("Enter");
  await expect(page.locator("#queue-note")).toHaveText("Loading requests…");
  await expect(page.locator("#queue-note")).toHaveText("5 requests");

  const search = page.getByRole("searchbox", { name: "Search requests" });
  const resolveRequest = page.getByRole("button", {
    name: "Resolve request",
    exact: true,
  });
  const reopenRequest = page.getByRole("button", {
    name: "Reopen request",
    exact: true,
  });
  await expect(resolveRequest).toBeVisible();
  await search.fill("fw-104");
  await expect(page.locator("#detail-title")).toHaveText(
    "Restore a deleted view",
  );
  await expect(reopenRequest).toBeVisible();
  await expect(resolveRequest).toBeHidden();
  await search.fill("unmatched");
  await expect(page.getByText("No matching requests")).toBeVisible();
  await expect(reopenRequest).toBeHidden();
  await expect(page.locator("#detail-title")).toHaveText("Request details");
  await page.getByRole("button", { name: "Clear filters" }).press("Enter");
  await expect(search).toBeFocused();
  await expect(search).toHaveValue("");
  await expect(page.locator("#queue-note")).toHaveText("5 requests");
});

test("resolves selected requests and can reopen one from detail", async ({
  page,
}) => {
  await page.goto(kit);
  const invite = page.getByRole("checkbox", {
    name: "Select Invite link expired",
  });
  const notes = page.getByRole("checkbox", {
    name: "Select Export is missing notes",
  });
  await expect(invite).toBeVisible();
  const status = page.getByRole("combobox", { name: "Status" });
  await status.click();
  await page.getByRole("option", { name: "Open", exact: true }).click();
  await invite.press("Space");
  await notes.press("Space");
  await expect(
    page.getByRole("checkbox", { name: "Select open requests" }),
  ).toHaveAttribute("aria-checked", "mixed");
  await page.getByRole("button", { name: "Resolve selected (2)" }).click();
  await expect(page.locator("#queue-note")).toHaveText(
    "2 requests resolved. 2 requests shown.",
  );
  await expect(invite).toBeHidden();
  await expect(notes).toBeHidden();
  await expect(page.locator("#detail-title")).toHaveText(
    "Move a project to another team",
  );

  await status.click();
  await page.getByRole("option", { name: "Resolved", exact: true }).click();
  await expect(page.locator("#requests").getByRole("listitem")).toHaveCount(3);
  await page.getByRole("button", { name: "Invite link expired" }).click();
  await page.getByRole("button", { name: "Reopen request" }).click();
  await expect(page.locator("#detail-status")).toHaveText("Open");
  await expect(page.locator("#requests").getByRole("listitem")).toHaveCount(2);
});

test("opens a filtered request and restores row focus on a phone", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(kit);
  const search = page.getByRole("searchbox", { name: "Search requests" });
  await expect(page.locator("#queue-note")).toHaveText("5 requests");
  await search.fill("fw-107");
  const row = page.getByRole("button", { name: "Export is missing notes" });
  await row.press("Enter");
  await expect(
    page.getByRole("heading", { name: "Export is missing notes" }),
  ).toBeFocused();
  await expect(search).toBeHidden();
  await expect(page.getByText("Ellis Reid", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Back to requests" }).press("Enter");
  await expect(row).toBeFocused();
  await expect(search).toHaveValue("fw-107");
});

test("keeps the active control focused when switching pane layouts", async ({
  page,
}) => {
  await page.goto(kit);
  const resolve = page.getByRole("button", {
    name: "Resolve request",
    exact: true,
  });
  await expect(resolve).toBeVisible();
  await resolve.focus();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(resolve).toBeFocused();
  const back = page.getByRole("button", { name: "Back to requests" });
  await back.focus();
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(back).toBeFocused();
  await back.press("Enter");
  await expect(
    page.getByRole("button", { name: "Invite link expired" }),
  ).toBeFocused();
});
