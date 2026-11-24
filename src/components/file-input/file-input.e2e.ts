import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
} from "../../../e2e/helpers/a11y.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";

const story = (name: string) => `forms-file-input--${name}`;

const png = {
  name: "cat.png",
  mimeType: "image/png",
  buffer: Buffer.from("a"),
};
const pdf = {
  name: "doc.pdf",
  mimeType: "application/pdf",
  buffer: Buffer.from("b"),
};

/** The names of the files the host holds. */
const held = (host: Locator) =>
  host.evaluate((el) =>
    (el as unknown as { files: File[] }).files.map((f) => f.name),
  );

/** What the form would submit, as [name, file name] pairs. */
const submitted = (page: Page) =>
  page
    .locator("#form")
    .evaluate((form) =>
      [...new FormData(form as HTMLFormElement)].map(([k, v]) => [
        k,
        v instanceof File ? v.name : String(v),
      ]),
    );

const valid = (page: Page) =>
  page
    .locator("#form")
    .evaluate((form) => (form as HTMLFormElement).checkValidity());

/** Fires a drag event carrying the named files on a control's field. */
async function drag(
  page: Page,
  host: Locator,
  type: "dragover" | "drop",
  files: [string, string][],
) {
  const dataTransfer = await page.evaluateHandle((list) => {
    const transfer = new DataTransfer();
    for (const [name, mime] of list)
      transfer.items.add(new File(["x"], name, { type: mime }));
    return transfer;
  }, files);
  await host.locator('[part="field"]').dispatchEvent(type, { dataTransfer });
}

const recordEvents = (host: Locator) =>
  host.evaluate((el) => {
    const log: string[] = [];
    (window as unknown as { log: string[] }).log = log;
    el.addEventListener("pl-change", (event) =>
      log.push(
        `pl-change:${(event as CustomEvent<{ files: File[] }>).detail.files.map((f) => f.name).join()}`,
      ),
    );
    el.addEventListener("change", () => log.push("change"));
  });

const events = (page: Page) =>
  page.evaluate(() => (window as unknown as { log: string[] }).log);

test("the group is named by the slotted label and holds a button and the names", async ({
  page,
}) => {
  await gotoStory(page, story("labelled"));
  const host = page.locator("#file");
  await expect(host.getByRole("group", { name: "Resume" })).toBeVisible();
  const button = host.getByRole("button", { name: "Choose file", exact: true });
  await expect(button).toBeVisible();
  await expect(host.locator('[part="names"]')).toHaveText("No file chosen");
  await expect(host.locator("input")).toHaveAttribute("accept", ".pdf,image/*");
});

test("without a slotted label the label attribute names the group", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await expect(
    page.locator("#file").getByRole("group", { name: "Attachment" }),
  ).toBeVisible();
  await expect(page.locator("#file").locator('[part="label"]')).toBeHidden();
});

test("the description slot shows only when it has content", async ({
  page,
}) => {
  await gotoStory(page, story("labelled"));
  await expect(
    page.locator("#file").locator('[part="description"]'),
  ).toBeVisible();
  await expect(page.getByText("A PDF or an image, up to 5 MB.")).toBeVisible();
  await gotoStory(page, story("default"));
  await expect(
    page.locator("#file").locator('[part="description"]'),
  ).toBeHidden();
});

test("choosing a file lists its name and fires pl-change then change", async ({
  page,
}) => {
  await gotoStory(page, story("labelled"));
  const host = page.locator("#file");
  await recordEvents(host);
  await host.locator("input").setInputFiles(pdf);
  await expect(host.locator('[part="names"]')).toHaveText("doc.pdf");
  expect(await held(host)).toEqual(["doc.pdf"]);
  expect(await events(page)).toEqual(["pl-change:doc.pdf", "change"]);
});

test("the button opens the file dialog", async ({ page }) => {
  await gotoStory(page, story("labelled"));
  const host = page.locator("#file");
  const chooser = page.waitForEvent("filechooser");
  await host.getByRole("button", { name: "Choose file", exact: true }).click();
  await (await chooser).setFiles(png);
  await expect(host.locator('[part="names"]')).toHaveText("cat.png");
});

test("multiple names the button for files and lists every name", async ({
  page,
}) => {
  await gotoStory(page, story("multiple"));
  const host = page.locator("#file");
  await expect(
    host.getByRole("button", { name: "Choose files", exact: true }),
  ).toBeVisible();
  await host.locator("input").setInputFiles([png, pdf]);
  await expect(host.locator('[part="names"]')).toHaveText("cat.png, doc.pdf");
  expect(await held(host)).toEqual(["cat.png", "doc.pdf"]);
});

test("the files property takes an array or a FileList and shows the names", async ({
  page,
}) => {
  await gotoStory(page, story("multiple"));
  const host = page.locator("#file");
  await host.evaluate((el) => {
    (el as unknown as { files: File[] }).files = [
      new File(["x"], "one.txt"),
      new File(["x"], "two.txt"),
    ];
  });
  await expect(host.locator('[part="names"]')).toHaveText("one.txt, two.txt");
  await expect(host.locator("input")).toHaveJSProperty("files.length", 2);
  await host.evaluate((el) => {
    const transfer = new DataTransfer();
    transfer.items.add(new File(["x"], "three.txt"));
    (el as unknown as { files: FileList }).files = transfer.files;
  });
  await expect(host.locator('[part="names"]')).toHaveText("three.txt");
  expect(await held(host)).toEqual(["three.txt"]);
});

test("dropping files on the field chooses them and fires pl-change", async ({
  page,
}) => {
  await gotoStory(page, story("multiple"));
  const host = page.locator("#file");
  await recordEvents(host);
  await drag(page, host, "dragover", [["a.png", "image/png"]]);
  expect(await host.evaluate((el) => el.matches(":state(dragging)"))).toBe(
    true,
  );
  await drag(page, host, "drop", [
    ["a.png", "image/png"],
    ["b.png", "image/png"],
  ]);
  expect(await host.evaluate((el) => el.matches(":state(dragging)"))).toBe(
    false,
  );
  await expect(host.locator('[part="names"]')).toHaveText("a.png, b.png");
  expect(await events(page)).toEqual(["pl-change:a.png,b.png", "change"]);
});

test("a drop keeps only files that match accept", async ({ page }) => {
  await gotoStory(page, story("multiple"));
  const host = page.locator("#file");
  await drag(page, host, "drop", [
    ["a.txt", "text/plain"],
    ["b.png", "image/png"],
  ]);
  await expect(host.locator('[part="names"]')).toHaveText("b.png");
});

test("a drop on a single-file control takes the first file", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  const host = page.locator("#file");
  await drag(page, host, "drop", [
    ["a.txt", "text/plain"],
    ["b.txt", "text/plain"],
  ]);
  await expect(host.locator('[part="names"]')).toHaveText("a.txt");
});

test("a drop of nothing acceptable changes nothing", async ({ page }) => {
  await gotoStory(page, story("multiple"));
  const host = page.locator("#file");
  await recordEvents(host);
  await drag(page, host, "drop", [["a.txt", "text/plain"]]);
  await expect(host.locator('[part="names"]')).toHaveText("No file chosen");
  expect(await events(page)).toEqual([]);
});

test("a disabled control takes no focus, no choice and no drop", async ({
  page,
}) => {
  await gotoStory(page, story("states"));
  const host = page.locator("#disabled");
  await expect(host.getByRole("button")).toBeDisabled();
  await drag(page, host, "dragover", [["a.txt", "text/plain"]]);
  expect(await host.evaluate((el) => el.matches(":state(dragging)"))).toBe(
    false,
  );
  await drag(page, host, "drop", [["a.txt", "text/plain"]]);
  await expect(host.locator('[part="names"]')).toHaveText("No file chosen");
});

test("the states story shows chosen names", async ({ page }) => {
  await gotoStory(page, story("states"));
  await expect(page.locator("#filled").locator('[part="names"]')).toHaveText(
    "report.txt",
  );
  await expect(page.locator("#several").locator('[part="names"]')).toHaveText(
    "one.txt, two.txt",
  );
});

test("the form gets the files under the name", async ({ page }) => {
  await gotoStory(page, story("in-form"));
  expect(await submitted(page)).toEqual([]);
  await page.locator("#photos").locator("input").setInputFiles([png, pdf]);
  await page.locator("#doc").locator("input").setInputFiles(pdf);
  expect(await submitted(page)).toEqual([
    ["photos", "cat.png"],
    ["photos", "doc.pdf"],
    ["doc", "doc.pdf"],
  ]);
});

test("a reset clears the files", async ({ page }) => {
  await gotoStory(page, story("in-form"));
  const photos = page.locator("#photos");
  await photos.locator("input").setInputFiles(png);
  await expect(photos.locator('[part="names"]')).toHaveText("cat.png");
  await page
    .locator("#form")
    .evaluate((form) => (form as HTMLFormElement).reset());
  await expect(photos.locator('[part="names"]')).toHaveText("No file chosen");
  expect(await held(photos)).toEqual([]);
  await expect(photos.locator("input")).toHaveJSProperty("files.length", 0);
  expect(await submitted(page)).toEqual([]);
});

test("required makes the form invalid until a file is chosen", async ({
  page,
}) => {
  await gotoStory(page, story("in-form"));
  expect(await valid(page)).toBe(false);
  expect(
    await page
      .locator("#photos")
      .evaluate((el) => (el as HTMLInputElement).validity.valueMissing),
  ).toBe(true);
  await page.locator("#photos").locator("input").setInputFiles(png);
  expect(await valid(page)).toBe(true);
});

test("the message appears once the control is touched and describes the button", async ({
  page,
}) => {
  await gotoStory(page, story("in-form"));
  const host = page.locator("#photos");
  const message = host.locator('[part="message"]');
  const button = host.getByRole("button");
  await expect(message).toBeHidden();
  await page
    .locator("#form")
    .evaluate((form) => (form as HTMLFormElement).requestSubmit());
  await expect(message).toBeVisible();
  await expect(message).toHaveText("Choose a file to continue.");
  await expect(button).toHaveAccessibleDescription(
    /Choose a file to continue\./,
  );
  await host.locator("input").setInputFiles(png);
  await expect(message).toBeHidden();
});

test("the invalid state story shows the message", async ({ page }) => {
  await gotoStory(page, story("states"));
  await expect(
    page.locator("#invalid").locator('[part="message"]'),
  ).toBeVisible();
});

test("a disabled fieldset disables the controls and submits nothing", async ({
  page,
}) => {
  await gotoStory(page, story("in-form"));
  await page.locator("#doc").locator("input").setInputFiles(pdf);
  await page
    .locator("#fieldset")
    .evaluate((el) => ((el as HTMLFieldSetElement).disabled = true));
  await expect(page.locator("#doc").getByRole("button")).toBeDisabled();
  expect(await submitted(page)).toEqual([]);
});

test("focusing the host focuses the button", async ({ page }) => {
  await gotoStory(page, story("default"));
  await page.locator("#file").focus();
  await expect(page.locator("#file").getByRole("button")).toBeFocused();
});

test("the button shows a focus ring from the keyboard", async ({ page }) => {
  await gotoStory(page, story("default"));
  await page.keyboard.press("Tab");
  await expect(page.locator("#file").getByRole("button")).toBeFocused();
  await expect
    .poll(() =>
      page
        .locator("#file")
        .getByRole("button")
        .evaluate((el) => getComputedStyle(el).outlineStyle),
    )
    .toBe("solid");
});

test("the host's aria attributes are forwarded to the button", async ({
  page,
}) => {
  await gotoStory(page, story("aria-forwarded"));
  const button = page.locator("#file").getByRole("button", {
    name: "Choose file",
    exact: true,
  });
  await expect(button).toHaveAttribute("aria-required", "true");
  await expect(button).toHaveAttribute("aria-invalid", "true");
  await expect(button).toHaveAttribute(
    "aria-description",
    "A PDF, up to 5 MB. Choose a file.",
  );
  // The label names the group, which holds the button.
  await expect(
    page.locator("#file").getByRole("group", { name: "Resume" }),
  ).toBeVisible();
  await page
    .locator("#file")
    .evaluate((el) => el.removeAttribute("aria-invalid"));
  await expect(button).not.toHaveAttribute("aria-invalid");
  await expect(button).toHaveAttribute(
    "aria-description",
    "A PDF, up to 5 MB.",
  );
});

test("inside a pl-field the field names, describes and marks the button invalid", async ({
  page,
}) => {
  await gotoStory(page, story("in-field"));
  const host = page.locator("#file");
  await expect(host.getByRole("group", { name: "Resume" })).toBeVisible();
  const button = host.getByRole("button", { name: "Choose file", exact: true });
  await expect(button).toHaveAttribute("aria-invalid", "true");
  await expect(button).toHaveAttribute("aria-description", /A PDF, up to 5 MB/);
  await expect(button).toHaveAttribute("aria-description", /Choose a file/);
  // Clicking the label focuses the control's button.
  await page.getByText("Resume", { exact: true }).click();
  await expect(button).toBeFocused();
  // The control fills the field's column instead of keeping its own width.
  const [fieldBox, hostBox] = await Promise.all([
    page.locator("pl-field [part=control]").boundingBox(),
    host.boundingBox(),
  ]);
  expect(hostBox!.width).toBeGreaterThanOrEqual(fieldBox!.width - 1);
});

test("the control is accessible", async ({ page }) => {
  await expectAccessible(await gotoStory(page, story("labelled")));
});

test("the aria and field stories are accessible", async ({ page }) => {
  await expectAccessible(await gotoStory(page, story("aria-forwarded")));
  await expectAccessible(await gotoStory(page, story("in-field")));
});

test("the states are accessible", async ({ page }) => {
  await expectAccessible(await gotoStory(page, story("states")));
});

test("the text is laid out from the start under rtl", async ({ page }) => {
  await gotoStory(page, story("rtl"));
  const direction = await page
    .locator("pl-file-input")
    .evaluate(
      (el) =>
        getComputedStyle(el.shadowRoot!.querySelector('[part="field"]')!)
          .direction,
    );
  expect(direction).toBe("rtl");
});

test("no horizontal overflow at 200% text zoom", async ({ page }) => {
  await expectNoOverflowAtTextZoom(await gotoStory(page, story("states")));
});
