export type Placement =
  | "bottom-start"
  | "bottom-end"
  | "top-start"
  | "top-end"
  | "top"
  | "bottom"
  | "start"
  | "end";

/** The side of the anchor the overlay ended up on, after flipping. */
export type Side = "top" | "bottom" | "left" | "right";

/** Which edge of the anchor an overlay above or below it lines up with: its middle, or its start or end edge (mirrored under rtl). */
export type Align = "center" | "start" | "end";

/** The placement for a side and an alignment. `start` and `end` sides sit beside the anchor, centred, so they take no alignment. */
export const withAlign = (
  placement: "top" | "bottom" | "start" | "end",
  align: Align,
): Placement =>
  align !== "center" && (placement === "top" || placement === "bottom")
    ? (`${placement}-${align}` as Placement)
    : placement;

const INSET = 8;

const clamp = (value: number, size: number, viewport: number) =>
  Math.max(INSET, Math.min(value, viewport - INSET - size));

/**
 * Places `overlay` next to `anchor` in fixed coordinates, flips to the opposite side when the
 * preferred one has no room, and keeps an 8px viewport inset. Stands in for CSS anchor
 * positioning until Firefox supports it. "start" and "end" follow the anchor's text direction:
 * as a suffix they align the overlay's edge with the anchor's; alone they put the overlay beside
 * the anchor. "top" and "bottom" alone centre it. The overlay's margins are the gap to the
 * anchor. Returns the side it took.
 */
export function position(
  anchor: Element,
  overlay: HTMLElement,
  placement: Placement,
): Side {
  // Fixed first: an in-flow overlay can size differently (stretch, wrap).
  overlay.style.position = "fixed";
  const a = anchor.getBoundingClientRect();
  const { width, height } = overlay.getBoundingClientRect();
  const { clientWidth, clientHeight } = document.documentElement;
  const rtl = getComputedStyle(anchor).direction === "rtl";

  const style = getComputedStyle(overlay);
  const margin = (side: "Top" | "Bottom" | "Left" | "Right") =>
    parseFloat(style[`margin${side}`]) || 0;
  const outerH = height + margin("Top") + margin("Bottom");
  const outerW = width + margin("Left") + margin("Right");

  const [head = "", tail] = placement.split("-");
  const beside = head === "start" || head === "end";
  const fits = (start: number, size: number, viewport: number) =>
    start >= INSET && start + size <= viewport - INSET;
  const pick = (first: number, second: number, ok: (n: number) => boolean) =>
    ok(first) || !ok(second) ? first : second;

  if (beside) {
    const preferLeft = (head === "start") !== rtl;
    const before = a.left - outerW;
    const after = a.right;
    const [first, second] = preferLeft ? [before, after] : [after, before];
    const left = pick(first, second, (n) => fits(n, outerW, clientWidth));
    overlay.style.left = `${clamp(left, outerW, clientWidth)}px`;
    overlay.style.top = `${clamp(a.top + a.height / 2 - outerH / 2, outerH, clientHeight)}px`;
    return left === before ? "left" : "right";
  }

  const preferBelow = head === "bottom";
  const below = a.bottom;
  const above = a.top - outerH;
  const [first, second] = preferBelow ? [below, above] : [above, below];
  const top = pick(first, second, (n) => fits(n, outerH, clientHeight));
  const left = !tail
    ? a.left + a.width / 2 - outerW / 2
    : (tail === "start") !== rtl
      ? a.left - margin("Left")
      : a.right - width - margin("Left");
  overlay.style.top = `${clamp(top, outerH, clientHeight)}px`;
  overlay.style.left = `${clamp(left, tail ? width : outerW, clientWidth)}px`;
  return top === above ? "top" : "bottom";
}
