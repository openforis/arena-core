export type ParsedVersion = {
  major: number
  minor: number
  patch: number
}

const VERSION_REGEX = /^v?(\d+)\.(\d+)(?:\.(\d+))?$/

const parse = (version: string): ParsedVersion => {
  const match = VERSION_REGEX.exec(version.trim())
  if (!match) {
    throw new Error(
      `Invalid version format: "${version}". Expected format: [v]major.minor[.patch] (e.g. "2.3", "2.3.1" or "v2.3.1")`
    )
  }
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: match[3] !== undefined ? parseInt(match[3], 10) : 0,
  }
}

/**
 * Compares two version strings.
 * @returns -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2
 */
const compare = (v1: string, v2: string): -1 | 0 | 1 => {
  const p1 = parse(v1)
  const p2 = parse(v2)

  if (p1.major !== p2.major) return p1.major < p2.major ? -1 : 1
  if (p1.minor !== p2.minor) return p1.minor < p2.minor ? -1 : 1
  if (p1.patch !== p2.patch) return p1.patch < p2.patch ? -1 : 1
  return 0
}

const isEqual = (v1: string, v2: string): boolean => compare(v1, v2) === 0

const isGreaterThan = (v1: string, v2: string): boolean => compare(v1, v2) === 1

const isLessThan = (v1: string, v2: string): boolean => compare(v1, v2) === -1

const isGreaterThanOrEqual = (v1: string, v2: string): boolean => compare(v1, v2) >= 0

const isLessThanOrEqual = (v1: string, v2: string): boolean => compare(v1, v2) <= 0

export const Versions = {
  parse,
  compare,
  isEqual,
  isGreaterThan,
  isLessThan,
  isGreaterThanOrEqual,
  isLessThanOrEqual,
}
