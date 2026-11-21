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
