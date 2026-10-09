import { describe, test, expect } from '@jest/globals'

import { NodeDefFactory } from './factory'
import { NodeDefType } from './nodeDef'
import { NodeDefs } from './nodeDefs'
import { NodeDefTime, NodeDefTimeProps } from './types/time'

describe('NodeDefs.isSecondsIncluded', () => {
  test('is false when includeSeconds prop is not set', () => {
    const nodeDef = NodeDefFactory.createInstance({ type: NodeDefType.time }) as NodeDefTime
    expect(NodeDefs.isSecondsIncluded(nodeDef)).toBe(false)
  })

  test('is false when includeSeconds prop is explicitly false', () => {
    const nodeDef = NodeDefFactory.createInstance({
      type: NodeDefType.time,
      props: { includeSeconds: false } as NodeDefTimeProps,
    }) as NodeDefTime
    expect(NodeDefs.isSecondsIncluded(nodeDef)).toBe(false)
  })

  test('is true when includeSeconds prop is true', () => {
    const nodeDef = NodeDefFactory.createInstance({
      type: NodeDefType.time,
      props: { includeSeconds: true } as NodeDefTimeProps,
    }) as NodeDefTime
    expect(NodeDefs.isSecondsIncluded(nodeDef)).toBe(true)
  })
})

describe('NodeDefs type guards', () => {
  test.each([
    [NodeDefType.boolean, NodeDefs.isBoolean],
    [NodeDefType.code, NodeDefs.isCode],
    [NodeDefType.coordinate, NodeDefs.isCoordinate],
    [NodeDefType.date, NodeDefs.isDate],
    [NodeDefType.decimal, NodeDefs.isDecimal],
    [NodeDefType.entity, NodeDefs.isEntity],
    [NodeDefType.file, NodeDefs.isFile],
    [NodeDefType.integer, NodeDefs.isInteger],
    [NodeDefType.taxon, NodeDefs.isTaxon],
    [NodeDefType.text, NodeDefs.isText],
    [NodeDefType.time, NodeDefs.isTime],
    [NodeDefType.formHeader, NodeDefs.isLayoutElement],
  ])('%s', (type, guard) => {
    expect(guard(NodeDefFactory.createInstance({ type }))).toBe(true)
    const otherType = type === NodeDefType.text ? NodeDefType.integer : NodeDefType.text
    expect(guard(NodeDefFactory.createInstance({ type: otherType }))).toBe(false)
  })

  test('narrows the node def type', () => {
    const nodeDef = NodeDefFactory.createInstance({ type: NodeDefType.time, props: { name: 'time' } })
    if (NodeDefs.isTime(nodeDef)) {
      // no cast needed to access time specific props
      expect(NodeDefs.isSecondsIncluded(nodeDef)).toBe(false)
    }
  })
})
