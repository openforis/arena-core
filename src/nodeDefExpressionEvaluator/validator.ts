import { NodeDef } from '../nodeDef'
import { Survey } from '../survey'
import { getNodeDefParent } from '../survey/surveys/nodeDefs'
import { ValidationResult, ValidationResultFactory } from '../validation'
import { NodeDefs } from '../nodeDef/nodeDefs'
import { NodeDefExpressionContext } from './context'
import { NodeDefExpressionEvaluator } from './evaluator'
import { SystemError } from '../error'

const determineNodeDefContext = (params: { survey: Survey; nodeDefCurrent: NodeDef<any> }) => {
  const { survey, nodeDefCurrent } = params

  const nodeDefContext = NodeDefs.isRoot(nodeDefCurrent)
    ? nodeDefCurrent
    : getNodeDefParent({ survey, nodeDef: nodeDefCurrent })

  if (!nodeDefContext) {
    throw new Error(`Cannot find context nodeDef: ${nodeDefCurrent?.props?.name}`)
  }
  return nodeDefContext
}

export class NodeDefExpressionValidator extends NodeDefExpressionEvaluator {
  async validate(
    params: NodeDefExpressionContext & {
      expression: string
    }
  ): Promise<{ validationResult: ValidationResult; referencedNodeDefUuids: Set<string> }> {
    const { expression, survey, nodeDefCurrent, nodeDefContext: nodeDefContextParam } = params
    try {
      const nodeDefContext = nodeDefContextParam ?? determineNodeDefContext({ survey, nodeDefCurrent })

      const referencedNodeDefUuids = new Set<string>()
      const evaluationParams = { ...params, nodeDefContext, object: nodeDefCurrent, referencedNodeDefUuids }

      await this.evaluate(expression, evaluationParams)

      return {
        validationResult: ValidationResultFactory.createInstance(),
        referencedNodeDefUuids,
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
