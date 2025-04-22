import { Record, RecordFactory } from '../../../record'
import { User } from '../../../auth'
import { Survey } from '../../../survey'
import { EntityBuilder } from './entityBuilder'

export class RecordBuilder {
  private survey: Survey
  private user: User
  private rootEntityBuilder: EntityBuilder

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
