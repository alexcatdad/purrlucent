import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
  spokenPhrases,
} from "../../../e2e/helpers/a11y.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";

const stories = [
  "default",
  "variants",
  "sizes",
  "destructive",
  "disabled",
  "busy",
  "glass",
  "links",
  "small",
  "submit-form",
];
const labels = ["Duplicate", "Save", "Share", "Cancel"];

test("aria snapshot", async ({ page }) => {
  const root = await gotoStory(page, "actions-button--variants");
  await expect(root).toMatchAriaSnapshot(`
    - button "Duplicate"
    - button "Save"
    - button "Share"
    - button "Cancel"
  `);
});

test("an icon button takes its name from aria-label", async ({ page }) => {
  const root = await gotoStory(page, "actions-button--sizes");
  await expect(
    root.getByRole("button", { name: "Add", exact: true }),
  ).toHaveCount(4);
});

test("a disabled button is exposed as disabled", async ({ page }) => {
  const root = await gotoStory(page, "actions-button--disabled");
  await expect(root.getByRole("button", { name: "Cancel" })).toBeDisabled();
});

for (const id of stories) {
  test(`axe finds no WCAG 2.2 AA violations in ${id}`, async ({ page }) => {
    await expectAccessible(await gotoStory(page, `actions-button--${id}`));
  });
}

test("a button without label text fails axe", async ({ page }) => {
  const root = await gotoStory(page, "actions-button--default");
  await root.evaluate((el) => {
    const empty = document.createElement("pl-button");
    empty.id = "empty";
    el.append(empty);
  });
  const { violations } = await new AxeBuilder({ page })
    .include("#empty")
    .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
    .analyze();
  expect(violations.map((v) => v.id)).toContain("aria-command-name");
});

test("a destructive button is never styled as the prominent button", async ({
  page,
}) => {
  await gotoStory(page, "actions-button--destructive");
  const background = (id: string) =>
    page
      .locator(`#${id}`)
      .evaluate((el) => getComputedStyle(el, "::before").backgroundColor);
  const primary = await page.evaluate(() => {
    const el = document.createElement("pl-button");
    el.setAttribute("variant", "primary");
    document.body.append(el);
    const color = getComputedStyle(el, "::before").backgroundColor;
    el.remove();
    return color;
  });
  expect(await background("destructive-primary")).not.toBe(primary);
  expect(await background("destructive-primary")).toBe(
    await background("destructive-tinted"),
  );
});

test("a submit button submits its form and a reset button resets it", async ({
  page,
}) => {
  await gotoStory(page, "actions-button--in-form");
  await page.locator("#form").evaluate((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      form.setAttribute("data-submitted", "");
    });
  });
  const title = page.getByRole("textbox", { name: "Title" });
  await title.fill("Changed");
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(title).toHaveValue("Draft");
  await expect(page.locator("#form")).not.toHaveAttribute("data-submitted");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.locator("#form")).toHaveAttribute("data-submitted");
});

test("each size is taller than the one before", async ({ page }) => {
  await gotoStory(page, "actions-button--sizes");
  const heights = await page
    .locator("pl-button:not([icon])")
    .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height));
  expect(heights).toEqual([...heights].sort((a, b) => a - b));
  expect(new Set(heights).size).toBe(4);
});

test("a small button is 24px tall and a small icon button is 24px square", async ({
  page,
}) => {
  await gotoStory(page, "actions-button--small");
  const box = async (id: string) => (await page.locator(id).boundingBox())!;
  // Firefox lays out to a subpixel short of the token size.
  for (const id of ["#small", "#small-primary", "#small-ghost", "#small-link"])
    expect((await box(id)).height).toBeCloseTo(24, 1);
  const icon = await box("#small-icon");
  expect(icon.width).toBeCloseTo(24, 1);
  expect(icon.height).toBeCloseTo(24, 1);
});

test("a submit button submits on Enter in a native field of a form with several fields", async ({
  page,
}) => {
  await gotoStory(page, "actions-button--submit-form");
  await page.locator("#signup").evaluate((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      form.dataset.data = JSON.stringify([
        ...new FormData(form as HTMLFormElement),
      ]);
      form.dataset.count = String(Number(form.dataset.count ?? 0) + 1);
    });
  });
  await page.getByRole("textbox", { name: "First name" }).fill("Ada");
  await page.keyboard.press("Enter");
  await expect(page.locator("#signup")).toHaveAttribute("data-count", "1");
  await expect(page.locator("#signup")).toHaveAttribute(
    "data-data",
    JSON.stringify([
      ["first", "Ada"],
      ["last", ""],
      ["email", ""],
      ["intent", "save"],
    ]),
  );
});

test("Enter in a pl-input still submits through the form's submit button", async ({
  page,
}) => {
  await gotoStory(page, "actions-button--submit-form");
  await page.locator("#signup").evaluate((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      form.dataset.count = String(Number(form.dataset.count ?? 0) + 1);
    });
  });
  await page.getByRole("textbox", { name: "Email" }).fill("ada@example.com");
  await page.keyboard.press("Enter");
  await expect(page.locator("#signup")).toHaveAttribute("data-count", "1");
});

test("a disabled submit button blocks Enter in a field", async ({ page }) => {
  await gotoStory(page, "actions-button--submit-form");
  await page.locator("#signup").evaluate((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      form.dataset.count = String(Number(form.dataset.count ?? 0) + 1);
    });
    form.querySelector("pl-button")!.setAttribute("disabled", "");
  });
  await page.getByRole("textbox", { name: "First name" }).fill("Ada");
  await page.keyboard.press("Enter");
  await expect(page.locator("#signup")).not.toHaveAttribute("data-count");
});

test("a submit button outside the form submits the form named by form, with its name and value", async ({
  page,
}) => {
  await gotoStory(page, "actions-button--submit-form");
  await page.locator("#signup").evaluate((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      form.dataset.data = JSON.stringify([
        ...new FormData(form as HTMLFormElement),
      ]);
    });
  });
  const draft = page.getByRole("button", { name: "Save as draft" });
  await expect(draft).toHaveAttribute("form", "signup");
  await draft.click();
  await expect(page.locator("#signup")).toHaveAttribute(
    "data-data",
    JSON.stringify([
      ["first", ""],
      ["last", ""],
      ["email", ""],
      ["intent", "draft"],
    ]),
  );
});

test("only the button that submitted adds its name and value", async ({
  page,
}) => {
  await gotoStory(page, "actions-button--submit-form");
  await page.locator("#signup").evaluate((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      form.dataset.data = JSON.stringify([
        ...new FormData(form as HTMLFormElement),
      ]);
    });
  });
  await page.getByRole("button", { name: "Save", exact: true }).click();
  const data = await page.locator("#signup").getAttribute("data-data");
  expect(JSON.parse(data!).filter(([k]: string[]) => k === "intent")).toEqual([
    ["intent", "save"],
  ]);
  await page.locator("#signup").evaluate((form) => {
    form.dataset.data = JSON.stringify([
      ...new FormData(form as HTMLFormElement),
    ]);
  });
  const later = await page.locator("#signup").getAttribute("data-data");
  expect(JSON.parse(later!).map(([k]: string[]) => k)).not.toContain("intent");
});

test("form, name and value are attributes and properties", async ({ page }) => {
  await gotoStory(page, "actions-button--submit-form");
  const draft = page.getByRole("button", { name: "Save as draft" });
  expect(
    await draft.evaluate((el) => {
      const b = el as HTMLElement & {
        form: string;
        name: string;
        value: string;
      };
      return [b.form, b.name, b.value];
    }),
  ).toEqual(["signup", "intent", "draft"]);
  await draft.evaluate((el) => {
    (el as HTMLElement & { name: string }).name = "other";
  });
  await expect(draft).toHaveAttribute("name", "other");
});

test("an icon button is as wide as it is tall", async ({ page }) => {
  await gotoStory(page, "actions-button--sizes");
  for (const button of await page.locator("pl-button[icon]").all()) {
    const box = await button.boundingBox();
    expect(box!.width).toBe(box!.height);
  }
});

test("the pressed state is visible on the button", async ({ page }) => {
  // Zero durations, so each face tone is read without waiting for a transition.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await gotoStory(page, "actions-button--default");
  const button = page.locator("#button");
  const face = () =>
    button.evaluate((el) => getComputedStyle(el, "::before").backgroundColor);
  await button.hover();
  const resting = await face();
  await page.mouse.down();
  expect(await face()).not.toBe(resting);
  await page.mouse.up();
  expect(await face()).toBe(resting);
});

test("no horizontal overflow at 200% text zoom", async ({ page }) => {
  await expectNoOverflowAtTextZoom(
    await gotoStory(page, "actions-button--variants"),
  );
});

test("virtual screen reader speaks each button", async ({ page }) => {
  await gotoStory(page, "actions-button--variants");
  const spoken = (await spokenPhrases(page)).join(" ");
  for (const label of labels) expect(spoken).toContain(label);
});

test.describe("coarse pointer on a wide screen", () => {
  test.use({ viewport: { width: 1440, height: 900 }, hasTouch: true });

  test("every button keeps a 44 by 44 hit area", async ({ page }) => {
    for (const id of ["variants", "sizes"]) {
      await gotoStory(page, `actions-button--${id}`);
      for (const button of await page.locator("pl-button").all()) {
        const box = await button.boundingBox();
        expect(box!.width).toBeGreaterThanOrEqual(44);
        expect(box!.height).toBeGreaterThanOrEqual(44);
      }
    }
  });
});

test("the focus ring stays visible under forced colors", async ({ page }) => {
  await gotoStory(page, "actions-button--variants");
  await page.emulateMedia({ forcedColors: "active" });
  await page.keyboard.press("Tab");
  const button = page.locator("pl-button").first();
  await expect(button).toBeFocused();
  expect(
    await button.evaluate((el) => getComputedStyle(el).outlineStyle),
  ).not.toBe("none");
});

test("a disabled fieldset makes the button inert, as a native button is", async ({
  page,
}) => {
  const root = await gotoStory(page, "actions-button--default");
  await root.evaluate((el) => {
    el.insertAdjacentHTML(
      "beforeend",
      `<form id="f"><fieldset id="fs" disabled>
        <pl-button id="b" type="submit">Save</pl-button>
      </fieldset></form>`,
    );
    const form = document.getElementById("f")!;
    const log = (what: string) => (form.dataset.log += `${what} `);
    form.dataset.log = "";
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      log("submit");
    });
    form.addEventListener("pl-press", () => log("press"));
  });
  const log = page.locator("#f");
  const button = page.locator("#b");
  await expect(button).toHaveAttribute("aria-disabled", "true");
  await expect(button).not.toHaveAttribute("tabindex");
  await button.focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Space");
  await expect(log).toHaveAttribute("data-log", "");
  await page
    .locator("#fs")
    .evaluate((el) => ((el as HTMLFieldSetElement).disabled = false));
  await expect(button).not.toHaveAttribute("aria-disabled");
  await expect(button).toHaveAttribute("tabindex", "0");
  await button.focus();
  await page.keyboard.press("Enter");
  await expect(log).toHaveAttribute("data-log", "submit press ");
});

test("Enter and Space fire click, as a native button does", async ({
  page,
}) => {
  await gotoStory(page, "actions-button--default");
  const button = page.locator("#button");
  await button.evaluate((el) => {
    el.dataset.clicks = "0";
    el.addEventListener("click", () => (el.dataset.clicks += "x"));
  });
  await button.focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Space");
  await expect(button).toHaveAttribute("data-clicks", "0xx");
});

test("a busy button shows a spinner, ignores presses and stays focusable", async ({
  page,
}) => {
  await gotoStory(page, "actions-button--busy");
  const button = page.locator("#busy");
  await expect(button).toHaveAttribute("aria-busy", "true");
  await expect(button).not.toHaveAttribute("aria-disabled");
  await expect(button).toHaveAttribute("tabindex", "0");
  await expect(button.locator("pl-spinner")).toBeVisible();
  await button.evaluate((el) => {
    el.dataset.presses = "0";
    el.addEventListener("pl-press", () => (el.dataset.presses += "x"));
  });
  await button.focus();
  await expect(button).toBeFocused();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Space");
  await expect(button).toHaveAttribute("data-presses", "0");
  const iconButton = page.locator("#busy-icon");
  const box = (await iconButton.boundingBox())!;
  expect(box.width).toBe(box.height);
  await button.evaluate((el) => el.removeAttribute("busy"));
  await expect(button).not.toHaveAttribute("aria-busy");
  await expect(button.locator("pl-spinner")).toHaveCount(0);
  await page.keyboard.press("Enter");
  await expect(button).toHaveAttribute("data-presses", "0x");
});

test("a click on a disabled button reaches no listener", async ({ page }) => {
  const root = await gotoStory(page, "actions-button--disabled");
  const button = root.getByRole("button", { name: "Cancel" });
  await button.evaluate((el) => {
    el.dataset.clicks = "0";
    el.addEventListener("click", () => (el.dataset.clicks += "x"));
  });
  const box = (await button.boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(button).toHaveAttribute("data-clicks", "0");
});

test("a disabled button takes no focus from a click or Tab, as a native one", async ({
  page,
}) => {
  const root = await gotoStory(page, "actions-button--default");
  await root.evaluate((el) =>
    el.insertAdjacentHTML(
      "beforeend",
      `<button id="before" tabindex="0">Before</button><pl-button id="off" disabled>Off</pl-button><button id="after" tabindex="0">After</button>`,
    ),
  );
  const active = () => page.evaluate(() => document.activeElement?.id);
  await expect(page.locator("#off")).toHaveAttribute("aria-disabled", "true");
  await expect(page.locator("#off")).not.toHaveAttribute("tabindex");
  await page.locator("#before").focus();
  await page.locator("#off").click({ force: true });
  expect(await active()).not.toBe("off");
  await page.locator("#before").focus();
  await page.keyboard.press("Tab");
  expect(await active()).toBe("after");
  await page.keyboard.press("Shift+Tab");
  expect(await active()).toBe("before");
});

test("a button keeps its own tabindex, also across disabling", async ({
  page,
}) => {
  const root = await gotoStory(page, "actions-button--default");
  await root.evaluate((el) =>
    el.insertAdjacentHTML(
      "beforeend",
      `<pl-button id="r" tabindex="-1">Roving</pl-button>`,
    ),
  );
  const button = page.locator("#r");
  await expect(button).toHaveAttribute("tabindex", "-1");
  await button.evaluate((el) => el.setAttribute("disabled", ""));
  await expect(button).not.toHaveAttribute("tabindex");
  await button.evaluate((el) => el.removeAttribute("disabled"));
  await expect(button).not.toHaveAttribute("aria-disabled");
  await expect(button).toHaveAttribute("tabindex", "-1");
});

test("the hidden attribute hides the button", async ({ page }) => {
  const root = await gotoStory(page, "actions-button--default");
  await root.evaluate((el) =>
    el.insertAdjacentHTML(
      "beforeend",
      `<pl-button id="h" hidden>Hi</pl-button>`,
    ),
  );
  await expect(page.locator("#h")).toBeHidden();
});

test("pressing shows feedback under forced colors", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
  await gotoStory(page, "actions-button--default");
  const button = page.locator("#button");
  const edge = () =>
    button.evaluate((el) => getComputedStyle(el, "::before").borderTopColor);
  const resting = await edge();
  await button.hover();
  await page.mouse.down();
  expect(await edge()).not.toBe(resting);
  await page.mouse.up();
});

test("increased contrast outlines every filled variant", async ({ page }) => {
  await page.emulateMedia({ contrast: "more" });
  const root = await gotoStory(page, "actions-button--default");
  await root.evaluate((el) =>
    el.insertAdjacentHTML(
      "beforeend",
      `<pl-button variant="primary">A</pl-button>
       <pl-button variant="tinted">B</pl-button>
       <pl-button destructive>C</pl-button>
       <pl-button variant="primary" disabled>D</pl-button>`,
    ),
  );
  const shadows = await page
    .locator("pl-button")
    .evaluateAll((els) =>
      els.map((el) => getComputedStyle(el, "::before").boxShadow),
    );
  for (const shadow of shadows) expect(shadow).not.toBe("none");
});

test.describe("links", () => {
  const story = "actions-button--links";
  const hash = (page: Page) => page.evaluate(() => location.hash);

  test("a button with href is a link named by its label or aria-label", async ({
    page,
  }) => {
    const root = await gotoStory(page, story);
    await expect(root).toMatchAriaSnapshot(`
      - link "Open in Contracts"
      - link "Back to list"
      - link "New contract"
      - link "Open report"
      - link "Archive" [disabled]
    `);
    await expect(root.getByRole("button")).toHaveCount(0);
    await expect(page.locator("#link-icon")).not.toHaveAttribute("aria-label");
  });

  test("a plain click follows the link", async ({ page }) => {
    await gotoStory(page, story);
    await page.locator("#link").click();
    await expect.poll(() => hash(page)).toBe("#contracts");
  });

  test("click() on the host follows the link", async ({ page }) => {
    await gotoStory(page, story);
    await page.locator("#link").evaluate((el: HTMLElement) => el.click());
    await expect.poll(() => hash(page)).toBe("#contracts");
  });

  test("the whole face is the link's hit area", async ({ page }) => {
    await gotoStory(page, story);
    // In the padding at the start edge, outside the label text.
    await page.locator("#link").click({ position: { x: 4, y: 12 } });
    await expect.poll(() => hash(page)).toBe("#contracts");
  });

  test("a click listener on the host can prevent the navigation and route instead", async ({
    page,
  }) => {
    await gotoStory(page, story);
    await page.locator("#link").evaluate((el) => {
      const w = window as unknown as { seen: string[] };
      w.seen = [];
      el.addEventListener("click", (event) => {
        w.seen.push((event.target as Element).id);
        event.preventDefault();
      });
    });
    await page.locator("#link").click();
    await page.locator("#link a").focus();
    await page.keyboard.press("Enter");
    expect(
      await page.evaluate(() => (window as unknown as { seen: string[] }).seen),
    ).toEqual(["link", "link"]);
    expect(await hash(page)).toBe("");
  });

  test("Tab reaches the inner link, Enter follows it and fires pl-press once", async ({
    page,
  }) => {
    await gotoStory(page, story);
    await page.locator("#link-ghost").evaluate((el) => {
      const w = window as unknown as { presses: number };
      w.presses = 0;
      el.addEventListener("pl-press", () => w.presses++);
    });
    await page.locator("#link a").focus();
    await page.keyboard.press("Tab");
    await expect(page.locator("#link-ghost a")).toBeFocused();
    await page.keyboard.press("Enter");
    await expect.poll(() => hash(page)).toBe("#list");
    expect(
      await page.evaluate(
        () => (window as unknown as { presses: number }).presses,
      ),
    ).toBe(1);
  });

  test("target, rel and download reach the inner link", async ({ page }) => {
    await gotoStory(page, story);
    const inner = page.locator("#link-new-tab a");
    await expect(inner).toHaveAttribute("href", "#report");
    await expect(inner).toHaveAttribute("target", "_blank");
    await expect(inner).toHaveAttribute("rel", "noopener");
    await page
      .locator("#link-new-tab")
      .evaluate((el) => el.setAttribute("download", "report.csv"));
    await expect(inner).toHaveAttribute("download", "report.csv");
  });

  test("a disabled link has no address, does not navigate and is skipped by Tab", async ({
    page,
  }) => {
    await gotoStory(page, story);
    const inner = page.locator("#link-disabled a");
    await expect(inner).not.toHaveAttribute("href");
    await expect(inner).toHaveAttribute("aria-disabled", "true");
    await page.locator("#link-disabled").click({ force: true });
    expect(await hash(page)).toBe("");
    await page.locator("#link-new-tab a").focus();
    await page.keyboard.press("Tab");
    await expect(inner).not.toBeFocused();
  });

  test("a disabled or busy link keeps its click from a router on the host", async ({
    page,
  }) => {
    await gotoStory(page, story);
    await page.evaluate(() => {
      const w = window as unknown as { seen: string[] };
      w.seen = [];
      for (const id of ["link-disabled", "link"])
        document
          .getElementById(id)!
          .addEventListener("click", () => w.seen.push(id));
    });
    await page.locator("#link").evaluate((el) => el.setAttribute("busy", ""));
    await page.locator("#link-disabled").click({ force: true });
    await page.locator("#link").click({ force: true });
    await page.locator("#link a").focus();
    await page.keyboard.press("Enter");
    expect(
      await page.evaluate(() => (window as unknown as { seen: string[] }).seen),
    ).toEqual([]);
    expect(await hash(page)).toBe("");
  });

  test("a link moved in the page stays a link", async ({ page }) => {
    const root = await gotoStory(page, story);
    await page.locator("#link").evaluate((el) => el.parentElement!.append(el));
    await expect(root.getByRole("button")).toHaveCount(0);
    await expect(
      root.getByRole("link", { name: "Open in Contracts" }),
    ).toBeVisible();
  });

  test("focus() focuses the inner link", async ({ page }) => {
    await gotoStory(page, story);
    await page
      .locator("#link-ghost")
      .evaluate((el) => (el as HTMLElement).focus());
    await expect(page.locator("#link-ghost a")).toBeFocused();
  });

  test("the keyboard focus ring is drawn around the face", async ({ page }) => {
    await gotoStory(page, story);
    await page.locator("#link a").focus();
    await page.keyboard.press("Tab");
    expect(
      await page
        .locator("#link-ghost a")
        .evaluate((a) => getComputedStyle(a, "::after").outlineStyle),
    ).toBe("solid");
  });

  test("removing href makes it a button again", async ({ page }) => {
    const root = await gotoStory(page, story);
    await page
      .locator("#link-icon")
      .evaluate((el) => el.removeAttribute("href"));
    await expect(
      root.getByRole("button", { name: "New contract" }),
    ).toBeVisible();
    await expect(page.locator("#link-icon")).toHaveAttribute("tabindex", "0");
  });
});
