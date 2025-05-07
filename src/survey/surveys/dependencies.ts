import * as SurveyNodeDefs from './nodeDefs'
import { NodeDef, NodeDefExpression, NodeDefFile, NodeDefProps, NodeDefs, NodeDefType } from '../../nodeDef'
import { NodeDefExpressionEvaluator } from '../../nodeDefExpressionEvaluator'

import { Survey, SurveyDependencyGraph, SurveyDependencyType } from '../survey'
import { Arrays, Objects } from '../../utils'
import { NodeDefExpressionFactory } from '../../nodeDef/nodeDef'
import { Dictionary } from '../../common'

const functionsRequiringOnUpdateDependency = ['recordDateLastModified']

const isContextParentByDependencyType = {
  [SurveyDependencyType.applicable]: true,
  [SurveyDependencyType.defaultValues]: true,
  [SurveyDependencyType.fileName]: true,
  [SurveyDependencyType.formula]: false,
  [SurveyDependencyType.maxCount]: true,
  [SurveyDependencyType.minCount]: true,
  [SurveyDependencyType.onUpdate]: true,
  [SurveyDependencyType.validations]: true,
}

const selfReferenceAllowedByDependencyType = {
  [SurveyDependencyType.applicable]: false,
  [SurveyDependencyType.defaultValues]: false,
  [SurveyDependencyType.fileName]: false,
  [SurveyDependencyType.formula]: false,
  [SurveyDependencyType.maxCount]: false,
  [SurveyDependencyType.minCount]: false,
  [SurveyDependencyType.onUpdate]: false,
  [SurveyDependencyType.validations]: true,
}

const newDependecyGraph = () => ({
  [SurveyDependencyType.applicable]: {},
  [SurveyDependencyType.defaultValues]: {},
  [SurveyDependencyType.fileName]: {},
  [SurveyDependencyType.formula]: {},
  [SurveyDependencyType.maxCount]: {},
  [SurveyDependencyType.minCount]: {},
  [SurveyDependencyType.onUpdate]: {},
  [SurveyDependencyType.validations]: {},
})

const getDependencyGraph = (survey: Survey): SurveyDependencyGraph => survey.dependencyGraph ?? newDependecyGraph()

export const getNodeDefDependents = (params: {
  survey: Survey
  nodeDefUuid: string
  dependencyType?: SurveyDependencyType
}): NodeDef<NodeDefType, NodeDefProps>[] => {
  const { survey, nodeDefUuid, dependencyType } = params
  const dependencyGraph = getDependencyGraph(survey)

  const dependentUuids = new Set<string>()

  const dependencyTypes: SurveyDependencyType[] = dependencyType
    ? [dependencyType]
    : Object.values(SurveyDependencyType)

  dependencyTypes.forEach((depType: SurveyDependencyType) => {
    const dependentUuidsTemp = dependencyGraph[depType]?.[nodeDefUuid] ?? []
    dependentUuidsTemp.forEach((dependentUuid) => {
      dependentUuids.add(dependentUuid)
    })
  })
  return dependentUuids.size > 0 ? SurveyNodeDefs.findNodeDefsByUuids({ survey, uuids: [...dependentUuids] }) : []
}

export const getOnUpdateDependents = (params: { survey: Survey }) => {
  const { survey } = params
  const dependencyGraph = getDependencyGraph(survey)
  const sourceDefUuids = Object.keys(dependencyGraph[SurveyDependencyType.onUpdate] ?? {})
  return sourceDefUuids.length > 0 ? SurveyNodeDefs.findNodeDefsByUuids({ survey, uuids: sourceDefUuids }) : []
}

const getDependencies = (params: {
  graphs: SurveyDependencyGraph
  type: SurveyDependencyType
  nodeDefUuid: string
}): Array<string> => {
  const { graphs, type, nodeDefUuid } = params
  const graph = graphs[type] ?? {}
  return graph[nodeDefUuid] ?? []
}

// UPDATE

const addDependency = (params: {
  graphs: SurveyDependencyGraph
  type: SurveyDependencyType
  nodeDefUuid: string
  nodeDefDepUuid: string
  sideEffect: boolean
}): SurveyDependencyGraph => {
  const { graphs, type, nodeDefUuid, nodeDefDepUuid, sideEffect = false } = params
  const deps = getDependencies({ graphs, type, nodeDefUuid })
  const depsUpdated = Arrays.addItem(nodeDefDepUuid, { sideEffect })(deps)
  return Objects.assocPath({ obj: graphs, path: [type, nodeDefUuid], value: depsUpdated, sideEffect })
}

const addDependencies = async (params: {
  survey: Survey
  nodeDef: NodeDef<NodeDefType>
  type: SurveyDependencyType
  graphs: SurveyDependencyGraph
  expressions: NodeDefExpression[]
  sideEffect?: boolean
}): Promise<SurveyDependencyGraph> => {
  const { survey, nodeDef, type, expressions, graphs: graphsParam, sideEffect = false } = params

  let graphsUpdated = sideEffect ? graphsParam : { ...graphsParam }

  if (!expressions || expressions.length === 0) return graphsUpdated

  const isContextParent = isContextParentByDependencyType[type]
  const selfReferenceAllowed = selfReferenceAllowedByDependencyType[type]

  const findReferencedNodeDefs = async (
    expression: string | undefined
  ): Promise<{ [key: string]: NodeDef<NodeDefType> }> => {
    if (!expression) return {}

    const referencedNodeDefUuids = await new NodeDefExpressionEvaluator().findReferencedNodeDefUuids({
      expression,
      survey,
      nodeDef,
      isContextParent,
      selfReferenceAllowed,
    })
    const referencedNodeDefsByUuid: Dictionary<NodeDef<any>> = {}
    referencedNodeDefUuids.forEach((uuid) => {
      referencedNodeDefsByUuid[uuid] = SurveyNodeDefs.getNodeDefByUuid({ survey, uuid })
    })
    return referencedNodeDefsByUuid
  }

  const referencedNodeDefs = {}
  for (const nodeDefExpr of expressions) {
    Object.assign(
      referencedNodeDefs,
      await findReferencedNodeDefs(nodeDefExpr.expression),
      await findReferencedNodeDefs(nodeDefExpr.applyIf)
    )
  }

  Object.values(referencedNodeDefs).forEach((nodeDefRef: any) => {
    graphsUpdated = addDependency({
      graphs: graphsUpdated,
      type,
      nodeDefUuid: nodeDefRef.uuid,
      nodeDefDepUuid: nodeDef.uuid,
      sideEffect,
    })
  })

  return graphsUpdated
}

export const addNodeDefDependencies = async (params: {
  nodeDef: NodeDef<NodeDefType>
  survey: Survey
  sideEffect?: boolean
}): Promise<Survey> => {
  const { nodeDef, survey, sideEffect = false } = params
  const graphs = getDependencyGraph(survey)
  let graphsUpdated = sideEffect ? graphs : { ...graphs }

  const _addDependencies = async (type: SurveyDependencyType, expressions: NodeDefExpression[]) => {
    let _graphUpdated = await addDependencies({
      survey,
      nodeDef,
      type,
      expressions,
      graphs: graphsUpdated,
      sideEffect,
    })
    // add onUpdate dependencies
    if (
      expressions.some((expression) =>
        functionsRequiringOnUpdateDependency.some(
          (functionName) => expression.applyIf?.includes(functionName) || expression.expression?.includes(functionName)
        )
      )
    ) {
      _graphUpdated = Objects.assocPath({
        obj: _graphUpdated,
        path: [SurveyDependencyType.onUpdate, nodeDef.uuid],
        value: true,
        sideEffect,
      })
    }
    return _graphUpdated
  }
  graphsUpdated = await _addDependencies(SurveyDependencyType.defaultValues, NodeDefs.getDefaultValues(nodeDef))
  graphsUpdated = await _addDependencies(SurveyDependencyType.applicable, NodeDefs.getApplicable(nodeDef))
  graphsUpdated = await _addDependencies(SurveyDependencyType.validations, NodeDefs.getValidationsExpressions(nodeDef))
  const maxCount = NodeDefs.getMaxCount(nodeDef)
  if (Array.isArray(maxCount)) {
    graphsUpdated = await _addDependencies(SurveyDependencyType.maxCount, maxCount)
  }
  const minCount = NodeDefs.getMinCount(nodeDef)
  if (Array.isArray(minCount)) {
    graphsUpdated = await _addDependencies(SurveyDependencyType.minCount, minCount)
  }
  // file name expression
  if (NodeDefs.getType(nodeDef) === NodeDefType.file) {
    const fileNameExpression = NodeDefs.getFileNameExpression(nodeDef as NodeDefFile)
    if (fileNameExpression) {
      graphsUpdated = await _addDependencies(SurveyDependencyType.fileName, [
        NodeDefExpressionFactory.createInstance({ expression: fileNameExpression }),
      ])
    }
  }
  if (sideEffect) {
    survey.dependencyGraph = graphsUpdated
    return survey
  }
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
  let graphUpdated = { ...(graphsUpdated[dependencyType] ?? {}) }
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

export const buildAndAssocDependencyGraph = async (survey: Survey): Promise<Survey> => {
  survey.dependencyGraph = newDependecyGraph()

  const sideEffect = true // when the dependency graph is built from scratch, do side effect to avoid re-creating objects

  // add dependencies for every node def
  let surveyUpdated = survey
  for (const nodeDef of SurveyNodeDefs.getNodeDefsArray(survey)) {
    surveyUpdated = await addNodeDefDependencies({ nodeDef, survey: surveyUpdated, sideEffect })
  }
  return surveyUpdated
}
