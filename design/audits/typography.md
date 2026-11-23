# HIG audit: prose typography

Source: [HIG Typography](https://developer.apple.com/design/human-interface-guidelines/typography), read 2026-11-23 (change log: December 16, 2025). Code: `src/typography/typography.css.ts`, `hig/rules/typography.yaml`. The stylesheet is not an element: it styles content inside a `.pl-prose` container. Verdicts: **met**, **gap**, **deviation**, or **needs eyes**. Rows marked "not stated on the HIG page" are web behavior.

## Prose styles (`proseStyles`)

| Guideline (HIG wording, shortened)                                       | Verdict    | Evidence                                                                                                                                                                                                                                                                 |
| ------------------------------------------------------------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Hierarchy from weight, size and color.                                   | met        | Heading sizes step down from `--pl-text-xl` to `--pl-text-base`, all bold or semibold; quotes use `--pl-color-muted-foreground` (`typography.css.ts:42-59,90`). E2E: "headings step down in size and every heading is bold" (`typography.e2e.ts:42`). Rule typography/9. |
| Hierarchy holds when text is enlarged.                                   | met        | Sizes are root-relative tokens and leading is derived with `calc()` from them (`typography.css.ts:44,49`). E2E: "no horizontal overflow at 200% text zoom" (`typography.e2e.ts:153`).                                                                                    |
| Avoid thin and light weights; use regular and heavier.                   | met        | Weights are 400, 600 and 700 (`typography.css.ts:22,38,58,115`). E2E: "no text is lighter than regular weight" (`typography.e2e.ts:59`). Rule typography/10.                                                                                                             |
| Few typefaces.                                                           | met        | Two families: `--pl-font-sans` and `--pl-font-mono` for code (`typography.css.ts:20,97`).                                                                                                                                                                                |
| Loose leading for long passages; tight only where height is constrained. | met        | Body and paragraphs use `--pl-leading-loose`; lists and tables use `--pl-leading-normal` (`typography.css.ts:23,74,105`). E2E: "paragraphs use loose leading and every line height clears the font size" (`typography.e2e.ts:77`). Rule typography/11.                   |
| Readable sizes.                                                          | met        | Body is `--pl-text-base`; inline code `--pl-text-sm` (`typography.css.ts:21,98`). E2E: "body text is at least 13 CSS pixels and code is not smaller than 12" (`typography.e2e.ts:69`). Rule typography/12.                                                               |
| Use the named set of text styles.                                        | met        | Every size and leading reads a `--pl-text-*` or `--pl-leading-*` token; no typed-in lengths (`scripts/style-check.ts` passes).                                                                                                                                           |
| (Platform behavior) Start alignment and right-to-left.                   | met        | Cells use `text-align: start`; the quote bar and list indent are logical (`typography.css.ts:111,88-89`). E2E at `typography.e2e.ts:119,129`. Not stated on the HIG page.                                                                                                |
| (Platform behavior) Links, code and quotes under forced colors.          | met        | Links use `LinkText`; code and quote edges use `CanvasText` (`typography.css.ts:134-150`). E2E at `typography.e2e.ts:140`. Not stated on the HIG page.                                                                                                                   |
| (Platform behavior) Heading sizes are close together.                    | needs eyes | The token scale tops out at `--pl-text-xl`, so h2, h3 and h4 differ mainly by weight and spacing. Check the hierarchy against a long document.                                                                                                                           |
| (Platform behavior) Measure.                                             | needs eyes | Container width is capped at 170 spacing steps (680px), a common reading width. HIG gives no value.                                                                                                                                                                      |

## Usage guidelines

- Add the stylesheet once and put the class `pl-prose` on the container; load `tokens.css` as well.
- Use headings in order; the levels are for structure, not size.

## Not verified

- Nothing was run in a browser; the e2e results above are read from the test files, not executed.
- The first 100,000 characters of the HIG page were read; the Dynamic Type tables were not compared.
