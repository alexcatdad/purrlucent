# Design decisions

Decisions that apply across components, made after the per-component HIG audits in `design/audits/`. `src/tokens/tokens.css` stays the source of truth for values.

## 2026-11-22

1. **Label weight: Regular (400).** Control labels (buttons, checkbox, switch, radio, segmented control, fields, select, combobox, menu items) use Regular, as HIG's macOS Body style does (13pt Regular, emphasized weight Semibold). Semibold stays for emphasis, such as a selected segment or a heading.
2. **Visible labels on select and combobox: a named `label` slot.** `slot="label"` shows a visible label that also names the control. The `label` attribute stays for an accessible name without visible text, and an external `<label for>` names the control too, as with `pl-input`.
3. **Dialog default and cancel buttons: explicit roles.** `pl-button` gets `default` and `cancel` attributes. In a dialog, Return activates the default button (not from a multi-line text area), and Escape or Command-Period activates the cancel button. The default button draws as primary. A destructive button cannot be the default; the dialog warns.
4. **Hit size with a fine pointer: the default control height, 32px (changed 2026-11-24 from 24px).** HIG's macOS default control size is 28×28pt and its minimum 20×20pt; 32px reads better at web text sizes. The hit size never drops below 24px, WCAG 2.2 AA's target minimum. A coarse pointer keeps 44px, HIG's iOS default control size.
5. **No state shown by color alone.**
   - An invalid text field (input, textarea, number field) shows its validation message below the field, with an icon, linked through `aria-describedby`. The message defaults to the native one and can be overridden.
   - A selected toggle button gets a filled face, like a selected segment.
   - Each banner tone draws its own default icon (info, warning, error) unless one is slotted.
6. **Built-in strings: native messages plus attributes.** Validation uses the browser's localized message where a native input exists to borrow it from. Every other built-in string gets an attribute (for example `empty-label`, `toggle-label`), as `close-label` already works on the banner. There is no global string table.
7. **Switch: `md` is the mini size.** Its track has its own heights (24, 28 and 36px), smaller than the control heights, and is 2.25 times as wide as it is tall at every size. A hierarchy uses `lg` or `xl` for the primary switch and `md` for the rest.
8. **Popover: size is not animated.** The panel only fades in; size changes come from app-driven content swaps, and the arrow and position would have to follow every frame.
9. **Context menu: item order is kept when the menu opens above.** Reversing the items would split the visual order from the DOM and keyboard order, or change nodes the app owns. Apps put the most used items first.
10. **Menu: no iOS icon-row layout.** It is a single-platform layout; every item is one row.
11. **Sidebar: no customize mode, no `sm` size, every row a tab stop.** Customizing is an app feature, the system size setting cannot be read on the web, and the sidebar is a navigation landmark of links, not a tree.
12. **Tab bar: later, as its own component.** Below 600px the sidebar collapses; the app supplies its own navigation until then.
13. **Slider: no vertical orientation, end icons, tick labels or circular dial for now.** They wait until an app needs them; an app can place icons and labels beside the slider.
14. **Toolbar: wraps, with no overflow menu for now.** Wrapping keeps every item reachable; an overflow menu waits until an app needs it.
15. **Banner: always dismissible.** A notice the person must keep belongs on another surface.
16. **Text field: the clear button stays search-only, with no leading or trailing slots.** This matches macOS text fields; slots wait until an app needs them.
17. **Not for the web:** spring loading, iOS context-menu previews, visionOS menu effects, the hover tooltip on a slider value (the value is exposed through `aria-valuenow`) and toolbar customization.
