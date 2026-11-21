/**
 * The index of the option a type-ahead `query` points at, or -1. A single
 * character moves on from `from` and wraps, so repeating it cycles through
 * the options that start with it; a longer query may keep `from` itself.
 */
export function matchIndex(
  labels: string[],
  query: string,
  from: number,
): number {
  const needle = query.toLowerCase();
  const start = needle.length === 1 ? from + 1 : Math.max(from, 0);
  for (let i = 0; i < labels.length; i++) {
    const index = (start + i) % labels.length;
    if (labels[index]!.toLowerCase().startsWith(needle)) return index;
  }
  return -1;
}

/**
 * The indexes of the labels that match `query`, case-insensitively: those that
 * start with it first, then those that merely contain it, each in list order.
 * An empty query matches every label.
 */
export function filterIndexes(labels: string[], query: string): number[] {
  const needle = query.toLowerCase();
  const found = labels
    .map((label, index) => ({ at: label.toLowerCase().indexOf(needle), index }))
    .filter(({ at }) => at >= 0);
  return [
    ...found.filter(({ at }) => at === 0),
    ...found.filter(({ at }) => at > 0),
  ].map(({ index }) => index);
}
