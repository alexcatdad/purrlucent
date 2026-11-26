import { expect, test } from "@playwright/test";

const examples = [
  {
    id: "product-site",
    name: "Product site",
    heading: "Web components for your app.",
  },
  {
    id: "centered-hero",
    name: "Centered hero and compact footer",
    heading: "Web components for your app.",
  },
  { id: "onboarding", name: "Onboarding", heading: "Create your account" },
  { id: "admin", name: "Admin", heading: "Support queue" },
  { id: "billing", name: "Billing", heading: "A plan for every team" },
  {
    id: "documentation",
    name: "Documentation",
    heading: "Install Purrlucent",
  },
  {
    id: "theming-article",
    name: "Theming article",
    heading: "Theme Purrlucent",
  },
];

for (const { id, name, heading } of examples) {
  test(`the starter kit guide opens ${name} as a Storybook story`, async ({
    page,
  }) => {
    await page.goto("/?path=/docs/starter-kits--docs");
    const managerStart = await page.evaluate(() => performance.timeOrigin);
    const preview = page.frameLocator("#storybook-preview-iframe");
    await preview.getByRole("link", { name, exact: true }).click();
    await expect(page).toHaveURL(
      new RegExp(`[?&]path=/story/starter-kits--${id}(?:&|$)`),
    );

    const frame = preview.locator("iframe").and(preview.getByTitle(name));
    const example = frame.contentFrame();
    await example
      .getByRole("heading", { name: heading, level: 1, exact: true })
      .waitFor();
    const sidebar = page.getByRole("navigation", { name: "Stories" });
    const row = sidebar.getByRole("row", { name, exact: true });
    await expect(row).toHaveAttribute("aria-selected", "true");
    expect(await page.evaluate(() => performance.timeOrigin)).toBe(
      managerStart,
    );

    if (id === "product-site") {
      await expect
        .poll(() =>
          frame.evaluate((el) => {
            const { width, height } = el.getBoundingClientRect();
            return width >= innerWidth - 1 && height >= innerHeight - 1;
          }),
        )
        .toBe(true);
      const faq = example.getByRole("button", {
        name: "Do I need a specific framework?",
        exact: true,
      });
      await expect(faq).toHaveAttribute("aria-expanded", "false");
      await faq.press("Enter");
      await expect(faq).toHaveAttribute("aria-expanded", "true");

      await row.press("ArrowDown");
      const centered = sidebar.getByRole("row", {
        name: "Centered hero and compact footer",
        exact: true,
      });
      await expect(centered).toBeFocused();
      await centered.press("Enter");
      await expect(page).toHaveURL(
        /[?&]path=\/story\/starter-kits--centered-hero(?:&|$)/,
      );
      await expect(centered).toHaveAttribute("aria-selected", "true");
    }

    if (id === "centered-hero") {
      await expect(example.locator(".product-hero-centered h1")).toBeVisible();
    }
  });
}

test("a link between kit stories keeps its section and toolbar settings on reload", async ({
  page,
}) => {
  await page.goto(
    "/?path=/story/starter-kits--product-site&globals=theme:dark;dir:rtl",
  );
  const preview = page.frameLocator("#storybook-preview-iframe");
  const product = preview.frameLocator('iframe[title="Product site"]');
  const managerStart = await page.evaluate(() => performance.timeOrigin);
  await product
    .getByRole("main")
    .getByRole("link", { name: "Install", exact: true })
    .click();
  await expect(page).toHaveURL(
    (url) =>
      url.searchParams.get("path") === "/story/starter-kits--documentation",
  );

  const article = preview.frameLocator('iframe[title="Documentation"]');
  const section = article.getByRole("heading", {
    name: "Install the package",
    exact: true,
  });
  const sectionHash = () =>
    section.evaluate((heading) => heading.ownerDocument.location.hash);
  await section.waitFor();
  expect(await page.evaluate(() => performance.timeOrigin)).toBe(managerStart);
  await expect.poll(sectionHash).toBe("#install");
  await expect(section).toBeInViewport();
  await page.reload();
  await section.waitFor();
  await expect(article.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(article.locator("html")).toHaveCSS("color-scheme", "dark");
  await expect.poll(sectionHash).toBe("#install");
  await expect(section).toBeInViewport();
});
