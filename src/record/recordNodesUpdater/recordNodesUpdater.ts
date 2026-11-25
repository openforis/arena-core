import { Dates, Queue } from '../../utils'

import { ArenaDictionary } from '../../common'
import { ArenaRecordNode, ArenaRecordNodesMap, RecordNodes } from '../../node'
import { NodeDefCountType, NodeDefs } from '../../nodeDef'
import { ArenaSurvey, SurveyDependencyType, Surveys } from '../../survey'
import {
  getDependentNodePointers,
  getDescendantsOrSelf,
  getNodeByUuid,
  getNodesByDefUuid,
} from '../_records/recordGetters'
import { RecordNodePointers } from '../nodePointers'
import { ArenaRecord } from '../record'
import { updateSelfAndDependentsApplicable } from './recordNodeDependentsApplicableUpdater'
import { updateDependentCodeAttributes } from './recordNodeDependentsCodeAttributesUpdater'
import { updateDependentsCount } from './recordNodeDependentsCountUpdater'
import { updateSelfAndDependentsDefaultValues } from './recordNodeDependentsDefaultValuesUpdater'
import { updateSelfAndDependentsEditable } from './recordNodeDependentsEditableUpdater'
import { updateDependentEnumeratedEntities } from './recordNodeDependentsEnumeratedEntitiesUpdater'
import { updateDependentEnumeratingItemsEntities } from './recordNodeDependentsEnumeratingItemsUpdater'
import { updateSelfAndDependentsFileNames } from './recordNodeDependentsFileNamesEvaluator'
import { RecordNodeDependentsUpdateParams } from './recordNodeDependentsUpdateParams'
import { updateSelfAndDependentsRequired } from './recordNodeDependentsRequiredUpdater'
import { updateSelfAndDependentsVisible } from './recordNodeDependentsVisibleUpdater'
import { ArenaRecordNodesUpdateParams } from './recordNodesCreator'
import { RecordUpdateResult } from './recordUpdateResult'

/**
 * Nodes can be visited maximum 2 times during the update of the dependent nodes, to avoid loops in the evaluation.
 * The first time the applicability can depend on attributes with default values not applied yet.
 * The second time the applicability expression can be evaluated correctly.
 */
const MAX_DEPENDENTS_VISITING_TIMES = 2

type RecordNodeDependentsUpdater = (params: RecordNodeDependentsUpdateParams) => Promise<RecordUpdateResult>

/**
 * Updaters applied (in this order) to every visited node and to its dependents.
 */
const dependentsUpdaters: RecordNodeDependentsUpdater[] = [
  (params) => updateDependentsCount({ ...params, countType: NodeDefCountType.min }),
  (params) => updateDependentsCount({ ...params, countType: NodeDefCountType.max }),
  updateSelfAndDependentsApplicable,
  updateSelfAndDependentsDefaultValues,
  updateSelfAndDependentsEditable,
  updateSelfAndDependentsRequired,
  updateSelfAndDependentsVisible,
  updateDependentCodeAttributes,
  updateDependentEnumeratedEntities,
  updateDependentEnumeratingItemsEntities,
  updateSelfAndDependentsFileNames,
]

/**
 * True if the node modification changes the date modified of its ancestors:
 * nodes created or deleted, and attributes (whose value changed); entities updated only in their meta
 * (e.g. children applicability) are excluded.
 */
const isModificationPropagatedToAncestors = (survey: ArenaSurvey, node: ArenaRecordNode): boolean => {
  if (node.created || node.deleted) return true
  const nodeDef = Surveys.findNodeDefByUuid({ survey, uuid: node.nodeDefUuid })
  return !!nodeDef && !NodeDefs.isEntity(nodeDef)
}

/**
 * Sets the date modified of the ancestors of the specified node (if not set already).
 * @returns The ancestors updated.
 */
const updateAncestorsDateModified = (params: {
  node: ArenaRecordNode
  updateResult: RecordUpdateResult
  dateModified: string
  sideEffect: boolean
}): ArenaRecordNode[] => {
  const { node, updateResult, dateModified, sideEffect } = params
  const ancestorsUpdated: ArenaRecordNode[] = []
  for (const ancestorUuid of RecordNodes.getHierarchy(node)) {
    const ancestor = updateResult.getNodeByUuid(ancestorUuid) ?? getNodeByUuid(ancestorUuid)(updateResult.record)
    if (!ancestor || ancestor.deleted || ancestor.dateModified === dateModified) continue

    const ancestorAlreadyUpdated = !!updateResult.getNodeByUuid(ancestorUuid)
    const ancestorUpdated = sideEffect ? ancestor : { ...ancestor }
    ancestorUpdated.dateModified = dateModified
    ancestorUpdated.updated = true
    updateResult.addNode(ancestorUpdated, { sideEffect })
    if (!ancestorAlreadyUpdated) {
      updateResult.dateModifiedOnlyNodeUuids.add(ancestorUuid)
    }
    ancestorsUpdated.push(ancestorUpdated)
  }
  return ancestorsUpdated
}

/**
 * Returns the nodes whose expressions use the dates of the specified entity (nodeDateCreated, nodeDateModified),
 * e.g. the attributes in the entity with the expression "nodeDateModified(parent(this))".
 */
const getNodeDatesDependentNodes = (params: {
  survey: ArenaSurvey
  record: ArenaRecord
  entity: ArenaRecordNode
}): ArenaRecordNode[] => {
  const { survey, record, entity } = params
  const dependentDefs = Surveys.getNodeDefDependents({
    survey,
    nodeDefUuid: entity.nodeDefUuid,
    dependencyType: SurveyDependencyType.nodeDates,
  })
  if (dependentDefs.length === 0) return []

  const result: ArenaRecordNode[] = []
  for (const dependentDef of dependentDefs) {
    if (dependentDef.meta.h.includes(entity.nodeDefUuid)) {
      // dependent def is a descendant of the entity def: only the dependent nodes in the entity are affected
      result.push(...getDescendantsOrSelf(entity, dependentDef)(record))
    } else {
      const nodePointers = getDependentNodePointers(
        survey,
        entity,
        SurveyDependencyType.nodeDates,
        false,
        (nodePointer) => nodePointer.nodeDef.uuid === dependentDef.uuid
      )(record)
      result.push(...RecordNodePointers.getNodesFromNodePointers({ record, nodePointers }))
    }
  }
  return result
}

/**
 * Updates the dependents of the specified nodes (applicability, default values, calculations, etc.).
 * The date modified of the ancestors of the modified nodes is updated too (see isModificationPropagatedToAncestors).
 * @param params.nodes - Nodes created, updated or deleted.
 * @param params.nodesToEvaluate - Nodes not modified whose dependents must be updated (e.g. the app info dependents).
 */
export const updateNodesDependents = async (
  params: ArenaRecordNodesUpdateParams & {
    nodes: ArenaDictionary<ArenaRecordNode>
    nodesToEvaluate?: ArenaRecordNodesMap
  }
): Promise<RecordUpdateResult> => {
  const { survey, record, nodes, nodesToEvaluate, sideEffect = false } = params
  // the same date modified is used for all the nodes modified (it lets the propagation to the ancestors end)
  const dateModified = params.dateModified ?? Dates.nowFormattedForStorage()
  // always copy: the nodes passed (e.g. the deleted nodes) must not collect the dependent nodes visited
  const initialNodesToVisit = { ...nodesToEvaluate, ...nodes }

  // include onUpdate dependents (always included in every record update)
  const onUpdateDependentDefs = Surveys.getOnUpdateDependents({ survey })
  if (onUpdateDependentDefs.length > 0) {
    for (const dependentDef of onUpdateDependentDefs) {
      const dependentNodes = getNodesByDefUuid(dependentDef.uuid)(record)
      for (const node of dependentNodes) {
        initialNodesToVisit[node.uuid] = node
      }
    }
  }

  const updateResult = new RecordUpdateResult({ record, nodes: initialNodesToVisit })

  const createNodeUpdateParams = (node: ArenaRecordNode): RecordNodeDependentsUpdateParams => ({
    ...params,
    dateModified,
    record: updateResult.record, // updateResult.record changes at every step (when sideEffect=false)
    node,
  })

  const nodeUuidsToVisit = new Queue(Object.keys(initialNodesToVisit))

  const hasNodeDatesDependencies =
    Object.keys(survey.dependencyGraph?.[SurveyDependencyType.nodeDates] ?? {}).length > 0

  // the dependents of the entities whose date modified changed (e.g. "nodeDateModified(parent(this))") are visited
  // as sources ("self" evaluation): the entities themselves are not visited, they are not modified in their content
  const visitNodeDatesDependents = (entities: ArenaRecordNode[]): void => {
    if (!hasNodeDatesDependencies) return
    for (const entity of entities) {
      for (const dependentNode of getNodeDatesDependentNodes({ survey, record: updateResult.record, entity })) {
        // included in the result (like the onUpdate dependents) so their validation is updated too
        updateResult.nodes[dependentNode.uuid] ??= dependentNode
        nodeUuidsToVisit.enqueue(dependentNode.uuid)
      }
    }
  }

  const updateAncestorsOfModifiedNodes = (modifiedNodes: ArenaRecordNode[]): void => {
    const entitiesUpdated: ArenaRecordNode[] = []
    for (const modifiedNode of modifiedNodes) {
      if (isModificationPropagatedToAncestors(survey, modifiedNode)) {
        entitiesUpdated.push(
          ...updateAncestorsDateModified({ node: modifiedNode, updateResult, dateModified, sideEffect })
        )
      } else if (!modifiedNode.deleted) {
        // entity updated in its meta (e.g. children applicability): its date modified changed
        entitiesUpdated.push(modifiedNode)
      }
    }
    visitNodeDatesDependents(entitiesUpdated)
  }
  updateAncestorsOfModifiedNodes(Object.values(nodes))

  // Avoid loops: visit the same node maximum 2 times (the second time the applicability could have been changed)
  const visitedCountByUuid: ArenaDictionary<number> = {}

  while (!nodeUuidsToVisit.isEmpty()) {
    const nodeUuid = nodeUuidsToVisit.dequeue()!

    const visitedCount = visitedCountByUuid[nodeUuid] ?? 0

    if (visitedCount < MAX_DEPENDENTS_VISITING_TIMES) {
      const nodesUpdatedCurrent: ArenaDictionary<ArenaRecordNode> = {}
      for (const dependentsUpdater of dependentsUpdaters) {
        // updaters must run sequentially: each one works on the record (and node) updated by the previous ones
        const node = updateResult.getNodeByUuid(nodeUuid)
        const dependentsUpdateResult = await dependentsUpdater(createNodeUpdateParams(node)) // NOSONAR
        updateResult.merge(dependentsUpdateResult)
        Object.assign(nodesUpdatedCurrent, dependentsUpdateResult.nodes)
      }

      // Mark updated nodes to visit
      nodeUuidsToVisit.enqueueItems(Object.keys(nodesUpdatedCurrent))
      updateAncestorsOfModifiedNodes(Object.values(nodesUpdatedCurrent))

      // Mark node as visited
      visitedCountByUuid[nodeUuid] = visitedCount + 1
    }
  }

  return updateResult
}
