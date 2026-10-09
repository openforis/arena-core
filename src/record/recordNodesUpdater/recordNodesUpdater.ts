import { Queue } from '../../utils'

import { Dictionary } from '../../common'
import { Node } from '../../node'
import { NodeDefCountType } from '../../nodeDef'
import { Surveys } from '../../survey'
import { getNodesByDefUuid } from '../_records/recordGetters'
import { updateSelfAndDependentsApplicable } from './recordNodeDependentsApplicableUpdater'
import { updateDependentCodeAttributes } from './recordNodeDependentsCodeAttributesUpdater'
import { updateDependentsCount } from './recordNodeDependentsCountUpdater'
import { updateSelfAndDependentsDefaultValues } from './recordNodeDependentsDefaultValuesUpdater'
import { updateSelfAndDependentsEditable } from './recordNodeDependentsEditableUpdater'
import { updateDependentEnumeratedEntities } from './recordNodeDependentsEnumeratedEntitiesUpdater'
import { updateDependentEnumeratingItemsEntities } from './recordNodeDependentsEnumeratingItemsUpdater'
import { updateSelfAndDependentsFileNames } from './recordNodeDependentsFileNamesEvaluator'
import { RecordNodeDependentsUpdateParams } from './recordNodeDependentsUpdateParams'
import { updateSelfAndDependentsVisible } from './recordNodeDependentsVisibleUpdater'
import { NodesUpdateParams } from './recordNodesCreator'
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
  updateSelfAndDependentsVisible,
  updateDependentCodeAttributes,
  updateDependentEnumeratedEntities,
  updateDependentEnumeratingItemsEntities,
  updateSelfAndDependentsFileNames,
]

export const updateNodesDependents = async (
  params: NodesUpdateParams & { nodes: Dictionary<Node> }
): Promise<RecordUpdateResult> => {
  const { survey, record, nodes, sideEffect = false } = params
  const initialNodesToVisit = sideEffect ? nodes : { ...nodes }

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

  const createNodeUpdateParams = (node: Node): RecordNodeDependentsUpdateParams => ({
    ...params,
    record: updateResult.record, // updateResult.record changes at every step (when sideEffect=false)
    node,
  })

  const nodeUuidsToVisit = new Queue(Object.keys(initialNodesToVisit))

  // Avoid loops: visit the same node maximum 2 times (the second time the applicability could have been changed)
  const visitedCountByUuid: Dictionary<number> = {}

  while (!nodeUuidsToVisit.isEmpty()) {
    const nodeUuid = nodeUuidsToVisit.dequeue()

    const visitedCount = visitedCountByUuid[nodeUuid] ?? 0

    if (visitedCount < MAX_DEPENDENTS_VISITING_TIMES) {
      const nodesUpdatedCurrent: Dictionary<Node> = {}
      for (const dependentsUpdater of dependentsUpdaters) {
        // updaters must run sequentially: each one works on the record (and node) updated by the previous ones
        const node = updateResult.getNodeByUuid(nodeUuid)
        const dependentsUpdateResult = await dependentsUpdater(createNodeUpdateParams(node)) // NOSONAR
        updateResult.merge(dependentsUpdateResult)
        Object.assign(nodesUpdatedCurrent, dependentsUpdateResult.nodes)
      }

      // Mark updated nodes to visit
      nodeUuidsToVisit.enqueueItems(Object.keys(nodesUpdatedCurrent))

      // Mark node as visited
      visitedCountByUuid[nodeUuid] = visitedCount + 1
    }
  }

  return updateResult
}
