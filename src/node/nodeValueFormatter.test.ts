import { describe, test, expect } from '@jest/globals'

import { NodeDefFactory, NodeDefType } from '../nodeDef'
import { Survey } from '../survey'
import { NodeValueFormatter } from './nodeValueFormatter'

describe('NodeValueFormatter', () => {
  test('formats every value of a multiple attribute separately', () => {
    const nodeDef = NodeDefFactory.createInstance({ type: NodeDefType.text, props: { name: 'text', multiple: true } })
    const formatted = NodeValueFormatter.format({
      survey: {} as Survey,
      cycle: '0',
      nodeDef,
      value: ['a', 'b'],
    })
    expect(formatted).toBe('a, b')
  })
})
