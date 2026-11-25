import { css } from "lit";

/*
 * The shell is one box behind the addons and the field row of the input: it
 * draws the fill, edge and focus ring that the input gives up while grouped.
 * The group measures the input's field and sets --_top and --_h, so the shell
 * and the addons line up with it, below a label and above a message.
 */
export const inputGroupStyles = css`
  :host {
    --_top: 0px;
    --_h: var(--pl-size-md);
    --_pad: var(--pl-pad-control);
    --_edge: var(--pl-color-input-border);

    position: relative;
    isolation: isolate;
    display: inline-grid;
    /*
     * The addon columns take their content's full width: Firefox counts a
     * button label's overflow-wrap: anywhere in an auto column's minimum
     * despite nowrap, and would squeeze the button below its text.
     */
    grid-template-columns:
      max-content minmax(calc(var(--pl-spacing) * 20), 1fr)
      max-content;
    inline-size: calc(var(--pl-spacing) * 40);
    /* Wide addons or large text grow the group instead of squeezing the field. */
    min-inline-size: min-content;
    max-inline-size: 100%;
    color: var(--pl-color-foreground);
    font: 400 var(--pl-text-sm) / var(--pl-leading-normal) var(--pl-font-sans);
  }

  :host([hidden]) {
    display: none;
  }

  :host(:state(textarea)) {
    inline-size: calc(var(--pl-spacing) * 60);
  }

  :host(:state(xl)) {
    --_pad: var(--pl-pad-control-xl);
  }

  :host(:state(invalid)) {
    --_edge: var(--pl-color-destructive);
  }

  [part="shell"] {
    box-sizing: border-box;
    position: absolute;
    z-index: -1;
    inset-block-start: var(--_top);
    inset-inline: 0;
    block-size: var(--_h);
    border-radius: var(--pl-radius-control);
    background: var(--pl-material-field);
    backdrop-filter: var(--pl-lens,) var(--pl-material-control-filter);
    box-shadow:
      var(--pl-material-edge),
      0 0 0 1px var(--_edge);
    outline: var(--pl-ring-width) solid transparent;
    outline-offset: var(--pl-ring-offset);
    pointer-events: none;
    transition:
      background-color var(--pl-duration-fast) var(--pl-ease-out),
      box-shadow var(--pl-duration-fast) var(--pl-ease-out),
      outline-color var(--pl-duration-fast) var(--pl-ease-out);
  }

  :host(:state(focused)) [part="shell"] {
    outline-color: var(--pl-color-ring);
  }

  :host(:state(disabled)) [part="shell"] {
    background: var(--pl-color-muted-disabled);
    box-shadow: 0 0 0 1px var(--pl-color-border);
  }

  ::slotted(pl-input),
  ::slotted(pl-textarea) {
    grid-column: 2;
    inline-size: auto;
    min-inline-size: 0;
  }

  /* An addon sits in the field row, as tall as the field. */
  ::slotted([slot="start"]),
  ::slotted([slot="end"]) {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    align-self: start;
    gap: var(--pl-gap-icon);
    margin-block-start: var(--_top);
    block-size: var(--_h);
    white-space: nowrap;
  }

  /* A button keeps its own colours; text and icon addons are muted. */
  ::slotted([slot="start"]:not(pl-button)),
  ::slotted([slot="end"]:not(pl-button)) {
    color: var(--pl-color-muted-foreground);
  }

  ::slotted([slot="start"]) {
    grid-column: 1;
    padding-inline: var(--_pad) 0;
  }

  ::slotted([slot="end"]) {
    grid-column: 3;
    padding-inline: 0 var(--_pad);
  }

  /* A button fills its end of the field and brings its own padding and face. */
  ::slotted(pl-button[slot]) {
    padding-block: 0;
    box-shadow: none;
  }

  ::slotted(pl-button[slot="start"]) {
    padding-inline: var(--_pad);
    border-start-end-radius: 0;
    border-end-end-radius: 0;
  }

  ::slotted(pl-button[slot="end"]) {
    padding-inline: var(--_pad);
    border-start-start-radius: 0;
    border-end-start-radius: 0;
  }

  ::slotted(svg[slot]) {
    flex: none;
    inline-size: var(--pl-icon-md);
    block-size: var(--pl-icon-md);
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  /* A multi-line field is tall: the addon stays beside its first line. */
  :host(:state(textarea)) ::slotted([slot="start"]),
  :host(:state(textarea)) ::slotted([slot="end"]) {
    align-items: flex-start;
    padding-block: var(--pl-space-1);
  }

  :host(:state(disabled)) ::slotted([slot]:not(pl-button)) {
    color: var(--pl-color-disabled-foreground);
  }

  @media (forced-colors: active) {
    [part="shell"] {
      border: 1px solid ButtonText;
      background: Field;
      box-shadow: none;
      forced-color-adjust: none;
    }

    :host(:state(focused)) [part="shell"] {
      outline-color: Highlight;
    }

    :host(:state(invalid)) [part="shell"] {
      border-style: dashed;
    }

    :host(:state(disabled)) [part="shell"] {
      border-color: GrayText;
      background: Field;
    }

    ::slotted([slot]:not(pl-button)) {
      color: FieldText;
    }

    :host(:state(disabled)) ::slotted([slot]:not(pl-button)) {
      color: GrayText;
    }
  }
`;
