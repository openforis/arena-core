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

describe('Arrays.addItems', () => {
  test('adds a large number of items with sideEffect', () => {
    const array = [0]
    const items = Array.from({ length: 300000 }, (_, index) => index + 1)
    const result = Arrays.addItems(items, { sideEffect: true })(array)
    expect(result).toBe(array)
    expect(result.length).toBe(300001)
    expect(result.at(-1)).toBe(300000)
  })
})
