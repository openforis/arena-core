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
import { User } from '../../auth'

type ExpressionEvaluateParams = {
  user: User
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

  async evalExpression(
    params: ExpressionEvaluateParams & {
      node: Node
      query: string
      item?: CategoryItem | Taxon
    }
  ): Promise<any> {
    const { user, survey, record, node, query, item, timezoneOffset } = params
    const nodeDef = Surveys.getNodeDefByUuid({ survey, uuid: node.nodeDefUuid })
    const nodeContext = NodeDefs.isEntity(nodeDef) ? node : Records.getParent(node)(record)
    if (!nodeContext) return null
    const context: RecordExpressionContext = {
      user,
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

  private async _getApplicableExpressions(
    params: ExpressionEvaluateParams & {
      nodeCtx: Node
      expressions: NodeDefExpression[]
      stopAtFirstFound?: boolean
    }
  ): Promise<NodeDefExpression[]> {
    const { user, survey, record, nodeCtx, expressions, stopAtFirstFound = false, timezoneOffset } = params
    const applicableExpressions: NodeDefExpression[] = []

    for await (const expression of expressions) {
      const applyIfExpr = expression.applyIf

      if (
        Objects.isEmpty(applyIfExpr) ||
        (await this.evalExpression({ user, survey, record, node: nodeCtx, query: applyIfExpr ?? '', timezoneOffset }))
      ) {
        applicableExpressions.push(expression)

        if (stopAtFirstFound) {
          break
        }
      }
    }
    return applicableExpressions
  }

  async evalApplicableExpressions(
    params: ExpressionEvaluateParams & {
      nodeCtx: Node
      expressions: NodeDefExpression[]
      stopAtFirstFound?: boolean
    }
  ): Promise<{ expression: NodeDefExpression; value: any }[]> {
    const { nodeCtx } = params
    const applicableExpressions = await this._getApplicableExpressions(params)

    const result = []
    for await (const expression of applicableExpressions) {
      result.push({
        expression,
        value: await this.evalExpression({ ...params, node: nodeCtx, query: expression.expression ?? '' }),
      })
    }
    return result
  }

  async evalApplicableExpression(
    params: ExpressionEvaluateParams & {
      nodeCtx: Node
      expressions: NodeDefExpression[]
    }
  ): Promise<{ expression: NodeDefExpression; value: any } | null> {
    const expressionsEvaluated = await this.evalApplicableExpressions({ ...params, stopAtFirstFound: true })
    return expressionsEvaluated[0] ?? null
  }
}
