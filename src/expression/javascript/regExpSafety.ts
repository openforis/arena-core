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
    const char = source[i]
    if (char === '\\') {
      i = skipEscape(i)
      continue
    }
    if (char === '[') {
      i = skipCharacterClass(source, i)
      continue
    }
    if (char === '(') {
      groupsStack.push(false)
      // a "?" right after "(" introduces a group modifier (e.g. "(?:"), it's not a quantifier
      i += source[i + 1] === '?' ? 2 : 1
      continue
    }
    if (char === ')') {
      const groupContainsQuantifier = groupsStack.pop() ?? false
      const groupQuantified = isQuantifierAt(source, i + 1)
      if (groupContainsQuantifier && unboundedQuantifierRegExp.test(source.substring(i + 1))) {
        return true
      }
      if (groupsStack.length > 0 && (groupContainsQuantifier || groupQuantified)) {
        groupsStack[groupsStack.length - 1] = true
      }
      i += 1
      continue
    }
    if (groupsStack.length > 0 && isQuantifierAt(source, i)) {
      groupsStack[groupsStack.length - 1] = true
    }
    i += 1
  }
  return false
}
