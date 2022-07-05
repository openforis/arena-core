import { Queue } from '../../utils'

import * as RecordNodeDependentsDefaultValuesUpdater from './recordNodeDependentsDefaultValuesUpdater'
import * as RecordNodeDependentsApplicableUpdater from './recordNodeDependentsApplicableUpdater'
import { Survey } from '../../survey'
import { Record } from '../record'
import { Node } from '../../node'
import { RecordUpdateResult } from './recordUpdateResult'

/**
 * Nodes can be visited maximum 2 times during the update of the dependent nodes, to avoid loops in the evaluation.
 * The first time the applicability can depend on attributes with default values not applied yet.
 * The second time the applicability expression can be evaluated correctly.
 */
const MAX_DEPENDENTS_VISITING_TIMES = 2

export const updateNodesDependents = (params: {
  survey: Survey
  record: Record
  nodes: { [key: string]: Node }
}): RecordUpdateResult => {
  const { survey, record, nodes } = params
  const updateResult = new RecordUpdateResult({ record, nodes })

  const nodeUuidsToVisit = new Queue(Object.keys(nodes))

  // Avoid loops: visit the same node maximum 2 times (the second time the applicability could have been changed)
  const visitedCountByUuid: { [key: string]: number } = {}

  while (!nodeUuidsToVisit.isEmpty()) {
    const nodeUuid = nodeUuidsToVisit.dequeue()
    const node = updateResult.getNodeByUuid(nodeUuid)

    const visitedCount = visitedCountByUuid[nodeUuid] || 0

    if (visitedCount < MAX_DEPENDENTS_VISITING_TIMES) {
      // Update node dependents (applicability)
      const applicabilityUpdateResult = RecordNodeDependentsApplicableUpdater.updateSelfAndDependentsApplicable({
        survey,
        record: updateResult.record,
        node,
      })

      updateResult.merge(applicabilityUpdateResult)

      // Update node dependents (default values)
      const defaultValuesUpdateResult = RecordNodeDependentsDefaultValuesUpdater.updateSelfAndDependentsDefaultValues({
        survey,
        record: updateResult.record,
        node,
      })

      // Update nodes in RecordResult object
      updateResult.merge(defaultValuesUpdateResult)

      const nodesUpdatedCurrent = {
        ...applicabilityUpdateResult.nodes,
        ...defaultValuesUpdateResult.nodes,
      }

      // Mark updated nodes to visit
      nodeUuidsToVisit.enqueueItems(Object.keys(nodesUpdatedCurrent))

      // Mark node visited
      visitedCountByUuid[nodeUuid] = visitedCount + 1
    }
  }

  return updateResult
}
