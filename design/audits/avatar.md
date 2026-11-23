# HIG audit: avatar

Source: the HIG has no avatar page. [HIG Images](https://developer.apple.com/design/human-interface-guidelines/images), read 2026-11-23, covers resolution, formats and platform image layers only, so it is listed in `hig/out-of-scope.yaml` and no rule file is added. Code: `src/components/avatar/`.

Verdicts: **met**, **gap**, **deviation** (deliberate, with a reason), or **needs eyes** (a visual judgement for the maintainer). Every row is platform behavior, checked against the web platform and WAI-ARIA, not against Apple's text. Nothing was run: the e2e tests cited were read, not executed.

| Guidance                                                                           | Verdict    | Evidence                                                                                                                                                                                                                                                                  |
| ---------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| (Platform behavior) A picture that cannot load is replaced by a fallback.          | met        | An `error` event sets the status to `error`, which removes the image and keeps the initials (`avatar.ts:64-80`). E2E: "an image that fails to load falls back to the initials" (`avatar.e2e.ts`).                                                                         |
| (Platform behavior) No `src` shows the initials of the name.                       | met        | `initialsOf` takes the first letter of the first and last word (`avatar.ts:5`). E2E: "without a src the initials of the name show".                                                                                                                                       |
| (Platform behavior) The name is read once.                                         | met        | With a `name` the host has `role="img"` and `aria-label` (`avatar.ts:58-59`); the initials and the picture are `aria-hidden` (`avatar.ts:68,76`). E2E: "the host carries the name and the initials and picture are hidden", virtual screen reader test.                   |
| (Platform behavior) With no name the avatar is decorative.                         | met        | The role and label are removed when `name` is empty (`avatar.ts:52-56`). E2E: "without a name the avatar has no role and no name". An app that sets its own `role` is left alone.                                                                                         |
| (Platform behavior) The initials are already there while an image loads.           | met        | The initials render until the image reports `load` (`avatar.ts:65-70`), and they share one grid cell with the image (`avatar.css.ts`, `[part="initials"]`).                                                                                                               |
| (Platform behavior) A new `src` starts over.                                       | met        | `willUpdate` resets the status to `loading` when `src` changes (`avatar.ts:51`). E2E: "changing the name and src updates the avatar".                                                                                                                                     |
| (Platform behavior) Sizes.                                                         | needs eyes | `sm`, `md`, `lg`, `xl` are 24, 32, 40 and 48px from `--pl-spacing` (`avatar.css.ts`), `md` default as in `pl-spinner`. The avatar is not interactive, so the hit-target minimum does not apply. E2E: "sizes grow from sm to xl and stay round".                           |
| (Platform behavior) Contrast of the initials, forced colors, increased contrast.   | met        | Text is `--pl-color-foreground` on `--pl-color-muted-1`, both of which strengthen under increased contrast (`tokens.css`). Forced colors draw a `ButtonText` border on `Canvas`. E2E: "the avatar keeps a visible border under forced colors"; axe on the initials story. |
| (Platform behavior) Right-to-left and text zoom.                                   | met        | Only symmetric, logical properties are used. E2E: "no horizontal overflow at 200% text zoom".                                                                                                                                                                             |
| (Platform behavior) Initials for names without spaces, or in scripts without them. | needs eyes | One word gives one letter. Names in scripts that do not use capitals or spaces show their first character. Whether that is right for every language is the maintainer's call.                                                                                             |

## Usage guidelines (for `docs/components.md`)

- Pass `name` so the avatar has an accessible name; leave it out only when the person's name is next to the avatar in text.
- Give `src` a picture of the person; the avatar does not crop to a face, it covers the circle.

## Not verified

- The HIG images page was read through its published data on 2026-11-23; no illustrations were viewed.
- Nothing was run in a browser.
