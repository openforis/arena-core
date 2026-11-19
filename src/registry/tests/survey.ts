import { ArenaSurvey, SurveyFactory, ArenaSurveyService } from '../../survey'
import { ArenaJobSerialized } from '../../job'

export const surveyMock: ArenaSurvey = SurveyFactory.createInstance({
  ownerUuid: 'survey_owner_uuid',
  name: 'survey_name',
})

export class SurveyServiceMock implements ArenaSurveyService {
  create(): Promise<ArenaSurvey> {
    throw new Error('Not implemented')
  }

  clone(): Promise<ArenaJobSerialized<any>> {
    throw new Error('Not implemented')
  }

  count(): Promise<number> {
    throw new Error('Not implemented')
  }

  getAllIds(): Promise<Array<number>> {
    throw new Error('Not implemented')
  }

  getMany(): Promise<Array<ArenaSurvey>> {
    throw new Error('Not implemented')
  }

  get(): Promise<ArenaSurvey> {
    return Promise.resolve(surveyMock)
  }

  update(): Promise<ArenaSurvey> {
    throw new Error('Not implemented')
  }

  publish(): Promise<ArenaJobSerialized<any>> {
    throw new Error('Not implemented')
  }

  delete(): Promise<void> {
    throw new Error('Not implemented')
  }
}
