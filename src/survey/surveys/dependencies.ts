import * as SurveyNodeDefs from './nodeDefs'
import { NodeDef, NodeDefExpression, NodeDefFile, NodeDefProps, NodeDefs, NodeDefType } from '../../nodeDef'
import { NodeDefExpressionEvaluator } from '../../nodeDefExpressionEvaluator'

import { Survey, SurveyDependencyGraph, SurveyDependencySubtype, SurveyDependencyType } from '../survey'
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

const getDependencies = (params: {
  graphs: SurveyDependencyGraph
  type: SurveyDependencyType
  subtype: SurveyDependencySubtype
  nodeDefUuid: string
}): string[] => {
  const { graphs, type, subtype, nodeDefUuid } = params
  return type === SurveyDependencyType.onUpdate ? [] : ((graphs?.[type]?.[subtype]?.[nodeDefUuid] ?? []) as string[])
}

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
    const dependentUuidsTemp = getDependencies({
      graphs: dependencyGraph,
      type: depType,
      subtype: SurveyDependencySubtype.nodeDefs,
      nodeDefUuid,
    })
    dependentUuidsTemp.forEach(dependentUuids.add, dependentUuids)
  })
  return dependentUuids.size > 0 ? SurveyNodeDefs.findNodeDefsByUuids({ survey, uuids: [...dependentUuids] }) : []
}

export const getOnUpdateDependents = (params: { survey: Survey }) => {
  const { survey } = params
  const dependencyGraph = getDependencyGraph(survey)
  const sourceDefUuids = Object.keys(dependencyGraph[SurveyDependencyType.onUpdate] ?? {})
  return sourceDefUuids.length > 0 ? SurveyNodeDefs.findNodeDefsByUuids({ survey, uuids: sourceDefUuids }) : []
}

// UPDATE

/**
 * Calculates the path from a source node definition to a dependent node definition.
 * The path represents how to navigate from the source to the dependent node in the hierarchy.
 *
 * @param survey - The survey containing the node definitions
 * @param sourceNodeDef - The source (referenced) node definition
 * @param dependentNodeDef - The dependent node definition (the one with the expression)
 * @returns The path from source to dependent, or empty string if they're the same or if path cannot be determined
 */
const calculatePathFromSourceToDependent = (params: {
  survey: Survey
  sourceNodeDef: NodeDef<NodeDefType>
  dependentNodeDef: NodeDef<NodeDefType>
}): string => {
  const { survey, sourceNodeDef, dependentNodeDef } = params

  if (sourceNodeDef.uuid === dependentNodeDef.uuid) {
    return ''
  }

  // Check if they share the same parent (siblings)
  if (sourceNodeDef.parentUuid === dependentNodeDef.parentUuid && sourceNodeDef.parentUuid) {
    // They are siblings, path is just the dependent's name
    return NodeDefs.getName(dependentNodeDef)
  }

  // Get hierarchies (parent chain, not including the node itself for the source)
  const sourceHierarchy = sourceNodeDef.meta.h // Just the parent chain
  const dependentHierarchy = [...dependentNodeDef.meta.h, dependentNodeDef.uuid] // Parent chain + the dependent itself

  // Find common ancestor in the parent chains
  let commonAncestorIndex = 0
  while (
    commonAncestorIndex < sourceHierarchy.length &&
    commonAncestorIndex < dependentHierarchy.length &&
    sourceHierarchy[commonAncestorIndex] === dependentHierarchy[commonAncestorIndex]
  ) {
    commonAncestorIndex++
  }

  // Build the path from source to dependent
  const pathParts: string[] = []

  // Add parent references to go up from source's parent to common ancestor
  const levelsUp = sourceHierarchy.length - commonAncestorIndex
  for (let i = 0; i < levelsUp; i++) {
    pathParts.push('parent()')
  }

  // Add path down from common ancestor to dependent
  for (let i = commonAncestorIndex; i < dependentHierarchy.length; i++) {
    const nodeDefUuid = dependentHierarchy[i]
    const nodeDef = SurveyNodeDefs.getNodeDefByUuid({ survey, uuid: nodeDefUuid })
    pathParts.push(NodeDefs.getName(nodeDef))
  }

  return pathParts.join('.')
}

const addDependency = (params: {
  graphs: SurveyDependencyGraph
  type: SurveyDependencyType
  nodeDefUuid: string
  nodeDefDepUuid: string
  dependentNodePaths: string[]
  sideEffect: boolean
}): SurveyDependencyGraph => {
  const { graphs, type, nodeDefUuid, nodeDefDepUuid, dependentNodePaths, sideEffect = false } = params
  // node defs
  const dependentNodeDefUuidsPrev = getDependencies({
    graphs,
    type,
    subtype: SurveyDependencySubtype.nodeDefs,
    nodeDefUuid,
  })
  const dependentNodeDefUuidsUpdated = Arrays.addItem(nodeDefDepUuid, { sideEffect })(dependentNodeDefUuidsPrev)
  let graphUpdated = Objects.assocPath({
    obj: graphs,
    path: [type, SurveyDependencySubtype.nodeDefs, nodeDefUuid],
    value: dependentNodeDefUuidsUpdated,
    sideEffect,
  })
  // node paths
  const dependentNodePathsPrev = getDependencies({
    graphs: graphUpdated,
    type,
    subtype: SurveyDependencySubtype.nodePaths,
    nodeDefUuid,
  })
  const dependentNodePathsUpdated = Arrays.addItems(dependentNodePaths, { sideEffect })(dependentNodePathsPrev)
  graphUpdated = Objects.assocPath({
    obj: graphUpdated,
    path: [type, SurveyDependencySubtype.nodePaths, nodeDefUuid],
    value: dependentNodePathsUpdated,
    sideEffect,
  })
  return graphUpdated
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

  const commonSearchParams = { survey, isContextParent, selfReferenceAllowed, nodeDef }

  const findReferencedNodeDefs = async (
    expression: string | undefined
  ): Promise<{ [key: string]: NodeDef<NodeDefType> }> => {
    if (!expression) return {}

    const referencedNodeDefUuids = await new NodeDefExpressionEvaluator().findReferencedNodeDefUuids({
      ...commonSearchParams,
      expression,
    })
    const referencedNodeDefsByUuid: Dictionary<NodeDef<any>> = {}
    for (const uuid of referencedNodeDefUuids) {
      referencedNodeDefsByUuid[uuid] = SurveyNodeDefs.getNodeDefByUuid({ survey, uuid })
    }
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

  // For each referenced node, calculate the path from it to the dependent node
  Object.values(referencedNodeDefs).forEach((nodeDefRef: any) => {
    const pathFromSourceToDependent = calculatePathFromSourceToDependent({
      survey,
      sourceNodeDef: nodeDefRef,
      dependentNodeDef: nodeDef,
    })

    graphsUpdated = addDependency({
      graphs: graphsUpdated,
      type,
      nodeDefUuid: nodeDefRef.uuid,
      nodeDefDepUuid: nodeDef.uuid,
      dependentNodePaths: pathFromSourceToDependent ? [pathFromSourceToDependent] : [],
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
  let graphUpdated = { ...(graphsUpdated?.[dependencyType]?.[SurveyDependencySubtype.nodeDefs] ?? {}) }
  // dissoc nodeDefUuid dependency as dependent
  graphUpdated = Objects.dissoc({ obj: graphUpdated, prop: nodeDefUuid })

  if (dependencyType !== SurveyDependencyType.onUpdate) {
    // dissoc nodeDefUuid dependency from sources (if any)
    for (const [key, dependentUuids] of Object.entries(graphUpdated)) {
      graphUpdated[key] = Arrays.removeItem(nodeDefUuid)(dependentUuids as string[])
    }
  }

  return Objects.assocPath({
    obj: graphsUpdated,
    path: [dependencyType, SurveyDependencySubtype.nodeDefs],
    value: graphUpdated,
  })
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
