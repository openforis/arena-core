import { Objects } from './_objects'

describe('Objects', () => {
  test('assocPath (simple value)', () => {
    const obj = { a: 1, b: '2' }
    const path = ['a']
    const value = 3
    const objectUpdated = Objects.assocPath({ obj, path, value })
    expect(objectUpdated).toEqual({ a: 3, b: '2' })
    // check that the original object hasn't been updated
    expect(obj).toEqual({ a: 1, b: '2' })
  })

  test('assocPath (deep path)', () => {
    const obj = { a: 1, b: { b1: 2, b2: { b2a: 10, b2b: 20 } } }
    const path = ['b', 'b2', 'b2a']
    const value = 12
    const objectUpdated = Objects.assocPath({ obj, path, value })
    expect(objectUpdated).toEqual({ a: 1, b: { b1: 2, b2: { b2a: 12, b2b: 20 } } })
    // check that the original object hasn't been updated
    expect(obj).toEqual({ a: 1, b: { b1: 2, b2: { b2a: 10, b2b: 20 } } })
  })

  test('assocPath (deep path with missing properties)', () => {
    const obj = { a: 1 }
    const path = ['b', 'b2', 'b2a']
    const value = 12
    const objectUpdated = Objects.assocPath({ obj, path, value })
    expect(objectUpdated).toEqual({ a: 1, b: { b2: { b2a: 12 } } })
    // check that the original object hasn't been updated
    expect(obj).toEqual({ a: 1 })
  })

  test('isEqual', () => {
    const o1 = { a: 1, b: '2' }
    const o2 = { a: 1, b: '2' }
    expect(Objects.isEqual(o1, o2)).toBeTruthy()
  })

  test('dissocPath (simple path)', () => {
    const obj = { a: 1 }
    const path = ['a']
    const objectUpdated = Objects.dissocPath({ obj, path })
    expect(objectUpdated).toEqual({})
    // check that the original object hasn't been updated
    expect(obj).toEqual({ a: 1 })
  })

  test('dissocPath (deep path)', () => {
    const obj = { a: 1, b: { b1: 2, b2: { b2a: 10, b2b: 20 } } }
    const path = ['b', 'b2', 'b2a']
    const objectUpdated = Objects.dissocPath({ obj, path })
    expect(objectUpdated).toEqual({ a: 1, b: { b1: 2, b2: { b2b: 20 } } })
    // check that the original object hasn't been updated
    expect(obj).toEqual({ a: 1, b: { b1: 2, b2: { b2a: 10, b2b: 20 } } })
  })

  test('dissocPath (missing property)', () => {
    const obj = { a: 1, b: { b1: 2, b2: { b2a: 10, b2b: 20 } } }
    const path = ['b', 'b2', 'b2c']
    const objectUpdated = Objects.dissocPath({ obj, path })
    expect(objectUpdated).toEqual({ a: 1, b: { b1: 2, b2: { b2a: 10, b2b: 20 } } })
    // check that the original object hasn't been updated
    expect(obj).toEqual({ a: 1, b: { b1: 2, b2: { b2a: 10, b2b: 20 } } })
  })
})
