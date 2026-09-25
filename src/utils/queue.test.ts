import { Queue } from './queue'

describe('Queue', () => {
  test('items are dequeued in the same order they are enqueued', () => {
    const queue = new Queue([1, 2])
    queue.enqueue(3)
    queue.enqueueItems([4, 5])
    expect(queue.size).toBe(5)
    expect(queue.first).toBe(1)
    expect(queue.last).toBe(5)
    expect(queue.items).toEqual([5, 4, 3, 2, 1])

    const dequeued = []
    while (!queue.isEmpty()) {
      dequeued.push(queue.dequeue())
    }
    expect(dequeued).toEqual([1, 2, 3, 4, 5])
    expect(queue.dequeue()).toBeUndefined()
    expect(queue.first).toBeUndefined()
    expect(queue.last).toBeUndefined()
    expect(queue.items).toEqual([])
  })

  test('enqueue and dequeue interleaved with many items', () => {
    const queue = new Queue()
    const dequeued = []
    let next = 0
    for (let round = 0; round < 50; round++) {
      for (let i = 0; i < 100; i++) {
        queue.enqueue(next++)
      }
      for (let i = 0; i < 70; i++) {
        dequeued.push(queue.dequeue())
      }
    }
    expect(queue.size).toBe(50 * 30)
    expect(queue.first).toBe(dequeued.length)
    while (!queue.isEmpty()) {
      dequeued.push(queue.dequeue())
    }
    expect(dequeued).toEqual(Array.from({ length: next }, (_, index) => index))
  })
})
