import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
} from "../../../e2e/helpers/a11y.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";

const story = (name: string) => `ai-chat-prompt-input--${name}`;

const field = (root: Locator) => root.getByRole("textbox", { name: "Message" });

/** Records the host's events as "name" or "name:value" in window.log. */
const watch = (root: Locator) =>
  root.locator("pl-prompt-input").evaluate((el) => {
    const log: string[] = [];
    (window as unknown as { log: string[] }).log = log;
    for (const name of [
      "pl-input",
      "pl-change",
      "pl-submit",
      "pl-stop",
      "input",
      "change",
    ])
      el.addEventListener(name, (event) => {
        const detail = (event as CustomEvent<{ value?: string }>).detail;
        log.push(
          detail?.value === undefined ? name : `${name}:${detail.value}`,
        );
      });
  });

const logged = (page: Page) =>
  page.evaluate(() => (window as unknown as { log: string[] }).log);

const submitted = async (page: Page) =>
  (await logged(page)).filter((entry) => entry.startsWith("pl-submit"));

const lines = (count: number) =>
  Array.from({ length: count }, (_, i) => `line ${i + 1}`).join("\n");

test("the field is named Message and a label attribute renames it", async ({
  page,
}) => {
  const root = await gotoStory(page, story("default"));
  await expect(field(root)).toBeVisible();
  const host = root.locator("pl-prompt-input");
  await host.evaluate((el) => el.setAttribute("label", "Reply"));
  await expect(root.getByRole("textbox", { name: "Reply" })).toBeVisible();
  await host.evaluate((el) => el.removeAttribute("label"));
  await expect(field(root)).toBeVisible();
});

test("a native label names the field", async ({ page }) => {
  const root = await gotoStory(page, story("default"));
  await root.evaluate((el) => {
    const label = document.createElement("label");
    label.htmlFor = "prompt";
    label.textContent = "Ask";
    el.append(label);
  });
  // The component's focus(), as in the input and textarea tests: Playwright's
  // own focus does not reach the field inside in every engine.
  await root
    .locator("pl-prompt-input")
    .evaluate((el) => (el as HTMLElement).focus());
  await expect(root.getByRole("textbox", { name: "Ask" })).toBeFocused();
});

test("focus() focuses the field", async ({ page }) => {
  const root = await gotoStory(page, story("tools"));
  await root.locator("pl-prompt-input").evaluate((el) => el.focus());
  await expect(field(root)).toBeFocused();
});

test("Send is off while the text is empty or only whitespace", async ({
  page,
}) => {
  const root = await gotoStory(page, story("default"));
  const send = root.getByRole("button", { name: "Send" });
  await expect(send).toHaveAttribute("aria-disabled", "true");
  await field(root).fill("   ");
  await expect(send).toHaveAttribute("aria-disabled", "true");
  await field(root).fill("hi");
  await expect(send).not.toHaveAttribute("aria-disabled");
});

test("Enter sends the trimmed text and clears the field", async ({ page }) => {
  const root = await gotoStory(page, story("default"));
  await watch(root);
  await field(root).fill("  hello\n");
  await field(root).press("Enter");
  expect(await submitted(page)).toEqual(["pl-submit:hello"]);
  await expect(field(root)).toHaveValue("");
  await expect(field(root)).toBeFocused();
});

test("Enter on whitespace sends nothing and adds no newline", async ({
  page,
}) => {
  const root = await gotoStory(page, story("default"));
  await watch(root);
  await field(root).fill("  ");
  await field(root).press("Enter");
  expect(await submitted(page)).toEqual([]);
  await expect(field(root)).toHaveValue("  ");
});

test("Shift+Enter inserts a newline and sends nothing", async ({ page }) => {
  const root = await gotoStory(page, story("default"));
  await watch(root);
  await field(root).pressSequentially("a");
  await field(root).press("Shift+Enter");
  await field(root).pressSequentially("b");
  await expect(field(root)).toHaveValue("a\nb");
  expect(await submitted(page)).toEqual([]);
});

test("Enter during IME composition never sends", async ({ page }) => {
  const root = await gotoStory(page, story("default"));
  await watch(root);
  await field(root).fill("nihon");
  await field(root).evaluate((el) =>
    el.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Enter",
        isComposing: true,
        bubbles: true,
        composed: true,
        cancelable: true,
      }),
    ),
  );
  expect(await submitted(page)).toEqual([]);
  await expect(field(root)).toHaveValue("nihon");
});

test("the Send button sends, and preventing pl-submit keeps the text", async ({
  page,
}) => {
  const root = await gotoStory(page, story("default"));
  await watch(root);
  await field(root).fill("first");
  await root.getByRole("button", { name: "Send" }).click();
  expect(await submitted(page)).toEqual(["pl-submit:first"]);
  await expect(field(root)).toHaveValue("");
  await root
    .locator("pl-prompt-input")
    .evaluate((el) =>
      el.addEventListener("pl-submit", (event) => event.preventDefault()),
    );
  await field(root).fill("second");
  await root.getByRole("button", { name: "Send" }).click();
  expect(await submitted(page)).toEqual([
    "pl-submit:first",
    "pl-submit:second",
  ]);
  await expect(field(root)).toHaveValue("second");
});

test("editing fires each pl-* event with its native event after it, and none twice", async ({
  page,
}) => {
  const root = await gotoStory(page, story("default"));
  await watch(root);
  await field(root).pressSequentially("hi");
  await page.keyboard.press("Tab");
  expect(await logged(page)).toEqual([
    "pl-input:h",
    "input",
    "pl-input:hi",
    "input",
    "pl-change:hi",
    "change",
  ]);
});

test("while busy the button is Stop, fires pl-stop, and Enter sends nothing", async ({
  page,
}) => {
  const root = await gotoStory(page, story("busy"));
  await watch(root);
  const stop = root.getByRole("button", { name: "Stop" });
  await expect(stop).not.toHaveAttribute("aria-disabled");
  await field(root).press("Enter");
  await expect(field(root)).toHaveValue("And the next one?");
  await stop.click();
  expect(await logged(page)).toEqual(["pl-stop"]);
  await root
    .locator("pl-prompt-input")
    .evaluate((el) => el.removeAttribute("busy"));
  await expect(root.getByRole("button", { name: "Send" })).toBeVisible();
});

test("a disabled prompt disables the field and Send", async ({ page }) => {
  const root = await gotoStory(page, story("disabled"));
  await expect(field(root)).toBeDisabled();
  await expect(root.getByRole("button", { name: "Send" })).toHaveAttribute(
    "aria-disabled",
    "true",
  );
});

test("the field grows with its text, stops at a maximum, scrolls, and shrinks again", async ({
  page,
}) => {
  const root = await gotoStory(page, story("default"));
  const height = async () => (await field(root).boundingBox())!.height;
  const one = await height();
  await field(root).fill(lines(3));
  await expect.poll(height).toBeGreaterThan(one + 1);
  await field(root).fill(lines(30));
  await expect
    .poll(() => field(root).evaluate((el) => el.scrollHeight > el.clientHeight))
    .toBe(true);
  const max = await root.locator("pl-prompt-input").evaluate((el) => {
    const probe = el.ownerDocument.body.appendChild(
      el.ownerDocument.createElement("div"),
    );
    probe.style.blockSize =
      "calc(var(--pl-leading-normal) * 7 + var(--pl-size-md) + var(--pl-pad-control) * 2)";
    const result = probe.getBoundingClientRect().height;
    probe.remove();
    return result;
  });
  expect(Math.abs((await height()) - max)).toBeLessThanOrEqual(1);
  await field(root).fill(lines(40));
  expect(Math.abs((await height()) - max)).toBeLessThanOrEqual(1);
  await field(root).fill("");
  await expect
    .poll(async () => Math.abs((await height()) - one))
    .toBeLessThan(2);
});

test("multiline: the field holds four lines and is taller than one", async ({
  page,
}) => {
  const empty = await gotoStory(page, story("default"));
  const one = (await field(empty).boundingBox())!.height;
  const root = await gotoStory(page, story("multiline"));
  await expect(field(root)).toHaveValue(/^.+\n.+\n.+\n.+$/);
  // One line fills a control's height; each further line adds one leading.
  const line = await root.locator("pl-prompt-input").evaluate((el) => {
    const probe = el.ownerDocument.body.appendChild(
      el.ownerDocument.createElement("div"),
    );
    probe.style.blockSize = "var(--pl-leading-normal)";
    const result = probe.getBoundingClientRect().height;
    probe.remove();
    return result;
  });
  await expect
    .poll(async () => (await field(root).boundingBox())!.height)
    .toBeGreaterThanOrEqual(one + line * 3 - 1);
});

test("the group's shell grows with the field", async ({ page }) => {
  const root = await gotoStory(page, story("default"));
  const shell = (host: Locator) =>
    host.evaluate(
      (el) =>
        el
          .shadowRoot!.querySelector("pl-input-group")!
          .shadowRoot!.querySelector('[part="shell"]')!
          .getBoundingClientRect().height,
    );
  const host = root.locator("pl-prompt-input");
  const before = await shell(host);
  await field(root).fill(lines(4));
  await expect.poll(() => shell(host)).toBeGreaterThan(before + 1);
});

test("tools sit on either side, before Send, and stay beside the last line", async ({
  page,
}) => {
  const root = await gotoStory(page, story("tools"));
  await field(root).fill(lines(5));
  const attach = root.getByRole("button", { name: "Attach" });
  const model = root.getByRole("button", { name: "Model" });
  const send = root.getByRole("button", { name: "Send" });
  await expect
    .poll(async () => (await field(root).boundingBox())!.height)
    .toBeGreaterThan(80);
  const [a, m, s, f] = (
    await Promise.all([
      attach.boundingBox(),
      model.boundingBox(),
      send.boundingBox(),
      field(root).boundingBox(),
    ])
  ).map((box) => box!);
  expect(a!.x + a!.width).toBeLessThanOrEqual(f!.x + 1);
  expect(m!.x).toBeGreaterThanOrEqual(f!.x + f!.width - 1);
  expect(m!.x + m!.width).toBeLessThanOrEqual(s!.x + 1);
  for (const box of [a, m])
    expect(Math.abs(box!.y + box!.height - (s!.y + s!.height))).toBeLessThan(2);
});

test("prompt input: buttons are inset by --pl-pad-control from the bar's top and bottom", async ({
  page,
}) => {
  const root = await gotoStory(page, story("tools"));
  const inset = await root.locator("pl-prompt-input").evaluate((el) => {
    const probe = el.ownerDocument.body.appendChild(
      el.ownerDocument.createElement("div"),
    );
    probe.style.blockSize = "var(--pl-pad-control)";
    const height = probe.getBoundingClientRect().height;
    probe.remove();
    return height;
  });
  const shell = await root.locator("pl-prompt-input").evaluate((el) => {
    const box = el
      .shadowRoot!.querySelector("pl-input-group")!
      .shadowRoot!.querySelector('[part="shell"]')!
      .getBoundingClientRect();
    return { top: box.top, bottom: box.bottom };
  });
  for (const name of ["Attach", "Model", "Send"]) {
    const box = (await root.getByRole("button", { name }).boundingBox())!;
    expect(Math.abs(box.y - shell.top - inset)).toBeLessThan(1.5);
    expect(Math.abs(shell.bottom - (box.y + box.height) - inset)).toBeLessThan(
      1.5,
    );
  }
});

test("an empty start slot leaves no gap before the field", async ({ page }) => {
  const root = await gotoStory(page, story("default"));
  const [host, box] = await Promise.all([
    root.locator("pl-prompt-input").boundingBox(),
    field(root).boundingBox(),
  ]);
  // Only the shell's own padding sits before the text, not an addon column.
  expect(box!.x - host!.x).toBeLessThan(24);
});

test("the tools mirror under rtl", async ({ page }) => {
  const root = await gotoStory(page, story("rtl"));
  const attach = (await root
    .getByRole("button", { name: "Attach" })
    .boundingBox())!;
  const model = (await root
    .getByRole("button", { name: "Model" })
    .boundingBox())!;
  const box = (await field(root).boundingBox())!;
  expect(attach.x).toBeGreaterThan(box.x);
  expect(model.x).toBeLessThan(box.x);
});

test("the form gets the text under its name, validity and reset", async ({
  page,
}) => {
  const root = await gotoStory(page, story("form"));
  const form = root.locator("#form");
  const data = () =>
    form.evaluate((el) => new FormData(el as HTMLFormElement).get("message"));
  const valid = () =>
    form.evaluate((el) => (el as HTMLFormElement).checkValidity());
  expect(await data()).toBe("Draft");
  expect(await valid()).toBe(true);
  await field(root).fill("");
  await expect.poll(valid).toBe(false);
  await field(root).fill("Hello");
  await expect.poll(data).toBe("Hello");
  await expect.poll(valid).toBe(true);
  await form.evaluate((el) => (el as HTMLFormElement).reset());
  await expect(field(root)).toHaveValue("Draft");
});

test("the controls keep a border under forced colors and the motion stops under reduced motion", async ({
  page,
}) => {
  const root = await gotoStory(page, story("default"));
  await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
  const style = await root.locator("pl-prompt-input").evaluate((el) => {
    const shell = getComputedStyle(
      el
        .shadowRoot!.querySelector("pl-input-group")!
        .shadowRoot!.querySelector('[part="shell"]')!,
    );
    return [shell.borderStyle, shell.transitionDuration];
  });
  expect(style[0]).toBe("solid");
  expect(style[1]!.split(", ").every((time) => time === "0s")).toBe(true);
  await expect(root.getByRole("button", { name: "Send" })).toBeVisible();
});

test("no horizontal overflow at 200% text zoom", async ({ page }) => {
  await expectNoOverflowAtTextZoom(await gotoStory(page, story("tools")));
});

test("axe finds no WCAG 2.2 AA violations", async ({ page }) => {
  await expectAccessible(await gotoStory(page, story("tools")));
});

test("axe finds no violations while busy", async ({ page }) => {
  await expectAccessible(await gotoStory(page, story("busy")));
});

test.describe("coarse pointer on a wide screen", () => {
  test.use({ viewport: { width: 1440, height: 900 }, hasTouch: true });

  test("every control keeps a 44 by 44 hit area", async ({ page }) => {
    const root = await gotoStory(page, story("tools"));
    for (const name of ["Attach", "Model", "Send"]) {
      const box = (await root.getByRole("button", { name }).boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
    expect((await field(root).boundingBox())!.height).toBeGreaterThanOrEqual(
      44,
    );
  });
});
