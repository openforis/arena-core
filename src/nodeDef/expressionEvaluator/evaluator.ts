import { ExpressionNodeType, JavascriptExpressionEvaluator } from '../../expression'
import { NodeDefIdentifierEvaluator } from './node/identifier'
import { NodeDefMemberEvaluator } from './node/member'
import { NodeDefThisEvaluator } from './node/thisEvaluator'
import { nodeDefExpressionFunctions } from './functions'
import { NodeDefExpressionContext } from './context'
import { NodeDef } from '../nodeDef'
import { Survey, Surveys } from '../../survey'

export class NodeDefExpressionEvaluator extends JavascriptExpressionEvaluator<NodeDefExpressionContext> {
  constructor() {
    super(nodeDefExpressionFunctions, {
      [ExpressionNodeType.Identifier]: NodeDefIdentifierEvaluator,
      [ExpressionNodeType.Member]: NodeDefMemberEvaluator,
      [ExpressionNodeType.This]: NodeDefThisEvaluator,
    })
  }

  findReferencedNodeDefUuids(params: {
    expression: string
    survey: Survey
    nodeDef: NodeDef<any>
    isContextParent?: boolean
    selfReferenceAllowed?: boolean
  }): Set<string> {
    const { expression, survey, nodeDef, isContextParent = true, selfReferenceAllowed = true } = params

    const nodeDefContext = isContextParent ? Surveys.getNodeDefParent({ survey, nodeDef }) : nodeDef

    const context: NodeDefExpressionContext = {
      survey,
      nodeDefCurrent: nodeDef,
      nodeDefContext,
      selfReferenceAllowed,
    }
    try {
      this.evaluate(expression, context)
      return context.referencedNodeDefUuids || new Set()
    } catch (error) {
      return new Set()
    }
  }
}
