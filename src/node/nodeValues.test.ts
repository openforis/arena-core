import { describe, test, expect } from '@jest/globals'

import { DateFormats } from '../utils'
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

  test('getTimeMinute still returns NaN for a malformed value with a missing part (unchanged by the seconds fix)', () => {
    const node = buildTimeNode('14')
    expect(Number.isNaN(NodeValues.getTimeMinute(node))).toBe(true)
  })
})

describe('time value equality (via record-level comparator wiring)', () => {
  // Exercised indirectly through arena's core/record/nodeValues.js in the arena repo (Task 9);
  // here we only verify the underlying format-conversion primitives arena-core exposes.
  test('an HH:mm value and its HH:mm:ss equivalent convert to the same timeWithSeconds string', () => {
    const { Dates } = require('../utils')
    const fromShort = Dates.convertDate({
      dateStr: '14:30',
      formatFrom: DateFormats.timeStorage,
      formatTo: DateFormats.timeWithSeconds,
    })
    const fromLong = Dates.convertDate({
      dateStr: '14:30:00',
      formatFrom: DateFormats.timeWithSeconds,
      formatTo: DateFormats.timeWithSeconds,
    })
    expect(fromShort).toBe(fromLong)
  })

  test('two values that differ only in seconds convert to different timeWithSeconds strings', () => {
    const { Dates } = require('../utils')
    const a = Dates.convertDate({
      dateStr: '14:30:00',
      formatFrom: DateFormats.timeWithSeconds,
      formatTo: DateFormats.timeWithSeconds,
    })
    const b = Dates.convertDate({
      dateStr: '14:30:45',
      formatFrom: DateFormats.timeWithSeconds,
      formatTo: DateFormats.timeWithSeconds,
    })
    expect(a).not.toBe(b)
  })
})
