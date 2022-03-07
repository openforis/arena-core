export class Queue {
  items: any[]

  constructor(items: any[] = []) {
    this.items = []
    this.enqueueItems(items)
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  enqueue(item: any): void {
    this.items.unshift(item)
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  enqueueItems(items: any[]) {
    for (const item of items) {
      this.enqueue(item)
    }
  }

  dequeue(): any {
    return this.items.pop()
  }

  first(): any {
    return this.items[this.size() - 1]
  }

  last(): any {
    return this.items[0]
  }

  size(): number {
    return this.items.length
  }

  isEmpty(): boolean {
    return this.size() === 0
  }
}
