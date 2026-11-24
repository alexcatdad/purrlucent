import { svg } from "lit";

/** An exclamation in a circle: a field's validation message and a destructive banner. */
export const errorGlyph = svg`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M12 8v4" /><path d="M12 16h.01" /></svg>`;

/** A chevron for a Back item. It points left; mirror it under right-to-left. Slot it into an icon `pl-button` that has an `aria-label`. */
export const backGlyph = svg`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m14.5 5.5-6 6.5 6 6.5" /></svg>`;

/** A cross for a Close item and the banner's close button. Slot it into an icon `pl-button` that has an `aria-label`. */
export const closeGlyph = svg`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></svg>`;

/** A check in a circle: a success banner or toast. */
export const successGlyph = svg`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M8.5 12.5l2.5 2.5l4.5 -5" /></svg>`;

/** An exclamation in a triangle: a warning banner or toast. */
export const warningGlyph = svg`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.3 4.2l-7.4 12.8a2 2 0 0 0 1.7 3h14.8a2 2 0 0 0 1.7 -3l-7.4 -12.8a2 2 0 0 0 -3.4 0" /><path d="M12 9v4" /><path d="M12 16.5h.01" /></svg>`;
