import { Queue } from '../../utils'

import { Dictionary } from '../../common'
import { Node } from '../../node'
import { NodeDefCountType } from '../../nodeDef'
import { Surveys } from '../../survey'
import { getNodesByDefUuid } from '../_records/recordGetters'
import { ExpressionEvaluationContext } from './expressionEvaluationContext'
import { updateSelfAndDependentsApplicable } from './recordNodeDependentsApplicableUpdater'
import { updateDependentCodeAttributes } from './recordNodeDependentsCodeAttributesUpdater'
import { updateDependentsCount } from './recordNodeDependentsCountUpdater'
import { updateSelfAndDependentsDefaultValues } from './recordNodeDependentsDefaultValuesUpdater'
import { updateDependentEnumeratedEntities } from './recordNodeDependentsEnumeratedEntitiesUpdater'
import { updateSelfAndDependentsFileNames } from './recordNodeDependentsFileNamesEvaluator'
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
  const { user, survey, record, nodes, timezoneOffset, sideEffect = false } = params
  const initialNodesToVisit = sideEffect ? nodes : { ...nodes }

  // include onUpdate dependents (always included in every record update)
  const onUpdateDependentDefs = Surveys.getOnUpdateDependents({ survey })
  if (onUpdateDependentDefs.length > 0) {
    onUpdateDependentDefs.forEach((dependentDef) => {
      const dependentNodes = getNodesByDefUuid(dependentDef.uuid)(record)
      dependentNodes.forEach((node) => {
        initialNodesToVisit[node.uuid] = node
      })
    })
  }

  const updateResult = new RecordUpdateResult({ record, nodes: initialNodesToVisit })

  const createEvaluationContext = (node: Node): ExpressionEvaluationContext & { node: Node } => ({
    user,
    survey,
    record: updateResult.record, // updateResult.record changes at every step (when sideEffect=false)
    timezoneOffset,
    sideEffect,
    node,
  })

  const nodeUuidsToVisit = new Queue(Object.keys(initialNodesToVisit))

  // Avoid loops: visit the same node maximum 2 times (the second time the applicability could have been changed)
  const visitedCountByUuid: Dictionary<number> = {}

  while (!nodeUuidsToVisit.isEmpty()) {
    const nodeUuid = nodeUuidsToVisit.dequeue()
    const node = updateResult.getNodeByUuid(nodeUuid)

    const visitedCount = visitedCountByUuid[nodeUuid] ?? 0

    if (visitedCount < MAX_DEPENDENTS_VISITING_TIMES) {
      // min count
      const minCountUpdateResult = updateDependentsCount({
        ...createEvaluationContext(node),
        countType: NodeDefCountType.min,
      })
      updateResult.merge(minCountUpdateResult)

      // max count
      const maxCountUpdateResult = updateDependentsCount({
        ...createEvaluationContext(node),
        countType: NodeDefCountType.max,
      })
      updateResult.merge(maxCountUpdateResult)

      // applicability
      const applicabilityUpdateResult = updateSelfAndDependentsApplicable(createEvaluationContext(node))
      updateResult.merge(applicabilityUpdateResult)

      // default values
      const defaultValuesUpdateResult = updateSelfAndDependentsDefaultValues(createEvaluationContext(node))
      updateResult.merge(defaultValuesUpdateResult)

      // code attributes
      const dependentCodeAttributesUpdateResult = updateDependentCodeAttributes(createEvaluationContext(node))
      updateResult.merge(dependentCodeAttributesUpdateResult)

      // enumerated entities
      const dependentEnumeratedEntitiesUpdateResult = updateDependentEnumeratedEntities(createEvaluationContext(node))
      updateResult.merge(dependentEnumeratedEntitiesUpdateResult)

      // Update dependents (file names)
      const dependentFileNamesUpdateResult = updateSelfAndDependentsFileNames(createEvaluationContext(node))
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
