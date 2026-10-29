import { describe, test, expect } from '@jest/globals'

import { SurveyBuilder, SurveyObjectBuilders } from '../../tests/builder/surveyBuilder'
import { createTestAdminUser } from '../../tests/data'
import { Survey } from '../survey'
import { Surveys } from '.'

import { AreaOfInterestDescriptor } from '../../geo'
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

describe('Surveys.getAreasOfInterest', () => {
  const areasOfInterest: AreaOfInterestDescriptor[] = [
    { name: 'area_a', fileUuid: 'uuid-a', fileName: 'a.geojson', size: 100, polygons: 1, vertices: 5 },
    { name: 'area_b', fileUuid: 'uuid-b', fileName: 'b.geojson', size: 200, polygons: 2, vertices: 10 },
  ]

  test('areas of interest in survey props (Arena Mobile)', () => {
    const survey = { props: { areasOfInterest } } as unknown as Survey
    expect(Surveys.getAreasOfInterest(survey)).toEqual(areasOfInterest)
  })

  test('areas of interest in survey info props (Arena)', () => {
    const survey = { props: {}, info: { props: { areasOfInterest } } } as unknown as Survey
    expect(Surveys.getAreasOfInterest(survey)).toEqual(areasOfInterest)
  })

  test('areas of interest not defined => empty array', () => {
    expect(Surveys.getAreasOfInterest({ props: {} } as unknown as Survey)).toEqual([])
  })

  test('area of interest by name', () => {
    const survey = { props: { areasOfInterest } } as unknown as Survey
    expect(Surveys.getAreaOfInterestByName({ survey, name: 'area_b' })?.fileUuid).toBe('uuid-b')
    expect(Surveys.getAreaOfInterestByName({ survey, name: 'area_c' })).toBeUndefined()
  })
})
