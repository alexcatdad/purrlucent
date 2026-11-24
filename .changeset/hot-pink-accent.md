---
"purrlucent": minor
---

Hot pink accent on a near-neutral base. The accent is `--pl-color-hot-pink` (#ff69b4); its fill takes ink text, and pink text, focus rings and selection use a deeper pink of the same hue on a light page. Page, text and fills mix from `--pl-color-ink` and `--pl-color-paper` instead of navy and honeydew, and the destructive red, `--pl-color-red`, leans to orange, away from the pink.

Cards and table boxes are raised off the page with `--pl-color-raised`. Their edge, `--pl-color-frame`, is a hairline in light and clear in dark, where the fill alone separates them; increased contrast and forced colors keep the edge.

Rename in your own styles: `--pl-color-oxford-navy` to `--pl-color-ink`, `--pl-color-honeydew` to `--pl-color-paper`, `--pl-color-punch-red` to `--pl-color-red`. `--pl-color-cerulean` and `--pl-color-frosted-blue` are gone; use `--pl-color-hot-pink` or the role tokens. A custom dark accent needs `--pl-color-accent-foreground: #fff`.
