import { ArenaRecord, RecordFactory } from '../../../record'
import { ArenaUser } from '../../../auth'
import { ArenaSurvey } from '../../../survey'
import { EntityBuilder } from './entityBuilder'

export class RecordBuilder {
  private readonly survey: ArenaSurvey
  private readonly user: ArenaUser
  private readonly rootEntityBuilder: EntityBuilder

  constructor(user: ArenaUser, survey: ArenaSurvey, rootEntityBuilder: EntityBuilder) {
    this.survey = survey
    this.user = user
    this.rootEntityBuilder = rootEntityBuilder
  }

  build(): ArenaRecord {
    const { survey, user } = this
    const record = RecordFactory.createInstance({ surveyUuid: survey.uuid, user })
    return this.rootEntityBuilder.build({ survey, record })
  }
}
