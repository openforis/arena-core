import { ExpressionNodeType, JavascriptExpressionEvaluator } from '../../expression'
import { RecordIdentifierEvaluator } from './node/identifier'
import { RecordThisEvaluator } from './node/thisEvaluator'
import { recordExpressionFunctions } from './functions'
import { RecordExpressionContext } from './context'
import { Survey, Surveys } from '../../survey'
import { Record } from '../record'
import { Node } from '../../node'
import { NodeDefExpression, NodeDefs } from '../../nodeDef'
import { Objects } from '../../utils'
import { Records } from '../records'

export class RecordExpressionEvaluator extends JavascriptExpressionEvaluator<RecordExpressionContext> {
  constructor() {
    super(recordExpressionFunctions, {
      [ExpressionNodeType.Identifier]: RecordIdentifierEvaluator,
      [ExpressionNodeType.This]: RecordThisEvaluator,
    })
  }

  evalNodeQuery(params: { survey: Survey; record: Record; node: Node; query: string }): any {
    const { survey, record, node, query } = params
    const nodeDef = Surveys.getNodeDefByUuid({ survey, uuid: node.nodeDefUuid })
    const nodeContext = NodeDefs.isEntity(nodeDef) ? node : Records.getParent(node)(record)
    if (!nodeContext) return null
    const context: RecordExpressionContext = { survey, record, nodeContext, nodeCurrent: node, object: nodeContext }
    return this.evaluate(query, context)
  }

  private _getApplicableExpressions(params: {
    survey: Survey
    record: Record
    nodeCtx: Node
    expressions: NodeDefExpression[]
    stopAtFirstFound: boolean
  }): NodeDefExpression[] {
    const { survey, record, nodeCtx, expressions, stopAtFirstFound = false } = params
    const applicableExpressions: NodeDefExpression[] = []
    for (let i = 0; i < expressions.length; i += 1) {
      const expression = expressions[i]

      const applyIfExpr = expression.applyIf

      if (
        Objects.isEmpty(applyIfExpr) ||
        this.evalNodeQuery({ survey, record, node: nodeCtx, query: applyIfExpr || '' })
      ) {
        applicableExpressions.push(expression)

        if (stopAtFirstFound) {
          return applicableExpressions
        }
      }
    }

    return applicableExpressions
  }

  evalApplicableExpressions = (params: {
    survey: Survey
    record: Record
    nodeCtx: Node
    expressions: NodeDefExpression[]
    stopAtFirstFound?: boolean
  }): { expression: NodeDefExpression; value: any }[] => {
    const { survey, record, nodeCtx, expressions, stopAtFirstFound = true } = params
    const applicableExpressions = this._getApplicableExpressions({
      survey,
      record,
      nodeCtx,
      expressions,
      stopAtFirstFound,
    })

    return applicableExpressions.map((expression) => ({
      expression,
      value: this.evalNodeQuery({ survey, record, node: nodeCtx, query: expression.expression || '' }),
    }))
  }

  evalApplicableExpression = (params: {
    survey: Survey
    record: Record
    nodeCtx: Node
    expressions: NodeDefExpression[]
  }): { expression: NodeDefExpression; value: any } | null => {
    const { survey, record, nodeCtx, expressions } = params
    const expressionsEvaluated = this.evalApplicableExpressions({
      survey,
      record,
      nodeCtx,
      expressions,
      stopAtFirstFound: true,
    })
    return expressionsEvaluated[0] || null
  }
}
