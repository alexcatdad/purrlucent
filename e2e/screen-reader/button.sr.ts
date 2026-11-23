import { screenReaderTest as test } from "@guidepup/playwright";
import { expect } from "@playwright/test";
import { gotoStory } from "../helpers/story.ts";
import { addClickSpacer } from "./setup.ts";
import { traceState } from "./trace.ts";

// VoiceOver on macOS, NVDA on Windows (see playwright.config.ts).
test("screen reader announces each button as a button with its label", async ({
  page,
  screenReader,
}) => {
  await gotoStory(page, "actions-button--variants");
  await addClickSpacer(page);
  await screenReader.navigateToWebContent();
  await traceState("setup", page, screenReader);
  for (let i = 0; i < 10; i++) {
    if ((await screenReader.spokenPhraseLog()).join(" ").includes("Cancel"))
      break;
    await screenReader.next();
    await traceState(`next ${i}`, page, screenReader);
  }
  const spoken = (await screenReader.spokenPhraseLog()).join(" ");
  for (const label of ["Duplicate", "Save", "Share", "Cancel"])
    expect(spoken).toContain(label);
  expect(spoken.toLowerCase()).toContain("button");
});
