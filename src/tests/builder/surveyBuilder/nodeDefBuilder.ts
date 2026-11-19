import { ArenaSurvey } from '../../../survey'
import {
  ArenaNodeDef,
  NodeDefFactory,
  ArenaNodeDefEntity,
  ArenaNodeDefProps,
  ArenaNodeDefPropsAdvanced,
  NodeDefType,
} from '../../../nodeDef'
import { ArenaNodeDefCountExpression, ArenaNodeDefExpression, NodeDefExpressionFactory } from '../../../nodeDef/nodeDef'
import { Objects } from '../../../utils'

export abstract class NodeDefBuilder {
  protected props: ArenaNodeDefProps
  protected propsAdvanced: ArenaNodeDefPropsAdvanced
  protected type: NodeDefType

  constructor(name: string, type: NodeDefType) {
    this.type = type
    this.props = {
      name,
    }
    this.propsAdvanced = {}
  }

  protected createNodeDef(
    params: { nodeDefParent?: ArenaNodeDefEntity } = {}
  ): ArenaNodeDef<NodeDefType, ArenaNodeDefProps> {
    const nodeDef = NodeDefFactory.createInstance({
      nodeDefParent: params.nodeDefParent,
      type: this.type,
      props: this.props,
      propsAdvanced: this.propsAdvanced,
    })
    nodeDef.temporary = false
    return nodeDef
  }

  abstract build(params: { survey: ArenaSurvey; nodeDefParent?: ArenaNodeDefEntity }): {
    [uuid: string]: ArenaNodeDef<NodeDefType>
  }

  multiple(): this {
    this.props.multiple = true
    return this
  }

  applyIf(expression: string): this {
    this.propsAdvanced.applicable = [NodeDefExpressionFactory.createInstance({ expression })]
    return this
  }

  editableIf(...expressions: (string | ArenaNodeDefExpression)[]): this {
    this.propsAdvanced.editableIf = expressions.map((expression) =>
      typeof expression === 'string' ? NodeDefExpressionFactory.createInstance({ expression }) : expression
    )
    return this
  }

  visibleIf(...expressions: (string | ArenaNodeDefExpression)[]): this {
    this.propsAdvanced.visibleIf = expressions.map((expression) =>
      typeof expression === 'string' ? NodeDefExpressionFactory.createInstance({ expression }) : expression
    )
    return this
  }

  maxCount(countExpr: ArenaNodeDefCountExpression): this {
    return Objects.assocPath({
      obj: this,
      path: ['propsAdvanced', 'validations', 'count', 'max'],
      value: countExpr,
      sideEffect: true,
    })
  }

  minCount(countExpr: ArenaNodeDefCountExpression): this {
    return Objects.assocPath({
      obj: this,
      path: ['propsAdvanced', 'validations', 'count', 'min'],
      value: countExpr,
      sideEffect: true,
    })
  }

  requiredIf(...expressions: (string | ArenaNodeDefExpression)[]): this {
    return Objects.assocPath({
      obj: this,
      path: ['propsAdvanced', 'validations', 'requiredIf'],
      value: expressions.map((expression) =>
        typeof expression === 'string' ? NodeDefExpressionFactory.createInstance({ expression }) : expression
      ),
      sideEffect: true,
    })
  }

  required(): this {
    return Objects.assocPath({
      obj: this,
      path: ['propsAdvanced', 'validations', 'required'],
      value: true,
      sideEffect: true,
    })
  }
}
