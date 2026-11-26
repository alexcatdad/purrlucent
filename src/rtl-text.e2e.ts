import { expect, test, type Page } from "@playwright/test";
import { gotoStory } from "../e2e/helpers/story.ts";

test("the Components reference remains LTR after viewing an RTL story", async ({
  page,
}) => {
  await page.goto("/?path=/story/foundations-surfaces--glass");
  const preview = page.frameLocator("#storybook-preview-iframe");
  await expect(preview.locator("#storybook-root")).toHaveCSS(
    "direction",
    "rtl",
  );

  await page.getByRole("row", { name: "Components reference" }).press("Enter");
  await expect(
    preview.getByRole("heading", { name: "Components", exact: true }),
  ).toHaveCSS("direction", "ltr");
});

/** Right-to-left stories that hold English sentences. */
const STORIES = [
  "feedback-banner--rtl",
  "ai-chat-message--rtl",
  "cards-lists-card--rtl",
  "feedback-empty--rtl",
  "forms-field--rtl",
  "navigation-tabs--rtl",
  "dialogs-dialog--rtl",
  "dialogs-drawer--rtl",
  "dialogs-hover-card--rtl",
  "menus-context-menu--rtl",
  "patterns-chat--rtl",
  "patterns-settings--rtl",
  "patterns-sign-in--rtl",
  "patterns-mail--rtl",
  "foundations-typography--rtl",
];

/**
 * Every English sentence (one text node that starts with a Latin letter and
 * ends with . ? or !) in the page and in every open shadow root, as the
 * x of its first and last letter and whether both sit on one line. Hidden text
 * (no box) is left out.
 */
const sentences = (page: Page) =>
  page.evaluate(() => {
    const out: { text: string; first: number; last: number; line: boolean }[] =
      [];
    const walk = (root: Document | ShadowRoot | Element) => {
      const texts = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      for (let node = texts.nextNode(); node; node = texts.nextNode()) {
        const value = node.textContent ?? "";
        const start = value.search(/\S/);
        const end = value.trimEnd().length - 1;
        // Line breaks in the source count as spaces.
        const text = value.slice(start, end + 1).replace(/\s+/g, " ");
        if (
          start < 0 ||
          text.length < 8 ||
          !/^[A-Za-z][\x20-\x7E’“”]*[.?!]$/.test(text)
        )
          continue;
        const rect = (at: number) => {
          const range = document.createRange();
          range.setStart(node, at);
          range.setEnd(node, at + 1);
          return range.getBoundingClientRect();
        };
        const first = rect(start);
        const last = rect(end);
        if (!first.width || !last.width) continue;
        out.push({
          text,
          first: first.left,
          last: last.left,
          line: Math.abs(first.top - last.top) < 2,
        });
      }
      for (const el of root.querySelectorAll("*"))
        if (el.shadowRoot) walk(el.shadowRoot);
    };
    walk(document);
    return out;
  });

/** Whole screens: their sentences show only as the demo is used, so none is required. */
const SCREENS = ["patterns-settings--rtl", "patterns-sign-in--rtl"];

for (const id of STORIES)
  test(`rtl stories: English sentences end with their period (${id})`, async ({
    page,
  }) => {
    await gotoStory(page, id);
    // An open dialog or drawer shows after the story's play function ran.
    if (!SCREENS.includes(id))
      await expect
        .poll(async () => (await sentences(page)).length, {
          message: "the story shows an English sentence",
        })
        .toBeGreaterThan(0);
    // A sentence on one line reads left to right: its last letter is the rightmost.
    for (const s of (await sentences(page)).filter((s) => s.line))
      expect(s.last, s.text).toBeGreaterThan(s.first);
  });
