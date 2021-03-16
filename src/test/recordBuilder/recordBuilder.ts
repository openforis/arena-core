import { Record, RecordFactory } from '../../record'
import { User } from '../../auth'
import { Survey } from '../../survey'
import { NodeBuilder } from './nodeBuilder'
import { EntityBuilder } from './entityBuilder'
import { AttributeBuilder } from './attributeBuilder'

class RecordBuilder {
  survey: Survey
  user: User
  rootEntityBuilder: EntityBuilder

  constructor(user: User, survey: Survey, rootEntityBuilder: EntityBuilder) {
    this.survey = survey
    this.user = user
    this.rootEntityBuilder = rootEntityBuilder
  }

  build(): Record {
    const record = RecordFactory.createInstance({ surveyUuid: this.survey.uuid, user: this.user })
    const nodes = this.rootEntityBuilder.build({ survey: this.survey, recordUuid: record.uuid })
    return { ...record, nodes }
  }
}

export const record = (user: User, survey: Survey, rootEntityBuilder: any) =>
  new RecordBuilder(user, survey, rootEntityBuilder)

export const entity = (nodeDefName: string, ...childBuilders: NodeBuilder[]) =>
  new EntityBuilder(nodeDefName, ...childBuilders)

export const attribute = (nodeDefName: string, value: any = null) => new AttributeBuilder(nodeDefName, value)
