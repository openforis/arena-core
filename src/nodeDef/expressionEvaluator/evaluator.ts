import { ExpressionNodeType, JavascriptExpressionEvaluator } from '../../expression'
import { NodeDefIdentifierEvaluator } from './node/identifier'
import { NodeDefMemberEvaluator } from './node/member'
import { nodeDefExpressionFunctions } from './functions'
import { NodeDefExpressionContext } from './context'
import { Survey, Surveys } from '../../survey'
import { NodeDef, NodeDefProps, NodeDefType } from '../nodeDef'
import { SurveyDependencyType } from '../../survey/survey'

const isContextParentByDependencyType = {
  [SurveyDependencyType.applicable]: true,
  [SurveyDependencyType.defaultValues]: false,
  [SurveyDependencyType.formula]: false,
  [SurveyDependencyType.validations]: false,
}

const selfReferenceAllowedByDependencyType = {
  [SurveyDependencyType.applicable]: false,
  [SurveyDependencyType.defaultValues]: false,
  [SurveyDependencyType.formula]: false,
  [SurveyDependencyType.validations]: true,
}

export class NodeDefExpressionEvaluator extends JavascriptExpressionEvaluator<NodeDefExpressionContext> {
  constructor() {
    super(nodeDefExpressionFunctions, {
      [ExpressionNodeType.Identifier]: NodeDefIdentifierEvaluator,
      [ExpressionNodeType.Member]: NodeDefMemberEvaluator,
    })
  }

  findReferencedNodeDefUuids(params: {
    survey: Survey
    nodeDef: NodeDef<NodeDefType, NodeDefProps>
    expression: string
    dependencyType: SurveyDependencyType
  }): Set<string> {
    const { survey, nodeDef, expression, dependencyType } = params
    const isContextParent = isContextParentByDependencyType[dependencyType]
    const selfReferenceAllowed = selfReferenceAllowedByDependencyType[dependencyType]
    const nodeDefContext = isContextParent ? Surveys.getNodeDefParent({ survey, nodeDef }) : nodeDef
    const context = {
      survey,
      nodeDefContext,
      nodeDefCurrent: nodeDef,
      selfReferenceAllowed,
      referencedNodeDefUuids: new Set<string>(),
    }
    try {
      this.evaluate(expression, context)
      return context.referencedNodeDefUuids || new Set<string>()
    } catch (error) {
      return new Set<string>()
    }
  }
}
