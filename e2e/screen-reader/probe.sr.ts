import { screenReaderTest as test } from "@guidepup/playwright";
import { expect } from "@playwright/test";
import { gotoStory } from "../helpers/story.ts";

// VoiceOver on macOS, NVDA on Windows (see playwright.config.ts).
test("screen reader speaks the probe's slotted text", async ({
  page,
  screenReader,
}) => {
  await gotoStory(page, "probe--default");
  await screenReader.navigateToWebContent();
  for (let i = 0; i < 10; i++) {
    if ((await screenReader.spokenPhraseLog()).join(" ").includes("Probe"))
      break;
    await screenReader.next();
  }
  expect((await screenReader.spokenPhraseLog()).join(" ")).toContain("Probe");
});
