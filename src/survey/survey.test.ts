import { SurveyFactory } from './factory'

test('ExpectedSurvey === Survey', () => {
  const surveyFactory = new SurveyFactory()
  const survey = surveyFactory.createInstance({})
  expect(survey).toHaveProperty('info')
})

test('ExpectedSurvey === Survey', () => {
  const surveyFactory = new SurveyFactory()
  const survey = surveyFactory.createInstance({})
  expect(survey).toBe('b')
})
