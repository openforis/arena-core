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

  test('returns an empty string for empty values and the raw value for types without a formatter', () => {
    const survey = {} as ArenaSurvey
    const integerDef = NodeDefFactory.createInstance({ type: NodeDefType.integer, props: { name: 'integer' } })
    expect(RecordNodeValueFormatter.format({ survey, cycle: '0', nodeDef: integerDef, value: null })).toBe('')
    expect(RecordNodeValueFormatter.format({ survey, cycle: '0', nodeDef: integerDef, value: 12 })).toBe('12')

    const booleanDef = NodeDefFactory.createInstance({ type: NodeDefType.boolean, props: { name: 'boolean' } })
    expect(RecordNodeValueFormatter.format({ survey, cycle: '0', nodeDef: booleanDef, value: true })).toBe(true)
  })
})
