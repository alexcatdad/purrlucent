/**
 * The value a toggle group should hold: `value` when a item has it,
 * else the item marked `selected`, else the first item. A control always
 * has one selection when it has any item.
 */
export function pickValue(
  items: { value: string; selected: boolean }[],
  value: string,
): string | undefined {
  if (items.some((s) => s.value === value)) return value;
  return (items.find((s) => s.selected) ?? items[0])?.value;
}
