import { ActivityLogFactory, ActivityLogFactoryParams } from '../factory'
import { surveyCreateMock } from './surveyCreate.mock'

const surveyCreateParams: ActivityLogFactoryParams = surveyCreateMock

describe('ActivityLog factory should return correct on', () => {
  test('SurveyCreate', () => {
    const activityLog = ActivityLogFactory.createInstance(surveyCreateParams)

    expect(activityLog.id).toBeDefined()
    expect(activityLog.id).toBe(surveyCreateParams.id)
    expect(activityLog.type).toBeDefined()
    expect(activityLog.type).toBe(surveyCreateParams.type)
    expect(activityLog.system).toBeDefined()
    expect(activityLog.system).toBe(surveyCreateParams.system)
    expect(activityLog.userUuid).toBeDefined()
    expect(activityLog.userUuid).toBe(surveyCreateParams.userUuid)

    expect(activityLog.content).toBeDefined()
    expect(activityLog.content).toBe(surveyCreateParams.content)
  })
})
