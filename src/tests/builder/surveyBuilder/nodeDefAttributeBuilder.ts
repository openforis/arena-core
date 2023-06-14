import { NodeDef, NodeDefEntity, NodeDefType } from '../../../nodeDef'
import { NodeDefExpression, NodeDefExpressionFactory } from '../../../nodeDef/nodeDef'
import { NodeDefBuilder } from './nodeDefBuilder'

export class NodeDefAttributeBuilder extends NodeDefBuilder {
  constructor(name: string, type: NodeDefType = NodeDefType.text) {
    super(name, type)
  }

  build(params: { nodeDefParent?: NodeDefEntity } = {}): { [uuid: string]: NodeDef<NodeDefType> } {
    const { nodeDefParent } = params
    const def: NodeDef<NodeDefType> = this.createNodeDef({ nodeDefParent })
    return { [def.uuid]: def }
  }

  key(): NodeDefAttributeBuilder {
    this.props.key = true
    return this
  }

  readOnly(): NodeDefAttributeBuilder {
    this.props.readOnly = true
    return this
  }

  defaultValue(expression: string): NodeDefAttributeBuilder {
    this.propsAdvanced.defaultValues = [NodeDefExpressionFactory.createInstance({ expression })]
    return this
  }

  defaultValues(...expressions: string[]): NodeDefAttributeBuilder {
    if (!this.propsAdvanced.defaultValues) this.propsAdvanced.defaultValues = []
    this.propsAdvanced.defaultValues = expressions.map((expression) =>
      NodeDefExpressionFactory.createInstance({ expression })
    )
    return this
  }

  validationExpressions(...expressions: (string | NodeDefExpression)[]): NodeDefAttributeBuilder {
    if (!this.propsAdvanced.validations) this.propsAdvanced.validations = {}
    this.propsAdvanced.validations.expressions = expressions.map((expression) =>
      typeof expression === 'string' ? NodeDefExpressionFactory.createInstance({ expression }) : expression
    )
    return this
  }
}
