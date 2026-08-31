import { Node, NodePointer, Nodes, NodeValues } from '../../node'
import { NodeDefEntity, NodeDefs } from '../../nodeDef'
import { Survey, Surveys } from '../../survey'
import { SurveyDependencyType } from '../../survey/survey'
import { getChild, getChildren, getRoot } from '../_records/recordGetters'
import { Record } from '../record'
import { Records } from '../records'
import { getEnumeratingCategoryItems } from '../_records/recordUtils'
import { getEnumeratingItemsAllowedCodes } from './recordEnumeratingItemsExpressionEvaluator'
import { RecordNodeDependentsUpdateParams } from './recordNodeDependentsUpdateParams'
import { createEnumeratedEntityNode } from './recordNodesCreator'
import { deleteNodes } from './recordNodesDeleter'
import { RecordUpdateResult } from './recordUpdateResult'

const getEnumeratingItemsNodePointers = (params: {
  survey: Survey
  record: Record
  node: Node
}): NodePointer[] => {
  const { survey, record, node } = params
  const nodePointers = Records.getDependentNodePointers({
    survey,
    record,
    node,
    dependencyType: SurveyDependencyType.enumeratingItems,
  })

  if (nodePointers.length > 0 || !node.deleted) {
    return nodePointers
  }

  const dependentDefs = Surveys.getNodeDefDependents({
    survey,
    nodeDefUuid: node.nodeDefUuid,
    dependencyType: SurveyDependencyType.enumeratingItems,
  })
  const root = getRoot(record)
  if (!root) {
    return nodePointers
  }

  for (const dependentDef of dependentDefs) {
    if (!NodeDefs.isEntity(dependentDef) || !NodeDefs.getEnumeratingItemsExpression(dependentDef as NodeDefEntity)) {
      continue
    }
    const parentDef = Surveys.getNodeDefParent({ survey, nodeDef: dependentDef })
    if (!parentDef) continue

    const contextNodes = Records.getDescendantsOrSelf({
      record,
      node: root,
      nodeDefDescendant: parentDef,
    })
    for (const contextNode of contextNodes) {
      nodePointers.push({ nodeCtx: contextNode, nodeDef: dependentDef })
    }
  }

  return nodePointers
}

export const syncEnumeratingItemsEntities = async (
  params: RecordNodeDependentsUpdateParams & {
    parentNode: Node
    entityDef: NodeDefEntity
    updateResult: RecordUpdateResult
  }
): Promise<void> => {
  const { survey, user, parentNode, entityDef, categoryItemProvider, updateResult, sideEffect } = params
  const recordUpdateOptions = { sideEffect }
  const existingEntities = getChildren(parentNode, entityDef.uuid)(updateResult.record)
  const applicable = Nodes.isChildApplicable(parentNode, entityDef.uuid)

  const deleteExistingEntities = () => {
    const existingEntityUuids = existingEntities.map((node) => node.uuid)
    const nodesDeleteUpdatedResult = deleteNodes(existingEntityUuids, recordUpdateOptions)(updateResult.record)
    updateResult.merge(nodesDeleteUpdatedResult)
  }

  if (!applicable) {
    if (existingEntities.length > 0) {
      deleteExistingEntities()
    }
    return
  }

  const enumeratorDef = Surveys.getNodeDefEnumerator({ survey, entityDef })
  if (!enumeratorDef) return

  const allowedCodes = await getEnumeratingItemsAllowedCodes({
    survey,
    user,
    record: updateResult.record,
    entityDef,
    parentNode,
  })

  const categoryItems = await getEnumeratingCategoryItems({
    survey,
    enumeratorDef,
    parentNode,
    categoryItemProvider,
    allowedCodes,
  })(updateResult.record)

  const targetItemUuids = new Set(categoryItems.map((item) => item.uuid))
  const existingItemUuids = new Set<string>()

  for (const existingEntity of existingEntities) {
    const existingEnumerator = getChild(existingEntity, enumeratorDef.uuid)(updateResult.record)
    const itemUuid = NodeValues.getItemUuid(existingEnumerator)
    if (!itemUuid || !targetItemUuids.has(itemUuid)) {
      const nodesDeleteUpdatedResult = deleteNodes([existingEntity.uuid], recordUpdateOptions)(updateResult.record)
      updateResult.merge(nodesDeleteUpdatedResult)
    } else {
      existingItemUuids.add(itemUuid)
    }
  }

  for (const categoryItem of categoryItems) {
    if (!existingItemUuids.has(categoryItem.uuid)) {
      await createEnumeratedEntityNode({
        user,
        survey,
        parentNode,
        nodeDef: entityDef,
        categoryItem,
        updateResult,
        sideEffect,
      })
    }
  }
}

export const updateDependentEnumeratingItemsEntities = async (
  params: RecordNodeDependentsUpdateParams
): Promise<RecordUpdateResult> => {
  const { survey, record, node } = params

  const updateResult = new RecordUpdateResult({ record })

  const nodePointers = getEnumeratingItemsNodePointers({ survey, record, node })

  for (const nodePointer of nodePointers) {
    const { nodeCtx: parentNode, nodeDef } = nodePointer
    if (!NodeDefs.isEntity(nodeDef)) continue

    const entityDef = nodeDef as NodeDefEntity
    if (!NodeDefs.isEnumerate(entityDef)) continue
    if (!NodeDefs.getEnumeratingItemsExpression(entityDef)) continue

    await syncEnumeratingItemsEntities({ ...params, parentNode, entityDef, updateResult })
  }

  return updateResult
}
