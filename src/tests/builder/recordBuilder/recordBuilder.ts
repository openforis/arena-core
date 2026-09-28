import { Record, RecordFactory } from '../../../record'
import { User } from '../../../auth'
import { Survey } from '../../../survey'
import { EntityBuilder } from './entityBuilder'

export class RecordBuilder {
  private readonly survey: Survey
  private readonly user: User
  private readonly rootEntityBuilder: EntityBuilder

  constructor(user: User, survey: Survey, rootEntityBuilder: EntityBuilder) {
    this.survey = survey
    this.user = user
    this.rootEntityBuilder = rootEntityBuilder
  }

  build(): Record {
    const { survey, user } = this
    const record = RecordFactory.createInstance({ surveyUuid: survey.uuid, user })
    return this.rootEntityBuilder.build({ survey, record })
  }
}
