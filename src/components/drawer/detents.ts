export type Detent = "medium" | "large";

/** The detents from smallest to largest. */
const order: readonly Detent[] = ["medium", "large"];

/** The detents named in a space-separated list, smallest first; unknown words are ignored. */
export function parseDetents(value: string | null | undefined): Detent[] {
  const words = (value ?? "").split(/\s+/);
  return order.filter((detent) => words.includes(detent));
}

/** The next larger (`1`) or smaller (`-1`) detent, or `undefined` past either end. */
export function stepDetent(
  detents: readonly Detent[],
  current: Detent,
  direction: 1 | -1,
): Detent | undefined {
  return detents[detents.indexOf(current) + direction];
}

export type Settled = Detent | "close" | "stay";

// How far ahead a flick is projected, so a fast short drag counts as a long one.
const lookahead = 120;

/**
 * Where a vertical drag of a bottom sheet comes to rest. `dy` is how far the
 * pointer moved down in px (negative is up) and `velocity` its speed in px per
 * ms at release. A drag past half the height closes; past a fifth steps down
 * to the next smaller detent, or closes when there is none; a tenth upward
 * steps to the next larger detent. Anything less snaps back.
 */
export function settle(options: {
  dy: number;
  velocity: number;
  height: number;
  detent: Detent;
  detents: readonly Detent[];
}): Settled {
  const { dy, velocity, height, detent, detents } = options;
  const ratio = (dy + velocity * lookahead) / height;
  if (ratio < -0.1) return stepDetent(detents, detent, 1) ?? "stay";
  if (ratio > 0.5) return "close";
  if (ratio > 0.2) return stepDetent(detents, detent, -1) ?? "close";
  return "stay";
}
