import { LanguageCode } from 'src/language'
import { SurveyFactory, SurveyFactoryParams } from './factory'

test('ExpectedSurvey === Survey', () => {
  const surveyOptions: SurveyFactoryParams = {
    ownerUuid: 'uuid-0001-test',
    name: 'test_survey',
    languages: [LanguageCode.en, LanguageCode.es],
  }

  const survey = SurveyFactory.createInstance(surveyOptions)

  expect(survey).toHaveProperty('authGroups')
  expect(Array.isArray(survey.authGroups)).toBeTruthy()

  expect(survey).toHaveProperty('uuid')
  expect(survey.uuid).toBeTruthy()

  expect(survey).toHaveProperty('published')
  expect(survey.published).toBe(false)

  expect(survey).toHaveProperty('draft')
  expect(survey.draft).toBe(true)

  expect(survey).toHaveProperty('ownerUuid')
  expect(survey.ownerUuid).toBe(surveyOptions.ownerUuid)

  // props
  expect(survey).toHaveProperty('props')
  const { props: surveyProps } = survey

  // props.name
  expect(surveyProps).toHaveProperty('name')
  expect(surveyProps.name).toBe(surveyOptions.name)

  // props.languages
  expect(surveyProps).toHaveProperty('languages')
  expect(surveyProps.languages.sort()).toBe(surveyOptions.languages)

  //props.labels
  expect(surveyProps).toHaveProperty('labels')
  expect(surveyProps).toMatchObject({})

  // props.srs
  expect(surveyProps).toHaveProperty('srs')
  expect(surveyProps.srs.length).toBe(1)
  expect(surveyProps.srs[0].code).toBeTruthy()
  expect(surveyProps.srs[0].code).toBe('4326')
  expect(surveyProps.srs[0].name).toBeTruthy()
  expect(surveyProps.srs[0].name).toBe('GCS WGS 1984')

  // props.cycle
  expect(surveyProps).toHaveProperty('cycles')
  expect(surveyProps.cycles['0']).toBeTruthy()
  expect(surveyProps.cycles['0'].dateStart).toBe(new Date().toISOString().split('T')[0])

  expect(surveyProps).toHaveProperty('descriptions')
  expect(surveyProps.descriptions).toBeNull()

  expect(surveyProps).toHaveProperty('collectUri')
  expect(surveyProps.collectUri).toBeNull()
})
