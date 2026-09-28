import { describe, expect, test } from '@jest/globals'

import { createQueryTestCases } from './common'
import { canEditSurveyQueries } from './survey/canEditSurvey'
import { canViewSurveyQueries } from './survey/canViewSurvey'

const testCases = createQueryTestCases([...canEditSurveyQueries, ...canViewSurveyQueries])

describe('Authorizer - Survey', () => {
  test.each(testCases)('$title', ({ authorizer, params, resultExpected }) => {
    expect(authorizer(...params)).toBe(resultExpected)
  })
})
