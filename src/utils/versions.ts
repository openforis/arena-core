export type ParsedVersion = {
  major: number
  minor: number
  patch?: number
  commitsSinceTag?: number
}

const VERSION_REGEX = /^v?(\d+)\.(\d+)(?:\.(\d+))?(?:-(\d+)(?:-g[0-9a-f]+)?)?$/i

const parse = (version: string): ParsedVersion => {
  const match = VERSION_REGEX.exec(version.trim())
  if (!match) {
    throw new Error(
      `Invalid version format: "${version}". Expected format: [v]major.minor[.patch][-commitsSinceTag[-g<commitHash>]] (e.g. "2.3", "2.3.1", "v2.3.1" or "v2.3.19-4-g207bc95f8")`
    )
  }
  const parsedVersion: ParsedVersion = {
    major: Number.parseInt(match[1], 10),
    minor: Number.parseInt(match[2], 10),
  }
  if (match[3] !== undefined) {
    parsedVersion.patch = Number.parseInt(match[3], 10)
  }
  if (match[4] !== undefined) {
    parsedVersion.commitsSinceTag = Number.parseInt(match[4], 10)
  }
  return parsedVersion
}

/**
 * Compares two version strings.
 * @returns -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2
 */
const compare = (v1: string, v2: string): -1 | 0 | 1 => {
  const p1 = parse(v1)
  const p2 = parse(v2)
  const patch1 = p1.patch ?? 0
  const patch2 = p2.patch ?? 0
  const commitsSinceTag1 = p1.commitsSinceTag ?? 0
  const commitsSinceTag2 = p2.commitsSinceTag ?? 0

  if (p1.major !== p2.major) return p1.major < p2.major ? -1 : 1
  if (p1.minor !== p2.minor) return p1.minor < p2.minor ? -1 : 1
  if (patch1 !== patch2) return patch1 < patch2 ? -1 : 1
  if (commitsSinceTag1 !== commitsSinceTag2) return commitsSinceTag1 < commitsSinceTag2 ? -1 : 1
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
