import { Queue } from '../../utils'

import { Dictionary } from '../../common'
import { Node } from '../../node'
import { NodeDefCountType } from '../../nodeDef'
import { ExpressionEvaluationContext } from './expressionEvaluationContext'
import * as DependentApplicableUpdater from './recordNodeDependentsApplicableUpdater'
import * as DependentCodeAttributesUpdater from './recordNodeDependentsCodeAttributesUpdater'
import * as DependentCountUpdater from './recordNodeDependentsCountUpdater'
import * as DependentDefaultValuesUpdater from './recordNodeDependentsDefaultValuesUpdater'
import * as DependentFileNamesUpdater from './recordNodeDependentsFileNamesEvaluator'
import { RecordUpdateResult } from './recordUpdateResult'

/**
 * Nodes can be visited maximum 2 times during the update of the dependent nodes, to avoid loops in the evaluation.
 * The first time the applicability can depend on attributes with default values not applied yet.
 * The second time the applicability expression can be evaluated correctly.
 */
const MAX_DEPENDENTS_VISITING_TIMES = 2

export const updateNodesDependents = (
  params: ExpressionEvaluationContext & { nodes: Dictionary<Node> }
): RecordUpdateResult => {
  const {
    user,
    survey,
    record,
    nodes,
    timezoneOffset,
    sideEffect = false,
    deleteNotApplicableEnumeratedEntities = false,
  } = params
  const updateResult = new RecordUpdateResult({ record, nodes: sideEffect ? nodes : { ...nodes } })

  const createEvaluationContext = (node: Node): ExpressionEvaluationContext & { node: Node } => ({
    user,
    survey,
    record: updateResult.record, // updateResult.record changes at every step (when sideEffect=false)
    timezoneOffset,
    sideEffect,
    deleteNotApplicableEnumeratedEntities,
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
      // min count
      const minCountUpdateResult = DependentCountUpdater.updateDependentsCount({
        ...createEvaluationContext(node),
        countType: NodeDefCountType.min,
      })
      updateResult.merge(minCountUpdateResult)

      // max count
      const maxCountUpdateResult = DependentCountUpdater.updateDependentsCount({
        ...createEvaluationContext(node),
        countType: NodeDefCountType.max,
      })
      updateResult.merge(maxCountUpdateResult)

      // applicability
      const applicabilityUpdateResult = DependentApplicableUpdater.updateSelfAndDependentsApplicable(
        createEvaluationContext(node)
      )
      updateResult.merge(applicabilityUpdateResult)

      // default values
      const defaultValuesUpdateResult = DependentDefaultValuesUpdater.updateSelfAndDependentsDefaultValues(
        createEvaluationContext(node)
      )
      updateResult.merge(defaultValuesUpdateResult)

      // code attributes
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
        ...minCountUpdateResult.nodes,
        ...maxCountUpdateResult.nodes,
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
