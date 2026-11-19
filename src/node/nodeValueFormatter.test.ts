import { describe, test, expect } from '@jest/globals'

import { NodeDefFactory, NodeDefType } from '../nodeDef'
import { ArenaSurvey } from '../survey'
import { RecordNodeValueFormatter } from './nodeValueFormatter'

describe('RecordNodeValueFormatter', () => {
  test('formats every value of a multiple attribute separately', () => {
    const nodeDef = NodeDefFactory.createInstance({ type: NodeDefType.text, props: { name: 'text', multiple: true } })
    const formatted = RecordNodeValueFormatter.format({
      survey: {} as ArenaSurvey,
      cycle: '0',
      nodeDef,
      value: ['a', 'b'],
    })
    expect(formatted).toBe('a, b')
  })
})
