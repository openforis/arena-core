import { describe, test, expect } from '@jest/globals'

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

  test('assocPath (deep path) copies only the objects along the path', () => {
    const obj = { a: { a1: 1 }, b: { b1: { c: 1 }, b2: { b2a: 10 } } }
    const objectUpdated = Objects.assocPath({ obj, path: ['b', 'b2', 'b2a'], value: 12 })
    expect(objectUpdated).not.toBe(obj)
    expect(objectUpdated.b).not.toBe(obj.b)
    expect(objectUpdated.b.b2).not.toBe(obj.b.b2)
    // objects outside of the path are shared
    expect(objectUpdated.a).toBe(obj.a)
    expect(objectUpdated.b.b1).toBe(obj.b.b1)
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

  test('assocPath (deep path with missing properties - side effect)', () => {
    const obj = { a: 1 }
    const path = ['b', 'b2', 'b2a']
    const value = 12
    const objectUpdated = Objects.assocPath({ obj, path, value, sideEffect: true })
    expect(objectUpdated).toEqual({ a: 1, b: { b2: { b2a: 12 } } })
    // check that the original object has been updated (side effect)
    expect(objectUpdated).toEqual(obj)
  })

  test('camelize (no side effect)', () => {
    const objectA = { p_1: 'A', p_2: 'B', p_3: 5 }
    const objectAString = JSON.stringify(objectA)
    const objectB = { prop_a: 1, prop_b: 2, prop_c: objectA }
    const objectBCamelized = Objects.camelize(objectB, { sideEffect: false })
    expect(objectAString).toEqual(JSON.stringify(objectA))
    expect(objectBCamelized).not.toEqual(objectB)
    expect(JSON.stringify(objectBCamelized)).not.toEqual(JSON.stringify(objectB))
  })

  test('camelize (side effect)', () => {
    const objectA = { p_1: 'A', p_2: 'B', p_3: 5 }
    const objectAString = JSON.stringify(objectA)
    const objectB = { prop_a: 1, prop_b: 2, prop_c: objectA }
    const objectBCamelized = Objects.camelize(objectB, { sideEffect: true })
    expect(objectAString).not.toEqual(JSON.stringify(objectA))
    expect(objectBCamelized).toEqual(objectB)
    expect(JSON.stringify(objectBCamelized)).toEqual(JSON.stringify(objectB))
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

  test('isEqual', () => {
    const o1 = { a: 1, b: '2' }
    const o2 = { a: 1, b: '2' }
    expect(Objects.isEqual(o1, o2)).toBeTruthy()
  })

  test('isEmpty', () => {
    expect(Objects.isEmpty(null)).toBeTruthy()
    expect(Objects.isEmpty(undefined)).toBeTruthy()
    expect(Objects.isEmpty({})).toBeTruthy()
    expect(Objects.isEmpty([])).toBeTruthy()
    expect(Objects.isEmpty(NaN)).toBeTruthy()
    expect(Objects.isEmpty(Date.parse('INVALID'))).toBeTruthy()

    // number
    expect(Objects.isEmpty(0)).toBeFalsy()
    expect(Objects.isEmpty(100)).toBeFalsy()
    // object
    expect(Objects.isEmpty({ a: 'some value' })).toBeFalsy()
    // date (valid)
    expect(Objects.isEmpty(new Date())).toBeFalsy()
    // function
    expect(Objects.isEmpty(() => 1)).toBeFalsy()
  })

  test('path: returns undefined (does not throw) when a value along the path is null', () => {
    const obj = { a: { b: null as any }, c: 0 }
    expect(Objects.path(['a', 'b', 'c'])(obj)).toBeUndefined()
    expect(Objects.path('a.b')(obj)).toBeNull()
    expect(Objects.path('c')(obj)).toBe(0)
    expect(Objects.path('x.y')(obj)).toBeUndefined()
  })

  test('camelize: skipped keys are skipped at every level', () => {
    const obj = { first_level: { skip_me: { inner_key: 1 }, other_key: 2 }, skip_me: { inner_key: 3 } }
    expect(Objects.camelize(obj, { skip: ['skip_me'] })).toEqual({
      firstLevel: { skip_me: { inner_key: 1 }, otherKey: 2 },
      skip_me: { inner_key: 3 },
    })
  })
})
