import { NodeDef, NodeDefExpression, NodeDefType } from '../../nodeDef'
import { Survey, SurveyDependencyGraph, SurveyDependencyType } from '../survey'

const enumToArray = (en: any): Array<any> => {
  const values: any[] = Object.keys(en)
    .filter((key) => !Number.isNaN(Number(key)))
    .map((key) => en[Number(key)])
  return values
}

// const isContextParentByDependencyType = {
//   [SurveyDependencyType.defaultValues]: false,
//   [SurveyDependencyType.applicable]: true,
//   [SurveyDependencyType.validations]: false,
//   [SurveyDependencyType.formula]: false,
// }

// const selfReferenceAllowedByDependencyType = {
//   [SurveyDependencyType.defaultValues]: false,
//   [SurveyDependencyType.applicable]: false,
//   [SurveyDependencyType.validations]: true,
//   [SurveyDependencyType.formula]: false,
// }

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
    dependencyTypes.push(...enumToArray(SurveyDependencyType))
  }

  dependencyTypes.forEach((depType: SurveyDependencyType) => {
    const graph = dependencyGraph[depType]
    const dependentUuidsTemp = graph[nodeDefUuid] || []
    dependentUuidsTemp.forEach((dependentUuid) => {
      dependentUuids.add(dependentUuid)
    })
  })
  return Array.from(dependentUuids.values())
}

// UPDATE

const getDependencies = (params: {
  graphs: SurveyDependencyGraph
  type: SurveyDependencyType
  nodeDefUuid: string
}): Array<string> => {
  const { graphs, type, nodeDefUuid } = params
  const graph = graphs[type]
  return graph[nodeDefUuid] || []
}

const addDependency = (params: {
  graphs: SurveyDependencyGraph
  type: SurveyDependencyType
  nodeDefUuid: string
  nodeDefDepUuid: string
}): SurveyDependencyGraph => {
  const { graphs, type, nodeDefUuid, nodeDefDepUuid } = params
  const deps = getDependencies({ graphs, type, nodeDefUuid })
  const depsUpdated = [...deps, nodeDefDepUuid]
  const graph = graphs[type] || {}
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
  const { nodeDef, type, expressions, graphs } = params
  if (!expressions || expressions.length === 0) return graphs

  //   const isContextParent = isContextParentByDependencyType[type]
  //   const selfReferenceAllowed = selfReferenceAllowedByDependencyType[type]

  const findReferencedNodeDefs = (expression: string | undefined): { [key: string]: NodeDef<NodeDefType> } => {
    if (!expression) return {}

    // try {
    //   return NodeDefExpressionValidator.findReferencedNodeDefs({
    //     survey,
    //     nodeDef,
    //     exprString: expression,
    //     isContextParent,
    //     selfReferenceAllowed,
    //   })
    // } catch (e) {
    //   // TODO ignore it?
    //   return {}
    // }
    return {}
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
    addDependency({ graphs, type, nodeDefUuid: nodeDefRef.uuid, nodeDefDepUuid: nodeDef.uuid })
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
  survey.dependencyGraph = dependencyGraph
  return survey
}

export const buildAndAssocDependencyGraph = (survey: Survey): Survey => {
  // add dependencies for every node def
  Object.values(survey.nodeDefs || {}).forEach((nodeDef) => addNodeDefDependencies({ nodeDef, survey }))
  return survey
}
