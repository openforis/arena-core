import { describe, expect, test } from '@jest/globals'

import { createQueryTestCases } from './common'
import { canAnalyzeRecordQueries } from './record/canAnalyzeRecord'
import { canCleanseRecordQueries } from './record/canCleanseRecord'
import { canCreateRecordQueries } from './record/canCreateRecord'
import { canEditRecordQueries } from './record/canEditRecord'
import { canViewRecordQueries } from './record/canViewRecord'

const testCases = createQueryTestCases([
  // CREATE
  ...canCreateRecordQueries,
  // VIEW
  ...canViewRecordQueries,
  // UPDATE
  ...canEditRecordQueries,
  ...canCleanseRecordQueries,
  ...canAnalyzeRecordQueries,
])

describe('Authorizer - Record', () => {
  test.each(testCases)('$title', ({ authorizer, params, resultExpected }) => {
    expect(authorizer(...params)).toBe(resultExpected)
  })
})
