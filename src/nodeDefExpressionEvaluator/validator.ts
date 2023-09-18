import { NodeDef } from '../nodeDef'
import { Survey, Surveys } from '../survey'
import { ValidationResult, ValidationResultFactory } from '../validation'
import { NodeDefs } from '../nodeDef/nodeDefs'
import { NodeDefExpressionContext } from './context'
import { NodeDefExpressionEvaluator } from './evaluator'
import { SystemError } from '../error'

const determineNodeDefContext = (params: { survey: Survey; nodeDefCurrent: NodeDef<any> }) => {
  const { survey, nodeDefCurrent } = params

  const nodeDefContext = NodeDefs.isRoot(nodeDefCurrent)
    ? nodeDefCurrent
    : Surveys.getNodeDefParent({ survey, nodeDef: nodeDefCurrent })

  if (!nodeDefContext) {
    throw new Error(`Cannot find context nodeDef: ${nodeDefCurrent?.props?.name}`)
  }
  return nodeDefContext
}

export class NodeDefExpressionValidator extends NodeDefExpressionEvaluator {
  validate(params: {
    expression: string
    survey: Survey
    nodeDefCurrent: NodeDef<any>
    nodeDefContext?: NodeDef<any>
    selfReferenceAllowed?: boolean
    itemsFilter?: boolean
  }): { validationResult: ValidationResult; referencedNodeDefUuids: Set<string> } {
    const {
      expression,
      survey,
      nodeDefCurrent,
      nodeDefContext: nodeDefContextParam,
      selfReferenceAllowed = true,
      itemsFilter = false,
    } = params

    try {
      const nodeDefContext = nodeDefContextParam ?? determineNodeDefContext({ survey, nodeDefCurrent })

      const context: NodeDefExpressionContext = {
        survey,
        nodeDefContext,
        nodeDefCurrent,
        object: nodeDefCurrent,
        selfReferenceAllowed,
        referencedNodeDefUuids: new Set(),
        itemsFilter,
      }

      this.evaluate(expression, context)

      return {
        validationResult: ValidationResultFactory.createInstance(),
        referencedNodeDefUuids: context.referencedNodeDefUuids ?? new Set(),
      }
    } catch (error: any) {
      const isSystemError = error instanceof SystemError
      const key = isSystemError ? error.key : 'expression.invalid'
      const params = isSystemError ? error.params : { details: error.description ?? error.toString() }
      return {
        validationResult: ValidationResultFactory.createInstance({ valid: false, key, params }),
        referencedNodeDefUuids: new Set(),
      }
    }
  }
}
