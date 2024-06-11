import { Queue } from '../../utils'

import * as DependentDefaultValuesUpdater from './recordNodeDependentsDefaultValuesUpdater'
import * as DependentApplicableUpdater from './recordNodeDependentsApplicableUpdater'
import * as DependentCodeAttributesUpdater from './recordNodeDependentsCodeAttributesUpdater'
import * as DependentCountUpdater from './recordNodeDependentsCountUpdater'
import { Survey } from '../../survey'
import { Record } from '../record'
import { Node } from '../../node'
import { RecordUpdateResult } from './recordUpdateResult'
import { NodeDefCountType } from '../../nodeDef'

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
  timezoneOffset?: number
  sideEffect?: boolean
}): RecordUpdateResult => {
  const { survey, record, nodes, timezoneOffset, sideEffect = false } = params
  const updateResult = new RecordUpdateResult({ record, nodes: sideEffect ? nodes : { ...nodes } })

  const nodeUuidsToVisit = new Queue(Object.keys(nodes))

  // Avoid loops: visit the same node maximum 2 times (the second time the applicability could have been changed)
  const visitedCountByUuid: { [key: string]: number } = {}

  const getCommonUpdaterParams = (node: Node) => ({
    survey,
    record: updateResult.record, // updateResult.record changes at every step (when sideEffect=false)
    node,
    timezoneOffset,
    sideEffect,
  })

  while (!nodeUuidsToVisit.isEmpty()) {
    const nodeUuid = nodeUuidsToVisit.dequeue()
    const node = updateResult.getNodeByUuid(nodeUuid)

    const visitedCount = visitedCountByUuid[nodeUuid] ?? 0

    if (visitedCount < MAX_DEPENDENTS_VISITING_TIMES) {
      const maxCountUpdateResult = DependentCountUpdater.updateSelfAndDependentsCount({
        ...getCommonUpdaterParams(node),
        countType: NodeDefCountType.max,
      })
      updateResult.merge(maxCountUpdateResult)

      const minCountUpdateResult = DependentCountUpdater.updateSelfAndDependentsCount({
        ...getCommonUpdaterParams(node),
        countType: NodeDefCountType.min,
      })
      updateResult.merge(minCountUpdateResult)

      // Update dependents (applicability)
      const applicabilityUpdateResult = DependentApplicableUpdater.updateSelfAndDependentsApplicable(
        getCommonUpdaterParams(node)
      )

      updateResult.merge(applicabilityUpdateResult)

      // Update dependents (default values)
      const defaultValuesUpdateResult = DependentDefaultValuesUpdater.updateSelfAndDependentsDefaultValues(
        getCommonUpdaterParams(node)
      )

      updateResult.merge(defaultValuesUpdateResult)

      // update depenent code attributes
      const dependentCodeAttributesUpdateResult = DependentCodeAttributesUpdater.updateDependentCodeAttributes(
        getCommonUpdaterParams(node)
      )

      updateResult.merge(dependentCodeAttributesUpdateResult)

      const nodesUpdatedCurrent = {
        ...applicabilityUpdateResult.nodes,
        ...defaultValuesUpdateResult.nodes,
        ...dependentCodeAttributesUpdateResult.nodes,
      }

      // Mark updated nodes to visit
      nodeUuidsToVisit.enqueueItems(Object.keys(nodesUpdatedCurrent))

      // Mark node as visited
      visitedCountByUuid[nodeUuid] = visitedCount + 1
    }
  }

  return updateResult
}
