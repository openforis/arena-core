export const fromPairs = (pairs: Iterable<readonly [PropertyKey, any]> | null | undefined): Record<string, any> =>
  Object.fromEntries(pairs ?? [])
