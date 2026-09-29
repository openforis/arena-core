import { Node, NodePointer, Nodes } from '../../node'
import { NodeDefEntity, NodeDefs } from '../../nodeDef'
import { Surveys } from '../../survey'
import { Survey, SurveyDependencyType } from '../../survey/survey'
import { Record } from '../record'
import { RecordExpressionEvaluator } from '../recordExpressionEvaluator'
import { Records, RecordUpdateOptions } from '../records'
import { createOrDeleteEnumeratedEntities } from './recordNodeDependentsEnumeratedEntitiesUpdater'
import { syncEnumeratingItemsEntities } from './recordNodeDependentsEnumeratingItemsUpdater'
import { createNodeAndDescendants } from './recordNodesCreator'
import { deleteNodes } from './recordNodesDeleter'
import { getDependentNodePointersByType } from './recordNodesDependentsUpdaterCommons'
import { RecordNodeDependentsUpdateParams } from './recordNodeDependentsUpdateParams'
import { RecordUpdateResult } from './recordUpdateResult'

const expressionEvaluator = new RecordExpressionEvaluator()

const extractNodePointersToUpdate = (params: { survey: Survey; record: Record; node: Node }) => {
  const { survey, record, node } = params

  const nodePointersToUpdate = getDependentNodePointersByType({
    survey,
    record,
    node,
    dependencyType: SurveyDependencyType.applicable,
    includeSelfWhenSourceIsAttribute: true,
    includeNewEntityChildPointers: true,
  })
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

  // if a multiple entity became not applicable and it's empty, delete it instead of just marking descendants as not applicable
  if (!applicable && clearNonApplicableValues) {
    const { iId: nodeCtxChildInternalId, nodeDefUuid: nodeCtxChildDefUuid } = nodeCtxChild
    const nodeCtxChildDef = Surveys.getNodeDefByUuid({ survey, uuid: nodeCtxChildDefUuid })
    if (NodeDefs.isMultipleEntity(nodeCtxChildDef) && Records.isNodeEmpty(nodeCtxChild)(updateResult.record)) {
      const deleteResult = deleteNodes([nodeCtxChildInternalId], recordUpdateOptions)(updateResult.record)
      updateResult.merge(deleteResult)
      updateResult.addClearedDefUuid(nodeCtxChildDefUuid)
    }
  }
}

const createMissingApplicableMultipleEntities = async ({
  params,
  updateResult,
  parentNode,
  nodeDef,
}: {
  params: RecordNodeDependentsUpdateParams
  updateResult: RecordUpdateResult
  parentNode: Node
  nodeDef: NodeDefEntity
}): Promise<void> => {
  if (!NodeDefs.isAutoCreateMinCountItems(nodeDef)) return

  const minCount = Nodes.getChildrenMinCount({ parentNode, nodeDef })
  if (Number.isNaN(minCount) || minCount <= 0) return

  const existingChildren = Records.getChildren(parentNode, nodeDef.uuid)(updateResult.record)
  const missingCount = Math.max(0, minCount - existingChildren.length)

  for (let index = 0; index < missingCount; index++) {
    const childUpdateResult = await createNodeAndDescendants({
      ...params,
      record: updateResult.record,
      parentNode,
      nodeDef,
    })
    updateResult.merge(childUpdateResult)
  }
}

const updateNodePointerApplicability = async ({
  params,
  updateResult,
  nodePointer,
  recordUpdateOptions,
}: {
  params: RecordNodeDependentsUpdateParams
  updateResult: RecordUpdateResult
  nodePointer: NodePointer
  recordUpdateOptions: RecordUpdateOptions
}): Promise<void> => {
  const { nodeCtx: nodeCtxNodePointer, nodeDef: nodeDefNodePointer } = nodePointer

  const nodeCtxInternalId = nodeCtxNodePointer.iId
  const nodeDefUuid = nodeDefNodePointer.uuid

  // nodeCtx could have been updated in a previous iteration
  const nodeCtx = updateResult.getNodeByInternalId(nodeCtxInternalId) ?? nodeCtxNodePointer

  const applicablePrev = Nodes.isChildApplicable(nodeCtx, nodeDefUuid)
  const applicable = await calculateApplicableNext({
    params,
    updateResult,
    nodePointer,
    nodeCtx,
  })
  if (applicable === undefined) {
    return
  }

  if (applicable && NodeDefs.isMultipleEntity(nodeDefNodePointer)) {
    await createMissingApplicableMultipleEntities({
      params,
      updateResult,
      parentNode: nodeCtx,
      nodeDef: nodeDefNodePointer as NodeDefEntity,
    })
  }

  // 4. persist updated applicability if changed, and return updated nodes
  if (applicablePrev === applicable) {
    return
  }
  // Applicability changed

  // update node and add it to nodes updated
  const nodeCtxUpdated = Nodes.assocChildApplicability(nodeCtx, nodeDefUuid, applicable)
  updateResult.addNode(nodeCtxUpdated, recordUpdateOptions)

  let nodeCtxChildren = Records.getChildren(nodeCtx, nodeDefUuid)(updateResult.record)

  if (NodeDefs.isMultipleEntity(nodeDefNodePointer) && NodeDefs.isEnumerate(nodeDefNodePointer as NodeDefEntity)) {
    const entityDef = nodeDefNodePointer as NodeDefEntity
    if (NodeDefs.getEnumeratingItemsExpression(entityDef)) {
      await syncEnumeratingItemsEntities({
        ...params,
        parentNode: nodeCtxUpdated,
        entityDef,
        updateResult,
      })
    } else {
      await createOrDeleteEnumeratedEntities({
        ...params,
        parentNode: nodeCtxUpdated,
        entityDef,
        updateResult,
      })
    }
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
    await updateNodePointerApplicability({ params, updateResult, nodePointer, recordUpdateOptions })
  }
  return updateResult
}
