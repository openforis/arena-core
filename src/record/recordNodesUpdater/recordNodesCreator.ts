import { CategoryItem } from '../../category'
import { SystemError } from '../../error'
import { Node, NodeFactory } from '../../node'
import { NodeValues } from '../../node/nodeValues'
import { NodeDef, NodeDefCode, NodeDefEntity, NodeDefType, NodeDefs } from '../../nodeDef'
import { Survey } from '../../survey'
import { getCategoryItems } from '../../survey/surveys/refsData'
import { getNodeDefEnumerator, getNodeDefChildren } from '../../survey/surveys/nodeDefs'
import { Record } from '../record'
import { RecordUpdateResult } from './recordUpdateResult'
import { User } from '../../auth'

export type NodesUpdateParams = {
  user: User
  survey: Survey
  record: Record
  dateModified?: string
  timezoneOffset?: number
  sideEffect?: boolean
}

export type NodeCreateParams = NodesUpdateParams & {
  parentNode?: Node
  nodeDef: NodeDef<any>
  createMultipleEntities?: boolean
}

const getNodesToInsertCount = (nodeDef: NodeDef<any>): number => {
  if (NodeDefs.isSingle(nodeDef)) return 1
  if (nodeDef.type === NodeDefType.code) return 0 // never create nodes for multiple code attributes
  return NodeDefs.getMinCount(nodeDef) ?? 0
}

const getEnumeratingCategoryItems = (params: { survey: Survey; enumerator: NodeDefCode }): CategoryItem[] => {
  const { survey, enumerator } = params
  const categoryUuid = enumerator.props.categoryUuid
  const category = survey.categories?.[categoryUuid]
  return category ? getCategoryItems({ survey, categoryUuid: category.uuid }) : []
}

const createEnumeratedEntityNodes = (params: {
  user: User
  survey: Survey
  parentNode: Node
  entityDef: NodeDefEntity
  updateResult: RecordUpdateResult
  sideEffect: boolean
}): boolean => {
  const { user, survey, parentNode, entityDef, updateResult, sideEffect } = params

  const enumerator = getNodeDefEnumerator({ survey, entityDef })
  if (!enumerator) return false

  const categoryItems = getEnumeratingCategoryItems({ survey, enumerator })
  categoryItems.forEach((categoryItem) => {
    const { record } = updateResult
    const childUpdateResult = createNodeAndDescendants({
      user,
      survey,
      record: updateResult.record,
      parentNode,
      nodeDef: entityDef,
      sideEffect,
    })
    const enumeratorNode = Object.values(childUpdateResult.nodes).find((node) => node.nodeDefUuid === enumerator.uuid)
    if (!enumeratorNode) {
      // it should never happen
      throw new SystemError('record.enumeratorNodeNotFound', {
        recordUuid: record.uuid,
        entityDef: NodeDefs.getName(entityDef),
        enumerator: NodeDefs.getName(enumerator),
      })
    }
    enumeratorNode.value = NodeValues.newCodeValue({ itemUuid: categoryItem.uuid })

    updateResult.merge(childUpdateResult)
  })
  return true
}

const createChildNodesBasedOnMinCount = (params: NodeCreateParams & { updateResult: RecordUpdateResult }): void => {
  const { user, survey, parentNode, nodeDef, updateResult, createMultipleEntities = true, sideEffect = false } = params

  if (NodeDefs.isMultipleEntity(nodeDef) && NodeDefs.isEnumerate(nodeDef)) {
    if (
      createEnumeratedEntityNodes({
        user,
        survey,
        parentNode: parentNode!,
        entityDef: nodeDef,
        updateResult,
        sideEffect,
      })
    ) {
      return
    }
  }

  const nodesToInsertCount = getNodesToInsertCount(nodeDef)
  if (nodesToInsertCount === 0 || (!createMultipleEntities && NodeDefs.isMultipleEntity(nodeDef))) {
    return // do nothing
  }
  for (let index = 0; index < nodesToInsertCount; index++) {
    const childUpdateResult = createNodeAndDescendants({
      user,
      survey,
      record: updateResult.record,
      parentNode,
      nodeDef,
      sideEffect,
    })
    updateResult.merge(childUpdateResult)
  }
}

export const createDescendants = (params: NodeCreateParams): RecordUpdateResult => {
  const { survey, record, nodeDef } = params

  const updateResult = new RecordUpdateResult({ record })

  if (NodeDefs.isEntity(nodeDef)) {
    const childDefs = getNodeDefChildren({ survey, nodeDef })

    // Add only child single nodes (it allows to apply default values)
    childDefs.forEach((nodeDef) => createChildNodesBasedOnMinCount({ ...params, updateResult, nodeDef }))
  }
  return updateResult
}

export const createNodeAndDescendants = (params: NodeCreateParams): RecordUpdateResult => {
  const { survey, record, parentNode, nodeDef, sideEffect = false } = params

  const node = NodeFactory.createInstance({
    nodeDefUuid: nodeDef.uuid,
    recordUuid: record.uuid,
    parentNode,
    surveyUuid: survey.uuid,
  })

  const updateResult = new RecordUpdateResult({ record })
  updateResult.addNode(node, { sideEffect })

  // Add children if entity
  if (NodeDefs.isEntity(nodeDef)) {
    const descendantsUpdateResult = createDescendants({ ...params, record: updateResult.record, parentNode: node })
    updateResult.merge(descendantsUpdateResult)
  }
  return updateResult
}
