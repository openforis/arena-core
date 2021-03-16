import { Node, NodeFactory } from '../../../node'
import { Survey } from '../../../survey'
import { NodeBuilder } from './nodeBuilder'

export class EntityBuilder extends NodeBuilder {
  childBuilders: NodeBuilder[] = []

  constructor(nodeDefName: string, ...childBuilders: NodeBuilder[]) {
    super(nodeDefName)
    this.childBuilders = childBuilders
  }

  build(params: { survey: Survey; recordUuid: string; parentNode?: Node }): { [nodeUuid: string]: Node } {
    const { survey, recordUuid, parentNode } = params

    const nodeDef = this.getNodeDef({ survey })

    const entity = NodeFactory.createInstance({ nodeDefUuid: nodeDef.uuid, recordUuid, parentNode })

    return this.childBuilders.reduce(
      (nodesAcc, childBuilder) => {
        const childNodes = childBuilder.build({ survey, recordUuid, parentNode: entity })
        return { ...nodesAcc, ...childNodes }
      },
      { [entity.uuid]: entity }
    )
  }
}
