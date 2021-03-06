import { Node, NodeFactory } from '../../../node'
import { Survey } from '../../../survey'
import { NodeBuilder } from './nodeBuilder'

export class AttributeBuilder extends NodeBuilder {
  private value: any

  constructor(nodeDefName: string, value: any = null) {
    super(nodeDefName)
    this.value = value
  }

  build(params: { survey: Survey; recordUuid: string; parentNode?: Node }): { [nodeUuid: string]: Node } {
    const { survey, recordUuid, parentNode } = params

    const nodeDef = this.getNodeDef({ survey })

    const attribute = NodeFactory.createInstance({
      nodeDefUuid: nodeDef.uuid,
      parentNode,
      recordUuid,
      value: this.value,
    })

    return { [attribute.uuid]: attribute }
  }
}
