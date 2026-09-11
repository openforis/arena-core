import { describe, test, expect } from '@jest/globals'

import { NodeDefFactory } from './factory'
import { NodeDefType } from './nodeDef'
import { NodeDefs } from './nodeDefs'
import { NodeDefTime } from './types/time'

describe('NodeDefs.isSecondsIncluded', () => {
  test('is false when includeSeconds prop is not set', () => {
    const nodeDef = NodeDefFactory.createInstance({ type: NodeDefType.time }) as NodeDefTime
    expect(NodeDefs.isSecondsIncluded(nodeDef)).toBe(false)
  })

  test('is false when includeSeconds prop is explicitly false', () => {
    const nodeDef = NodeDefFactory.createInstance({
      type: NodeDefType.time,
      props: { includeSeconds: false },
    }) as NodeDefTime
    expect(NodeDefs.isSecondsIncluded(nodeDef)).toBe(false)
  })

  test('is true when includeSeconds prop is true', () => {
    const nodeDef = NodeDefFactory.createInstance({
      type: NodeDefType.time,
      props: { includeSeconds: true },
    }) as NodeDefTime
    expect(NodeDefs.isSecondsIncluded(nodeDef)).toBe(true)
  })
})
