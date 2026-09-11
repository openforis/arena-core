import { describe, test, expect } from '@jest/globals'

import { NodeFactory } from './factory'
import { NodeValues } from './nodeValues'

const buildTimeNode = (value: string | undefined) =>
  NodeFactory.createInstance({ nodeDefUuid: 'time-def-uuid', recordUuid: 'record-uuid', value })

describe('NodeValues time getters', () => {
  test('getTimeHour and getTimeMinute read an HH:mm value', () => {
    const node = buildTimeNode('14:30')
    expect(NodeValues.getTimeHour(node)).toBe(14)
    expect(NodeValues.getTimeMinute(node)).toBe(30)
  })

  test('getTimeSeconds reads the third part of an HH:mm:ss value', () => {
    const node = buildTimeNode('14:30:45')
    expect(NodeValues.getTimeSeconds(node)).toBe(45)
  })

  test('getTimeSeconds defaults to 0 for an HH:mm value with no seconds part', () => {
    const node = buildTimeNode('14:30')
    expect(NodeValues.getTimeSeconds(node)).toBe(0)
  })
})
