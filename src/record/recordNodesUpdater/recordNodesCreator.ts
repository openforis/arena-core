import { CategoryItem } from '../../category'
import { SystemError } from '../../error'
import { Node, NodeFactory } from '../../node'
import { NodeValues } from '../../node/nodeValues'
import { NodeDef, NodeDefCode, NodeDefEntity, NodeDefs } from '../../nodeDef'
import { Survey, Surveys } from '../../survey'
import { Record } from '../record'
import { RecordUpdateResult } from './recordUpdateResult'

const getNodesToInsertCount = (nodeDef: NodeDef<any>): number => {
  if (NodeDefs.isSingle(nodeDef)) return 1
  return NodeDefs.getMinCount(nodeDef) || 0
}

const getEnumeratingCategoryItems = (params: { survey: Survey; enumerator: NodeDefCode }): CategoryItem[] => {
  const { survey, enumerator } = params
  const categoryUuid = enumerator.props.categoryUuid
  const category = survey.categories?.[categoryUuid]
  return category ? Surveys.getCategoryItems({ survey, categoryUuid: category.uuid }) : []
}

const createEnumeratedEntityNodes = (params: {
  survey: Survey
  parentNode: Node
  entityDef: NodeDefEntity
  updateResult: RecordUpdateResult
  sideEffect: boolean
}): boolean => {
  const { survey, parentNode, entityDef, updateResult, sideEffect } = params

  const enumerator = Surveys.getNodeDefEnumerator({ survey, entityDef })
  if (!enumerator) return false

  const categoryItems = getEnumeratingCategoryItems({ survey, enumerator })
  categoryItems.forEach((categoryItem) => {
    const { record } = updateResult
    const childUpdateResult = createNodeAndDescendants({
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

const createChildNodesBasedOnMinCount =
  (params: {
    survey: Survey
    updateResult: RecordUpdateResult
    parentNode: Node
    createMultipleEntities?: boolean
    sideEffect?: boolean
  }) =>
  (childDef: NodeDef<any>): void => {
    const { survey, parentNode, updateResult, createMultipleEntities = true, sideEffect = false } = params

    if (NodeDefs.isMultipleEntity(childDef) && NodeDefs.isEnumerate(childDef)) {
      if (createEnumeratedEntityNodes({ survey, parentNode, entityDef: childDef, updateResult, sideEffect })) {
        return
      }
    }

    const nodesToInsertCount = getNodesToInsertCount(childDef)
    if (nodesToInsertCount === 0 || (!createMultipleEntities && NodeDefs.isMultipleEntity(childDef))) {
      return // do nothing
    }
    for (let index = 0; index < nodesToInsertCount; index++) {
      const childUpdateResult = createNodeAndDescendants({
        survey,
        record: updateResult.record,
        parentNode,
        nodeDef: childDef,
        sideEffect,
      })
      updateResult.merge(childUpdateResult)
    }
  }

export const createDescendants = (params: {
  survey: Survey
  record: Record
  parentNode: Node
  nodeDef: NodeDef<any>
  createMultipleEntities?: boolean
  sideEffect?: boolean
}): RecordUpdateResult => {
  const { survey, record, parentNode, nodeDef, createMultipleEntities, sideEffect = false } = params

  const updateResult = new RecordUpdateResult({ record })

  if (NodeDefs.isEntity(nodeDef)) {
    const childDefs = Surveys.getNodeDefChildren({ survey, nodeDef })

    // Add only child single nodes (it allows to apply default values)
    childDefs.forEach(
      createChildNodesBasedOnMinCount({ survey, parentNode, updateResult, createMultipleEntities, sideEffect })
    )
  }
  return updateResult
}

export const createNodeAndDescendants = (params: {
  survey: Survey
  record: Record
  parentNode?: Node
  nodeDef: NodeDef<any>
  createMultipleEntities?: boolean
  sideEffect?: boolean
}): RecordUpdateResult => {
  const { survey, record, parentNode, nodeDef, createMultipleEntities, sideEffect = false } = params

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
    const descendantsUpdateResult = createDescendants({
      survey,
      record: updateResult.record,
      nodeDef,
      parentNode: node,
      createMultipleEntities,
      sideEffect,
    })
    updateResult.merge(descendantsUpdateResult)
  }
  return updateResult
}
