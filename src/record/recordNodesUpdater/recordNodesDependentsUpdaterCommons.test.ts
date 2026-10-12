import { describe, expect, test } from '@jest/globals'

import { SystemError } from '../../error'
import { SurveyDependencyType, Surveys } from '../../survey'
import { SurveyBuilder, SurveyObjectBuilders } from '../../tests/builder/surveyBuilder'
import { createTestAdminUser } from '../../tests/data'
import { throwError } from './recordNodesDependentsUpdaterCommons'

const { entityDef, integerDef } = SurveyObjectBuilders

describe('throwError', () => {
  test('throws a SystemError keeping the original error as cause', async () => {
    const survey = await new SurveyBuilder(createTestAdminUser(), entityDef('root', integerDef('num'))).build()
    const nodeDef = Surveys.getNodeDefByName({ survey, name: 'num' })
    const originalError = new Error('evaluation failed')

    let thrown: unknown
    try {
      throwError({
        error: originalError,
        errorKey: 'record.updateSelfAndDependentsDefaultValues',
        expressionType: SurveyDependencyType.defaultValues,
        survey,
        nodeDef,
        expressionsToEvaluate: [],
      })
    } catch (error) {
      thrown = error
    }

    expect(thrown).toBeInstanceOf(SystemError)
    const systemError = thrown as SystemError
    expect(systemError.key).toBe('record.updateSelfAndDependentsDefaultValues')
    expect(systemError.params).toMatchObject({ nodeDefName: 'num', error: 'Error: evaluation failed' })
    expect(systemError.cause).toBe(originalError)
  })
})
