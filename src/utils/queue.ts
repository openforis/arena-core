export class Queue {
  data: any[]

  constructor(items: any[] = []) {
    this.data = []
    this.enqueueItems(items)
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  enqueue(item: any): void {
    this.data.unshift(item)
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  enqueueItems(items: any[]) {
    for (const item of items) {
      this.enqueue(item)
    }
  }

  dequeue(): any {
    return this.data.pop()
  }

  first(): any {
    return this.data[this.size() - 1]
  }

  last(): any {
    return this.data[0]
  }

  size(): number {
    return this.data.length
  }

  isEmpty(): boolean {
    return this.size() === 0
  }
}
