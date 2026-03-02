export class Queue<T> {
  items: T[]

  constructor(items: T[] = []) {
    this.items = []
    this.enqueueItems(items)
  }

  enqueue(item: T): void {
    this.items.unshift(item)
  }

  enqueueItems(items: T[]) {
    for (const item of items) {
      this.enqueue(item)
    }
  }

  dequeue(): T | undefined {
    return this.items.pop()
  }

  get first(): T | undefined {
    return this.items[this.size - 1]
  }

  get last(): T | undefined {
    return this.items[0]
  }

  get size(): number {
    return this.items.length
  }

  isEmpty(): boolean {
    return this.size === 0
  }
}
