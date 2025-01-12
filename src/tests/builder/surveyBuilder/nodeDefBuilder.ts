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
import { Objects } from '../../../utils'

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
    const nodeDef = NodeDefFactory.createInstance({
      nodeDefParent: params.nodeDefParent,
      type: this.type,
      props: this.props,
      propsAdvanced: this.propsAdvanced,
    })
    nodeDef.temporary = false
    return nodeDef
  }

  abstract build(params: { survey: Survey; nodeDefParent?: NodeDefEntity }): { [uuid: string]: NodeDef<NodeDefType> }

  multiple(): this {
    this.props.multiple = true
    return this
  }

  applyIf(expression: string): this {
    this.propsAdvanced.applicable = [NodeDefExpressionFactory.createInstance({ expression })]
    return this
  }

  maxCount(countExpr: string): this {
    return Objects.assocPath({
      obj: this,
      path: ['propsAdvanced', 'validations', 'count', 'max'],
      value: countExpr,
      sideEffect: true,
    })
  }

  minCount(countExpr: string): this {
    return Objects.assocPath({
      obj: this,
      path: ['propsAdvanced', 'validations', 'count', 'min'],
      value: countExpr,
      sideEffect: true,
    })
  }
}
