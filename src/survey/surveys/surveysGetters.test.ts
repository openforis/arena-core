import { describe, test, expect } from '@jest/globals'

import { SurveyBuilder, SurveyObjectBuilders } from '../../tests/builder/surveyBuilder'
import { createTestAdminUser } from '../../tests/data'
import { Survey } from '../survey'
import { Surveys } from '.'

const { entityDef, integerDef } = SurveyObjectBuilders

const buildSurvey = async (props: Partial<Survey['props']> = {}): Promise<Survey> => {
  const survey = await new SurveyBuilder(createTestAdminUser(), entityDef('root', integerDef('id').key())).build()
  return { ...survey, props: { ...survey.props, ...props } }
}

describe('Surveys getters', () => {
  test('isKeepNonApplicableValues is false by default', async () => {
    expect(Surveys.isKeepNonApplicableValues(await buildSurvey())).toBe(false)
  })

  test('isKeepNonApplicableValues reads the survey setting', async () => {
    expect(Surveys.isKeepNonApplicableValues(await buildSurvey({ keepNonApplicableValues: true }))).toBe(true)
    expect(Surveys.isKeepNonApplicableValues(await buildSurvey({ keepNonApplicableValues: false }))).toBe(false)
  })
})
