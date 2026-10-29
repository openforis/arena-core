/**
 * Protection against regular expressions that can take exponential time (ReDoS): JavaScript cannot interrupt a
 * running regular expression, so a single evaluation could freeze the server or the browser.
 */

// maximum length of the strings that regular expressions are applied to in expressions
export const REG_EXP_INPUT_MAX_LENGTH = 1000

// unbounded quantifier at the given position: *, + or {n,} (quantifiers like {n} or {n,m} are bounded)
const unboundedQuantifierRegExp = /^(\*|\+|\{\d+,\})/

const isQuantifierAt = (source: string, index: number): boolean => {
  const char = source[index]
  if (char === '*' || char === '+') return true
  // {n,m} or {n,} (exact {n} repetitions don't multiply the ways a string can be matched)
  return char === '{' && /^\{\d+,\d*\}/.test(source.substring(index))
}

const skipEscape = (index: number): number => index + 2

const skipCharacterClass = (source: string, index: number): number => {
  let i = index + 1
  while (i < source.length && source[i] !== ']') {
    i = source[i] === '\\' ? skipEscape(i) : i + 1
  }
  return i + 1
}

// marks the innermost open group (if any) as containing a quantifier
const markInnermostGroupQuantified = (groupsStack: boolean[]): void => {
  if (groupsStack.length > 0) {
    groupsStack[groupsStack.length - 1] = true
  }
}

/**
 * Closes the group ending at the specified index (position of the ")").
 * Returns true if the group contains a quantifier and it's repeated by an unbounded quantifier.
 */
const closeGroup = (source: string, index: number, groupsStack: boolean[]): boolean => {
  const groupContainsQuantifier = groupsStack.pop() ?? false
  if (groupContainsQuantifier && unboundedQuantifierRegExp.test(source.substring(index + 1))) {
    return true
  }
  if (groupContainsQuantifier || isQuantifierAt(source, index + 1)) {
    markInnermostGroupQuantified(groupsStack)
  }
  return false
}

/**
 * Returns true if the specified regular expression source contains a group repeated by an unbounded quantifier
 * that contains a quantifier itself (star height > 1), e.g. (a+)+, (\w*)* or (x{1,3})+:
 * these patterns can take exponential time on non-matching strings.
 * Overlapping alternations like (a|aa)+ are not detected.
 */
export const hasNestedQuantifiers = (source: string): boolean => {
  // for each open group: true if it contains a quantifier
  const groupsStack: boolean[] = []
  let i = 0
  while (i < source.length) {
    switch (source[i]) {
      case '\\':
        i = skipEscape(i)
        break
      case '[':
        i = skipCharacterClass(source, i)
        break
      case '(':
        groupsStack.push(false)
        // a "?" right after "(" introduces a group modifier (e.g. "(?:"), it's not a quantifier
        i += source[i + 1] === '?' ? 2 : 1
        break
      case ')':
        if (closeGroup(source, i, groupsStack)) return true
        i += 1
        break
      default:
        if (isQuantifierAt(source, i)) {
          markInnermostGroupQuantified(groupsStack)
        }
        i += 1
    }
  }
  return false
}
