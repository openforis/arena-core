import { Queue } from '../../utils'

import { Dictionary } from '../../common'
import { Node, NodesMap } from '../../node'
import { NodeDefCountType } from '../../nodeDef'
import { Surveys } from '../../survey'
import { getNodesByDefUuid } from '../_records/recordGetters'
import { updateSelfAndDependentsApplicable } from './recordNodeDependentsApplicableUpdater'
import { updateDependentCodeAttributes } from './recordNodeDependentsCodeAttributesUpdater'
import { updateDependentsCount } from './recordNodeDependentsCountUpdater'
import { updateSelfAndDependentsDefaultValues } from './recordNodeDependentsDefaultValuesUpdater'
import { updateDependentEnumeratedEntities } from './recordNodeDependentsEnumeratedEntitiesUpdater'
import { updateSelfAndDependentsFileNames } from './recordNodeDependentsFileNamesEvaluator'
import { RecordNodeDependentsUpdateParams } from './recordNodeDependentsUpdateParams'
import { NodesUpdateParams } from './recordNodesCreator'
import { RecordUpdateResult } from './recordUpdateResult'

/**
 * Nodes can be visited maximum 2 times during the update of the dependent nodes, to avoid loops in the evaluation.
 * The first time the applicability can depend on attributes with default values not applied yet.
 * The second time the applicability expression can be evaluated correctly.
 */
const MAX_DEPENDENTS_VISITING_TIMES = 2

export const updateNodesDependents = async (
  params: NodesUpdateParams & { nodes: NodesMap }
): Promise<RecordUpdateResult> => {
  const { survey, record, nodes, sideEffect = false } = params
  const initialNodesToVisit = sideEffect ? nodes : { ...nodes }

  // include onUpdate dependents (always included in every record update)
  const onUpdateDependentDefs = Surveys.getOnUpdateDependents({ survey })
  if (onUpdateDependentDefs.length > 0) {
    for (const dependentDef of onUpdateDependentDefs) {
      const dependentNodes = getNodesByDefUuid(dependentDef.uuid)(record)
      for (const node of dependentNodes) {
        initialNodesToVisit[node.iId] = node
      }
    }
  }

  const updateResult = new RecordUpdateResult({ record, nodes: initialNodesToVisit })

  const createNodeUpdateParams = (node: Node): RecordNodeDependentsUpdateParams => ({
    ...params,
    record: updateResult.record, // updateResult.record changes at every step (when sideEffect=false)
    node,
  })

  const nodeInternalIdsToVisit = new Queue<number>(Object.keys(initialNodesToVisit).map(Number))

  // Avoid loops: visit the same node maximum 2 times (the second time the applicability could have been changed)
  const visitedCountByInternalId: Dictionary<number> = {}

  while (!nodeInternalIdsToVisit.isEmpty()) {
    const nodeInternalId = nodeInternalIdsToVisit.dequeue()!
    const node = updateResult.getNodeByInternalId(nodeInternalId)

    const visitedCount = visitedCountByInternalId[nodeInternalId] ?? 0

    if (visitedCount < MAX_DEPENDENTS_VISITING_TIMES) {
      // min count
      const minCountUpdateResult = await updateDependentsCount({
        ...createNodeUpdateParams(node),
        countType: NodeDefCountType.min,
      })
      updateResult.merge(minCountUpdateResult)

      // max count
      const maxCountUpdateResult = await updateDependentsCount({
        ...createNodeUpdateParams(node),
        countType: NodeDefCountType.max,
      })
      updateResult.merge(maxCountUpdateResult)

      // applicability
      const applicabilityUpdateResult = await updateSelfAndDependentsApplicable(createNodeUpdateParams(node))
      updateResult.merge(applicabilityUpdateResult)

      // default values
      const defaultValuesUpdateResult = await updateSelfAndDependentsDefaultValues(createNodeUpdateParams(node))
      updateResult.merge(defaultValuesUpdateResult)

      // code attributes
      const dependentCodeAttributesUpdateResult = updateDependentCodeAttributes(createNodeUpdateParams(node))
      updateResult.merge(dependentCodeAttributesUpdateResult)

      // enumerated entities
      const dependentEnumeratedEntitiesUpdateResult = await updateDependentEnumeratedEntities(
        createNodeUpdateParams(node)
      )
      updateResult.merge(dependentEnumeratedEntitiesUpdateResult)

      // Update dependents (file names)
      const dependentFileNamesUpdateResult = await updateSelfAndDependentsFileNames(createNodeUpdateParams(node))
      updateResult.merge(dependentFileNamesUpdateResult)

      const nodesUpdatedCurrent: Dictionary<Node> = {
        ...minCountUpdateResult.nodes,
        ...maxCountUpdateResult.nodes,
        ...applicabilityUpdateResult.nodes,
        ...defaultValuesUpdateResult.nodes,
        ...dependentCodeAttributesUpdateResult.nodes,
        ...dependentEnumeratedEntitiesUpdateResult.nodes,
        ...dependentFileNamesUpdateResult.nodes,
      }

      // Mark updated nodes to visit
      nodeInternalIdsToVisit.enqueueItems(Object.keys(nodesUpdatedCurrent).map(Number))

      // Mark node as visited
      visitedCountByInternalId[nodeInternalId] = visitedCount + 1
    }
  }

  return updateResult
}
