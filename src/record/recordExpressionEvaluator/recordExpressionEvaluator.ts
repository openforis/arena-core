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
import { CategoryItem } from '../../category'
import { Taxon } from '../../taxonomy'

type ExpressionEvaluateParams = {
  survey: Survey
  record: Record
  timezoneOffset?: number
}

export class RecordExpressionEvaluator extends JavascriptExpressionEvaluator<RecordExpressionContext> {
  constructor() {
    super(recordExpressionFunctions, {
      [ExpressionNodeType.Identifier]: RecordIdentifierEvaluator,
      [ExpressionNodeType.This]: RecordThisEvaluator,
    })
  }

  evalExpression(
    params: ExpressionEvaluateParams & {
      node: Node
      query: string
      item?: CategoryItem | Taxon
    }
  ): any {
    const { survey, record, node, query, item, timezoneOffset } = params
    const nodeDef = Surveys.getNodeDefByUuid({ survey, uuid: node.nodeDefUuid })
    const nodeContext = NodeDefs.isEntity(nodeDef) ? node : Records.getParent(node)(record)
    if (!nodeContext) return null
    const context: RecordExpressionContext = {
      survey,
      record,
      nodeContext,
      nodeCurrent: node,
      object: nodeContext,
      item,
      timezoneOffset,
    }
    return this.evaluate(query, context)
  }

  private _getApplicableExpressions(
    params: ExpressionEvaluateParams & {
      nodeCtx: Node
      expressions: NodeDefExpression[]
      stopAtFirstFound?: boolean
    }
  ): NodeDefExpression[] {
    const { survey, record, nodeCtx, expressions, stopAtFirstFound = false, timezoneOffset } = params
    const applicableExpressions: NodeDefExpression[] = []

    expressions.every((expression) => {
      const applyIfExpr = expression.applyIf

      if (
        Objects.isEmpty(applyIfExpr) ||
        this.evalExpression({ survey, record, node: nodeCtx, query: applyIfExpr ?? '', timezoneOffset })
      ) {
        applicableExpressions.push(expression)

        if (stopAtFirstFound) {
          // break the loop
          return false
        }
      }
      return true
    })

    return applicableExpressions
  }

  evalApplicableExpressions = (
    params: ExpressionEvaluateParams & {
      nodeCtx: Node
      expressions: NodeDefExpression[]
      stopAtFirstFound?: boolean
    }
  ): { expression: NodeDefExpression; value: any }[] => {
    const { nodeCtx } = params
    const applicableExpressions = this._getApplicableExpressions(params)

    return applicableExpressions.map((expression) => ({
      expression,
      value: this.evalExpression({ ...params, node: nodeCtx, query: expression.expression ?? '' }),
    }))
  }

  evalApplicableExpression = (
    params: ExpressionEvaluateParams & {
      nodeCtx: Node
      expressions: NodeDefExpression[]
    }
  ): { expression: NodeDefExpression; value: any } | null => {
    const expressionsEvaluated = this.evalApplicableExpressions({ ...params, stopAtFirstFound: true })
    return expressionsEvaluated[0] ?? null
  }
}
