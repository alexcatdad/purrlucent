export type SidebarLevel = 1 | 2;

/** True when the consumer's bundler sets NODE_ENV to production. Read at call time. */
function isProduction(): boolean {
  try {
    return process.env.NODE_ENV === "production";
  } catch {
    // No bundler replaced it and there is no `process`: treat as development.
    return false;
  }
}

/**
 * Validates a sidebar item level. A sidebar shows at most two levels: anything
 * else throws in development and is treated as level 2 in production builds.
 * No value (a removed attribute) is the default, level 1.
 */
export function parseLevel(value: unknown): SidebarLevel {
  if (value == null) return 1;
  if (value === 1 || value === 2) return value;
  if (!isProduction())
    throw new RangeError(
      `pl-sidebar-item: level must be 1 or 2, received ${String(value)}`,
    );
  return 2;
}
