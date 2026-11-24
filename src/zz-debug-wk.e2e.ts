import { test } from "@playwright/test";
import { gotoStory } from "../e2e/helpers/story.ts";

// Temporary diagnostics, not committed to the PR branch.
test("debug mail badge boxes", async ({ page }) => {
  await gotoStory(page, "patterns-mail--default", "theme:light");
  await page.evaluate(() => document.fonts.ready);
  const info = await page.evaluate(() => {
    const host = document.querySelector("mail-demo")!;
    const root = host.shadowRoot!;
    const r = (el: Element | null | undefined) => {
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return [Math.round(b.left), Math.round(b.right), Math.round(b.width)];
    };
    const badge = root.querySelector("pl-badge[slot=detail]");
    const item = badge?.parentElement;
    const panel = root.querySelector("pl-resizable-panel");
    const folders = root.querySelector(".folders");
    const sidebar = root.querySelector("pl-sidebar");
    const cs = (el: Element | null | undefined) =>
      el ? getComputedStyle(el) : null;
    return {
      badge: r(badge),
      badgeBg: cs(badge)?.backgroundColor,
      item: r(item),
      itemScroll: item ? [item.scrollWidth, item.clientWidth] : null,
      sidebar: r(sidebar),
      sidebarScroll: sidebar
        ? [sidebar.scrollWidth, sidebar.clientWidth]
        : null,
      folders: r(folders),
      panel: r(panel),
      panelOverflow: cs(panel)?.overflow,
    };
  });
  console.log("MAIL", JSON.stringify(info));
});

test("debug chat streaming scroll", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await gotoStory(page, "patterns-chat--streaming", "theme:light");
  await page.evaluate(() => document.fonts.ready);
  const sample = () =>
    page.evaluate(() => {
      const demo = document.querySelector("chat-demo")!.shadowRoot!;
      const scroller = demo.querySelector("pl-message-scroller") as HTMLElement;
      const inner = scroller.shadowRoot?.querySelector("[part=scroller]") as
        HTMLElement | undefined;
      const bubble = demo.querySelector("pl-bubble[align=end]");
      const b = bubble?.getBoundingClientRect();
      return {
        top: inner?.scrollTop ?? scroller.scrollTop,
        height: inner?.scrollHeight,
        bubbleTop: b ? Math.round(b.top) : null,
        bubbleBg: bubble ? getComputedStyle(bubble).backgroundColor : null,
      };
    });
  const a = await sample();
  await page.waitForTimeout(300);
  const b = await sample();
  await page.waitForTimeout(1500);
  const c = await sample();
  console.log("CHAT", JSON.stringify({ a, b, c }));
});
