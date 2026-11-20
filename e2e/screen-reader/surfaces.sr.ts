import { screenReaderTest as test } from "@guidepup/playwright";
import { expect } from "@playwright/test";
import { gotoStory } from "../helpers/story.ts";

// VoiceOver on macOS, NVDA on Windows (see playwright.config.ts).
test("screen reader speaks the text on each surface", async ({
  page,
  screenReader,
}) => {
  await gotoStory(page, "surfaces--default");
  await screenReader.navigateToWebContent();
  for (let i = 0; i < 10; i++) {
    if ((await screenReader.spokenPhraseLog()).join(" ").includes("List row"))
      break;
    await screenReader.next();
  }
  const spoken = (await screenReader.spokenPhraseLog()).join(" ");
  for (const text of ["Bar", "Panel", "Sheet", "List row"])
    expect(spoken).toContain(text);
});
