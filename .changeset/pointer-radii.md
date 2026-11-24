---
"purrlucent": minor
---

Radii by role and pointer. `--pl-radius` and `--pl-radius-lg` are replaced by `--pl-radius-control` (8px, 12px for a coarse pointer) for buttons, fields and groups, and `--pl-radius-panel` (16px) for dialogs, popovers, menus, sheets and sidebars. Two follow from them so nested curves stay parallel: `--pl-radius-control-inner` (control minus 2px) and `--pl-radius-row` (panel minus its padding) for menu and list rows. Rename `--pl-radius` to `--pl-radius-control` and `--pl-radius-lg` to `--pl-radius-panel` in your own styles.
