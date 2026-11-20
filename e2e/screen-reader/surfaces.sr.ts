import { screenReaderTest as test } from "@guidepup/playwright";
import { expect } from "@playwright/test";
import { gotoStory } from "../helpers/story.ts";
import { traceState } from "./trace.ts";

// VoiceOver on macOS, NVDA on Windows (see playwright.config.ts).
// Uses the story without a text input: NVDA switches to focus mode on a
// focused input and then keeps re-reading it instead of the page.
test("screen reader speaks the text on each surface", async ({
  page,
  screenReader,
}) => {
  await gotoStory(page, "surfaces--text-only");
  await screenReader.navigateToWebContent();
  await traceState("setup", page, screenReader);
  for (let i = 0; i < 10; i++) {
    if ((await screenReader.spokenPhraseLog()).join(" ").includes("List row"))
      break;
    await screenReader.next();
    await traceState(`next ${i}`, page, screenReader);
  }
  const spoken = (await screenReader.spokenPhraseLog()).join(" ");
  for (const text of ["Bar", "Panel", "Sheet", "List row"])
    expect(spoken).toContain(text);
});
