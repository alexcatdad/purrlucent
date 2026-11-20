/**
 * The value a segmented control should hold: `value` when a segment has it,
 * else the segment marked `selected`, else the first segment. A control always
 * has one selection when it has any segment.
 */
export function pickValue(
  segments: { value: string; selected: boolean }[],
  value: string,
): string | undefined {
  if (segments.some((s) => s.value === value)) return value;
  return (segments.find((s) => s.selected) ?? segments[0])?.value;
}
