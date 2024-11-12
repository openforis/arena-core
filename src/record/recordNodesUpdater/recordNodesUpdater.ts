import { Queue } from '../../utils'

import * as DependentDefaultValuesUpdater from './recordNodeDependentsDefaultValuesUpdater'
import * as DependentApplicableUpdater from './recordNodeDependentsApplicableUpdater'
import * as DependentCodeAttributesUpdater from './recordNodeDependentsCodeAttributesUpdater'
import * as DependentFileNamesUpdater from './recordNodeDependentsFileNamesEvaluator'
import { Survey } from '../../survey'
import { Record } from '../record'
import { Node } from '../../node'
import { RecordUpdateResult } from './recordUpdateResult'
import { User } from '../../auth'
import { Dictionary } from '../../common'

/**
 * Nodes can be visited maximum 2 times during the update of the dependent nodes, to avoid loops in the evaluation.
 * The first time the applicability can depend on attributes with default values not applied yet.
 * The second time the applicability expression can be evaluated correctly.
 */
const MAX_DEPENDENTS_VISITING_TIMES = 2

export interface ExpressionEvaluationContext {
  user: User
  survey: Survey
  record: Record
  timezoneOffset?: number
  sideEffect?: boolean
}

export const updateNodesDependents = (
  params: ExpressionEvaluationContext & { nodes: Dictionary<Node> }
): RecordUpdateResult => {
  const { user, survey, record, nodes, timezoneOffset, sideEffect = false } = params
  const updateResult = new RecordUpdateResult({ record, nodes: sideEffect ? nodes : { ...nodes } })

  const createEvaluationContext = (node: Node): ExpressionEvaluationContext & { node: Node } => ({
    user,
    survey,
    record: updateResult.record,
    timezoneOffset,
    sideEffect,
    node,
  })

  const nodeUuidsToVisit = new Queue(Object.keys(nodes))

  // Avoid loops: visit the same node maximum 2 times (the second time the applicability could have been changed)
  const visitedCountByUuid: Dictionary<number> = {}

  while (!nodeUuidsToVisit.isEmpty()) {
    const nodeUuid = nodeUuidsToVisit.dequeue()
    const node = updateResult.getNodeByUuid(nodeUuid)

    const visitedCount = visitedCountByUuid[nodeUuid] ?? 0

    if (visitedCount < MAX_DEPENDENTS_VISITING_TIMES) {
      // Update dependents (applicability)
      const applicabilityUpdateResult = DependentApplicableUpdater.updateSelfAndDependentsApplicable(
        createEvaluationContext(node)
      )
      updateResult.merge(applicabilityUpdateResult)

      // Update dependents (default values)
      const defaultValuesUpdateResult = DependentDefaultValuesUpdater.updateSelfAndDependentsDefaultValues(
        createEvaluationContext(node)
      )
      updateResult.merge(defaultValuesUpdateResult)

      // Update dependents (code attributes)
      const dependentCodeAttributesUpdateResult = DependentCodeAttributesUpdater.updateDependentCodeAttributes(
        createEvaluationContext(node)
      )
      updateResult.merge(dependentCodeAttributesUpdateResult)

      // Update dependents (file names)
      const dependentFileNamesUpdateResult = DependentFileNamesUpdater.updateSelfAndDependentsFileNames(
        createEvaluationContext(node)
      )
      updateResult.merge(dependentFileNamesUpdateResult)

      const nodesUpdatedCurrent: Dictionary<Node> = {
        ...applicabilityUpdateResult.nodes,
        ...defaultValuesUpdateResult.nodes,
        ...dependentCodeAttributesUpdateResult.nodes,
        ...dependentFileNamesUpdateResult.nodes,
      }

      // Mark updated nodes to visit
      nodeUuidsToVisit.enqueueItems(Object.keys(nodesUpdatedCurrent))

      // Mark node as visited
      visitedCountByUuid[nodeUuid] = visitedCount + 1
    }
  }

  return updateResult
}
