import * as SurveyNodeDefs from './nodeDefs'
import { NodeDef, NodeDefExpression, NodeDefProps, NodeDefs, NodeDefType } from '../../nodeDef'
import { NodeDefExpressionEvaluator } from '../../nodeDefExpressionEvaluator'

import { Survey, SurveyDependencyGraph, SurveyDependencyType } from '../survey'
import { Arrays, Objects } from '../../utils'

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

export const getNodeDefDependents = (params: {
  survey: Survey
  nodeDefUuid: string
  dependencyType?: SurveyDependencyType
}): NodeDef<NodeDefType, NodeDefProps>[] => {
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
  return SurveyNodeDefs.getNodeDefsByUuids({ survey, uuids: [...dependentUuids] })
}

const getDependencies = (params: {
  graphs: SurveyDependencyGraph
  type: SurveyDependencyType
  nodeDefUuid: string
}): Array<string> => {
  const { graphs, type, nodeDefUuid } = params
  const graph = graphs[type] || {}
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
  graphs: SurveyDependencyGraph
  expressions: NodeDefExpression[]
}): SurveyDependencyGraph => {
  const { survey, nodeDef, type, expressions, graphs: graphsParam } = params

  let graphsUpdated = { ...graphsParam }

  if (!expressions || expressions.length === 0) return graphsUpdated

  const isContextParent = isContextParentByDependencyType[type]
  const selfReferenceAllowed = selfReferenceAllowedByDependencyType[type]

  const findReferencedNodeDefs = (expression: string | undefined): { [key: string]: NodeDef<NodeDefType> } => {
    if (!expression) return {}

    const referencedNodeDefUuids = new NodeDefExpressionEvaluator().findReferencedNodeDefUuids({
      expression,
      survey,
      nodeDef,
      isContextParent,
      selfReferenceAllowed,
    })
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
    graphsUpdated = addDependency({
      graphs: graphsUpdated,
      type,
      nodeDefUuid: nodeDefRef.uuid,
      nodeDefDepUuid: nodeDef.uuid,
    })
  })

  return graphsUpdated
}

export const addNodeDefDependencies = (params: { nodeDef: NodeDef<NodeDefType>; survey: Survey }): Survey => {
  const { nodeDef, survey } = params
  let graphsUpdated = getDependencyGraph(survey)

  const _addDependencies = (type: SurveyDependencyType, expressions: NodeDefExpression[]) =>
    addDependencies({
      survey,
      nodeDef,
      type,
      expressions,
      graphs: graphsUpdated,
    })
  graphsUpdated = _addDependencies(SurveyDependencyType.defaultValues, NodeDefs.getDefaultValues(nodeDef))
  graphsUpdated = _addDependencies(SurveyDependencyType.applicable, NodeDefs.getApplicable(nodeDef))
  graphsUpdated = _addDependencies(
    SurveyDependencyType.validations,
    NodeDefs.getValidations(nodeDef)?.expressions || []
  )
  return { ...survey, dependencyGraph: graphsUpdated }
}

// DELETE

const _removeNodeDefDependenciesOfType = (params: {
  graphs: SurveyDependencyGraph
  dependencyType: SurveyDependencyType
  nodeDefUuid: string
}): SurveyDependencyGraph => {
  const { graphs, nodeDefUuid, dependencyType } = params

  const graphsUpdated = { ...graphs }
  let graphUpdated = { ...(graphsUpdated[dependencyType] || {}) }
  // dissoc nodeDefUuid dependency as dependent
  graphUpdated = Objects.dissoc({ obj: graphUpdated, prop: nodeDefUuid })

  // dissoc nodeDefUuid dependency from sources (if any)
  Object.entries(graphUpdated).forEach(([key, dependentUuids]) => {
    graphUpdated[key] = Arrays.removeItem(nodeDefUuid)(dependentUuids)
  })

  graphsUpdated[dependencyType] = graphUpdated
  return graphsUpdated
}

export const removeNodeDefDependencies = (params: {
  survey: Survey
  nodeDefUuid: string
  dependencyType?: SurveyDependencyType
}): Survey => {
  const { survey, nodeDefUuid, dependencyType = null } = params
  const graphs = getDependencyGraph(survey)
  const dependencyTypes = dependencyType ? [dependencyType] : (Object.keys(graphs) as SurveyDependencyType[])
  const graphsUpdated = dependencyTypes.reduce(
    (dependencyGraphAcc, type) =>
      _removeNodeDefDependenciesOfType({ graphs: dependencyGraphAcc, dependencyType: type, nodeDefUuid }),
    graphs
  )
  return { ...survey, dependencyGraph: graphsUpdated }
}

export const buildAndAssocDependencyGraph = (survey: Survey): Survey =>
  // add dependencies for every node def
  Object.values(survey.nodeDefs || {}).reduce(
    (surveyAcc, nodeDef) => addNodeDefDependencies({ nodeDef, survey: surveyAcc }),
    survey
  )
