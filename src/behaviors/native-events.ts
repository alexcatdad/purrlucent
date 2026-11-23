/**
 * Fires the native `input` or `change` event a native control would, after the
 * element's own purr-* event, so React's `onInput` and `onChange` and form
 * libraries that listen for them see the edit. As with a native control,
 * `input` crosses shadow roots and `change` does not.
 */
export function fireNative(
  host: EventTarget,
  ...types: ("input" | "change")[]
) {
  for (const type of types)
    host.dispatchEvent(
      new Event(type, { bubbles: true, composed: type === "input" }),
    );
}
