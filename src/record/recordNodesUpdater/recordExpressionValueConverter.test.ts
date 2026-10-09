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

describe('date expression value conversion', () => {
  const convertToDate = (valueExpr: any, timezoneOffset?: number) =>
    RecordExpressionValueConverter.toNodeValue({
      survey: {} as any,
      record: {} as any,
      nodeParent: {} as any,
      nodeDef: NodeDefFactory.createInstance({ type: NodeDefType.date }),
      valueExpr,
      timezoneOffset,
    })

  test('date string is kept as is (in any time zone)', async () => {
    expect(await convertToDate('2020-01-31')).toBe('2020-01-31')
  })

  test('ISO datetime is converted to its UTC date when no client time zone offset is specified', async () => {
    expect(await convertToDate('2020-01-31T23:30:00.000Z')).toBe('2020-01-31')
  })

  test('ISO datetime is converted to the client date using the client time zone offset', async () => {
    // client in UTC+1 (Date.getTimezoneOffset() = -60): 23:30 UTC is already the next day there
    expect(await convertToDate('2020-01-31T23:30:00.000Z', -60)).toBe('2020-02-01')
    // client in UTC-5 (Date.getTimezoneOffset() = 300): 02:00 UTC is still the previous day there
    expect(await convertToDate('2020-02-01T02:00:00.000Z', 300)).toBe('2020-01-31')
  })

  test('invalid value gives null', async () => {
    expect(await convertToDate('not a date')).toBeNull()
  })
})
