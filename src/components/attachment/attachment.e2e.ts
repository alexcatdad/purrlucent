import { expect, test } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
} from "../../../e2e/helpers/a11y.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";

const story = (name: string) => `cards-lists-attachment--${name}`;

test("aria snapshot of a link card", async ({ page }) => {
  const root = await gotoStory(page, story("link"));
  await expect(root).toMatchAriaSnapshot(`
    - link "Quarterly report.pdf":
      - /url: "#report"
    - text: PDF, 2.4 MB
    - button "Remove Quarterly report.pdf"
  `);
});

for (const name of [
  "default",
  "states",
  "link",
  "vertical",
  "group",
  "group-presentational",
]) {
  test(`${name} has no axe violations`, async ({ page }) => {
    await expectAccessible(await gotoStory(page, story(name)));
  });
}

test("without an href or clickable there is no link or card button", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await expect(page.getByRole("link")).toHaveCount(0);
  await expect(page.getByRole("button")).toHaveCount(1);
  await expect(page.getByText("Quarterly report.pdf")).toBeVisible();
});

test("a click anywhere on a link card follows the link", async ({ page }) => {
  await gotoStory(page, story("link"));
  const box = (await page.locator("pl-attachment").boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height - 4);
  expect(new URL(page.url()).hash).toBe("#report");
});

test("clicking the action does not follow the link", async ({ page }) => {
  await gotoStory(page, story("link"));
  await page
    .getByRole("button", { name: "Remove Quarterly report.pdf" })
    .click();
  expect(new URL(page.url()).hash).toBe("");
});

test("a link card has one tab stop for the link and one for the action", async ({
  page,
}) => {
  await gotoStory(page, story("link"));
  await page.getByRole("link").focus();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Remove Quarterly report.pdf" }),
  ).toBeFocused();
});

test.describe("a clickable card", () => {
  const listen = (page: import("@playwright/test").Page) =>
    page.locator("#clickable").evaluate((el) => {
      el.addEventListener("pl-press", () =>
        el.setAttribute(
          "data-presses",
          String(Number(el.getAttribute("data-presses") ?? 0) + 1),
        ),
      );
    });

  test("a click anywhere on the card fires pl-press once", async ({ page }) => {
    await gotoStory(page, story("clickable"));
    await listen(page);
    const box = (await page.locator("#clickable").boundingBox())!;
    await page.mouse.click(box.x + box.width / 2, box.y + box.height - 4);
    await expect(page.locator("#clickable")).toHaveAttribute(
      "data-presses",
      "1",
    );
  });

  test("Enter and Space on the button fire pl-press", async ({ page }) => {
    await gotoStory(page, story("clickable"));
    await listen(page);
    await page
      .getByRole("button", { name: "Quarterly report.pdf", exact: true })
      .focus();
    await page.keyboard.press("Enter");
    await page.keyboard.press("Space");
    await expect(page.locator("#clickable")).toHaveAttribute(
      "data-presses",
      "2",
    );
  });

  test("the action does not fire pl-press", async ({ page }) => {
    await gotoStory(page, story("clickable"));
    await listen(page);
    await page
      .getByRole("button", { name: "Remove Quarterly report.pdf" })
      .click();
    await expect(page.locator("#clickable")).not.toHaveAttribute(
      "data-presses",
      /.*/,
    );
  });
});

test("the focus ring is visible on the card, also under forced colors", async ({
  page,
}) => {
  await gotoStory(page, story("link"));
  await page.emulateMedia({ forcedColors: "active" });
  await page.getByRole("link").focus();
  const style = await page.locator("pl-attachment").evaluate((el) => {
    const a = el.shadowRoot!.querySelector("a")!;
    return getComputedStyle(a, "::after").outlineStyle;
  });
  expect(style).not.toBe("none");
});

test("the media sits before the text and the actions after it", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  const media = (await page.locator("svg[slot=media]").boundingBox())!;
  const text = (await page.locator("[slot=title]").boundingBox())!;
  const action = (await page.getByRole("button").boundingBox())!;
  expect(media.x).toBeLessThan(text.x);
  expect(action.x).toBeGreaterThan(text.x);
});

test("under rtl the media sits at the right edge", async ({ page }) => {
  await gotoStory(page, story("rtl"));
  const card = (await page.locator("pl-attachment").boundingBox())!;
  const media = (await page.locator("svg[slot=media]").boundingBox())!;
  expect(media.x - card.x).toBeGreaterThan(card.width / 2);
});

test("an image fills the media tile", async ({ page }) => {
  await gotoStory(page, story("image"));
  const sizes = await page.locator("pl-attachment").evaluate((el) => {
    const tile = el
      .shadowRoot!.querySelector("[part=media]")!
      .getBoundingClientRect();
    const image = el.querySelector("img")!.getBoundingClientRect();
    return {
      tile: tile.width,
      image: image.width,
      tileH: tile.height,
      imageH: image.height,
    };
  });
  expect(sizes.image).toBeCloseTo(sizes.tile, 0);
  expect(sizes.imageH).toBeCloseTo(sizes.tileH, 0);
});

test("empty media and action sections are hidden", async ({ page }) => {
  await gotoStory(page, story("title-only"));
  const hidden = () =>
    page.locator("pl-attachment").evaluate((el) => ({
      media: el.shadowRoot!.querySelector<HTMLElement>("[part=media]")!.hidden,
      actions:
        el.shadowRoot!.querySelector<HTMLElement>("[part=actions]")!.hidden,
    }));
  await expect.poll(hidden).toEqual({ media: true, actions: true });
});

test("sizes shrink from default to sm to xs", async ({ page }) => {
  await gotoStory(page, story("sizes"));
  const height = async (id: string) =>
    (await page.locator(`#size-${id}`).boundingBox())!.height;
  const [d, sm, xs] = [
    await height("default"),
    await height("sm"),
    await height("xs"),
  ];
  expect(d).toBeGreaterThan(sm);
  expect(sm).toBeGreaterThan(xs);
});

test("a vertical card puts the media above the text", async ({ page }) => {
  await gotoStory(page, story("vertical"));
  const media = (await page.locator("img[slot=media]").boundingBox())!;
  const title = (await page.locator("[slot=title]").boundingBox())!;
  const card = (await page.locator("pl-attachment").boundingBox())!;
  expect(media.y + media.height).toBeLessThanOrEqual(title.y);
  expect(media.width).toBeGreaterThan(card.width / 2);
});

test.describe("states", () => {
  const titleStyle = (page: import("@playwright/test").Page, id: string) =>
    page.locator(`#state-${id}`).evaluate((el) => {
      const style = getComputedStyle(
        el.shadowRoot!.querySelector("[part=title]")!,
      );
      return { animation: style.animationName, mask: style.maskImage };
    });

  test("uploading and processing shimmer the title with motion allowed", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await gotoStory(page, story("states"));
    for (const id of ["uploading", "processing"]) {
      expect((await titleStyle(page, id)).animation).toBe(
        "pl-attachment-shimmer",
      );
    }
    for (const id of ["idle", "error", "done"]) {
      expect((await titleStyle(page, id)).animation).toBe("none");
    }
  });

  test("the shimmer moves", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await gotoStory(page, story("states"));
    const position = () =>
      page
        .locator("#state-uploading")
        .evaluate(
          (el) =>
            getComputedStyle(el.shadowRoot!.querySelector("[part=title]")!)
              .maskPosition,
        );
    const first = await position();
    await page.waitForTimeout(300);
    expect(await position()).not.toBe(first);
  });

  test("under reduced motion the shimmer stops", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await gotoStory(page, story("states"));
    expect(await titleStyle(page, "uploading")).toEqual({
      animation: "none",
      mask: "none",
    });
  });

  test("the shimmer is mirrored under rtl", async ({ page }) => {
    await gotoStory(page, story("states"));
    await page.evaluate(() => (document.documentElement.dir = "rtl"));
    await expect
      .poll(() =>
        page
          .locator("#state-uploading")
          .evaluate(
            (el) =>
              getComputedStyle(el.shadowRoot!.querySelector("[part=title]")!)
                .animationDirection,
          ),
      )
      .toBe("reverse");
  });

  test("an error uses the destructive edge and text, and keeps the reason", async ({
    page,
  }) => {
    await gotoStory(page, story("states"));
    const colors = (id: string) =>
      page.locator(`#state-${id}`).evaluate((el) => ({
        edge: getComputedStyle(el).borderTopColor,
        reason: getComputedStyle(el.querySelector("[slot=description]")!).color,
        title: getComputedStyle(el.shadowRoot!.querySelector("[part=label]")!)
          .color,
      }));
    const error = await colors("error");
    const done = await colors("done");
    expect(error.edge).not.toBe(done.edge);
    expect(error.reason).not.toBe(done.reason);
    expect(error.title).not.toBe(done.title);
    await expect(
      page.getByText("File is too large. The limit is 10 MB."),
    ).toBeVisible();
  });

  test("an error keeps a visible edge under forced colors", async ({
    page,
  }) => {
    await gotoStory(page, story("states"));
    await page.emulateMedia({ forcedColors: "active" });
    const style = await page
      .locator("#state-error")
      .evaluate((el) => getComputedStyle(el).borderTopStyle);
    expect(style).toBe("dashed");
  });

  test("uploading and processing are busy and add a hidden status word", async ({
    page,
  }) => {
    await gotoStory(page, story("states"));
    const status = (id: string) =>
      page
        .locator(`#state-${id}`)
        .evaluate(
          (el) =>
            el.shadowRoot!.querySelector("[part=status]")?.textContent ?? null,
        );
    expect(await status("uploading")).toBe("Uploading");
    expect(await status("processing")).toBe("Processing");
    expect(await status("error")).toBe("Error");
    expect(await status("done")).toBeNull();
    await expect(page.locator("#state-uploading")).toHaveAttribute(
      "aria-busy",
      "true",
    );
    await expect(page.locator("#state-done")).not.toHaveAttribute("aria-busy");
  });

  test("status-label replaces the status word", async ({ page }) => {
    await gotoStory(page, story("uploading"));
    await page
      .locator("pl-attachment")
      .evaluate((el) => el.setAttribute("status-label", "Envoi"));
    await expect
      .poll(() =>
        page
          .locator("pl-attachment")
          .evaluate(
            (el) => el.shadowRoot!.querySelector("[part=status]")?.textContent,
          ),
      )
      .toBe("Envoi");
  });

  test("removing the state attribute falls back to done", async ({ page }) => {
    await gotoStory(page, story("uploading"));
    await page
      .locator("pl-attachment")
      .evaluate((el) => el.removeAttribute("state"));
    await expect(page.locator("pl-attachment")).not.toHaveAttribute(
      "aria-busy",
    );
  });
});

test("the card stays solid under glass", async ({ page }) => {
  await gotoStory(page, story("glass"));
  expect(
    await page
      .locator("pl-attachment")
      .evaluate((el) => getComputedStyle(el).backdropFilter),
  ).toBe("none");
});

test("long text wraps without horizontal overflow at 200% text zoom", async ({
  page,
}) => {
  await expectNoOverflowAtTextZoom(await gotoStory(page, story("long-text")));
});

test("states do not overflow at 200% text zoom", async ({ page }) => {
  await expectNoOverflowAtTextZoom(await gotoStory(page, story("states")));
});

test.describe("coarse pointer on a wide screen", () => {
  test.use({ viewport: { width: 1440, height: 900 }, hasTouch: true });

  test("the action is at least 44 by 44", async ({ page }) => {
    await gotoStory(page, story("default"));
    const box = (await page.getByRole("button").boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
  });

  test("a compact link card is at least 44 tall", async ({ page }) => {
    await gotoStory(page, story("compact-link"));
    const box = (await page.locator("pl-attachment").boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(44);
  });
});

test.describe("group", () => {
  const group = (page: import("@playwright/test").Page) =>
    page.locator("pl-attachment-group");

  test("is a named group that scrolls sideways and snaps", async ({ page }) => {
    await gotoStory(page, story("group"));
    await expect(
      page.getByRole("group", { name: "Attachments" }),
    ).toBeVisible();
    const style = await group(page).evaluate((el) => ({
      wider: el.scrollWidth > el.clientWidth,
      snap: getComputedStyle(el).scrollSnapType,
      align: getComputedStyle(el.firstElementChild!).scrollSnapAlign,
    }));
    expect(style.wider).toBe(true);
    expect(style.snap).toContain("x");
    expect(style.align).toContain("start");
  });

  test("a fade marks the edge that has more to scroll to", async ({ page }) => {
    await gotoStory(page, story("group"));
    await expect(group(page)).toHaveAttribute("data-more-right", "");
    await expect(group(page)).not.toHaveAttribute("data-more-left");
    expect(
      await group(page).evaluate((el) => getComputedStyle(el).maskImage),
    ).not.toBe("none");
    await group(page).evaluate((el) => {
      el.scrollLeft = el.scrollWidth;
    });
    await expect(group(page)).toHaveAttribute("data-more-left", "");
    await expect(group(page)).not.toHaveAttribute("data-more-right");
  });

  test("a group that does not overflow has no fade", async ({ page }) => {
    await gotoStory(page, story("group-few"));
    await expect(group(page)).not.toHaveAttribute("data-more-right");
    await expect(group(page)).not.toHaveAttribute("data-more-left");
    expect(
      await group(page).evaluate((el) => getComputedStyle(el).maskImage),
    ).toBe("none");
  });

  test("links inside are the tab stops and the group takes none", async ({
    page,
  }) => {
    await gotoStory(page, story("group"));
    await expect(group(page)).not.toHaveAttribute("tabindex");
    await page.getByRole("link").first().focus();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link").nth(1)).toBeFocused();
  });

  test("a group of presentational cards is a focusable group the keyboard scrolls", async ({
    page,
  }) => {
    await gotoStory(page, story("group-presentational"));
    await expect(group(page)).toHaveAttribute("tabindex", "0");
    await expect(
      page.getByRole("group", { name: "Attached files" }),
    ).toBeVisible();
    await group(page).focus();
    await page.keyboard.press("ArrowRight");
    await expect
      .poll(() => group(page).evaluate((el) => el.scrollLeft))
      .toBeGreaterThan(0);
  });

  test("a group that does not overflow takes no tab stop", async ({ page }) => {
    await gotoStory(page, story("group-few"));
    await expect(group(page)).not.toHaveAttribute("tabindex");
  });

  test("the focus ring shows on the group, also under forced colors", async ({
    page,
  }) => {
    await gotoStory(page, story("group-presentational"));
    await page.emulateMedia({ forcedColors: "active" });
    await group(page).focus();
    expect(
      await group(page).evaluate((el) => getComputedStyle(el).outlineStyle),
    ).not.toBe("none");
  });

  test("under rtl the row starts at the right and the fade is on the left", async ({
    page,
  }) => {
    await gotoStory(page, story("group-rtl"));
    await expect(group(page)).toHaveAttribute("data-more-left", "");
    await expect(group(page)).not.toHaveAttribute("data-more-right");
    const group0 = (await group(page).boundingBox())!;
    const first = (await page.locator("pl-attachment").first().boundingBox())!;
    expect(first.x + first.width).toBeGreaterThan(group0.x + group0.width - 4);
  });
});
