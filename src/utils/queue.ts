// when the number of dequeued items exceeds this threshold (and half of the stored items),
// the storage array is compacted to release the memory of the dequeued items
const COMPACTION_MIN_HEAD_INDEX = 1024

/**
 * FIFO queue with constant time enqueue and dequeue operations.
 */
export class Queue {
  private _items: any[]
  private _headIndex: number

  constructor(items: any[] = []) {
    this._items = []
    this._headIndex = 0
    this.enqueueItems(items)
  }

  /**
   * Items still in the queue, from the last enqueued to the first one (the next one to be dequeued).
   */
  get items(): any[] {
    return this._items.slice(this._headIndex).reverse()
  }

  enqueue(item: any): void {
    this._items.push(item)
  }

  enqueueItems(items: any[]) {
    for (const item of items) {
      this.enqueue(item)
    }
  }

  dequeue(): any {
    if (this.isEmpty()) return undefined

    const item = this._items[this._headIndex]
    this._items[this._headIndex] = undefined
    this._headIndex += 1

    if (this.isEmpty()) {
      this._items = []
      this._headIndex = 0
    } else if (this._headIndex >= COMPACTION_MIN_HEAD_INDEX && this._headIndex * 2 >= this._items.length) {
      this._items = this._items.slice(this._headIndex)
      this._headIndex = 0
    }
    return item
  }

  get first(): any {
    return this.isEmpty() ? undefined : this._items[this._headIndex]
  }

  get last(): any {
    return this.isEmpty() ? undefined : this._items[this._items.length - 1]
  }

  get size(): number {
    return this._items.length - this._headIndex
  }

  isEmpty(): boolean {
    return this.size === 0
  }
}
