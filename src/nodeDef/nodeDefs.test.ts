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
