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
 * The browser's own, localized "required" message, read from a detached native
 * control in the same state. Empty where the browser gives none.
 */
export const nativeMessage = (kind: Kind, fallback: string) => {
  let message = cache.get(kind);
  if (message === undefined) {
    message = make(kind).validationMessage;
    cache.set(kind, message);
  }
  return message || fallback;
};
