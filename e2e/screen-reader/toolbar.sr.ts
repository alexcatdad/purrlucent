import { screenReaderTest as test } from "@guidepup/playwright";
import { expect } from "@playwright/test";
import { gotoStory } from "../helpers/story.ts";
import { traceState } from "./trace.ts";

// VoiceOver on macOS, NVDA on Windows (see playwright.config.ts).
test("screen reader announces the toolbar and its items", async ({
  page,
  screenReader,
}) => {
  await gotoStory(page, "components-toolbar--default");
  await screenReader.navigateToWebContent();
  await traceState("setup", page, screenReader);
  for (let i = 0; i < 15; i++) {
    if ((await screenReader.spokenPhraseLog()).join(" ").includes("Done"))
      break;
    await screenReader.next();
    await traceState(`next ${i}`, page, screenReader);
  }
  const spoken = (await screenReader.spokenPhraseLog()).join(" ");
  for (const text of ["Document actions", "Search", "Add", "More", "Done"])
    expect(spoken).toContain(text);
});
