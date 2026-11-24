---
"purrlucent": minor
---

Tooltip and popover: `pl-tooltip` takes rich, non-interactive content in a `content` slot (still `role="tooltip"`, still named by the target's `aria-describedby`). Both take `align` (`center`, `start`, `end`) for a panel above or below its trigger, mirrored under right-to-left text. New tokens `--pl-popover-max-inline-size` and `--pl-tooltip-max-inline-size` set the widest panel before its content wraps, so a long tooltip wraps instead of running on in one line. `--pl-tooltip-open-delay` sets the hover delay of a tooltip.
