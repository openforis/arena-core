import { ArenaUser } from '../auth'
import { ExpressionNodeType, JavascriptExpressionEvaluator } from '../expression'
import { NodeDefIdentifierEvaluator } from './node/identifier'
import { NodeDefMemberEvaluator } from './node/member'
import { NodeDefThisEvaluator } from './node/thisEvaluator'
import { nodeDefExpressionFunctions } from './functions'
import { NodeDefExpressionContext } from './context'
import { ArenaNodeDef } from '../nodeDef/nodeDef'
import { ArenaSurvey } from '../survey'
import { getNodeDefParent } from '../survey/surveys/nodeDefs'

export type ExpressionEvaluatorParams = {
  expression: string
  user?: ArenaUser
  survey: ArenaSurvey
  nodeDef: ArenaNodeDef<any>
  isContextParent?: boolean
  selfReferenceAllowed?: boolean
  itemsFilter?: boolean
}

export class NodeDefExpressionEvaluator extends JavascriptExpressionEvaluator<NodeDefExpressionContext> {
  constructor() {
    super(nodeDefExpressionFunctions, {
      [ExpressionNodeType.Identifier]: NodeDefIdentifierEvaluator,
      [ExpressionNodeType.Member]: NodeDefMemberEvaluator,
      [ExpressionNodeType.This]: NodeDefThisEvaluator,
    })
  }

  async _eval(
    params: ExpressionEvaluatorParams,
    referencedNodeDefUuids: Set<string> = new Set(),
    nodeDateReferencedNodeDefUuids: Set<string> = new Set()
  ): Promise<{ result: any; referencedNodeDefUuids: Set<string> }> {
    const {
      expression,
      user,
      survey,
      nodeDef,
      isContextParent = true,
      selfReferenceAllowed = true,
      itemsFilter = false,
    } = params

    const nodeDefContext = isContextParent ? getNodeDefParent({ survey, nodeDef }) : nodeDef

    const context: NodeDefExpressionContext = {
      user,
      survey,
      nodeDefCurrent: nodeDef,
      nodeDefContext,
      object: nodeDef,
      selfReferenceAllowed,
      referencedNodeDefUuids,
      nodeDateReferencedNodeDefUuids,
      itemsFilter,
    }
    const result = await this.evaluate(expression, context)
    return { result, referencedNodeDefUuids }
  }

  /**
   * Finds the node defs referenced by the expression.
   * If the evaluation fails, the node defs referenced before the error are returned: an empty set would drop
   * all the dependencies of the expression.
   */
  async findReferencedNodeDefUuids(params: ExpressionEvaluatorParams): Promise<Set<string>> {
    const referencedNodeDefUuids: Set<string> = new Set()
    try {
      await this._eval(params, referencedNodeDefUuids)
    } catch {
      // invalid expression (reported by the expression validator): keep the references found so far
    }
    return referencedNodeDefUuids
  }

  /**
   * Finds the node defs referenced by the expression (see findReferencedNodeDefUuids) and the entity defs
   * whose nodes dates are used in it (nodeDateCreated, nodeDateModified functions).
   */
  async findReferencedNodeDefUuidsWithNodeDates(
    params: ExpressionEvaluatorParams
  ): Promise<{ referencedNodeDefUuids: Set<string>; nodeDateReferencedNodeDefUuids: Set<string> }> {
    const referencedNodeDefUuids: Set<string> = new Set()
    const nodeDateReferencedNodeDefUuids: Set<string> = new Set()
    try {
      await this._eval(params, referencedNodeDefUuids, nodeDateReferencedNodeDefUuids)
    } catch {
      // invalid expression (reported by the expression validator): keep the references found so far
    }
    return { referencedNodeDefUuids, nodeDateReferencedNodeDefUuids }
  }

  async evalExpression(params: ExpressionEvaluatorParams): Promise<any> {
    const { result } = await this._eval(params)
    return result
  }
}
