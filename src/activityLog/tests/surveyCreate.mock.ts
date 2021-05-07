import { ActivityLogType } from '../activityLog'
import { ActivityLogFactoryParams } from '../factory'
import { SurveyFactory } from '../../survey'
import { SurveyFactoryParams } from '../../survey/factory'
import { LanguageCode } from '../../language'

const surveyOptions: SurveyFactoryParams = {
  ownerUuid: 'uuid-0001-test',
  name: 'test_survey',
  languages: [LanguageCode.en, LanguageCode.es],
}

const survey = SurveyFactory.createInstance(surveyOptions)

export const surveyCreateMock: ActivityLogFactoryParams = {
  id: 1,
  type: ActivityLogType.surveyCreate,
  userUuid: 'b195f226-03ae-426d-9b52-c73ad4e4e961',
  content: survey,
  system: false,
  // dateCreated: '2021-02-23 08:56:11.460342', from db
}
