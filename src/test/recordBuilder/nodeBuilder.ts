import { Node } from '../../node'
import { NodeDef, NodeDefProps, NodeDefType } from '../../nodeDef'
import { Survey } from '../../survey'

export abstract class NodeBuilder {
  nodeDefName: string

  constructor(nodeDefName: string) {
    this.nodeDefName = nodeDefName
  }

  _getNodeDef(params: { survey: Survey }): NodeDef<NodeDefType, NodeDefProps> {
    const nodeDef = Object.values(params.survey.nodeDefs || {}).find((n) => n.props.name === this.nodeDefName)

    if (!nodeDef) {
      throw new Error(`Node def with name ${this.nodeDefName} not found in survey`)
    }

    return nodeDef
  }

  abstract build(params: { survey: Survey; recordUuid: string; parentNode?: Node }): { [nodeUuid: string]: Node }
}
