import { LanguageCode } from 'src/language'
import { SurveyFactory, SurveyFactoryParams } from './factory'

test('ExpectedSurvey === Survey', () => {
  const surveyFactory = new SurveyFactory()
  const surveyOptions: SurveyFactoryParams = {
    ownerUuid: 'uuid-0001-test',
    name: 'test_survey',
    languages: [LanguageCode.en, LanguageCode.es],
  }

  const survey = surveyFactory.createInstance(surveyOptions)

  expect(survey).toHaveProperty('uuid')
  expect(survey).toHaveProperty('published')
  expect(survey).toHaveProperty('draft')
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

  // props.srs
  expect(surveyProps).toHaveProperty('srs')
  expect(surveyProps.srs.length).toBe(1)
  expect(surveyProps.srs[0].code).toBeTruthy()
  expect(surveyProps.srs[0].name).toBeTruthy()

  // props.cycle
  expect(surveyProps).toHaveProperty('cycles')

  expect(surveyProps).toHaveProperty('descriptions')
  expect(surveyProps).toHaveProperty('collectUri')
})
