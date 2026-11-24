type Named = { name: string; type: string };

/**
 * Whether a file passes an `accept` list as a native file input reads it:
 * comma-separated extensions (`.pdf`), types (`image/png`) and wildcards
 * (`image/*`). An empty list accepts everything.
 */
export function matchesAccept(file: Named, accept: string | undefined) {
  const tokens = (accept ?? "")
    .split(",")
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);
  if (!tokens.length) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return tokens.some((token) =>
    token.startsWith(".")
      ? name.endsWith(token)
      : token.endsWith("/*")
        ? type.startsWith(token.slice(0, -1))
        : type === token,
  );
}

/** The dropped files the control takes: those that pass `accept`, the first only unless `multiple`. */
export function pickDropped<T extends Named>(
  files: T[],
  accept: string | undefined,
  multiple: boolean,
) {
  const accepted = files.filter((file) => matchesAccept(file, accept));
  return multiple ? accepted : accepted.slice(0, 1);
}
