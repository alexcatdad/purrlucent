/** The bounds of one panel, in percent of the group. */
export interface Limits {
  min: number;
  max: number;
}

const round = (n: number) => Math.round(n * 1e3) / 1e3;

export const rounded = (sizes: number[]) => sizes.map(round);

const given = (size: number | undefined): size is number =>
  size !== undefined && Number.isFinite(size) && size > 0;

/**
 * The starting sizes: a collapsed panel is 0, a panel with a `size` keeps it,
 * and the others share what is left. The result is scaled to add up to 100.
 */
export function initialSizes(
  specs: { size: number | undefined; closed: boolean }[],
): number[] {
  const open = specs.filter((spec) => !spec.closed);
  const taken = open.reduce(
    (sum, { size }) => sum + (given(size) ? size : 0),
    0,
  );
  const missing = open.filter(({ size }) => !given(size)).length;
  const fill =
    missing > 0 ? (taken < 100 ? 100 - taken : 100 / open.length) / missing : 0;
  const raw = specs.map(({ size, closed }) =>
    closed ? 0 : given(size) ? size : fill,
  );
  const total = raw.reduce((sum, size) => sum + size, 0);
  return total > 0 ? raw.map((size) => round((size * 100) / total)) : raw;
}

/** What the first of the panels `i` and `i + 1` may be: the bounds of both, together. */
export function span(sizes: number[], i: number, limits: Limits[]) {
  const pair = sizes[i]! + sizes[i + 1]!;
  return {
    lo: Math.max(limits[i]!.min, pair - limits[i + 1]!.max),
    hi: Math.min(limits[i]!.max, pair - limits[i + 1]!.min),
  };
}

/** Moves the divider between panels `i` and `i + 1` so the first is `target`, held within both panels' limits. */
export function resizePair(
  sizes: number[],
  i: number,
  target: number,
  limits: Limits[],
): number[] {
  const { lo, hi } = span(sizes, i, limits);
  if (lo > hi) return sizes;
  const first = round(Math.min(hi, Math.max(lo, target)));
  const next = [...sizes];
  next[i] = first;
  next[i + 1] = round(sizes[i]! + sizes[i + 1]! - first);
  return next;
}

/** Collapses panel `i`: the open panels share its space in proportion. Unchanged when it is the only open panel. */
export function collapseAt(sizes: number[], closed: boolean[], i: number) {
  const rest = 100 - sizes[i]!;
  if (rest <= 0 || !closed.some((c, j) => !c && j !== i)) return sizes;
  return sizes.map((size, j) =>
    j === i || closed[j] ? 0 : round((size * 100) / rest),
  );
}

/** Opens panel `i` at `size`: the open panels give up that much, in proportion. */
export function expandAt(sizes: number[], i: number, size: number) {
  return sizes.map((s, j) =>
    j === i ? size : round((s * (100 - size)) / 100),
  );
}
