import { svg } from "lit";

/** An exclamation in a circle: a field's validation message and a destructive banner. */
export const errorGlyph = svg`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M12 8v4" /><path d="M12 16h.01" /></svg>`;

/** A chevron for a Back item. It points left; mirror it under right-to-left. Slot it into an icon `purr-button` that has an `aria-label`. */
export const backGlyph = svg`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m14.5 5.5-6 6.5 6 6.5" /></svg>`;

/** A cross for a Close item and the banner's close button. Slot it into an icon `purr-button` that has an `aria-label`. */
export const closeGlyph = svg`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></svg>`;
