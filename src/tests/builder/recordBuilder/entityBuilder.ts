import { Node, NodeFactory } from '../../../node'
import { Record, Records } from '../../../record'
import { Survey } from '../../../survey'
import { NodeBuilder } from './nodeBuilder'

export class EntityBuilder extends NodeBuilder {
  private childBuilders: NodeBuilder[] = []

  constructor(nodeDefName: string, ...childBuilders: NodeBuilder[]) {
    super(nodeDefName)
    this.childBuilders = childBuilders
  }

  build(params: { survey: Survey; record: Record; parentNode?: Node }): Record {
    const { survey, record, parentNode } = params

    const nodeDef = this.getNodeDef({ survey })

    const entity = NodeFactory.createInstance({ nodeDefUuid: nodeDef.uuid, record, parentNode })

    let recordUpdated = Records.addNode(entity)(record)

    this.childBuilders.forEach((childBuilder) => {
      recordUpdated = childBuilder.build({ survey, record: recordUpdated, parentNode: entity })
    })

    return recordUpdated
  }
}
