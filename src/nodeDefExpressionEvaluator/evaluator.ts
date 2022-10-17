import { ExpressionNodeType, JavascriptExpressionEvaluator } from '../expression'
import { NodeDefIdentifierEvaluator } from './node/identifier'
import { NodeDefMemberEvaluator } from './node/member'
import { NodeDefThisEvaluator } from './node/thisEvaluator'
import { nodeDefExpressionFunctions } from './functions'
import { NodeDefExpressionContext } from './context'
import { NodeDef } from '../nodeDef/nodeDef'
import { Survey, Surveys } from '../survey'

export class NodeDefExpressionEvaluator extends JavascriptExpressionEvaluator<NodeDefExpressionContext> {
  constructor() {
    super(nodeDefExpressionFunctions, {
      [ExpressionNodeType.Identifier]: NodeDefIdentifierEvaluator,
      [ExpressionNodeType.Member]: NodeDefMemberEvaluator,
      [ExpressionNodeType.This]: NodeDefThisEvaluator,
    })
  }

  _eval(params: {
    expression: string
    survey: Survey
    nodeDef: NodeDef<any>
    isContextParent?: boolean
    selfReferenceAllowed?: boolean
  }): { result: any; referencedNodeDefUuids: Set<string> } {
    const { expression, survey, nodeDef, isContextParent = true, selfReferenceAllowed = true } = params

    const nodeDefContext = isContextParent ? Surveys.getNodeDefParent({ survey, nodeDef }) : nodeDef

    const referencedNodeDefUuids: Set<string> = new Set()

    const context: NodeDefExpressionContext = {
      survey,
      nodeDefCurrent: nodeDef,
      nodeDefContext,
      object: nodeDef,
      selfReferenceAllowed,
      referencedNodeDefUuids,
    }
    const result = this.evaluate(expression, context)
    return { result, referencedNodeDefUuids }
  }

  findReferencedNodeDefUuids(params: {
    expression: string
    survey: Survey
    nodeDef: NodeDef<any>
    isContextParent?: boolean
    selfReferenceAllowed?: boolean
  }): Set<string> {
    try {
      const { referencedNodeDefUuids } = this._eval(params)
      return referencedNodeDefUuids
    } catch (error) {
      return new Set()
    }
  }

  evalExpression(params: {
    expression: string
    survey: Survey
    nodeDef: NodeDef<any>
    isContextParent?: boolean
    selfReferenceAllowed?: boolean
  }): any {
    const { result } = this._eval(params)
    return result
  }
}
