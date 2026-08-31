import { User } from '../../auth'
import { Node } from '../../node'
import { NodeDefEntity, NodeDefs } from '../../nodeDef'
import { Survey } from '../../survey'
import { Record } from '../record'
import { RecordExpressionEvaluator } from '../recordExpressionEvaluator'

const expressionEvaluator = new RecordExpressionEvaluator()

/**
 * Evaluates the entity's enumeratingItemsExpression and returns the allowed category item codes.
 *
 * @param params - Evaluation context parameters.
 * @returns Allowed category item codes, or undefined when no expression is configured.
 */
export const getEnumeratingItemsAllowedCodes = async (params: {
  survey: Survey
  user: User
  record: Record
  entityDef: NodeDefEntity
  parentNode: Node
}): Promise<Set<string> | undefined> => {
  const { survey, user, record, entityDef, parentNode } = params
  const expression = NodeDefs.getEnumeratingItemsExpression(entityDef)
  if (!expression) return undefined

  const result = await expressionEvaluator.evalExpression({
    user,
    survey,
    record,
    node: parentNode,
    query: expression,
  })

  if (!result || !Array.isArray(result)) return new Set<string>()
  return new Set(
    result
      .filter((value) => value !== null && value !== undefined && value !== '')
      .map((value) => String(value))
  )
}
