import { ArenaRecordNode, RecordNodeFactory } from '../../../node'
import { ArenaRecord, Records } from '../../../record'
import { ArenaSurvey } from '../../../survey'
import { NodeBuilder } from './nodeBuilder'

export class EntityBuilder extends NodeBuilder {
  private readonly childBuilders: NodeBuilder[] = []

  constructor(nodeDefName: string, ...childBuilders: NodeBuilder[]) {
    super(nodeDefName)
    this.childBuilders = childBuilders
  }

  build(params: { survey: ArenaSurvey; record: ArenaRecord; parentNode?: ArenaRecordNode }): ArenaRecord {
    const { survey, record, parentNode } = params

    const nodeDef = this.getNodeDef({ survey })

    const entity = RecordNodeFactory.createInstance({ nodeDefUuid: nodeDef.uuid, recordUuid: record.uuid, parentNode })

    let recordUpdated = Records.addNode(entity)(record)

    this.childBuilders.forEach((childBuilder) => {
      recordUpdated = childBuilder.build({ survey, record: recordUpdated, parentNode: entity })
    })

    return recordUpdated
  }
}
