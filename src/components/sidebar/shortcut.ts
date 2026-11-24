type Keys = Pick<
  KeyboardEvent,
  "key" | "code" | "ctrlKey" | "metaKey" | "altKey" | "shiftKey"
>;

/**
 * True when a key event is the shortcut `spec`: `+`-separated modifiers and a
 * key, such as "mod+b" or "alt+shift+s". `mod` is Command on Apple platforms
 * and Control elsewhere. Modifiers must match exactly. A letter or digit also
 * matches by position, so Option on a Mac, which changes the typed character,
 * still works.
 */
export function matchesShortcut(event: Keys, spec: string, apple: boolean) {
  const parts = spec.toLowerCase().split("+");
  const key = parts.pop()?.trim();
  if (!key) return false;
  const mods = new Set(parts.map((part) => part.trim()));
  const mod = mods.has("mod");
  const wanted = {
    ctrlKey: mods.has("ctrl") || (mod && !apple),
    metaKey: mods.has("meta") || mods.has("cmd") || (mod && apple),
    altKey: mods.has("alt") || mods.has("option"),
    shiftKey: mods.has("shift"),
  };
  if (
    event.ctrlKey !== wanted.ctrlKey ||
    event.metaKey !== wanted.metaKey ||
    event.altKey !== wanted.altKey ||
    event.shiftKey !== wanted.shiftKey
  )
    return false;
  return (
    event.key.toLowerCase() === key ||
    event.code.toLowerCase() === `key${key}` ||
    event.code === `Digit${key}`
  );
}

/** True on macOS and iOS, where `mod` is Command. */
export const isApple = () =>
  /mac|iphone|ipad/i.test(
    (navigator as { userAgentData?: { platform?: string } }).userAgentData
      ?.platform ?? navigator.platform,
  );
