import { ExpressionNode, ExpressionNodeType, IdentifierExpression, MemberExpression } from '../../expression'
import { parseExpression } from '../../expression/javascript/evaluator'
import { NodeDef, NodeDefProps, NodeDefs, NodeDefType } from '../../nodeDef'
import { SurveyDependencyType } from '../../survey/survey'

/**
 * True if the identifier is used as (or inside) the property of a member expression (e.g. "dbh" in
 * "parent(tree).tree.dbh" or in "tree[dbh > 10]"): there it can refer to nodes outside the context entity.
 */
const isReferencedThroughMember = (params: {
  expressionNode: unknown
  name: string
  inMemberProperty: boolean
}): boolean => {
  const { expressionNode, name, inMemberProperty } = params
  if (!expressionNode || typeof expressionNode !== 'object') return false
  if (Array.isArray(expressionNode)) {
    return expressionNode.some((item) => isReferencedThroughMember({ expressionNode: item, name, inMemberProperty }))
  }
  const { type } = expressionNode as ExpressionNode<ExpressionNodeType>
  if (type === ExpressionNodeType.Identifier) {
    return inMemberProperty && (expressionNode as IdentifierExpression).name === name
  }
  if (type === ExpressionNodeType.Member) {
    const { object, property } = expressionNode as MemberExpression
    return (
      isReferencedThroughMember({ expressionNode: object, name, inMemberProperty }) ||
      isReferencedThroughMember({ expressionNode: property, name, inMemberProperty: true })
    )
  }
  return Object.values(expressionNode).some((child) =>
    isReferencedThroughMember({ expressionNode: child, name, inMemberProperty })
  )
}

const isExpressionSelfReferenceLocal = (params: { expression: string | undefined; name: string }): boolean => {
  const { expression, name } = params
  if (!expression) return true
  try {
    return !isReferencedThroughMember({ expressionNode: parseExpression(expression), name, inMemberProperty: false })
  } catch {
    // invalid expression: be conservative
    return false
  }
}

/**
 * Returns true if the node def references itself in its expressions of the specified dependency type only
 * as a plain identifier (e.g. "dbh > 0" in a validation of "dbh"): such a reference is resolved among the
 * children of the node's parent entity, so only the node and its siblings depend on it, not every node with
 * the same node def in the record.
 */
const isSelfReferenceLocal = (params: {
  nodeDef: NodeDef<NodeDefType, NodeDefProps>
  dependencyType: SurveyDependencyType
}): boolean => {
  const { nodeDef, dependencyType } = params
  // self references by plain identifier are allowed only in validation expressions (see dependencies.ts)
  if (dependencyType !== SurveyDependencyType.validations) return false
  const name = NodeDefs.getName(nodeDef)
  return NodeDefs.getValidationsExpressions(nodeDef).every(
    ({ expression, applyIf }) =>
      isExpressionSelfReferenceLocal({ expression, name }) &&
      isExpressionSelfReferenceLocal({ expression: applyIf, name })
  )
}

export const NodeDefSelfReferences = {
  isSelfReferenceLocal,
}
