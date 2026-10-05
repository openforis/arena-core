import { Promises } from './promises'

describe('Promises.each', () => {
  test('iterates serially, awaiting each callback before the next one', async () => {
    const events: string[] = []
    await Promises.each([1, 2, 3], async (item) => {
      events.push(`start ${item}`)
      await new Promise((resolve) => setTimeout(resolve, 5 - item))
      events.push(`end ${item}`)
    })
    expect(events).toEqual(['start 1', 'end 1', 'start 2', 'end 2', 'start 3', 'end 3'])
  })

  test('passes the item index to the callback', async () => {
    const indexes: number[] = []
    await Promises.each(['a', 'b', 'c'], async (_item, index) => {
      indexes.push(index)
    })
    expect(indexes).toEqual([0, 1, 2])
  })

  test('stops when stopIfFn returns true', async () => {
    const visited: number[] = []
    await Promises.each(
      [1, 2, 3, 4],
      async (item) => {
        visited.push(item)
      },
      (item) => item === 3
    )
    expect(visited).toEqual([1, 2])
  })

  test('does not share collected results between calls', async () => {
    const noop = async () => {}
    const firstResults = (await Promises.each([1, 2], noop)) as unknown as unknown[]
    const secondResults = (await Promises.each([3], noop)) as unknown as unknown[]
    expect(firstResults).toHaveLength(2)
    expect(secondResults).toHaveLength(1)
  })
})
