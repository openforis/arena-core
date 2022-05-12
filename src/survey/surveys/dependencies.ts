import * as SurveyNodeDefs from './nodeDefs'
import { NodeDef, NodeDefExpressionEvaluator, NodeDefProps, NodeDefType } from '../../nodeDef'
import { Survey, SurveyDependencyType } from '../survey'

const getEnumKeys = (en: any): Array<any> =>
  Object.keys(en)
    .filter((key) => !Number.isNaN(Number(key)))
    .map((key) => Number(key))

const getExpressionByDependencyType = (params: {
  nodeDef: NodeDef<NodeDefType, NodeDefProps>
  dependencyType: SurveyDependencyType
}) => {
  const { nodeDef, dependencyType } = params
  const expressionsByType = {
    [SurveyDependencyType.applicable]: () => nodeDef.propsAdvanced?.applicable,
    [SurveyDependencyType.defaultValues]: () => nodeDef.propsAdvanced?.defaultValues,
    [SurveyDependencyType.formula]: () => null,
    [SurveyDependencyType.validations]: () => nodeDef.propsAdvanced?.validations?.expressions,
  }
  return expressionsByType[dependencyType]()
}

const calculatedDependentNodeDefs = (params: {
  survey: Survey
  dependencyType: SurveyDependencyType
  nodeDef: NodeDef<NodeDefType, NodeDefProps>
}): { [key: string]: NodeDef<NodeDefType, NodeDefProps> } => {
  const { survey, nodeDef, dependencyType } = params
  const expressions = getExpressionByDependencyType({ nodeDef, dependencyType })
  if (!expressions || expressions.length === 0) return {}

  const findReferencedNodeDefs = (
    expression: string | undefined
  ): { [key: string]: NodeDef<NodeDefType, NodeDefProps> } => {
    if (!expression) return {}

    const uuids = [
      ...new NodeDefExpressionEvaluator().findReferencedNodeDefUuids({ survey, nodeDef, expression, dependencyType }),
    ]

    return SurveyNodeDefs.getNodeDefsByUuids({ survey, uuids }).reduce(
      (acc, _nodeDef) => ({ ...acc, [_nodeDef.uuid]: _nodeDef }),
      {}
    )
  }

  return expressions.reduce(
    (referencedAcc, nodeDefExpr) => ({
      ...referencedAcc,
      ...findReferencedNodeDefs(nodeDefExpr.expression),
      ...findReferencedNodeDefs(nodeDefExpr.applyIf),
    }),
    {}
  )
}

export const getNodeDefDependents = (params: {
  survey: Survey
  nodeDefUuid: string
  dependencyType: SurveyDependencyType | null
}): { [key: string]: NodeDef<NodeDefType, NodeDefProps> } => {
  const { survey, nodeDefUuid, dependencyType } = params
  const nodeDef = SurveyNodeDefs.getNodeDefByUuid({ survey, uuid: nodeDefUuid })
  if (!nodeDef) return {}

  const dependencyTypes: SurveyDependencyType[] = []
  if (dependencyType) {
    dependencyTypes.push(dependencyType)
  } else {
    dependencyTypes.push(...getEnumKeys(SurveyDependencyType))
  }

  return dependencyTypes.reduce(
    (acc, _dependencyType) => ({
      ...acc,
      ...calculatedDependentNodeDefs({ survey, nodeDef, dependencyType: _dependencyType }),
    }),
    {}
  )
}
