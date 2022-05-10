import { Queue } from '../../utils'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'
import * as Node from '@core/record/node'

import * as RecordNodeDependentsUpdater from './recordNodeDependentsUpdater'
import RecordUpdateResult from './RecordUpdateResult'
import { NodeDefProps, NodeDefType } from '../../nodeDef'

/**
 * Nodes can be visited maximum 2 times during the update of the dependent nodes, to avoid loops in the evaluation.
 * The first time the applicability can depend on attributes with default values not applied yet.
 * The second time the applicability expression can be evaluated correctly.
 */
const MAX_DEPENDENTS_VISITING_TIMES = 2

const getNodesToInsertCount = (nodeDef:NodeDef<NodeDefType, NodeDefProps>):number => {
  if (NodeDef.isSingle(nodeDef)) return 1
  const validations = NodeDef.getValidations(nodeDef)
  return Number(NodeDefValidations.getMinCount(validations)) || 0
}

const _addNodeAndDescendants = ({ survey, record, parentNode, nodeDef }) => {
  const node = Node.newNode(NodeDef.getUuid(nodeDef), record.uuid, parentNode)

  const updateResult = new RecordUpdateResult({ record })
  updateResult.addNode(node)

  // Add children if entity
  if (NodeDef.isEntity(nodeDef)) {
    const childDefs = Survey.getNodeDefChildren(nodeDef)(survey)

    // Add only child single nodes (it allows to apply default values)
    childDefs.forEach((childDef) => {
      const nodesToInsert = getNodesToInsertCount(childDef)
      if (nodesToInsert === 0) {
        return // do nothing
      }
      const nodesToInsertArray = [...Array(Number(nodesToInsert)).keys()]
      nodesToInsertArray.forEach(() => {
        const childUpdateResult = _addNodeAndDescendants({
          survey,
          record: updateResult.record,
          parentNode: node,
          nodeDef: childDef,
        })
        updateResult.merge(childUpdateResult)
      })
    })
  }
  return updateResult
}

const updateNodesDependents = ({ survey, record, nodes, logger = null }) => {
  // Output
  const updateResult = new RecordUpdateResult({ record, nodes })

  const nodeUuidsToVisit = new Queue(Object.keys(nodes))

  const visitedCountByUuid = {} // Avoid loops: visit the same node maximum 2 times (the second time the applicability could have been changed)

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
