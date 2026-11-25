/**
 * Cache with a maximum number of entries: when it is full, adding an entry evicts the least recently used one.
 * To be used for module-level caches, which would otherwise grow for the whole life of the process.
 */
export class LRUCache<K, V> {
  private readonly maxSize: number
  private readonly entries = new Map<K, V>()

  constructor(maxSize: number) {
    if (!Number.isInteger(maxSize) || maxSize <= 0) throw new Error(`Invalid LRU cache max size: ${maxSize}`)
    this.maxSize = maxSize
  }

  get size(): number {
    return this.entries.size
  }

  has(key: K): boolean {
    return this.entries.has(key)
  }

  get(key: K): V | undefined {
    if (!this.entries.has(key)) return undefined
    const value = this.entries.get(key) as V
    // move the entry to the end (most recently used): Map keeps the insertion order
    this.entries.delete(key)
    this.entries.set(key, value)
    return value
  }

  set(key: K, value: V): this {
    this.entries.delete(key)
    if (this.entries.size >= this.maxSize) {
      const leastRecentlyUsedKey = this.entries.keys().next().value as K
      this.entries.delete(leastRecentlyUsedKey)
    }
    this.entries.set(key, value)
    return this
  }

  /**
   * Returns the cached value of the specified key, computing and caching it if missing.
   */
  getOrCompute(key: K, compute: (key: K) => V): V {
    if (this.entries.has(key)) return this.get(key) as V
    const value = compute(key)
    this.set(key, value)
    return value
  }

  clear(): void {
    this.entries.clear()
  }
}
