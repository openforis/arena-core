import { Node, NodePointer, Nodes } from '../../node'
import { NodeDefEntity, NodeDefs } from '../../nodeDef'
import { Surveys } from '../../survey'
import { Survey, SurveyDependencyType } from '../../survey/survey'
import { Record } from '../record'
import { RecordExpressionEvaluator } from '../recordExpressionEvaluator'
import { Records, RecordUpdateOptions } from '../records'
import { createOrDeleteEnumeratedEntities } from './recordNodeDependentsEnumeratedEntitiesUpdater'
import { deleteNodes } from './recordNodesDeleter'
import { RecordNodeDependentsUpdateParams } from './recordNodeDependentsUpdateParams'
import { RecordUpdateResult } from './recordUpdateResult'

const expressionEvaluator = new RecordExpressionEvaluator()

const extractNodePointersToUpdate = (params: { survey: Survey; record: Record; node: Node }) => {
  const { survey, record, node } = params

  const nodeDef = Surveys.getNodeDefByUuid({ survey, uuid: node.nodeDefUuid })

  const nodePointersToUpdate = Records.getDependentNodePointers({
    survey,
    record,
    node,
    dependencyType: SurveyDependencyType.applicable,
    includeSelf: !NodeDefs.isEntity(nodeDef),
  })

  if (NodeDefs.isEntity(nodeDef) && node.created) {
    // for new entities, include children multiple nodes (to update their applicability too, in case they are empty)
    const multipleNodeDefs = Surveys.getNodeDefChildren({ survey, nodeDef }).filter(NodeDefs.isMultiple)
    for (const childDef of multipleNodeDefs) {
      nodePointersToUpdate.push({ nodeCtx: node, nodeDef: childDef })
    }
  }
  return nodePointersToUpdate
}

const calculateApplicableNext = async ({
  params,
  updateResult,
  nodePointer,
  nodeCtx,
}: {
  params: RecordNodeDependentsUpdateParams
  updateResult: RecordUpdateResult
  nodePointer: NodePointer
  nodeCtx: Node
}): Promise<boolean | undefined> => {
  const { nodeDef: nodeDefNodePointer } = nodePointer

  const { uuid: nodeDefUuid } = nodeDefNodePointer

  const applicablePrev = Nodes.isChildApplicable(nodeCtx, nodeDefUuid)
  const expressionsToEvaluate = NodeDefs.getApplicable(nodeDefNodePointer)
  if (expressionsToEvaluate.length === 0) {
    if (applicablePrev) {
      // skip nodes that were already applicable and have no applicable expression, as they will remain applicable
      return undefined
    } else {
      // used during survey publishing: node def could have had applicable expression(s) that were removed,
      // and node could have been not applicable, but now it should be applicable, as there are no more applicable expressions
      return true
    }
  } else {
    // 3. evaluate applicable expression
    const exprEval = await expressionEvaluator.evalApplicableExpression({
      ...params,
      record: updateResult.record,
      nodeCtx,
      expressions: expressionsToEvaluate,
    })
    return exprEval?.value || false
  }
}

const updateDescendantsApplicability = ({
  updateResult,
  nodeCtxChild,
  applicable,
  params,
  recordUpdateOptions,
}: {
  updateResult: RecordUpdateResult
  nodeCtxChild: Node
  applicable: boolean
  params: RecordNodeDependentsUpdateParams
  recordUpdateOptions: RecordUpdateOptions
}): void => {
  const { survey, sideEffect = false, clearNonApplicableValues = false } = params

  Records.visitDescendantsAndSelf({
    record: updateResult.record,
    node: nodeCtxChild,
    visitor: (nodeDescendant): boolean => {
      const nodeDescendantCleared = clearNonApplicableValues && !applicable && Nodes.isValueNotBlank(nodeDescendant)
      // Clear value if becoming non-applicable and parameter is enabled
      const nodeDescendantUpdated = nodeDescendantCleared
        ? Nodes.assocValue(nodeDescendant, null, sideEffect)
        : nodeDescendant
      updateResult.addNode(nodeDescendantUpdated, recordUpdateOptions)
      if (nodeDescendantCleared) {
        updateResult.addClearedDefUuid(nodeDescendant.nodeDefUuid)
      }
      return false
    },
  })

  // if a multiple entity became not applicable and is empty, delete it instead of just marking descendants
  if (!applicable) {
    const { uuid: nodeCtxChildUuid, nodeDefUuid: nodeCtxChildDefUuid } = nodeCtxChild
    const nodeCtxChildDef = Surveys.getNodeDefByUuid({ survey, uuid: nodeCtxChildDefUuid })
    if (NodeDefs.isMultipleEntity(nodeCtxChildDef) && Records.isNodeEmpty(nodeCtxChild)(updateResult.record)) {
      const deleteResult = deleteNodes([nodeCtxChildUuid], recordUpdateOptions)(updateResult.record)
      updateResult.merge(deleteResult)
      updateResult.addClearedDefUuid(nodeCtxChildDefUuid)
    }
  }
}

export const updateSelfAndDependentsApplicable = async (
  params: RecordNodeDependentsUpdateParams
): Promise<RecordUpdateResult> => {
  const { survey, record, node, sideEffect = false } = params

  const updateResult = new RecordUpdateResult({ record })

  const recordUpdateOptions: RecordUpdateOptions = { sideEffect }

  // 1. fetch dependent nodes
  const nodePointersToUpdate = extractNodePointersToUpdate({ survey, record, node })

  // 2. update expr to node and dependent nodes
  // NOTE: don't do it in parallel, same nodeCtx metadata could be overwritten
  for (const nodePointer of nodePointersToUpdate) {
    const { nodeCtx: nodeCtxNodePointer, nodeDef: nodeDefNodePointer } = nodePointer

    const nodeCtxUuid = nodeCtxNodePointer.uuid
    const nodeDefUuid = nodeDefNodePointer.uuid

    // nodeCtx could have been updated in a previous iteration
    const nodeCtx = updateResult.getNodeByUuid(nodeCtxUuid) ?? nodeCtxNodePointer

    const applicablePrev = Nodes.isChildApplicable(nodeCtx, nodeDefUuid)
    const applicable = await calculateApplicableNext({
      params,
      updateResult,
      nodePointer,
      nodeCtx,
    })
    if (applicable === undefined) {
      continue
    }
    // 4. persist updated applicability if changed, and return updated nodes

    if (applicablePrev !== applicable) {
      // Applicability changed

      // update node and add it to nodes updated
      const nodeCtxUpdated = Nodes.assocChildApplicability(nodeCtx, nodeDefUuid, applicable)
      updateResult.addNode(nodeCtxUpdated, recordUpdateOptions)

      let nodeCtxChildren = Records.getChildren(nodeCtx, nodeDefUuid)(updateResult.record)

      if (NodeDefs.isMultipleEntity(nodeDefNodePointer) && NodeDefs.isEnumerate(nodeDefNodePointer as NodeDefEntity)) {
        await createOrDeleteEnumeratedEntities({
          ...params,
          parentNode: nodeCtxUpdated,
          entityDef: nodeDefNodePointer as NodeDefEntity,
          updateResult,
        })
        nodeCtxChildren = Records.getChildren(nodeCtx, nodeDefUuid)(updateResult.record)
      }
      for (const nodeCtxChild of nodeCtxChildren) {
        // add nodeCtxChild and its descendants to nodesUpdated
        updateDescendantsApplicability({
          updateResult,
          nodeCtxChild,
          applicable,
          params,
          recordUpdateOptions,
        })
      }
    }
  }
  return updateResult
}
