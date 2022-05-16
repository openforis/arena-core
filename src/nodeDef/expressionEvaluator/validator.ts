import { ValidationResult, ValidationResultFactory } from '../../validation'
import { NodeDefExpressionContext } from './context'
import { NodeDefExpressionEvaluator } from './evaluator'

export class NodeDefExpressionValidator extends NodeDefExpressionEvaluator {
  validate(expression: string, context: NodeDefExpressionContext): ValidationResult {
    try {
      this.evaluate(expression, context)
      return ValidationResultFactory.createInstance({ valid: true })
    } catch (error: any) {
      const details = error.description || error.toString()
      return ValidationResultFactory.createInstance({
        valid: false,
        messageKey: 'expression.invalid',
        messageParams: { details },
      })
    }
  }
}
