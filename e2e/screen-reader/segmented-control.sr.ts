import { screenReaderTest as test } from "@guidepup/playwright";
import { expect } from "@playwright/test";
import { gotoStory } from "../helpers/story.ts";
import { traceState } from "./trace.ts";

// VoiceOver on macOS, NVDA on Windows (see playwright.config.ts).
test("screen reader speaks each segment and the selected one", async ({
  page,
  screenReader,
}) => {
  await gotoStory(page, "components-segmented-control--default");
  await screenReader.navigateToWebContent();
  await traceState("setup", page, screenReader);
  for (let i = 0; i < 10; i++) {
    if ((await screenReader.spokenPhraseLog()).join(" ").includes("Month"))
      break;
    await screenReader.next();
    await traceState(`next ${i}`, page, screenReader);
  }
  const spoken = (await screenReader.spokenPhraseLog()).join(" ");
  for (const text of ["Calendar range", "Day", "Week", "Month"])
    expect(spoken).toContain(text);
});
