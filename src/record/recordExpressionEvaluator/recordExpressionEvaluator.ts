import { ArenaCategoryItem } from '../../category'
import { ExpressionNodeType, JavascriptExpressionEvaluator } from '../../expression'
import { ArenaRecordNode } from '../../node'
import { ArenaNodeDefExpression, NodeDefs } from '../../nodeDef'
import { Surveys } from '../../survey'
import { ArenaTaxon } from '../../taxonomy'
import { Objects } from '../../utils'
import { Records } from '../records'
import { ArenaRecordExpressionContext } from './context'
import { recordExpressionFunctions } from './functions'
import { RecordIdentifierEvaluator } from './node/identifier'
import { RecordThisEvaluator } from './node/thisEvaluator'
import type { RecordExpressionEvaluationParams } from '../recordNodesUpdater/recordExpressionEvaluationContext'

type ExpressionEvaluateParams = RecordExpressionEvaluationParams

export class RecordExpressionEvaluator extends JavascriptExpressionEvaluator<ArenaRecordExpressionContext> {
  constructor() {
    super(recordExpressionFunctions, {
      [ExpressionNodeType.Identifier]: RecordIdentifierEvaluator,
      [ExpressionNodeType.This]: RecordThisEvaluator,
    })
  }

  async evalExpression(
    params: ExpressionEvaluateParams & {
      node: ArenaRecordNode
      query: string
      item?: ArenaCategoryItem | ArenaTaxon
    }
  ): Promise<any> {
    const { survey, record, node, query, item } = params
    const nodeDef = Surveys.getNodeDefByUuid({ survey, uuid: node.nodeDefUuid })
    const nodeContext = NodeDefs.isEntity(nodeDef) ? node : Records.getParent(node)(record)
    if (!nodeContext) return null
    const context: ArenaRecordExpressionContext = {
      ...params,
      nodeContext,
      nodeCurrent: node,
      object: nodeContext,
      item,
    }
    return this.evaluate(query, context)
  }

  private async _getApplicableExpressions(
    params: ExpressionEvaluateParams & {
      nodeCtx: ArenaRecordNode
      expressions: ArenaNodeDefExpression[]
      stopAtFirstFound?: boolean
    }
  ): Promise<ArenaNodeDefExpression[]> {
    const { nodeCtx, expressions, stopAtFirstFound = false } = params
    const applicableExpressions: ArenaNodeDefExpression[] = []

    for (const expression of expressions) {
      const applyIfExpr = expression.applyIf

      if (
        Objects.isEmpty(applyIfExpr) ||
        (await this.evalExpression({ ...params, node: nodeCtx, query: applyIfExpr ?? '' }))
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
      nodeCtx: ArenaRecordNode
      expressions: ArenaNodeDefExpression[]
      stopAtFirstFound?: boolean
    }
  ): Promise<{ expression: ArenaNodeDefExpression; value: any }[]> {
    const { nodeCtx } = params
    const applicableExpressions = await this._getApplicableExpressions(params)

    return Promise.all(
      applicableExpressions.map(async (expression) => ({
        expression,
        value: await this.evalExpression({ ...params, node: nodeCtx, query: expression.expression ?? '' }),
      }))
    )
  }

  async evalApplicableExpression(
    params: ExpressionEvaluateParams & {
      nodeCtx: ArenaRecordNode
      expressions: ArenaNodeDefExpression[]
    }
  ): Promise<{ expression: ArenaNodeDefExpression; value: any } | null> {
    const expressionsEvaluated = await this.evalApplicableExpressions({ ...params, stopAtFirstFound: true })
    return expressionsEvaluated[0] ?? null
  }
}
