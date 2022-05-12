import * as SurveyNodeDefs from './nodeDefs'
import { NodeDef, NodeDefExpression, NodeDefExpressionEvaluator, NodeDefType } from '../../nodeDef'
import { Survey, SurveyDependencyGraph, SurveyDependencyType } from '../survey'

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

const getDependencyGraph = (survey: Survey): SurveyDependencyGraph =>
  survey.dependencyGraph || {
    [SurveyDependencyType.applicable]: {},
    [SurveyDependencyType.defaultValues]: {},
    [SurveyDependencyType.formula]: {},
    [SurveyDependencyType.validations]: {},
  }

export const getNodeDefDependentUuids = (params: {
  survey: Survey
  nodeDefUuid: string
  dependencyType: SurveyDependencyType | null
}): Array<string> => {
  const { survey, nodeDefUuid, dependencyType } = params
  const dependencyGraph = getDependencyGraph(survey)

  const dependentUuids = new Set<string>()

  const dependencyTypes: Array<SurveyDependencyType> = []
  if (dependencyType) {
    dependencyTypes.push(dependencyType)
  } else {
    dependencyTypes.push(...Object.values(SurveyDependencyType))
  }

  dependencyTypes.forEach((depType: SurveyDependencyType) => {
    const dependentUuidsTemp = dependencyGraph[depType]?.[nodeDefUuid] || []
    dependentUuidsTemp.forEach((dependentUuid) => {
      dependentUuids.add(dependentUuid)
    })
  })
  return Array.from(dependentUuids.values())
}

const getDependencies = (params: {
  graphs: SurveyDependencyGraph
  type: SurveyDependencyType
  nodeDefUuid: string
}): Array<string> => {
  const { graphs, type, nodeDefUuid } = params
  const graph = graphs[type]
  return graph[nodeDefUuid] || []
}

// UPDATE

const addDependency = (params: {
  graphs: SurveyDependencyGraph
  type: SurveyDependencyType
  nodeDefUuid: string
  nodeDefDepUuid: string
}): SurveyDependencyGraph => {
  const { graphs, type, nodeDefUuid, nodeDefDepUuid } = params
  const deps = getDependencies({ graphs, type, nodeDefUuid })
  const depsUpdated = [...deps, nodeDefDepUuid]
  const graph = { ...(graphs[type] || {}) }
  graph[nodeDefUuid] = depsUpdated
  return { ...graphs, [type]: graph }
}

const addDependencies = (params: {
  survey: Survey
  nodeDef: NodeDef<NodeDefType>
  type: SurveyDependencyType
  expressions: NodeDefExpression[] | undefined
  graphs: SurveyDependencyGraph
}): SurveyDependencyGraph => {
  const { survey, nodeDef, type, expressions, graphs: graphsParam } = params

  let graphs = { ...graphsParam }

  if (!expressions || expressions.length === 0) return graphs

  const isContextParent = isContextParentByDependencyType[type]
  const selfReferenceAllowed = selfReferenceAllowedByDependencyType[type]

  const findReferencedNodeDefs = (expression: string | undefined): { [key: string]: NodeDef<NodeDefType> } => {
    if (!expression) return {}

    const nodeDefContext = isContextParent ? SurveyNodeDefs.getNodeDefParent({ survey, nodeDef }) : nodeDef
    const context = { survey, nodeDefContext, nodeDefCurrent: nodeDef, selfReferenceAllowed }
    const referencedNodeDefUuids = new NodeDefExpressionEvaluator().findReferencedNodeDefUuids(expression, context)
    return [...referencedNodeDefUuids.values()].reduce(
      (acc, uuid) => ({ ...acc, [uuid]: SurveyNodeDefs.getNodeDefByUuid({ survey, uuid }) }),
      {}
    )
  }

  const referencedNodeDefs = expressions.reduce(
    (referencedAcc, nodeDefExpr) => ({
      ...referencedAcc,
      ...findReferencedNodeDefs(nodeDefExpr.expression),
      ...findReferencedNodeDefs(nodeDefExpr.applyIf),
    }),
    {}
  )

  Object.values(referencedNodeDefs).forEach((nodeDefRef: any) => {
    graphs = addDependency({ graphs, type, nodeDefUuid: nodeDefRef.uuid, nodeDefDepUuid: nodeDef.uuid })
  })

  return graphs
}

export const addNodeDefDependencies = (params: { nodeDef: NodeDef<NodeDefType>; survey: Survey }): Survey => {
  const { nodeDef, survey } = params
  const graphs = getDependencyGraph(survey)

  let dependencyGraph = graphs
  dependencyGraph = addDependencies({
    survey,
    nodeDef,
    type: SurveyDependencyType.defaultValues,
    expressions: nodeDef.propsAdvanced?.defaultValues,
    graphs: dependencyGraph,
  })
  dependencyGraph = addDependencies({
    survey,
    nodeDef,
    type: SurveyDependencyType.applicable,
    expressions: nodeDef.propsAdvanced?.applicable,
    graphs: dependencyGraph,
  })
  dependencyGraph = addDependencies({
    survey,
    nodeDef,
    type: SurveyDependencyType.validations,
    expressions: nodeDef.propsAdvanced?.validations?.expressions,
    graphs: dependencyGraph,
  })
  return { ...survey, dependencyGraph }
}

export const buildAndAssocDependencyGraph = (survey: Survey): Survey =>
  // add dependencies for every node def
  Object.values(survey.nodeDefs || {}).reduce(
    (surveyAcc, nodeDef) => addNodeDefDependencies({ nodeDef, survey: surveyAcc }),
    survey
  )
