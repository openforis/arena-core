import { Record, RecordFactory } from '../../../record'
import { RecordNodesIndexUpdater } from '../../../record/_records/recordNodesIndexUpdater'
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
    const record = RecordFactory.createInstance({ surveyUuid: this.survey.uuid, user: this.user })
    const nodes = this.rootEntityBuilder.build({ survey: this.survey, recordUuid: record.uuid })
    const recordWithNodes = { ...record, nodes }
    const nodesIndex = RecordNodesIndexUpdater.initializeIndex(recordWithNodes)
    return { ...recordWithNodes, _nodesIndex: nodesIndex }
  }
}
