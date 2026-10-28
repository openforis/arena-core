import { describe, test, expect } from '@jest/globals'

import { SurveyBuilder, SurveyObjectBuilders } from '../../tests/builder/surveyBuilder'
import { createTestAdminUser } from '../../tests/data'
import { Survey } from '../survey'
import { Surveys } from '.'

import { AreaOfInterest } from '../../geo'
import { LanguageCode } from '../../language'

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

  test('getLabelOrName returns the label in the language, the default language when not specified', async () => {
    const survey = await buildSurvey({
      name: 'survey_name',
      languages: [LanguageCode.en, LanguageCode.fr],
      labels: { en: 'Survey', fr: 'Enquête' },
    })
    expect(Surveys.getLabelOrName(LanguageCode.fr)(survey)).toBe('Enquête')
    expect(Surveys.getLabelOrName()(survey)).toBe('Survey')
  })

  test('getLabelOrName falls back to the name when the label is missing or empty', async () => {
    const survey = await buildSurvey({ name: 'survey_name', languages: [LanguageCode.en], labels: { en: '' } })
    expect(Surveys.getLabelOrName(LanguageCode.en)(survey)).toBe('survey_name')
    expect(Surveys.getLabelOrName(LanguageCode.fr)(survey)).toBe('survey_name')
  })
})

describe('Surveys.getAreaOfInterest', () => {
  const areaOfInterest: AreaOfInterest = {
    type: 'Polygon',
    coordinates: [
      [
        [12.4, 41.8],
        [12.6, 41.8],
        [12.6, 42.0],
        [12.4, 41.8],
      ],
    ],
  }

  test('area of interest in survey props', () => {
    const survey = { props: { areaOfInterest } } as unknown as Survey
    expect(Surveys.getAreaOfInterest(survey)).toEqual(areaOfInterest)
  })

  test('area of interest in survey info props (Arena)', () => {
    const survey = { info: { props: { areaOfInterest } } } as unknown as Survey
    expect(Surveys.getAreaOfInterest(survey)).toEqual(areaOfInterest)
  })

  test('area of interest not defined', () => {
    expect(Surveys.getAreaOfInterest({ props: {} } as unknown as Survey)).toBeUndefined()
  })
})
