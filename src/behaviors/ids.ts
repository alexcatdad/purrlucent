let count = 0;

/** Gives an element an id when it has none, so another element can refer to it. */
export const idOf = (el: Element, prefix: string) =>
  (el.id ||= `${prefix}-${++count}`);
