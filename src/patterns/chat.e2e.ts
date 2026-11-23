import { expect, test, type Locator } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
} from "../../e2e/helpers/a11y.ts";
import { gotoStory } from "../../e2e/helpers/story.ts";

const story = (name: string) => `patterns-chat--${name}`;

const field = (root: Locator) => root.getByRole("textbox", { name: "Message" });
const send = (root: Locator) => root.getByRole("button", { name: "Send" });
const stop = (root: Locator) => root.getByRole("button", { name: "Stop" });
const scroller = (root: Locator) => root.locator("pl-message-scroller");
const thinking = (root: Locator) =>
  root.getByRole("status").filter({ hasText: "Thinking" });

/** The bubbles of the person's new messages and of the streamed replies. */
const mine = (root: Locator) =>
  root.locator("pl-message-scroller-item[message-id^=m] pl-bubble");
const replies = (root: Locator) =>
  root.locator("pl-message-scroller-item[message-id^=r] pl-bubble");

for (const name of ["conversation", "streaming", "empty", "rtl", "glass"])
  test(`axe finds no WCAG 2.2 AA violations in ${name}`, async ({ page }) => {
    await expectAccessible(await gotoStory(page, story(name)));
  });

for (const name of ["conversation", "empty"])
  test(`no horizontal overflow at 200% text zoom in ${name}`, async ({
    page,
  }) => {
    await expectNoOverflowAtTextZoom(await gotoStory(page, story(name)));
  });

test("the conversation shows both senders, the attachments and the reaction", async ({
  page,
}) => {
  const root = await gotoStory(page, story("conversation"));
  await expect(root.getByRole("group", { name: "You" }).first()).toBeVisible();
  await expect(
    root.getByRole("group", { name: "Assistant" }).first(),
  ).toBeVisible();
  await expect(root.locator("pl-attachment")).toHaveCount(2);
  await expect(root.getByRole("img", { name: "1 like" })).toHaveCount(1);
  await expect(root.locator("pl-marker", { hasText: "Today" })).toBeVisible();
});

test("the prompt stays docked below the scroller", async ({ page }) => {
  const root = await gotoStory(page, story("conversation"));
  const list = (await scroller(root).boundingBox())!;
  const prompt = (await root.locator("pl-prompt-input").boundingBox())!;
  expect(prompt.y).toBeGreaterThanOrEqual(list.y + list.height - 1);
  const frame = (await root.locator("chat-demo").boundingBox())!;
  expect(prompt.y + prompt.height).toBeLessThanOrEqual(
    frame.y + frame.height + 1,
  );
});

test("sending adds the message and clears the field", async ({ page }) => {
  const root = await gotoStory(page, story("conversation"));
  await field(root).fill("Is it ready to ship?");
  await send(root).click();
  await expect(thinking(root)).toBeVisible();
  await expect(
    root.locator("pl-bubble", { hasText: "Is it ready to ship?" }),
  ).toHaveCount(1);
  await expect(mine(root)).toHaveCount(1);
  await expect(field(root)).toHaveValue("");
  await expect(scroller(root)).toHaveAttribute("busy", "");
  await expect(stop(root)).toBeVisible();
});

test("streaming: a partial reply is showing while the prompt offers Stop", async ({
  page,
}) => {
  const root = await gotoStory(page, story("streaming"));
  const bubble = root.locator("pl-bubble", { hasText: "streamed one word" });
  await expect(bubble).toBeVisible();
  await expect(bubble).not.toContainText("Press Stop at any time");
  await expect(scroller(root)).toHaveAttribute("busy", "");
  await expect(stop(root)).toBeVisible();
  await expect(send(root)).toHaveCount(0);
});

test("the reply streams in word by word and the view follows it", async ({
  page,
}) => {
  const root = await gotoStory(page, story("conversation"));
  await field(root).fill("Can you check the changelog too?");
  await send(root).click();
  await expect(thinking(root)).toBeVisible();
  await expect(replies(root)).toHaveCount(1);
  await expect(thinking(root)).toHaveCount(0);
  const length = () =>
    replies(root)
      .first()
      .evaluate((el) => el.textContent!.length);
  const early = await length();
  await expect.poll(length).toBeGreaterThan(early);
  await expect(scroller(root)).not.toHaveAttribute("busy", {
    timeout: 15_000,
  });
  await expect(replies(root).first()).toContainText("Press Stop at any time");
  await expect(send(root)).toBeVisible();
  // The last row, the finished reply, is inside the scroller's view.
  await expect
    .poll(() =>
      scroller(root).evaluate((el) => {
        const last = [...el.querySelectorAll("pl-message-scroller-item")].at(
          -1,
        )!;
        const row = last.getBoundingClientRect();
        const view = el.getBoundingClientRect();
        return row.bottom <= view.bottom + 1 && row.top >= view.top - 1;
      }),
    )
    .toBe(true);
});

test("Stop ends the stream early and brings Send back", async ({ page }) => {
  const root = await gotoStory(page, story("conversation"));
  await field(root).fill("Please summarize it");
  await send(root).click();
  await expect(replies(root)).toHaveCount(1);
  await stop(root).click();
  await expect(send(root)).toBeVisible();
  await expect(stop(root)).toHaveCount(0);
  await expect(scroller(root)).not.toHaveAttribute("busy");
  const text = await replies(root)
    .first()
    .evaluate((el) => el.textContent);
  await page.waitForTimeout(400);
  expect(
    await replies(root)
      .first()
      .evaluate((el) => el.textContent),
  ).toBe(text);
  expect(text).not.toContain("Press Stop at any time");
  // The field is ready for the next message.
  await field(root).fill("Next one");
  await expect(send(root)).not.toHaveAttribute("aria-disabled");
});

test("Stop during Thinking leaves a note instead of an empty reply", async ({
  page,
}) => {
  const root = await gotoStory(page, story("conversation"));
  await field(root).fill("Hello");
  await send(root).click();
  await stop(root).click();
  await expect(root.locator("pl-marker", { hasText: "Stopped" })).toBeVisible();
  await expect(replies(root)).toHaveCount(0);
  await expect(send(root)).toBeVisible();
});

test.describe("keyboard", () => {
  test("Enter sends and Shift+Enter makes a newline", async ({ page }) => {
    const root = await gotoStory(page, story("conversation"));
    await field(root).focus();
    await page.keyboard.type("first line");
    await page.keyboard.press("Shift+Enter");
    await page.keyboard.type("second line");
    await expect(field(root)).toHaveValue("first line\nsecond line");
    await expect(mine(root)).toHaveCount(0);
    await page.keyboard.press("Enter");
    await expect(mine(root)).toHaveCount(1);
    await expect(mine(root).first()).toContainText("first line");
    await expect(mine(root).first()).toContainText("second line");
    await expect(mine(root).first().locator(".sent")).toHaveCSS(
      "white-space",
      "pre-wrap",
    );
    await expect(
      mine(root)
        .first()
        .locator(".sent")
        .evaluate((el) => (el as HTMLElement).innerText),
    ).resolves.toBe("first line\nsecond line");
    await expect(field(root)).toHaveValue("");
    await expect(field(root)).toBeFocused();
  });

  test("Enter while the reply streams sends nothing", async ({ page }) => {
    const root = await gotoStory(page, story("conversation"));
    await field(root).focus();
    await page.keyboard.type("one");
    await page.keyboard.press("Enter");
    await expect(stop(root)).toBeVisible();
    await page.keyboard.type("two");
    await page.keyboard.press("Enter");
    await expect(mine(root)).toHaveCount(1);
    await expect(field(root)).toHaveValue("two");
  });
});

test("the first message replaces the empty state", async ({ page }) => {
  const root = await gotoStory(page, story("empty"));
  await expect(root.locator("pl-empty")).toContainText("Start a conversation");
  await expect(scroller(root)).toHaveCount(0);
  await field(root).fill("Hello");
  await send(root).click();
  await expect(root.locator("pl-empty")).toHaveCount(0);
  await expect(mine(root)).toHaveCount(1);
  await expect(field(root)).toHaveValue("");
});

test("under rtl the person's messages sit at the left", async ({ page }) => {
  const root = await gotoStory(page, story("rtl"));
  const frame = (await root.locator("chat-demo").boundingBox())!;
  const own = (await root
    .locator("pl-bubble", { hasText: "Thanks, that is clearer." })
    .boundingBox())!;
  expect(own.x - frame.x).toBeLessThan(
    frame.x + frame.width - (own.x + own.width),
  );
});

test("reduced motion and forced colors keep the demo usable", async ({
  page,
}) => {
  const root = await gotoStory(page, story("conversation"));
  await page.emulateMedia({ reducedMotion: "reduce", forcedColors: "active" });
  await field(root).fill("Hi");
  await send(root).click();
  await expect(mine(root)).toHaveCount(1);
  await expect(stop(root)).toBeVisible();
});

test.describe("coarse pointer on a wide screen", () => {
  test.use({ viewport: { width: 1440, height: 900 }, hasTouch: true });

  test("Send keeps a 44 by 44 hit area", async ({ page }) => {
    const root = await gotoStory(page, story("conversation"));
    const box = (await send(root).boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
  });
});
