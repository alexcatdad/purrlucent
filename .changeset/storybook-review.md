---
"purrlucent": minor
---

Glass mode now covers the whole controls and navigation layer. Buttons, toggles, switches, sliders, checkboxes, radios, text fields, selects, comboboxes, number fields, date pickers, code inputs, prompt inputs, menubars, tabs, pagination, breadcrumbs, command palettes, toasts, banners and hover cards take the glass material, with a highlighted edge and a soft shadow. New tokens: `--pl-material-highlight`, `--pl-material-control`, `--pl-material-control-pressed`, `--pl-material-control-filter`, `--pl-material-capsule`, `--pl-material-field`, `--pl-material-float` and `--pl-elevation-control`. Content stays solid, and increased contrast, reduced transparency and forced colors still fall back to solid.

`pl-data-table` gains a built-in filter field (`filterable`, `filter`, `pl-filter`) and pagination (`page-size`, `page`, `pl-page`), plus a `model` property that renders a supplied table model: grouped headers, merged cells, group and expandable rows, aggregate footers, pinned rows and columns, column menus, per-column filters, resizing and cell selection.

The prose styles cover every text-level element. `pl-checkbox` gains `readonly`, `pl-collapsible` gains `disabled`, and `pl-banner` gains `no-icon`.

Fixes: the submenu surface and disabled checkbox border are visible, sort glyphs are easier to see, the toolbar centres its title, prompt input buttons sit inside the bar, message-scroller content stays clear of the jump button, date and calendar labels follow their locale, charts mirror in right-to-left layouts, and keyboard shortcuts keep their order in right-to-left text.
