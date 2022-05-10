import { Queue } from '../../utils'

import * as RecordNodeDependentsUpdater from './recordNodeDependentsUpdater'
import { NodeDefProps, NodeDefType } from '../../nodeDef'
import { Survey, Surveys } from '../../survey'
import { Record } from '../record'
import { Node } from '../../node'
import { RecordUpdateResult } from './recordUpdateResult'

/**
 * Nodes can be visited maximum 2 times during the update of the dependent nodes, to avoid loops in the evaluation.
 * The first time the applicability can depend on attributes with default values not applied yet.
 * The second time the applicability expression can be evaluated correctly.
 */
const MAX_DEPENDENTS_VISITING_TIMES = 2

const updateNodesDependents = (params: { survey:Survey, record:Record, nodes: {[key:string]: Node}, logger: any }):RecordUpdateResult => {
  const {survey, record, nodes, logger} = params
  const updateResult = new RecordUpdateResult({ record, nodes })

  const nodeUuidsToVisit = new Queue(Object.keys(nodes))

  // Avoid loops: visit the same node maximum 2 times (the second time the applicability could have been changed)
  const visitedCountByUuid: {[key:string]: number} = {} 

  while (!nodeUuidsToVisit.isEmpty()) {
    const nodeUuid = nodeUuidsToVisit.dequeue()
    const node = nodes[nodeUuid]

    const visitedCount = visitedCountByUuid[nodeUuid] || 0

    if (visitedCount < MAX_DEPENDENTS_VISITING_TIMES) {
      // Update node dependents (applicability)
      const applicabilityUpdateResult = RecordNodeDependentsUpdater.updateSelfAndDependentsApplicable({
        survey,
        record: updateResult.record,
        node,
        logger,
      })

      updateResult.merge(applicabilityUpdateResult)

      // Update node dependents (default values)
      const defaultValuesUpdateResult = RecordNodeDependentsUpdater.updateSelfAndDependentsDefaultValues({
        survey,
        record: updateResult.record,
        node,
        logger,
      })

      updateResult.merge(defaultValuesUpdateResult)

      // Update record nodes
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


export const RecordNodesUpdater = {
  updateNodesDependents,
}
