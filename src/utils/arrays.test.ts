import { describe, expect, test } from '@jest/globals'

import { Arrays } from './arrays'

describe('Arrays.intersection', () => {
  test('keeps the items of the first array that are in the second one, in the order of the first array', () => {
    expect(Arrays.intersection(['c', 'a', 'b', 'd'], ['b', 'c', 'x'])).toEqual(['c', 'b'])
  })

  test('keeps duplicates of the first array', () => {
    expect(Arrays.intersection([1, 2, 1, 3], [1])).toEqual([1, 1])
  })

  test('empty arrays', () => {
    expect(Arrays.intersection([], [1, 2])).toEqual([])
    expect(Arrays.intersection([1, 2], [])).toEqual([])
  })

  test('NaN is found as with includes (SameValueZero)', () => {
    expect(Arrays.intersection([Number.NaN, 1], [Number.NaN])).toEqual([Number.NaN])
  })
})
