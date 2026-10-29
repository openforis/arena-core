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

  test('assocPath copies arrays along the path as arrays', () => {
    const obj = { a: [1, 2] }
    const objectUpdated = Objects.assocPath({ obj, path: ['a', '0'], value: 5 })
    expect(objectUpdated).toEqual({ a: [5, 2] })
    expect(Array.isArray(objectUpdated.a)).toBeTruthy()
    // check that the original object hasn't been updated
    expect(obj).toEqual({ a: [1, 2] })
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

  test('dissocPath copies arrays along the path as arrays', () => {
    const obj = { a: [{ b: 1, c: 2 }, { b: 3 }] }
    const objectUpdated = Objects.dissocPath({ obj, path: ['a', '0', 'b'] })
    expect(objectUpdated).toEqual({ a: [{ c: 2 }, { b: 3 }] })
    expect(Array.isArray(objectUpdated.a)).toBeTruthy()
    // check that the original object hasn't been updated
    expect(obj).toEqual({ a: [{ b: 1, c: 2 }, { b: 3 }] })
  })

  test('setInPath replaces null or primitive intermediate values with objects', () => {
    expect(Objects.setInPath({ obj: { a: null }, path: ['a', 'b'], value: 1 })).toEqual({ a: { b: 1 } })
    expect(Objects.setInPath({ obj: { a: 5 }, path: ['a', 'b'], value: 1 })).toEqual({ a: { b: 1 } })
    expect(Objects.setInPath({ obj: { a: 'x' }, path: ['a', 'b', 'c'], value: 1 })).toEqual({ a: { b: { c: 1 } } })
  })

  test('setInPath keeps existing intermediate objects and arrays', () => {
    const inner = { c: 1 }
    const obj = { a: inner, l: [{ x: 1 }] }
    Objects.setInPath({ obj, path: ['a', 'b'], value: 2 })
    Objects.setInPath({ obj, path: ['l', '0', 'y'], value: 3 })
    expect(obj).toEqual({ a: { c: 1, b: 2 }, l: [{ x: 1, y: 3 }] })
    expect(obj.a).toBe(inner)
    expect(Array.isArray(obj.l)).toBeTruthy()
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

  test('assocPath and setInPath return the type of the object', () => {
    type Item = { uuid: string; props: { name?: string } }
    const item: Item = { uuid: 'item', props: {} }

    const itemUpdated: Item = Objects.assocPath({ obj: item, path: ['props', 'name'], value: 'name_1' })
    // @ts-expect-error the result has the type of the object passed
    const notAnItem: { other: string } = Objects.assocPath({ obj: item, path: ['props', 'name'], value: 'name_2' })
    const itemSet: Item = Objects.setInPath({
      obj: { uuid: 'item_2', props: {} } as Item,
      path: ['props', 'name'],
      value: 'name_3',
    })

    expect(itemUpdated.props.name).toBe('name_1')
    expect(notAnItem).toEqual({ uuid: 'item', props: { name: 'name_2' } })
    expect(itemSet.props.name).toBe('name_3')
  })

  test('difference: props of the other object missing or with a different (deep) value', () => {
    const object = { a: 1, b: { c: [1, 2] }, d: 'x' }
    const otherObject = { a: 1, b: { c: [1, 3] }, d: 'x', e: undefined }
    expect(Objects.difference(object, otherObject)).toEqual({ b: { c: [1, 3] }, e: undefined })
    expect(Objects.difference(object, object)).toEqual({})
    expect(Objects.difference(null, { a: 1 })).toEqual({ a: 1 })
  })

  test('toPairs / fromPairs', () => {
    expect(Objects.toPairs({ a: 1, b: 2 })).toEqual([
      ['a', 1],
      ['b', 2],
    ])
    expect(Objects.toPairs(null)).toEqual([])
    expect(Objects.fromPairs([['a', 1]])).toEqual({ a: 1 })
    expect(Objects.fromPairs(null)).toEqual({})
  })
})
