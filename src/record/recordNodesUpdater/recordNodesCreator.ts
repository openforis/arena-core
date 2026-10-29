import { User } from '../../auth'
import { SystemError, SystemErrorKeys } from '../../error'
import { CategoryItem } from '../../category'
import { ArenaRecordNode, NodeFactory, Nodes } from '../../node'
import { NodeValues } from '../../node/nodeValues'
import { NodeDef, NodeDefCode, NodeDefEntity, NodeDefType, NodeDefs } from '../../nodeDef'
import { CategoryItemProvider } from '../../nodeDefExpressionEvaluator/categoryItemProvider'
import { Survey } from '../../survey'
import { getNodeDefChildren, getNodeDefEnumerator } from '../../survey/surveys/nodeDefs'
import { getAncestorCodeAttributes } from '../_records/recordGetters'
import { getEnumeratingCategoryItems } from '../_records/recordUtils'
import { getEnumeratingItemsAllowedCodes } from './recordEnumeratingItemsExpressionEvaluator'
import { RecordExpressionEvaluationContext } from './recordExpressionEvaluationContext'
import { RecordUpdateResult } from './recordUpdateResult'

export type NodesUpdateParams = RecordExpressionEvaluationContext & {
  dateModified?: string
  clearNonApplicableValues?: boolean
}

export type NodeCreateParams = NodesUpdateParams & {
  parentNode?: ArenaRecordNode
  nodeDef: NodeDef<any>
  createMultipleEntities?: boolean
}

const getNodesToInsertCount = (params: { parentNode: ArenaRecordNode | undefined; nodeDef: NodeDef<any> }): number => {
  const { nodeDef, parentNode } = params
  if (!parentNode || NodeDefs.isSingle(nodeDef)) return 1
  if (nodeDef.type === NodeDefType.code) return 0 // never create nodes for multiple code attributes

  if (NodeDefs.isMultipleEntity(nodeDef) && !NodeDefs.isAutoCreateMinCountItems(nodeDef)) return 0

  const minCount = Nodes.getChildrenMinCount({ parentNode, nodeDef })
  if (Number.isNaN(minCount) || minCount <= 0) return 0
  return minCount
}

export const createEnumeratedEntityNode = async (params: {
  user: User
  survey: Survey
  parentNode: ArenaRecordNode
  nodeDef: NodeDefEntity
  enumeratorDef: NodeDefCode
  categoryItem: CategoryItem
  updateResult: RecordUpdateResult
  sideEffect?: boolean
}): Promise<void> => {
  const { user, survey, parentNode, nodeDef, enumeratorDef, categoryItem, updateResult, sideEffect } = params

  const { record } = updateResult

  const childUpdateResult = await addNodeAndDescendants({
    user,
    survey,
    record: updateResult.record,
    parentNode,
    nodeDef,
    sideEffect,
  })
  const enumeratorNode = Object.values(childUpdateResult.nodes).find((node) => node.nodeDefUuid === enumeratorDef.uuid)
  if (!enumeratorNode) {
    throw new SystemError(SystemErrorKeys.record.enumeratorNodeNotFound, {
      recordUuid: record.uuid,
      entityDef: NodeDefs.getName(nodeDef),
      enumerator: NodeDefs.getName(enumeratorDef),
    })
  }
  enumeratorNode.value = NodeValues.newCodeValue({ itemUuid: categoryItem.uuid })
  enumeratorNode.meta = { ...enumeratorNode.meta, defaultValueApplied: true }
  enumeratorNode.refData = { categoryItem }

  updateResult.merge(childUpdateResult)
}

export const createEnumeratedEntityNodes = async (params: {
  user: User
  survey: Survey
  parentNode: ArenaRecordNode
  nodeDef: NodeDefEntity
  updateResult: RecordUpdateResult
  categoryItemProvider?: CategoryItemProvider
  sideEffect?: boolean
}): Promise<boolean> => {
  const { user, survey, parentNode, nodeDef, updateResult, categoryItemProvider } = params

  const enumeratorDef = getNodeDefEnumerator({ survey, entityDef: nodeDef })
  if (!enumeratorDef) return false

  const allowedCodes = await getEnumeratingItemsAllowedCodes({
    survey,
    user,
    record: updateResult.record,
    entityDef: nodeDef,
    parentNode,
  })

  const categoryItems = await getEnumeratingCategoryItems({
    survey,
    enumeratorDef,
    parentNode,
    categoryItemProvider,
    allowedCodes,
  })(updateResult.record)
  if (categoryItems.length === 0) return false

  for (const categoryItem of categoryItems) {
    // sequential: each iteration updates the record
    await createEnumeratedEntityNode({ ...params, enumeratorDef, categoryItem }) // NOSONAR
  }
  return true
}

const createChildNodesBasedOnMinCount = async (
  params: NodeCreateParams & { updateResult: RecordUpdateResult }
): Promise<void> => {
  const { parentNode, nodeDef, updateResult, createMultipleEntities = true } = params

  if (NodeDefs.isMultipleEntity(nodeDef) && NodeDefs.isEnumerate(nodeDef)) {
    if (await createEnumeratedEntityNodes({ ...params, parentNode: parentNode! })) {
      return
    }
  }

  const nodesToInsertCount = getNodesToInsertCount({ parentNode, nodeDef })
  if (
    nodesToInsertCount === 0 ||
    (NodeDefs.isMultipleEntity(nodeDef) &&
      (!createMultipleEntities || (parentNode && !Nodes.isChildApplicable(parentNode, nodeDef.uuid))))
  ) {
    return // do nothing
  }
  for (let index = 0; index < nodesToInsertCount; index++) {
    // sequential: each iteration updates the record
    const childUpdateResult = await addNodeAndDescendants({ ...params, record: updateResult.record }) // NOSONAR
    updateResult.merge(childUpdateResult)
  }
}

export const addDescendants = async (params: NodeCreateParams): Promise<RecordUpdateResult> => {
  const { survey, record, nodeDef } = params

  const updateResult = new RecordUpdateResult({ record })

  if (NodeDefs.isEntity(nodeDef)) {
    const childDefs = getNodeDefChildren({ survey, nodeDef })

    // Add only child single nodes (it allows to apply default values)
    for (const childDef of childDefs) {
      // sequential: each iteration updates the record
      await createChildNodesBasedOnMinCount({ ...params, updateResult, nodeDef: childDef }) // NOSONAR
    }
  }
  return updateResult
}

export const addNodeAndDescendants = async (params: NodeCreateParams): Promise<RecordUpdateResult> => {
  const { survey, record, parentNode, nodeDef, sideEffect = false } = params

  const node = NodeFactory.createInstance({
    nodeDefUuid: nodeDef.uuid,
    recordUuid: record.uuid,
    parentNode,
    surveyUuid: survey.uuid,
  })
  if (parentNode && nodeDef.type === NodeDefType.code && NodeDefs.getParentCodeDefUuid(nodeDef as NodeDefCode)) {
    // meta.hCode indexes the node as dependent of its ancestor code attributes (cleared when they change)
    const ancestorCodeAttributes = getAncestorCodeAttributes(survey, parentNode, nodeDef as NodeDefCode)(record)
    node.meta = { ...node.meta, hCode: ancestorCodeAttributes.map((codeAttribute) => codeAttribute.uuid) }
  }

  const updateResult = new RecordUpdateResult({ record })
  updateResult.addNode(node, { sideEffect })

  // Add children if entity
  if (NodeDefs.isEntity(nodeDef)) {
    const descendantsUpdateResult = await addDescendants({
      ...params,
      record: updateResult.record,
      parentNode: node,
    })
    updateResult.merge(descendantsUpdateResult)
  }
  return updateResult
}
