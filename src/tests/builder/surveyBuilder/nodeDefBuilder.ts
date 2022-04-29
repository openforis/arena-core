import { Survey } from '../../../survey'
import {
  NodeDef,
  NodeDefFactory,
  NodeDefEntity,
  NodeDefProps,
  NodeDefPropsAdvanced,
  NodeDefType,
} from '../../../nodeDef'
import { NodeDefExpressionFactory } from '../../../nodeDef/nodeDef'

export abstract class NodeDefBuilder {
  protected props: NodeDefProps
  protected propsAdvanced: NodeDefPropsAdvanced
  protected type: NodeDefType

  constructor(name: string, type: NodeDefType) {
    this.type = type
    this.props = {
      name,
    }
    this.propsAdvanced = {}
  }

  protected createNodeDef(params: { nodeDefParent?: NodeDefEntity } = {}): NodeDef<NodeDefType, NodeDefProps> {
    return NodeDefFactory.createInstance({
      nodeDefParent: params.nodeDefParent,
      type: this.type,
      props: this.props,
      propsAdvanced: this.propsAdvanced,
    })
  }

  abstract build(params: { survey: Survey; nodeDefParent?: NodeDefEntity }): { [uuid: string]: NodeDef<NodeDefType> }

  multiple(): NodeDefBuilder {
    this.props.multiple = true
    return this
  }

  applyIf(expression: string): NodeDefBuilder {
    this.propsAdvanced.applicable = [NodeDefExpressionFactory.createInstance({ expression })]
    return this
  }
}
