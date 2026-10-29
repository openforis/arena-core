import { ArenaRecordNode, NodePointer, Nodes, NodesMap } from '../../node'
import { NodeDefEntity, NodeDefs } from '../../nodeDef'
import { Surveys } from '../../survey'
import { Survey, SurveyDependencyType } from '../../survey/survey'
import { ArenaRecord } from '../record'
import { Records, RecordUpdateOptions } from '../records'
import { calculateBooleanValueNext } from './recordNodeDependentsBooleanUpdater'
import { createOrDeleteEnumeratedEntities } from './recordNodeDependentsEnumeratedEntitiesUpdater'
import { syncEnumeratingItemsEntities } from './recordNodeDependentsEnumeratingItemsUpdater'
import { addNodeAndDescendants } from './recordNodesCreator'
import { removeNodes } from './recordNodesDeleter'
import { getDependentNodePointersByType } from './recordNodesDependentsUpdaterCommons'
import { RecordNodeDependentsUpdateParams } from './recordNodeDependentsUpdateParams'
import { RecordUpdateResult } from './recordUpdateResult'

const extractNodePointersToUpdate = (params: { survey: Survey; record: ArenaRecord; node: ArenaRecordNode }) => {
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

const calculateApplicableNext = (params: {
  params: RecordNodeDependentsUpdateParams
  updateResult: RecordUpdateResult
  nodePointer: NodePointer
  nodeCtx: ArenaRecordNode
}): Promise<boolean | undefined> =>
  calculateBooleanValueNext({
    ...params,
    getExpressions: (nodePointer) => NodeDefs.getApplicable(nodePointer.nodeDef),
    getValuePrev: Nodes.isChildApplicable,
  })

const updateDescendantsApplicability = ({
  updateResult,
  nodeCtxChild,
  applicable,
  params,
  recordUpdateOptions,
}: {
  updateResult: RecordUpdateResult
  nodeCtxChild: ArenaRecordNode
  applicable: boolean
  params: RecordNodeDependentsUpdateParams
  recordUpdateOptions: RecordUpdateOptions
}): void => {
  const { survey, sideEffect = false, clearNonApplicableValues = false } = params

  // only values entered by the user are reported as cleared (they need a confirmation)
  let userValuesCleared = false

  // nodes added to the record all together: adding them one by one would copy the record nodes at every node
  // (when sideEffect is false)
  const nodesUpdated: NodesMap = {}

  Records.visitDescendantsAndSelf(nodeCtxChild, (nodeDescendant): boolean => {
    const nodeDescendantCleared = clearNonApplicableValues && !applicable && Nodes.isValueNotBlank(nodeDescendant)
    // values set by expressions (default values, read only attributes) are applied again when applicable: not reported
    // (evaluated before clearing the value: with sideEffect the node is modified in place)
    const nodeDescendantDef = Surveys.getNodeDefByUuid({ survey, uuid: nodeDescendant.nodeDefUuid })
    const userValueCleared =
      nodeDescendantCleared && !NodeDefs.isReadOnly(nodeDescendantDef) && Nodes.hasUserInputValue(nodeDescendant)
    // Clear value if becoming non-applicable and parameter is enabled
    const nodeDescendantUpdated = nodeDescendantCleared
      ? Nodes.assocValue(nodeDescendant, null, { sideEffect })
      : nodeDescendant
    nodesUpdated[nodeDescendantUpdated.uuid] = nodeDescendantUpdated
    if (userValueCleared) {
      updateResult.addClearedDefUuid(nodeDescendant.nodeDefUuid)
      userValuesCleared = true
    }
    return false
  })(updateResult.record)

  updateResult.addNodes(nodesUpdated, recordUpdateOptions)

  // if a multiple entity became not applicable and it's empty, delete it instead of just marking descendants as not applicable
  if (!applicable && clearNonApplicableValues) {
    const { uuid: nodeCtxChildUuid, nodeDefUuid: nodeCtxChildDefUuid } = nodeCtxChild
    const nodeCtxChildDef = Surveys.getNodeDefByUuid({ survey, uuid: nodeCtxChildDefUuid })
    if (NodeDefs.isMultipleEntity(nodeCtxChildDef) && Records.isNodeEmpty(nodeCtxChild)(updateResult.record)) {
      const deleteResult = removeNodes([nodeCtxChildUuid], recordUpdateOptions)(updateResult.record)
      updateResult.merge(deleteResult)
      if (userValuesCleared) {
        updateResult.addClearedDefUuid(nodeCtxChildDefUuid)
      }
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
  parentNode: ArenaRecordNode
  nodeDef: NodeDefEntity
}): Promise<void> => {
  if (!NodeDefs.isAutoCreateMinCountItems(nodeDef)) return

  const minCount = Nodes.getChildrenMinCount({ parentNode, nodeDef })
  if (Number.isNaN(minCount) || minCount <= 0) return

  const existingChildren = Records.getChildren(parentNode, nodeDef.uuid)(updateResult.record)
  const missingCount = Math.max(0, minCount - existingChildren.length)

  for (let index = 0; index < missingCount; index++) {
    const createParams = { ...params, record: updateResult.record, parentNode, nodeDef }
    // create nodes sequentially: every iteration works on the record updated by the previous one
    const childUpdateResult = await addNodeAndDescendants(createParams) // NOSONAR
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
    await updateNodePointerApplicability({ params, updateResult, nodePointer, recordUpdateOptions }) // NOSONAR
  }
  return updateResult
}
