/**
 * A slotchange listener that hides the slot's wrapper while nothing is assigned,
 * so an empty section adds no gap. `:host(:has(...))` would say this in CSS,
 * but browsers do not match `:has()` inside `:host()`.
 */
export function hideWhenEmpty(event: Event) {
  const slot = event.target as HTMLSlotElement;
  slot.parentElement?.toggleAttribute(
    "hidden",
    slot.assignedElements({ flatten: true }).length === 0,
  );
}
