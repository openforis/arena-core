import { describe, test, expect } from '@jest/globals'

import { NodeDefFactory } from '../../nodeDef/factory'
import { NodeDefType } from '../../nodeDef/nodeDef'
import { NodeDefTimeProps } from '../../nodeDef/types/time'
import { RecordExpressionValueConverter } from './recordExpressionValueConverter'

describe('time expression value conversion', () => {
  test('keeps only HH:mm when includeSeconds is not set', async () => {
    const nodeDef = NodeDefFactory.createInstance({ type: NodeDefType.time })
    const result = await RecordExpressionValueConverter.toNodeValue({
      survey: {} as any,
      record: {} as any,
      nodeParent: {} as any,
      nodeDef,
      valueExpr: '14:30:45',
    })
    expect(result).toBe('14:30')
  })

  test('keeps HH:mm:ss when includeSeconds is true', async () => {
    const nodeDef = NodeDefFactory.createInstance({
      type: NodeDefType.time,
      props: { includeSeconds: true } as NodeDefTimeProps,
    })
    const result = await RecordExpressionValueConverter.toNodeValue({
      survey: {} as any,
      record: {} as any,
      nodeParent: {} as any,
      nodeDef,
      valueExpr: '14:30:45',
    })
    expect(result).toBe('14:30:45')
  })
})
