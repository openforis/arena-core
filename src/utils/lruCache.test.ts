import { describe, expect, test } from '@jest/globals'

import { LRUCache } from './lruCache'

describe('LRUCache', () => {
  test('evicts the least recently used entry when full', () => {
    const cache = new LRUCache<string, number>(2)
    cache.set('a', 1).set('b', 2)
    // "a" becomes the most recently used
    expect(cache.get('a')).toBe(1)
    cache.set('c', 3)
    expect(cache.size).toBe(2)
    expect(cache.has('b')).toBe(false)
    expect(cache.get('a')).toBe(1)
    expect(cache.get('c')).toBe(3)
  })

  test('updating an existing key does not evict other entries', () => {
    const cache = new LRUCache<string, number>(2)
    cache.set('a', 1).set('b', 2).set('a', 10)
    expect(cache.size).toBe(2)
    expect(cache.get('a')).toBe(10)
    expect(cache.get('b')).toBe(2)
  })

  test('getOrCompute computes missing values only once', () => {
    const cache = new LRUCache<string, boolean>(10)
    let computeCount = 0
    const compute = (): boolean => {
      computeCount += 1
      return false
    }
    expect(cache.getOrCompute('x', compute)).toBe(false)
    expect(cache.getOrCompute('x', compute)).toBe(false)
    expect(computeCount).toBe(1)
  })

  test('invalid max size', () => {
    expect(() => new LRUCache(0)).toThrow()
  })
})
