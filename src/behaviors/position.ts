export type Placement = "bottom-start" | "bottom-end" | "top-start" | "top-end";

const INSET = 8;

const clamp = (value: number, size: number, viewport: number) =>
  Math.max(INSET, Math.min(value, viewport - INSET - size));

/**
 * Places `overlay` next to `anchor` in fixed coordinates, flips vertically when the preferred
 * side has no room, and keeps an 8px viewport inset. Stands in for CSS anchor positioning
 * until Firefox supports it. "start" and "end" follow the anchor's text direction.
 */
export function position(
  anchor: Element,
  overlay: HTMLElement,
  placement: Placement,
): void {
  const a = anchor.getBoundingClientRect();
  const { width, height } = overlay.getBoundingClientRect();
  const { clientWidth, clientHeight } = document.documentElement;
  const rtl = getComputedStyle(anchor).direction === "rtl";

  const below = a.bottom;
  const above = a.top - height;
  const preferBelow = placement.startsWith("bottom");
  const fits = (top: number) =>
    top >= INSET && top + height <= clientHeight - INSET;
  const [first, second] = preferBelow ? [below, above] : [above, below];
  const top = fits(first) || !fits(second) ? first : second;

  const alignLeft = placement.endsWith("start") !== rtl;
  const left = alignLeft ? a.left : a.right - width;

  overlay.style.position = "fixed";
  overlay.style.top = `${clamp(top, height, clientHeight)}px`;
  overlay.style.left = `${clamp(left, width, clientWidth)}px`;
}
