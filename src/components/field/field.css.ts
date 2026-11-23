import { css } from "lit";

/*
 * The base is a grid of four named areas. Orientation only changes the
 * columns and the area map, so the container query for `responsive` sets two
 * custom properties and nothing else. Hidden parts add no rows of height and
 * no gaps: spacing is margin on the part, not row-gap.
 */
export const fieldStyles = css`
  :host {
    display: block;
    color: var(--pl-color-foreground);
    font: 400 var(--pl-text-sm) / var(--pl-leading-normal) var(--pl-font-sans);
  }

  :host([hidden]) {
    display: none;
  }

  :host([orientation="responsive"]) {
    container-type: inline-size;
  }

  [part="base"] {
    --_cols: minmax(0, 1fr);
    --_areas: "label" "control" "description" "error";
    --_label-gap: var(--pl-space-2);

    display: grid;
    grid-template-columns: var(--_cols);
    grid-template-areas: var(--_areas);
    column-gap: var(--pl-gap-form);
    align-items: start;
  }

  /* Label beside the control: text on one side, the control across its rows. */
  :host([orientation="horizontal"]) [part="base"] {
    --_cols: minmax(0, 1fr) minmax(0, 2fr);
    --_areas: "label control" "description control" "error control";
    --_label-gap: 0px;
  }

  :host([orientation="horizontal"]:state(control-first)) [part="base"] {
    --_cols: auto minmax(0, 1fr);
    --_areas: "control label" "control description" "control error";
  }

  @container (min-width: 32rem) {
    :host([orientation="responsive"]) [part="base"] {
      --_cols: minmax(0, 1fr) minmax(0, 2fr);
      --_areas: "label control" "description control" "error control";
      --_label-gap: 0px;
    }

    :host([orientation="responsive"]:state(control-first)) [part="base"] {
      --_cols: auto minmax(0, 1fr);
      --_areas: "control label" "control description" "control error";
    }
  }

  [part="label"] {
    grid-area: label;
    margin-block-end: var(--_label-gap);
    font-weight: 500;
    overflow-wrap: anywhere;
  }

  [part="control"] {
    grid-area: control;
    align-self: center;
    min-inline-size: 0;
  }

  /* The text controls fill their column; other controls keep their own size. */
  [part="control"]
    ::slotted(
      :is(
        pl-input,
        pl-textarea,
        pl-number-field,
        pl-select,
        pl-combobox,
        pl-date-picker,
        pl-input-group
      )
    ) {
    inline-size: 100%;
    max-inline-size: 100%;
  }

  :host(:state(control-first)) [part="control"] {
    align-self: start;
  }

  /* A toggle's label is the larger hit area on a coarse pointer. */
  :host(:state(control-first)) ::slotted([slot="label"]) {
    display: flex;
    align-items: center;
    min-block-size: var(--pl-size-hit-min);
  }

  [part="description"] {
    grid-area: description;
    margin-block-start: var(--pl-space-1);
    color: var(--pl-color-muted-foreground);
    overflow-wrap: anywhere;
  }

  [part="error"] {
    grid-area: error;
    display: flex;
    align-items: flex-start;
    gap: var(--pl-gap-icon);
    margin-block-start: var(--pl-space-1);
    color: var(--pl-color-destructive-text);
    font-size: var(--pl-text-xs);
    overflow-wrap: anywhere;
  }

  [part="error"] svg {
    flex: none;
    inline-size: var(--pl-icon-md);
    block-size: auto;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  [hidden] {
    display: none;
  }

  @media (forced-colors: active) {
    [part="description"],
    [part="error"] {
      color: CanvasText;
    }
  }
`;
