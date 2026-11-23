# HIG audit: empty

Source: [HIG Loading](https://developer.apple.com/design/human-interface-guidelines/loading) and [HIG Writing](https://developer.apple.com/design/human-interface-guidelines/writing). Code: `src/components/empty/`, `hig/rules/loading.yaml`, `hig/rules/writing.yaml`.

Verdicts: **met**, **gap**, **deviation** (deliberate, with a reason), or **needs eyes** (a visual judgement for the maintainer). Rows marked "not stated on the HIG page" are web platform behavior. Nothing was run for this audit; the verdicts come from reading the source, stories and e2e files. The HIG pages could not be fetched as text, so the wording is from general knowledge of them and should be checked against them.

## Library guidelines

| Guideline                                                                 | Verdict    | Evidence                                                                                                                                     |
| ------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| An empty state is not a loader.                                           | met        | No motion or progress role; the icon is a static tile (`empty.css.ts:43-65`). Rule loading/1 is a rubric check.                              |
| It is plain content, not an announcement.                                 | met        | No role or live region (`empty.ts:19-27`). E2E: "it is not a live region" (`empty.e2e.ts:59`). Rule loading/2.                               |
| It offers a next step and reserves no space without one.                  | met        | The icon and action wrappers show only when something is slotted (`empty.css.ts:43-49`, `:67-72`). E2E at `empty.e2e.ts:43`. Rule loading/3. |
| It is centered, in the order icon, text, action.                          | met        | A centered flex column (`empty.css.ts:7-16`). E2E at `empty.e2e.ts:24` and `:32`. Rules loading/4 and loading/5.                             |
| Empty states say what is missing and offer a clear next step (writing/6). | needs eyes | The slots invite it; the words are the app's. The stories model it ("No projects", "Create project").                                        |
| (Platform behavior) Text wraps at 200% text zoom.                         | met        | `overflow-wrap: anywhere` (`empty.css.ts:20-23`). E2E at `empty.e2e.ts:73`.                                                                  |
| (Platform behavior) Forced colors drop the icon tile fill.                | met        | `empty.css.ts:74-78`.                                                                                                                        |
| (Platform behavior) Sizes and type scale.                                 | needs eyes | Icon tile is 12 spacing steps; the title is `--pl-text-lg`. HIG gives no values.                                                             |

## Usage guidelines (for `docs/components.md`, not the component)

- Use the title for what is missing and the description for why or what to do.
- Start the action label with a verb (writing/3).
- Use `pl-spinner` while content is loading, and swap to this only when loading ends with nothing to show.
- Say that loading failed in an error message, not here.

## Not verified

- No test, Storybook or browser was run.
