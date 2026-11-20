import { screenReaderTest as test } from "@guidepup/playwright";
import { expect } from "@playwright/test";
import { gotoStory } from "../helpers/story.ts";
import { addClickSpacer, walkCompositeWithArrows } from "./setup.ts";
import { traceState } from "./trace.ts";

// VoiceOver on macOS, NVDA on Windows (see playwright.config.ts).
test("screen reader speaks each segment and the selected one", async ({
  page,
  screenReader,
}) => {
  await gotoStory(page, "components-segmented-control--default");
  await addClickSpacer(page);
  await screenReader.navigateToWebContent();
  await traceState("setup", page, screenReader);
  let spoken: string;
  // NVDA runs on the Windows runner, VoiceOver on macOS.
  if (process.platform !== "win32") {
    // VoiceOver reads the group and each segment with its next-item command.
    for (let i = 0; i < 10; i++) {
      if ((await screenReader.spokenPhraseLog()).join(" ").includes("Month"))
        break;
      await screenReader.next();
      await traceState(`next ${i}`, page, screenReader);
    }
    spoken = (await screenReader.spokenPhraseLog()).join(" ");
  } else {
    spoken = await walkCompositeWithArrows(
      page,
      screenReader,
      // Tab lands on the checked segment; the arrows visit (and wrap to) the others.
      "purr-segmented-control",
      2,
    );
    await traceState("arrows", page, screenReader);
  }
  for (const text of ["Calendar range", "Day", "Week", "Month"])
    expect(spoken).toContain(text);
});
