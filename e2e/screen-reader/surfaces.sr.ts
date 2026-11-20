import {
  NVDAKeyCodeCommands,
  WindowsKeyCodes,
  WindowsModifiers,
} from "@guidepup/guidepup";
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
  if (process.platform === "win32") {
    // Guidepup's NVDA setup tabs to the first focusable item, the field shell's
    // text input, which leaves NVDA in focus mode re-reading the input. Blur it,
    // return to browse mode and start reading from the top of the page.
    await page.evaluate(() =>
      (document.activeElement as HTMLElement | null)?.blur(),
    );
    await screenReader.perform(NVDAKeyCodeCommands.exitFocusMode);
    await screenReader.perform({
      keyCode: [WindowsKeyCodes.Home],
      modifiers: [WindowsModifiers.Control],
    });
    await screenReader.clearSpokenPhraseLog();
  }
  for (let i = 0; i < 10; i++) {
    if ((await screenReader.spokenPhraseLog()).join(" ").includes("List row"))
      break;
    await screenReader.next();
  }
  const spoken = (await screenReader.spokenPhraseLog()).join(" ");
  for (const text of ["Bar", "Panel", "Sheet", "List row"])
    expect(spoken).toContain(text);
});
