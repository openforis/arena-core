import { NodeDef } from '..'
import { Survey, Surveys } from '../../survey'
import { ValidationResult, ValidationResultFactory } from '../../validation'
import { NodeDefExpressionContext } from './context'
import { NodeDefExpressionEvaluator } from './evaluator'

export class NodeDefExpressionValidator extends NodeDefExpressionEvaluator {
  validate(params: {
    expression: string
    survey: Survey
    nodeDefCurrent: NodeDef<any>
    nodeDefContext?: NodeDef<any>
    selfReferenceAllowed?: boolean
  }): { validationResult: ValidationResult; referencedNodeDefUuids: Set<string> } {
    const {
      expression,
      survey,
      nodeDefCurrent,
      nodeDefContext: nodeDefContextParam,
      selfReferenceAllowed = true,
    } = params

    try {
      const nodeDefContext = nodeDefContextParam
        ? nodeDefContextParam
        : !nodeDefCurrent.parentUuid
        ? nodeDefCurrent
        : Surveys.getNodeDefParent({ survey, nodeDef: nodeDefCurrent })

      if (!nodeDefContext) {
        throw new Error(`Cannot find context nodeDef: ${nodeDefCurrent?.props?.name}`)
      }

      const context: NodeDefExpressionContext = {
        survey,
        nodeDefContext,
        nodeDefCurrent,
        object: nodeDefCurrent,
        selfReferenceAllowed,
        referencedNodeDefUuids: new Set(),
      }

      this.evaluate(expression, context)

      return {
        validationResult: ValidationResultFactory.createInstance(),
        referencedNodeDefUuids: context.referencedNodeDefUuids || new Set(),
      }
    } catch (error: any) {
      const details = error.description || error.toString()
      return {
        validationResult: ValidationResultFactory.createInstance({
          valid: false,
          key: 'expression.invalid',
          params: { details },
        }),
        referencedNodeDefUuids: new Set(),
      }
    }
  }
}
