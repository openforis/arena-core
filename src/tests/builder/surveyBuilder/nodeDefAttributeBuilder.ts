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

  key(): this {
    this.props.key = true
    return this
  }

  autoIncrementalKey(): this {
    this.props.autoIncrementalKey = true
    return this
  }

  readOnly(): this {
    this.props.readOnly = true
    return this
  }

  excludeInClone(): this {
    this.propsAdvanced.excludedInClone = true
    return this
  }

  defaultValue(expression: string): this {
    this.propsAdvanced.defaultValues = [NodeDefExpressionFactory.createInstance({ expression })]
    return this
  }

  defaultValues(...expressions: string[]): this {
    if (!this.propsAdvanced.defaultValues) this.propsAdvanced.defaultValues = []
    this.propsAdvanced.defaultValues = expressions.map((expression) =>
      NodeDefExpressionFactory.createInstance({ expression })
    )
    return this
  }

  defaultValueEvaluatedOnlyOneTime(): this {
    this.propsAdvanced.defaultValueEvaluatedOneTime = true
    return this
  }

  validationExpressions(...expressions: (string | NodeDefExpression)[]): this {
    if (!this.propsAdvanced.validations) this.propsAdvanced.validations = {}
    this.propsAdvanced.validations.expressions = expressions.map((expression) =>
      typeof expression === 'string' ? NodeDefExpressionFactory.createInstance({ expression }) : expression
    )
    return this
  }
}
