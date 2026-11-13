import { describe, test, expect, afterEach } from '@jest/globals'

import { CategoryItem } from '../../category'
import { SurveyRefDataFactory } from './factory'

const createItem = (params: { uuid: string; parentUuid?: string; code: string }): CategoryItem =>
  ({
    uuid: params.uuid,
    parentUuid: params.parentUuid,
    props: { code: params.code },
  }) as unknown as CategoryItem

describe('SurveyRefDataFactory', () => {
  afterEach(() => {
    // safety net: don't let a failure leak into other tests
    delete (Object.prototype as any).polluted
  })

  test('indexes category items by category, parent item and code', () => {
    const refData = SurveyRefDataFactory.createInstance({
      itemsByCategoryUuid: {
        cat1: [
          createItem({ uuid: 'item1', code: '1' }),
          createItem({ uuid: 'item1a', parentUuid: 'item1', code: 'a' }),
        ],
      },
    })
    expect(refData.categoryItemUuidIndex).toEqual({ cat1: { null: { '1': 'item1' }, item1: { a: 'item1a' } } })
  })

  test('items with special keys as parent uuid or code do not modify Object.prototype', () => {
    const refData = SurveyRefDataFactory.createInstance({
      itemsByCategoryUuid: {
        cat1: [
          createItem({ uuid: 'item1', parentUuid: '__proto__', code: 'polluted' }),
          createItem({ uuid: 'item2', parentUuid: 'constructor', code: 'polluted' }),
        ],
        __proto__: [createItem({ uuid: 'item3', code: 'polluted' })],
      },
    })
    expect(({} as any).polluted).toBeUndefined()
    const { categoryItemUuidIndex } = refData as any
    expect(categoryItemUuidIndex.cat1['__proto__'].polluted).toEqual('item1')
    expect(categoryItemUuidIndex.cat1.constructor.polluted).toEqual('item2')
  })
})
