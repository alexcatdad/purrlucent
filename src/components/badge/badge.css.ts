import { css } from "lit";

/*
 * A pill. The three variants pair a fill with the foreground token made for it,
 * the same pairs the buttons use, so the text keeps its contrast in every color
 * scheme. A badge with one short glyph or digit stays round.
 */
export const badgeStyles = css`
  :host {
    --_fill: var(--pl-color-muted-3);
    --_text: var(--pl-color-foreground);

    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    min-inline-size: calc(var(--pl-leading-normal) + var(--pl-space-1));
    block-size: calc(var(--pl-leading-normal) + var(--pl-space-1));
    padding-inline: var(--pl-space-1);
    border: 1px solid transparent;
    border-radius: var(--pl-radius-full);
    background: var(--_fill);
    color: var(--_text);
    font: 600 var(--pl-text-xs) / 1 var(--pl-font-sans);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    vertical-align: middle;
  }

  :host(:state(text)) {
    padding-inline: var(--pl-space-2);
  }

  /* The label sets its own color, so a container that colors slotted content
     (a sidebar item's detail slot) cannot take the text off its fill. */
  [part="label"] {
    color: var(--_text);
  }

  :host([hidden]) {
    display: none;
  }

  :host([variant="accent"]) {
    --_fill: var(--pl-color-accent);
    --_text: var(--pl-color-accent-foreground);
  }

  :host([variant="destructive"]) {
    --_fill: var(--pl-color-destructive);
    --_text: var(--pl-color-destructive-foreground);
  }

  :host([variant="success"]) {
    --_fill: var(--pl-color-success);
    --_text: var(--pl-color-success-foreground);
  }

  :host([variant="warning"]) {
    --_fill: var(--pl-color-warning);
    --_text: var(--pl-color-warning-foreground);
  }

  /* A status pill: the neutral fill, and the tone's mark color on a dot. */
  :host([dot]) {
    --_fill: var(--pl-color-muted-3);
    --_text: var(--pl-color-foreground);
    --_dot: var(--pl-color-neutral-mark);

    gap: var(--pl-space-1);
    padding-inline: var(--pl-space-2);
  }

  :host([dot][variant="accent"]) {
    --_dot: var(--pl-color-accent-mark);
  }

  :host([dot][variant="success"]) {
    --_dot: var(--pl-color-success-mark);
  }

  :host([dot][variant="warning"]) {
    --_dot: var(--pl-color-warning-mark);
  }

  :host([dot][variant="destructive"]) {
    --_dot: var(--pl-color-destructive-mark);
  }

  /*
   * Soft and outline. Each variant names its tint (the solid fill), its edge
   * (the tone's mark) and its ink (the tone's text color). The text is that ink
   * mixed toward the foreground, which keeps 4.5:1 on the light tint in light
   * and on the dark tint in dark. A dot badge keeps its neutral fill and edge.
   */
  :host {
    --_tint: var(--pl-color-foreground);
    --_edge: var(--pl-color-neutral-mark);
    --_ink: var(--pl-color-foreground);
  }

  :host([variant="accent"]) {
    --_tint: var(--pl-color-accent);
    --_edge: var(--pl-color-accent-mark);
    --_ink: var(--pl-color-accent-text);
  }

  :host([variant="success"]) {
    --_tint: var(--pl-color-success);
    --_edge: var(--pl-color-success-mark);
    --_ink: var(--pl-color-success-text);
  }

  :host([variant="warning"]) {
    --_tint: var(--pl-color-warning);
    --_edge: var(--pl-color-warning-mark);
    --_ink: var(--pl-color-warning-text);
  }

  :host([variant="destructive"]) {
    --_tint: var(--pl-color-destructive);
    --_edge: var(--pl-color-destructive-mark);
    --_ink: var(--pl-color-destructive-text);
  }

  :host([dot]) {
    --_edge: var(--pl-color-neutral-mark);
  }

  :host([appearance="soft"]:not([dot])) {
    --_fill: color-mix(in srgb, var(--_tint) 12%, transparent);
    --_text: color-mix(in srgb, var(--_ink) 50%, var(--pl-color-foreground));
  }

  :host([appearance="outline"]) {
    --_fill: transparent;

    border-color: var(--_edge);
  }

  :host([appearance="outline"]:not([dot])) {
    --_text: color-mix(in srgb, var(--_ink) 50%, var(--pl-color-foreground));
  }

  [part="dot"] {
    flex: none;
    inline-size: calc(var(--pl-spacing) * 1.5);
    block-size: calc(var(--pl-spacing) * 1.5);
    border-radius: var(--pl-radius-full);
    background: var(--_dot);
  }

  @media (forced-colors: active) {
    :host {
      --_text: ButtonText;

      border-color: ButtonText;
      background: ButtonFace;
      color: ButtonText;
    }

    [part="dot"] {
      background: ButtonText;
    }
  }
`;
