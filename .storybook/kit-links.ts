import { NAVIGATE_URL } from "storybook/internal/core-events";
import { addons } from "storybook/preview-api";

/** Use the manager router for ordinary clicks and the link's href for modified clicks. */
export function openKitStory(event: MouseEvent, url: URL) {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey
  )
    return;
  event.preventDefault();
  addons.getChannel().emit(NAVIGATE_URL, url.pathname + url.search + url.hash);
}
