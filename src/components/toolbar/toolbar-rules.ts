/** Describes how a toolbar's emphasized items break the placement rule, or returns undefined when they follow it. `flags` lists each item in order: true when it is prominent. */
export function prominentIssue(flags: boolean[]): string | undefined {
  const count = flags.filter(Boolean).length;
  if (count > 1)
    return `A toolbar has at most one prominent item, found ${count}.`;
  if (count === 1 && !flags[flags.length - 1])
    return "The prominent item belongs at the trailing end of the toolbar.";
  return undefined;
}
