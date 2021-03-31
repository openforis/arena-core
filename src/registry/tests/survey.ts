import { Survey, SurveyFactory, SurveyService } from '../../survey'
import { JobSummary } from '../../job'

export const surveyMock: Survey = SurveyFactory.createInstance({
  ownerUuid: 'survey_owner_uuid',
  name: 'survey_name',
})

export class SurveyServiceMock implements SurveyService {
  create(): Promise<Survey> {
    throw new Error('Not implemented')
  }

  clone(): Promise<JobSummary<any>> {
    throw new Error('Not implemented')
  }

  count(): Promise<number> {
    throw new Error('Not implemented')
  }

  getAllIds(): Promise<Array<number>> {
    throw new Error('Not implemented')
  }

  getMany(): Promise<Array<Survey>> {
    throw new Error('Not implemented')
  }

  get(): Promise<Survey> {
    return Promise.resolve(surveyMock)
  }

  update(): Promise<Survey> {
    throw new Error('Not implemented')
  }

  publish(): Promise<JobSummary<any>> {
    throw new Error('Not implemented')
  }

  delete(): Promise<void> {
    throw new Error('Not implemented')
  }
}
