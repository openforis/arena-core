import { Node } from '../../../node'
import { NodeDef, NodeDefProps, NodeDefType } from '../../../nodeDef'
import { Record } from '../../../record'
import { Survey } from '../../../survey'

export abstract class NodeBuilder {
  protected nodeDefName: string

  constructor(nodeDefName: string) {
    this.nodeDefName = nodeDefName
  }

  protected getNodeDef(params: { survey: Survey }): NodeDef<NodeDefType, NodeDefProps> {
    const nodeDef = Object.values(params.survey.nodeDefs || {}).find((n) => n.props.name === this.nodeDefName)

    if (!nodeDef) {
      throw new Error(`Node def with name ${this.nodeDefName} not found in survey`)
    }

    return nodeDef
  }

  abstract build(params: { survey: Survey; record: Record; parentNode?: Node }): Record
}
