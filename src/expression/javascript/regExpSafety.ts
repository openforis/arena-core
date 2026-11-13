/**
 * Protection against regular expressions that can take exponential time (ReDoS): JavaScript cannot interrupt a
 * running regular expression, so a single evaluation could freeze the server or the browser.
 */

// maximum length of the strings that regular expressions are applied to in expressions
export const REG_EXP_INPUT_MAX_LENGTH = 1000

// repetitions of a group with a higher maximum (e.g. {1,1000}) are as dangerous as unbounded ones
const GROUP_REPETITIONS_MAX = 3

// characters that, right after an atom, quantify it (including "?", which makes it optional)
const quantifierStartChars = new Set(['*', '+', '?', '{'])

// characters with a special meaning outside character classes
const specialChars = new Set(['\\', '[', ']', '(', ')', '|', '.', '^', '$', '*', '+', '?', '{', '}'])

const isQuantifierAt = (source: string, index: number): boolean => {
  const char = source[index]
  if (char === '*' || char === '+') return true
  // {n,m} or {n,} (exact {n} repetitions don't multiply the ways a string can be matched)
  return char === '{' && /^\{\d+,\d*\}/.test(source.substring(index))
}

/**
 * Returns true if the quantifier at the specified index repeats the preceding atom an unbounded number of times:
 * *, +, {n,} or {n,m} with m greater than GROUP_REPETITIONS_MAX.
 */
const isUnboundedQuantifierAt = (source: string, index: number): boolean => {
  const char = source[index]
  if (char === '*' || char === '+') return true
  const match = /^\{\d+(,(\d*))?\}/.exec(source.substring(index))
  if (!match) return false
  const [, comma, max] = match
  if (!comma) return false // exact {n}
  return !max || Number(max) > GROUP_REPETITIONS_MAX
}

const skipEscape = (index: number): number => index + 2

const skipCharacterClass = (source: string, index: number): number => {
  let i = index + 1
  while (i < source.length && source[i] !== ']') {
    i = source[i] === '\\' ? skipEscape(i) : i + 1
  }
  return i + 1
}

// skips "(" and the group modifier, if any: (?:, (?=, (?!, (?<=, (?<! or (?<name>
const skipGroupStart = (source: string, index: number): number => {
  if (source[index + 1] !== '?') return index + 1
  if (source[index + 2] === '<' && source[index + 3] !== '=' && source[index + 3] !== '!') {
    const nameEnd = source.indexOf('>', index + 3)
    return nameEnd < 0 ? source.length : nameEnd + 1
  }
  return source[index + 2] === '<' ? index + 4 : index + 3
}

/**
 * Returns the literal character that the alternative starting at the specified index must start with,
 * or null if it can start with different characters (character class, ".", group, optional atom etc.)
 * or it can be empty.
 */
const getAlternativeFirstChar = (source: string, index: number): string | null => {
  const char = source[index]
  let literal: string | null
  let atomLength: number
  if (char === undefined) {
    return null
  } else if (char === '\\') {
    // escaped letters and digits are character classes (\d, \w...), assertions (\b) or back references
    const escapedChar = source[index + 1]
    literal = escapedChar !== undefined && !/[a-zA-Z0-9]/.test(escapedChar) ? escapedChar : null
    atomLength = 2
  } else {
    literal = specialChars.has(char) ? null : char
    atomLength = 1
  }
  if (literal === null || quantifierStartChars.has(source[index + atomLength])) return null
  // case insensitive comparison: the regular expression could use the "i" flag
  return literal.toLowerCase()
}

type GroupState = {
  // the group contains a quantifier
  quantified: boolean
  // the group contains an alternation (or a group with an alternation) whose alternatives can match the same string
  ambiguous: boolean
  // first characters of the alternatives (null if not a single literal character)
  alternativesFirstChars: (string | null)[]
}

const createGroupState = (source: string, contentStartIndex: number): GroupState => ({
  quantified: false,
  ambiguous: false,
  alternativesFirstChars: [getAlternativeFirstChar(source, contentStartIndex)],
})

/**
 * Alternatives are considered unambiguous only if they all start with different literal characters:
 * then at most one of them can match at any position.
 */
const hasAmbiguousAlternatives = (group: GroupState): boolean => {
  const { alternativesFirstChars } = group
  if (alternativesFirstChars.length < 2) return false
  if (alternativesFirstChars.some((char) => char === null)) return true
  return new Set(alternativesFirstChars).size < alternativesFirstChars.length
}

/**
 * Closes the group ending at the specified index (position of the ")").
 * Returns true if the group contains a quantifier or ambiguous alternatives and it's repeated
 * by an unbounded quantifier.
 */
const closeGroup = (source: string, index: number, groupsStack: GroupState[]): boolean => {
  const group = groupsStack.pop()
  if (!group) return false
  const ambiguous = group.ambiguous || hasAmbiguousAlternatives(group)
  if ((group.quantified || ambiguous) && isUnboundedQuantifierAt(source, index + 1)) {
    return true
  }
  const parent = groupsStack[groupsStack.length - 1]
  if (parent) {
    parent.quantified = parent.quantified || group.quantified || isQuantifierAt(source, index + 1)
    // the parent group could be repeated
    parent.ambiguous = parent.ambiguous || ambiguous
  }
  return false
}

/**
 * Returns true if the specified regular expression source contains a group repeated by an unbounded quantifier
 * (*, +, {n,} or {n,m} with a high m) that contains:
 * - a quantifier itself (star height > 1), e.g. (a+)+, (\w*)* or (x{1,3})+
 * - alternatives that can match the same string, e.g. (a|aa)+, (a|.)* or (\d|-)+
 *   (alternatives are considered safe only if they start with different literal characters, e.g. (ab|cd)+).
 * These patterns can take exponential time on non-matching strings.
 * Note: patterns taking polynomial time (e.g. a+a+a+$) are not detected; the time they take is limited by
 * the maximum length of the input strings (REG_EXP_INPUT_MAX_LENGTH).
 */
export const isUnsafeRegExpSource = (source: string): boolean => {
  const groupsStack: GroupState[] = []
  let i = 0
  while (i < source.length) {
    switch (source[i]) {
      case '\\':
        i = skipEscape(i)
        break
      case '[':
        i = skipCharacterClass(source, i)
        break
      case '(': {
        i = skipGroupStart(source, i)
        groupsStack.push(createGroupState(source, i))
        break
      }
      case '|': {
        groupsStack[groupsStack.length - 1]?.alternativesFirstChars.push(getAlternativeFirstChar(source, i + 1))
        i += 1
        break
      }
      case ')':
        if (closeGroup(source, i, groupsStack)) return true
        i += 1
        break
      default: {
        const group = groupsStack[groupsStack.length - 1]
        if (group && isQuantifierAt(source, i)) {
          group.quantified = true
        }
        i += 1
      }
    }
  }
  return false
}
