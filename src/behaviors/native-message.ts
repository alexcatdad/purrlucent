import { messages, ownMessages } from "./locale.ts";
import type { PlMessages } from "./locale.ts";

type Kind = "checkbox" | "radio" | "select";

const make = (kind: Kind) => {
  if (kind === "select") {
    const select = document.createElement("select");
    select.required = true;
    select.append(new Option("", ""));
    return select;
  }
  const input = document.createElement("input");
  input.type = kind;
  input.required = true;
  return input;
};

const cache = new Map<Kind, string>();

/**
 * The "required" message in the element's language: the library's own text
 * where it has that language, else the browser's localized message, read from
 * a detached native control in the same state, else English.
 */
export const nativeMessage = (
  host: Element,
  kind: Kind,
  key: keyof PlMessages,
) => {
  const own = ownMessages(host);
  if (own) return own[key];
  let message = cache.get(kind);
  if (message === undefined) {
    message = make(kind).validationMessage;
    cache.set(kind, message);
  }
  return message || messages(host)[key];
};
