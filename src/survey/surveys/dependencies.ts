import * as SurveyNodeDefs from './nodeDefs'
import {
  ArenaAnyNodeDef,
  ArenaNodeDefCode,
  ArenaNodeDefEntity,
  ArenaNodeDefExpression,
  ArenaNodeDefFile,
  NodeDefs,
  NodeDefType,
} from '../../nodeDef'
import { NodeDefExpressionEvaluator } from '../../nodeDefExpressionEvaluator'
import { findFunctionCallNames } from '../../expression/javascript/parser/expressionNodesFinder'

import { ArenaSurvey, ArenaSurveyDependencyGraph, SurveyDependencyType } from '../survey'
import { Arrays, Objects } from '../../utils'
import { NodeDefExpressionFactory } from '../../nodeDef/nodeDef'

// dependency types stored as dictionary of booleans (node def uuid => true), not as dependents of a node def
const booleanDependencyTypes = new Set<SurveyDependencyType>([
  SurveyDependencyType.onUpdate,
  SurveyDependencyType.appInfo,
])

const functionNamesByBooleanDependencyType: { [key: string]: string[] } = {
  [SurveyDependencyType.onUpdate]: ['recordDateLastModified'],
  [SurveyDependencyType.appInfo]: ['appId', 'appPlatform', 'appVersion'],
}

const isContextParentByDependencyType = {
  [SurveyDependencyType.appInfo]: true,
  [SurveyDependencyType.applicable]: true,
  [SurveyDependencyType.defaultValues]: true,
  [SurveyDependencyType.editable]: true,
  [SurveyDependencyType.enumeratingItems]: true,
  [SurveyDependencyType.fileName]: true,
  [SurveyDependencyType.formula]: false,
  [SurveyDependencyType.maxCount]: true,
  [SurveyDependencyType.minCount]: true,
  [SurveyDependencyType.nodeDates]: true,
  [SurveyDependencyType.onUpdate]: true,
  [SurveyDependencyType.parentCode]: false,
  [SurveyDependencyType.required]: true,
  [SurveyDependencyType.validations]: true,
  [SurveyDependencyType.visible]: true,
}

const selfReferenceAllowedByDependencyType = {
  [SurveyDependencyType.appInfo]: false,
  [SurveyDependencyType.applicable]: false,
  [SurveyDependencyType.defaultValues]: false,
  [SurveyDependencyType.editable]: false,
  [SurveyDependencyType.enumeratingItems]: false,
  [SurveyDependencyType.fileName]: false,
  [SurveyDependencyType.formula]: false,
  [SurveyDependencyType.maxCount]: false,
  [SurveyDependencyType.minCount]: false,
  [SurveyDependencyType.nodeDates]: false,
  [SurveyDependencyType.onUpdate]: false,
  [SurveyDependencyType.parentCode]: false,
  [SurveyDependencyType.required]: false,
  [SurveyDependencyType.validations]: true,
  [SurveyDependencyType.visible]: false,
}

const newDependencyGraph = () => ({
  [SurveyDependencyType.appInfo]: {},
  [SurveyDependencyType.applicable]: {},
  [SurveyDependencyType.defaultValues]: {},
  [SurveyDependencyType.editable]: {},
  [SurveyDependencyType.enumeratingItems]: {},
  [SurveyDependencyType.fileName]: {},
  [SurveyDependencyType.formula]: {},
  [SurveyDependencyType.maxCount]: {},
  [SurveyDependencyType.minCount]: {},
  [SurveyDependencyType.nodeDates]: {},
  [SurveyDependencyType.onUpdate]: {},
  [SurveyDependencyType.parentCode]: {},
  [SurveyDependencyType.required]: {},
  [SurveyDependencyType.validations]: {},
  [SurveyDependencyType.visible]: {},
})

const getDependencyGraph = (survey: ArenaSurvey): ArenaSurveyDependencyGraph =>
  survey.dependencyGraph ?? newDependencyGraph()

const getDependencies = (params: {
  graphs: ArenaSurveyDependencyGraph
  type: SurveyDependencyType
  nodeDefUuid: string
}): Array<string> => {
  const { graphs, type, nodeDefUuid } = params
  return booleanDependencyTypes.has(type) ? [] : ((graphs?.[type]?.[nodeDefUuid] ?? []) as string[])
}

export const getNodeDefDependents = (params: {
  survey: ArenaSurvey
  nodeDefUuid: string
  dependencyType?: SurveyDependencyType
}): ArenaAnyNodeDef[] => {
  const { survey, nodeDefUuid, dependencyType } = params
  const dependencyGraph = getDependencyGraph(survey)

  const dependentUuids = new Set<string>()

  const dependencyTypes: SurveyDependencyType[] = dependencyType
    ? [dependencyType]
    : Object.values(SurveyDependencyType)

  for (const depType of dependencyTypes) {
    const dependentUuidsTemp = getDependencies({ graphs: dependencyGraph, type: depType, nodeDefUuid })
    for (const dependentUuid of dependentUuidsTemp) {
      dependentUuids.add(dependentUuid)
    }
  }
  return dependentUuids.size > 0 ? SurveyNodeDefs.findNodeDefsByUuids({ survey, uuids: [...dependentUuids] }) : []
}

const getBooleanDependencyTypeDependents = (params: {
  survey: ArenaSurvey
  dependencyType: SurveyDependencyType
}): ArenaAnyNodeDef[] => {
  const { survey, dependencyType } = params
  const dependencyGraph = getDependencyGraph(survey)
  const sourceDefUuids = Object.keys(dependencyGraph[dependencyType] ?? {})
  return sourceDefUuids.length > 0 ? SurveyNodeDefs.findNodeDefsByUuids({ survey, uuids: sourceDefUuids }) : []
}

/**
 * Returns the node defs to be evaluated again on every record update (their expressions use e.g. recordDateLastModified).
 */
export const getOnUpdateDependents = (params: { survey: ArenaSurvey }): ArenaAnyNodeDef[] =>
  getBooleanDependencyTypeDependents({ survey: params.survey, dependencyType: SurveyDependencyType.onUpdate })

/**
 * Returns the node defs to be evaluated again when a record is updated with a different app
 * (their expressions use the app info functions: appId, appPlatform, appVersion).
 */
export const getAppInfoDependents = (params: { survey: ArenaSurvey }): ArenaAnyNodeDef[] =>
  getBooleanDependencyTypeDependents({ survey: params.survey, dependencyType: SurveyDependencyType.appInfo })

// UPDATE

const addDependency = (params: {
  graphs: ArenaSurveyDependencyGraph
  type: SurveyDependencyType
  nodeDefUuid: string
  nodeDefDepUuid: string
  sideEffect: boolean
}): ArenaSurveyDependencyGraph => {
  const { graphs, type, nodeDefUuid, nodeDefDepUuid, sideEffect = false } = params
  const deps = getDependencies({ graphs, type, nodeDefUuid })
  // dependencies of a node def can be added again (e.g. when it is updated): keep each dependent only once
  if (deps.includes(nodeDefDepUuid)) return graphs
  const depsUpdated = Arrays.addItem(nodeDefDepUuid, { sideEffect })(deps)
  return Objects.assocPath({ obj: graphs, path: [type, nodeDefUuid], value: depsUpdated, sideEffect })
}

const addDependencies = async (params: {
  survey: ArenaSurvey
  nodeDef: ArenaAnyNodeDef
  type: SurveyDependencyType
  graphs: ArenaSurveyDependencyGraph
  expressions: ArenaNodeDefExpression[]
  sideEffect?: boolean
}): Promise<ArenaSurveyDependencyGraph> => {
  const { survey, nodeDef, type, expressions, graphs: graphsParam, sideEffect = false } = params

  if (!expressions || expressions.length === 0) return graphsParam

  let graphsUpdated = sideEffect ? graphsParam : { ...graphsParam }

  const isContextParent = isContextParentByDependencyType[type]
  const selfReferenceAllowed = selfReferenceAllowedByDependencyType[type]

  const referencedNodeDefUuids = new Set<string>()
  const nodeDateReferencedNodeDefUuids = new Set<string>()

  const findReferencedNodeDefs = async (expression: string | undefined): Promise<void> => {
    if (!expression) return

    const result = await new NodeDefExpressionEvaluator().findReferencedNodeDefUuidsWithNodeDates({
      expression,
      survey,
      nodeDef,
      isContextParent,
      selfReferenceAllowed,
    })
    result.referencedNodeDefUuids.forEach((uuid) => referencedNodeDefUuids.add(uuid))
    result.nodeDateReferencedNodeDefUuids.forEach((uuid) => nodeDateReferencedNodeDefUuids.add(uuid))
  }

  await Promise.all(
    expressions.flatMap((nodeDefExpr) => [
      findReferencedNodeDefs(nodeDefExpr.expression),
      findReferencedNodeDefs(nodeDefExpr.applyIf),
    ])
  )

  const addGraphDependencies = (dependencyType: SurveyDependencyType, sourceDefUuids: Set<string>): void => {
    for (const sourceDefUuid of sourceDefUuids) {
      // the referenced node def must exist
      const sourceDef = SurveyNodeDefs.getNodeDefByUuid({ survey, uuid: sourceDefUuid })
      graphsUpdated = addDependency({
        graphs: graphsUpdated,
        type: dependencyType,
        nodeDefUuid: sourceDef.uuid,
        nodeDefDepUuid: nodeDef.uuid,
        sideEffect,
      })
    }
  }
  addGraphDependencies(type, referencedNodeDefUuids)
  // entities whose nodes dates are used in the expressions (nodeDateCreated, nodeDateModified)
  addGraphDependencies(SurveyDependencyType.nodeDates, nodeDateReferencedNodeDefUuids)

  return graphsUpdated
}

export const addNodeDefDependencies = async (params: {
  nodeDef: ArenaAnyNodeDef
  survey: ArenaSurvey
  sideEffect?: boolean
}): Promise<ArenaSurvey> => {
  const { nodeDef, survey, sideEffect = false } = params
  const graphs = getDependencyGraph(survey)
  let graphsUpdated = sideEffect ? graphs : { ...graphs }

  const _addDependencies = async (type: SurveyDependencyType, expressions: ArenaNodeDefExpression[]) => {
    let _graphUpdated = await addDependencies({
      survey,
      nodeDef,
      type,
      expressions,
      graphs: graphsUpdated,
      sideEffect,
    })
    // add boolean (onUpdate, appInfo) dependencies
    const calledFunctionNames = new Set(
      expressions.flatMap((expression) => [
        ...findFunctionCallNames(expression.expression),
        ...findFunctionCallNames(expression.applyIf),
      ])
    )
    for (const [booleanDependencyType, functionNames] of Object.entries(functionNamesByBooleanDependencyType)) {
      if (functionNames.some((functionName) => calledFunctionNames.has(functionName))) {
        _graphUpdated = Objects.assocPath({
          obj: _graphUpdated,
          path: [booleanDependencyType, nodeDef.uuid],
          value: true,
          sideEffect,
        })
      }
    }
    return _graphUpdated
  }
  graphsUpdated = await _addDependencies(SurveyDependencyType.applicable, NodeDefs.getApplicable(nodeDef))
  graphsUpdated = await _addDependencies(SurveyDependencyType.defaultValues, NodeDefs.getDefaultValues(nodeDef))
  graphsUpdated = await _addDependencies(SurveyDependencyType.editable, NodeDefs.getEditableIf(nodeDef))
  graphsUpdated = await _addDependencies(SurveyDependencyType.required, NodeDefs.getRequiredIf(nodeDef))
  graphsUpdated = await _addDependencies(SurveyDependencyType.validations, NodeDefs.getValidationsExpressions(nodeDef))
  graphsUpdated = await _addDependencies(SurveyDependencyType.visible, NodeDefs.getVisibleIf(nodeDef))
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
    const fileNameExpression = NodeDefs.getFileNameExpression(nodeDef as ArenaNodeDefFile)
    if (fileNameExpression) {
      graphsUpdated = await _addDependencies(SurveyDependencyType.fileName, [
        NodeDefExpressionFactory.createInstance({ expression: fileNameExpression }),
      ])
    }
  }
  if (NodeDefs.isEntity(nodeDef)) {
    const enumeratingItemsExpression = NodeDefs.getEnumeratingItemsExpression(nodeDef as ArenaNodeDefEntity)
    if (enumeratingItemsExpression) {
      graphsUpdated = await _addDependencies(SurveyDependencyType.enumeratingItems, [
        NodeDefExpressionFactory.createInstance({ expression: enumeratingItemsExpression }),
      ])
    }
  }
  // parent code
  if (NodeDefs.getType(nodeDef) === NodeDefType.code) {
    const parentCodeDefUuid = NodeDefs.getParentCodeDefUuid(nodeDef as ArenaNodeDefCode)
    if (parentCodeDefUuid) {
      graphsUpdated = addDependency({
        graphs: graphsUpdated,
        type: SurveyDependencyType.parentCode,
        nodeDefUuid: parentCodeDefUuid,
        nodeDefDepUuid: nodeDef.uuid,
        sideEffect,
      })
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
  graphs: ArenaSurveyDependencyGraph
  dependencyType: SurveyDependencyType
  nodeDefUuid: string
}): ArenaSurveyDependencyGraph => {
  const { graphs, nodeDefUuid, dependencyType } = params

  const graphsUpdated = { ...graphs }
  let graphUpdated = { ...graphsUpdated[dependencyType] }
  // dissoc nodeDefUuid dependency as dependent
  graphUpdated = Objects.dissoc({ obj: graphUpdated, prop: nodeDefUuid })

  if (!booleanDependencyTypes.has(dependencyType)) {
    // dissoc nodeDefUuid dependency from sources (if any)
    for (const [key, dependentUuids] of Object.entries(graphUpdated)) {
      graphUpdated[key] = Arrays.removeItem(nodeDefUuid)(dependentUuids as string[])
    }
  }

  graphsUpdated[dependencyType] = graphUpdated
  return graphsUpdated
}

export const removeNodeDefDependencies = (params: {
  survey: ArenaSurvey
  nodeDefUuid: string
  dependencyType?: SurveyDependencyType
}): ArenaSurvey => {
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

/**
 * Builds the dependency graph of the survey.
 *
 * @param survey - The survey.
 * @returns A copy of the survey with the dependency graph (the survey passed in is not modified).
 */
export const buildAndAssocDependencyGraph = async (survey: ArenaSurvey): Promise<ArenaSurvey> => {
  // the new graph is built from scratch with side effect (to avoid re-creating objects): it belongs only to the copy of the survey
  const sideEffect = true

  // add dependencies for every node def
  let surveyUpdated: ArenaSurvey = { ...survey, dependencyGraph: newDependencyGraph() }
  for (const nodeDef of SurveyNodeDefs.getNodeDefsArray(survey)) {
    // sequential: each iteration updates the survey
    surveyUpdated = await addNodeDefDependencies({ nodeDef, survey: surveyUpdated, sideEffect }) // NOSONAR
  }
  return surveyUpdated
}
