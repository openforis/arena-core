import { describe, test, expect } from '@jest/globals'

import { NodeFactory } from '../../node/factory'
import { NodeDefFactory } from '../../nodeDef/factory'
import { NodeDefType } from '../../nodeDef/nodeDef'
import { Record } from '../record'
import { AttributeTypeValidator } from './attributeTypeValidator'

describe('attributeTypeValidator - time', () => {
  const nodeDef = NodeDefFactory.createInstance({ type: NodeDefType.time })
  const record = { uuid: 'r1' } as Record

  test('accepts a valid HH:mm value', async () => {
    const node = NodeFactory.createInstance({ nodeDefUuid: nodeDef.uuid, record, value: '14:30' })
    const result = await AttributeTypeValidator.validateValueType({
      survey: {} as any,
      record: {} as any,
      nodeDef,
    })('value', node)
    expect(result.valid).toBe(true)
  })

  test('rejects an out-of-range seconds part', async () => {
    const node = NodeFactory.createInstance({ nodeDefUuid: nodeDef.uuid, record, value: '14:30:99' })
    const result = await AttributeTypeValidator.validateValueType({
      survey: {} as any,
      record: {} as any,
      nodeDef,
    })('value', node)
    expect(result.valid).toBe(false)
  })
})
