import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
} from "../../../e2e/helpers/a11y.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";
import type { PlMessageScroller } from "./message-scroller.ts";

const story = (name: string) => `ai-chat-message-scroller--${name}`;

const scroller = (page: Page) => page.locator("#scroller");

const latest = (page: Page) =>
  scroller(page).getByRole("button", { name: "Scroll to latest" });

/** Pixels left to scroll before the end. */
const toEnd = (el: Locator) =>
  el.evaluate((e) => e.scrollHeight - e.clientHeight - e.scrollTop);

/** Two frames: enough for scroll events, observers and slot changes to run. */
const frames = (page: Page) =>
  page.evaluate(async () => {
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
  });

/** How far a row's top is below the top of the viewport. */
const rowTop = (el: Locator, id: string) =>
  el.evaluate((e, id) => {
    const row = e.querySelector(`[message-id="${id}"]`)!;
    return (
      row.getBoundingClientRect().top -
      e.getBoundingClientRect().top -
      e.clientTop
    );
  }, id);

/** The peek the scroller leaves above an anchor, in pixels. */
const peekOf = (el: Locator) =>
  el.evaluate((e) => parseFloat(getComputedStyle(e).scrollPaddingBlockStart));

/** Appends rows of `lines` one-line paragraphs, in one task, so they arrive as one change. */
const append = (
  el: Locator,
  rows: { id: string; lines: number; anchor?: boolean }[],
) =>
  el.evaluate((e, rows) => {
    e.append(
      ...rows.map((row) => {
        const item = document.createElement("pl-message-scroller-item");
        item.setAttribute("message-id", row.id);
        if (row.anchor) item.setAttribute("scroll-anchor", "");
        for (let i = 0; i < row.lines; i++) {
          const p = document.createElement("p");
          p.style.margin = "0";
          p.textContent = `${row.id} line ${i + 1}`;
          item.append(p);
        }
        return item;
      }),
    );
  }, rows);

/** Adds lines to the last row, as a streamed reply does. */
const grow = (el: Locator, lines = 10) =>
  el.evaluate((e, lines) => {
    const last = [...e.children].filter((c) => !c.hasAttribute("slot")).at(-1)!;
    for (let i = 0; i < lines; i++) {
      const p = document.createElement("p");
      p.style.margin = "0";
      p.textContent = `Streamed line ${i + 1}`;
      last.append(p);
    }
  }, lines);

/** The two fade lengths the mask reads, in pixels. */
const fades = (el: Locator) =>
  el.evaluate((e) => {
    const style = getComputedStyle(e);
    return {
      start: parseFloat(style.getPropertyValue("--_ms-fade-start")),
      end: parseFloat(style.getPropertyValue("--_ms-fade-end")),
    };
  });

test("aria snapshot", async ({ page }) => {
  const root = await gotoStory(page, story("short"));
  await expect(root).toMatchAriaSnapshot(`
    - region "Messages":
      - log:
        - paragraph: /You, message 1/
        - paragraph: /Assistant, message 2/
  `);
});

test("the host is a named region and a tab stop", async ({ page }) => {
  const root = await gotoStory(page, story("default"));
  await expect(root.getByRole("region", { name: "Messages" })).toHaveCount(1);
  await expect(scroller(page)).toHaveAttribute("tabindex", "0");
});

test("label names the region and no label drops the role", async ({ page }) => {
  const root = await gotoStory(page, story("default"));
  await scroller(page).evaluate((el) => el.setAttribute("label", "Chat"));
  await expect(root.getByRole("region", { name: "Chat" })).toHaveCount(1);
  await scroller(page).evaluate((el) => el.removeAttribute("label"));
  await expect(scroller(page)).not.toHaveAttribute("role");
});

test("the log announces additions and is busy only while a reply streams", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  const log = () =>
    scroller(page).evaluate((el) => {
      const part = el.shadowRoot!.querySelector("[part=log]")!;
      return {
        role: part.getAttribute("role"),
        relevant: part.getAttribute("aria-relevant"),
        busy: part.getAttribute("aria-busy"),
      };
    });
  expect(await log()).toEqual({
    role: "log",
    relevant: "additions",
    busy: "false",
  });
  await scroller(page).evaluate((el) => el.setAttribute("busy", ""));
  await expect.poll(log).toEqual({
    role: "log",
    relevant: "additions",
    busy: "true",
  });
});

test("a story with busy starts with a busy log", async ({ page }) => {
  await gotoStory(page, story("streaming"));
  expect(
    await scroller(page).evaluate((el) =>
      el.shadowRoot!.querySelector("[part=log]")!.getAttribute("aria-busy"),
    ),
  ).toBe("true");
});

test("rows are skipped when far from the viewport", async ({ page }) => {
  await gotoStory(page, story("default"));
  expect(
    await scroller(page)
      .locator("pl-message-scroller-item")
      .first()
      .evaluate((el) => getComputedStyle(el).contentVisibility),
  ).toBe("auto");
});

test("scrolling is native: the keyboard scrolls the focused region", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  const el = scroller(page);
  await el.focus();
  await page.keyboard.press("PageDown");
  await expect.poll(() => el.evaluate((e) => e.scrollTop)).toBeGreaterThan(0);
  await page.keyboard.press("End");
  await expect.poll(() => toEnd(el)).toBeLessThan(2);
});

test("data-scrollable lists the edges that can still be scrolled toward", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  const el = scroller(page);
  await expect(el).toHaveAttribute("data-scrollable", "end");
  await el.evaluate((e) => (e.scrollTop = 200));
  await expect(el).toHaveAttribute("data-scrollable", "start end");
  await el.evaluate((e) => (e.scrollTop = e.scrollHeight));
  await expect(el).toHaveAttribute("data-scrollable", "start");
});

test("content that fits has no data-scrollable", async ({ page }) => {
  await gotoStory(page, story("short"));
  await frames(page);
  await expect(scroller(page)).not.toHaveAttribute("data-scrollable");
});

test("pl-scroll fires when an edge changes and not on every scroll", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  const el = scroller(page);
  await el.evaluate((e) => {
    const w = window as never as { scrolls: unknown[] };
    w.scrolls = [];
    e.addEventListener("pl-scroll", (event) =>
      w.scrolls.push((event as CustomEvent).detail),
    );
  });
  for (const top of [100, 150, 200]) {
    await el.evaluate((e, top) => (e.scrollTop = top), top);
    await frames(page);
  }
  expect(
    await page.evaluate(
      () => (window as never as { scrolls: unknown[] }).scrolls,
    ),
  ).toEqual([{ start: true, end: true }]);
});

test.describe("fades", () => {
  test("the edges fade where there is more to see", async ({ page }) => {
    // Reduced motion uses the static fades, which the same lengths carry.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await gotoStory(page, story("default"));
    const el = scroller(page);
    const shown = async () => {
      const { start, end } = await fades(el);
      return [start > 0, end > 0];
    };
    await expect.poll(shown).toEqual([false, true]);
    await el.evaluate((e) => (e.scrollTop = 200));
    await expect.poll(shown).toEqual([true, true]);
    await el.evaluate((e) => (e.scrollTop = e.scrollHeight));
    await expect.poll(shown).toEqual([true, false]);
  });

  test("the fades do not animate", async ({ page }) => {
    await gotoStory(page, story("default"));
    expect(
      await scroller(page).evaluate((e) => getComputedStyle(e).animationName),
    ).toBe("none");
  });

  test("forced colors draw no mask", async ({ page }) => {
    await gotoStory(page, story("default"));
    await page.emulateMedia({ forcedColors: "active" });
    expect(
      await scroller(page).evaluate((e) => getComputedStyle(e).maskImage),
    ).toBe("none");
  });
});

test.describe("methods", () => {
  test("scrollToMessage puts the message below the previous item's peek", async ({
    page,
  }) => {
    await gotoStory(page, story("default"));
    const el = scroller(page);
    const peek = await peekOf(el);
    expect(peek).toBeGreaterThan(0);
    expect(
      await el.evaluate((e) =>
        (e as PlMessageScroller).scrollToMessage("m10", {
          behavior: "instant",
        }),
      ),
    ).toBe(true);
    await expect
      .poll(async () => Math.abs((await rowTop(el, "m10")) - peek) < 2)
      .toBe(true);
  });

  test("scrollToMessage aligns to the end and the center", async ({ page }) => {
    await gotoStory(page, story("default"));
    const el = scroller(page);
    await el.evaluate((e) =>
      (e as PlMessageScroller).scrollToMessage("m10", {
        align: "end",
        behavior: "instant",
      }),
    );
    await expect
      .poll(() =>
        el.evaluate((e) => {
          const box = e
            .querySelector('[message-id="m10"]')!
            .getBoundingClientRect();
          return (
            Math.abs(
              box.bottom - e.getBoundingClientRect().top - e.clientHeight,
            ) < 2
          );
        }),
      )
      .toBe(true);
    await el.evaluate((e) =>
      (e as PlMessageScroller).scrollToMessage("m10", {
        align: "center",
        behavior: "instant",
      }),
    );
    await expect
      .poll(() =>
        el.evaluate((e) => {
          const box = e
            .querySelector('[message-id="m10"]')!
            .getBoundingClientRect();
          const middle =
            box.top + box.height / 2 - e.getBoundingClientRect().top;
          return Math.abs(middle - e.clientHeight / 2) < 2;
        }),
      )
      .toBe(true);
  });

  test("scrollToMessage returns false for an unknown message", async ({
    page,
  }) => {
    await gotoStory(page, story("default"));
    expect(
      await scroller(page).evaluate((e) =>
        (e as PlMessageScroller).scrollToMessage("nope"),
      ),
    ).toBe(false);
  });

  test("scrollToEnd and scrollToStart return whether they moved", async ({
    page,
  }) => {
    await gotoStory(page, story("default"));
    const result = await scroller(page).evaluate((e) => {
      const s = e as PlMessageScroller;
      const options = { behavior: "instant" } as const;
      return [
        s.scrollToStart(options),
        s.scrollToEnd(options),
        s.scrollToEnd(options),
        s.scrollToStart(options),
        s.scrollToStart(options),
      ];
    });
    expect(result).toEqual([false, true, false, true, false]);
  });

  test("scrollToEnd on content that fits returns false", async ({ page }) => {
    await gotoStory(page, story("short"));
    expect(
      await scroller(page).evaluate((e) =>
        (e as PlMessageScroller).scrollToEnd(),
      ),
    ).toBe(false);
  });

  test("reduced motion makes a smooth scroll a jump", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await gotoStory(page, story("default"));
    expect(
      await scroller(page).evaluate((e) => {
        (e as PlMessageScroller).scrollToMessage("m10");
        return e.scrollTop;
      }),
    ).toBeGreaterThan(0);
  });

  test("a numeric peek replaces the default", async ({ page }) => {
    await gotoStory(page, story("peek"));
    const el = scroller(page);
    await el.evaluate((e) =>
      (e as PlMessageScroller).scrollToMessage("m10", { behavior: "instant" }),
    );
    await expect
      .poll(async () => Math.abs((await rowTop(el, "m10")) - 16) < 2)
      .toBe(true);
  });
});

test.describe("placement", () => {
  test("it never scrolls by itself: a row without scroll-anchor leaves the position alone", async ({
    page,
  }) => {
    await gotoStory(page, story("default"));
    const el = scroller(page);
    await el.evaluate((e) => (e.scrollTop = e.scrollHeight));
    await frames(page);
    const before = await el.evaluate((e) => e.scrollTop);
    await append(el, [{ id: "plain", lines: 5 }]);
    await frames(page);
    // The view stays put, so the new row waits below the end.
    expect(
      Math.abs((await el.evaluate((e) => e.scrollTop)) - before),
    ).toBeLessThan(1);
    expect(await toEnd(el)).toBeGreaterThan(0);
  });

  test("default-scroll-position end opens at the latest message", async ({
    page,
  }) => {
    await gotoStory(page, story("start-at-end"));
    await expect.poll(() => toEnd(scroller(page))).toBeLessThan(2);
  });

  test("default-scroll-position last-anchor opens at the last anchor with a peek", async ({
    page,
  }) => {
    await gotoStory(page, story("last-anchor"));
    const el = scroller(page);
    const peek = await peekOf(el);
    await expect
      .poll(async () => Math.abs((await rowTop(el, "last")) - peek) < 2)
      .toBe(true);
    expect(await toEnd(el)).toBeGreaterThan(10);
  });

  test("the default position is applied once, on the first non-empty render", async ({
    page,
  }) => {
    await gotoStory(page, story("start-at-end"));
    const el = scroller(page);
    await expect.poll(() => toEnd(el)).toBeLessThan(2);
    await el.evaluate((e) => (e.scrollTop = 0));
    await append(el, [{ id: "more", lines: 3 }]);
    await frames(page);
    expect(await el.evaluate((e) => e.scrollTop)).toBe(0);
  });

  test("a scroll-anchor row added at the end lands near the top below the peek", async ({
    page,
  }) => {
    await gotoStory(page, story("default"));
    const el = scroller(page);
    const peek = await peekOf(el);
    await el.evaluate((e) => (e.scrollTop = e.scrollHeight));
    await frames(page);
    await append(el, [
      { id: "question", lines: 1, anchor: true },
      { id: "answer", lines: 30 },
    ]);
    await expect
      .poll(async () => Math.abs((await rowTop(el, "question")) - peek) < 2)
      .toBe(true);
  });

  test("an anchor holds its place while its reply streams without auto-scroll", async ({
    page,
  }) => {
    await gotoStory(page, story("default"));
    const el = scroller(page);
    const peek = await peekOf(el);
    await el.evaluate((e) => (e.scrollTop = e.scrollHeight));
    await frames(page);
    await append(el, [
      { id: "question", lines: 1, anchor: true },
      { id: "answer", lines: 30 },
    ]);
    await expect
      .poll(async () => Math.abs((await rowTop(el, "question")) - peek) < 2)
      .toBe(true);
    await grow(el, 20);
    await frames(page);
    expect(Math.abs((await rowTop(el, "question")) - peek)).toBeLessThan(2);
  });

  test("older rows added before the first keep the visible rows where they are", async ({
    page,
  }) => {
    await gotoStory(page, story("default"));
    const el = scroller(page);
    await el.evaluate((e) => (e.scrollTop = 300));
    await frames(page);
    const before = await rowTop(el, "m10");
    await el.evaluate((e) => {
      const rows = Array.from({ length: 5 }, (_, i) => {
        const item = document.createElement("pl-message-scroller-item");
        item.setAttribute("message-id", `old${i}`);
        item.textContent = `Older message ${i}`;
        return item;
      });
      e.prepend(...rows);
    });
    await frames(page);
    expect(Math.abs((await rowTop(el, "m10")) - before)).toBeLessThan(2);
  });
});

test.describe("auto-scroll", () => {
  test("follows streamed content while the reader is at the end", async ({
    page,
  }) => {
    await gotoStory(page, story("streaming"));
    const el = scroller(page);
    await expect.poll(() => toEnd(el)).toBeLessThan(2);
    await grow(el);
    await expect.poll(() => toEnd(el)).toBeLessThan(2);
  });

  test("the wheel lets go and scrollToEnd takes hold again", async ({
    page,
  }) => {
    await gotoStory(page, story("streaming"));
    const el = scroller(page);
    await expect.poll(() => toEnd(el)).toBeLessThan(2);
    await el.hover();
    await page.mouse.wheel(0, -300);
    await expect.poll(() => toEnd(el)).toBeGreaterThan(100);
    await grow(el);
    await frames(page);
    expect(await toEnd(el)).toBeGreaterThan(100);
    await el.evaluate((e) =>
      (e as PlMessageScroller).scrollToEnd({ behavior: "instant" }),
    );
    await grow(el);
    await expect.poll(() => toEnd(el)).toBeLessThan(2);
  });

  test("a scroll key lets go", async ({ page }) => {
    await gotoStory(page, story("streaming"));
    const el = scroller(page);
    await expect.poll(() => toEnd(el)).toBeLessThan(2);
    await el.focus();
    await page.keyboard.press("PageUp");
    await expect.poll(() => toEnd(el)).toBeGreaterThan(50);
    await grow(el);
    await frames(page);
    expect(await toEnd(el)).toBeGreaterThan(50);
  });

  test("selecting text lets go", async ({ page }) => {
    await gotoStory(page, story("streaming"));
    const el = scroller(page);
    await expect.poll(() => toEnd(el)).toBeLessThan(2);
    await el.evaluate((e) => {
      const range = document.createRange();
      range.selectNodeContents(e.lastElementChild!);
      const selection = getSelection()!;
      selection.removeAllRanges();
      selection.addRange(range);
    });
    await frames(page);
    await grow(el);
    await frames(page);
    expect(await toEnd(el)).toBeGreaterThan(50);
  });

  test("an anchor holds near the end until its reply fills the viewport, then the view follows", async ({
    page,
  }) => {
    await gotoStory(page, story("streaming"));
    const el = scroller(page);
    await expect.poll(() => toEnd(el)).toBeLessThan(2);
    await append(el, [
      { id: "question", lines: 1, anchor: true },
      { id: "answer", lines: 1 },
    ]);
    await expect.poll(() => toEnd(el)).toBeLessThan(2);
    await grow(el, 40);
    await expect.poll(() => toEnd(el)).toBeLessThan(2);
    expect(await rowTop(el, "question")).toBeLessThan(0);
  });
});

test.describe("button", () => {
  test("it is drawn while there is more below and scrolls to the end", async ({
    page,
  }) => {
    await gotoStory(page, story("default"));
    const el = scroller(page);
    await expect(latest(page)).toBeVisible();
    await latest(page).click();
    await expect.poll(() => toEnd(el)).toBeLessThan(2);
    await expect(el.locator("pl-message-scroller-button")).toHaveAttribute(
      "data-active",
      "false",
    );
  });

  test("it is inert when there is nothing to scroll to", async ({ page }) => {
    await gotoStory(page, story("short"));
    const button = scroller(page).locator("pl-message-scroller-button");
    await expect(button).toHaveAttribute("inert", "");
    await expect(button).toHaveAttribute("data-active", "false");
  });

  test("it becomes active when content grows past the viewport", async ({
    page,
  }) => {
    await gotoStory(page, story("short"));
    const button = scroller(page).locator("pl-message-scroller-button");
    await append(scroller(page), [{ id: "long", lines: 40 }]);
    await expect(button).toHaveAttribute("data-active", "true");
    await expect(button).not.toHaveAttribute("inert");
  });

  test("after it is pressed, focus moves to the scroller", async ({ page }) => {
    await gotoStory(page, story("default"));
    await latest(page).click();
    await expect(scroller(page)).toBeFocused();
  });

  test("the keyboard reaches it after the region and Enter scrolls to the end", async ({
    page,
  }) => {
    await gotoStory(page, story("default"));
    await scroller(page).focus();
    await page.keyboard.press("Tab");
    await expect(latest(page)).toBeFocused();
    await page.keyboard.press("Enter");
    await expect.poll(() => toEnd(scroller(page))).toBeLessThan(2);
    await expect(scroller(page)).toBeFocused();
  });

  test("button-label names the built-in button", async ({ page }) => {
    await gotoStory(page, story("default"));
    await scroller(page).evaluate((el) =>
      el.setAttribute("button-label", "Newest"),
    );
    await expect(
      scroller(page).getByRole("button", { name: "Newest" }),
    ).toBeVisible();
  });

  test("a button in the button slot replaces the built-in one", async ({
    page,
  }) => {
    await gotoStory(page, story("custom-button"));
    const el = scroller(page);
    await expect(
      el.getByRole("button", { name: "Jump to the newest message" }),
    ).toBeVisible();
    await expect(latest(page)).toHaveCount(0);
    await el
      .getByRole("button", { name: "Jump to the newest message" })
      .click();
    await expect.poll(() => toEnd(el)).toBeLessThan(2);
  });
});

test("message-scroller: jump button does not cover text", async ({ page }) => {
  await gotoStory(page, story("default"));
  const [padding, button] = await Promise.all([
    scroller(page).evaluate((e) =>
      parseFloat(getComputedStyle(e).scrollPaddingBlockEnd),
    ),
    latest(page).boundingBox(),
  ]);
  // Content scrolled to the end stops above the button, which is as tall as it.
  expect(Math.abs(padding - button!.height)).toBeLessThan(1);
});

test("the button sits at the center under rtl and the region scrolls", async ({
  page,
}) => {
  await gotoStory(page, story("rtl"));
  const el = scroller(page);
  const host = (await el.boundingBox())!;
  const button = (await latest(page).boundingBox())!;
  // The scrollbar shifts the middle of the client area by half its width.
  expect(
    Math.abs(button.x + button.width / 2 - (host.x + host.width / 2)),
  ).toBeLessThan(16);
  await el.evaluate((e) =>
    (e as PlMessageScroller).scrollToMessage("m10", { behavior: "instant" }),
  );
  await expect.poll(() => el.evaluate((e) => e.scrollTop)).toBeGreaterThan(0);
});

test("the focus ring is visible under forced colors", async ({ page }) => {
  await gotoStory(page, story("default"));
  await page.emulateMedia({ forcedColors: "active" });
  await scroller(page).focus();
  expect(
    await scroller(page).evaluate((e) => getComputedStyle(e).outlineStyle),
  ).not.toBe("none");
});

test("the focus ring is not faded by the edge mask", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await gotoStory(page, story("default"));
  const el = scroller(page);
  await el.evaluate((e) => (e.scrollTop = 200));
  const mask = () => el.evaluate((e) => getComputedStyle(e).maskImage);
  const plain = await mask();
  await el.focus();
  // The ring's own width is kept opaque, so the mask differs from the faded one.
  await expect.poll(mask).not.toBe(plain);
});

test("axe finds no WCAG 2.2 AA violations", async ({ page }) => {
  await expectAccessible(await gotoStory(page, story("default")));
});

test("no horizontal overflow at 200% text zoom", async ({ page }) => {
  await expectNoOverflowAtTextZoom(await gotoStory(page, story("default")));
});

test.describe("coarse pointer on a wide screen", () => {
  test.use({ viewport: { width: 1440, height: 900 }, hasTouch: true });

  test("the scroll-to-end button is at least 44 by 44", async ({ page }) => {
    await gotoStory(page, story("default"));
    const box = (await latest(page).boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
  });
});
