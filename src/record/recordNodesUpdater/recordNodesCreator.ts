import { User } from '../../auth'
import { SystemError } from '../../error'
import { Node, NodeFactory, Nodes } from '../../node'
import { NodeValues } from '../../node/nodeValues'
import { NodeDef, NodeDefEntity, NodeDefType, NodeDefs } from '../../nodeDef'
import { CategoryItemProvider } from '../../nodeDefExpressionEvaluator/categoryItemProvider'
import { TaxonProvider } from '../../nodeDefExpressionEvaluator/taxonProvider'
import { Survey } from '../../survey'
import { getNodeDefChildren, getNodeDefEnumerator } from '../../survey/surveys/nodeDefs'
import { getEnumeratingCategoryItems } from '../_records/recordUtils'
import { Record } from '../record'
import { RecordUpdateResult } from './recordUpdateResult'

export type NodesUpdateParams = {
  user: User
  survey: Survey
  record: Record
  dateModified?: string
  timezoneOffset?: number
  sideEffect?: boolean
  categoryItemProvider?: CategoryItemProvider
  taxonProvider?: TaxonProvider
}

export type NodeCreateParams = NodesUpdateParams & {
  parentNode?: Node
  nodeDef: NodeDef<any>
  createMultipleEntities?: boolean
}

const getNodesToInsertCount = (params: { parentNode: Node | undefined; nodeDef: NodeDef<any> }): number => {
  const { nodeDef, parentNode } = params
  if (!parentNode || NodeDefs.isSingle(nodeDef)) return 1
  if (nodeDef.type === NodeDefType.code) return 0 // never create nodes for multiple code attributes
  return Nodes.getChildrenMinCount({ parentNode, nodeDef }) ?? 0
}

export const createEnumeratedEntityNodes = (params: {
  user: User
  survey: Survey
  parentNode: Node
  entityDef: NodeDefEntity
  updateResult: RecordUpdateResult
  sideEffect?: boolean
}): boolean => {
  const { user, survey, parentNode, entityDef, updateResult, sideEffect } = params

  const enumeratorDef = getNodeDefEnumerator({ survey, entityDef })
  if (!enumeratorDef) return false

  const categoryItems = getEnumeratingCategoryItems({ survey, enumeratorDef, parentNode })(updateResult.record)
  if (categoryItems.length === 0) return false

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
    const enumeratorNode = Object.values(childUpdateResult.nodes).find(
      (node) => node.nodeDefUuid === enumeratorDef.uuid
    )
    if (!enumeratorNode) {
      // it should never happen
      throw new SystemError('record.enumeratorNodeNotFound', {
        recordUuid: record.uuid,
        entityDef: NodeDefs.getName(entityDef),
        enumerator: NodeDefs.getName(enumeratorDef),
      })
    }
    enumeratorNode.value = NodeValues.newCodeValue({ itemUuid: categoryItem.uuid })
    enumeratorNode.meta = { ...(enumeratorNode.meta ?? {}), defaultValueApplied: true }
    enumeratorNode.refData = { categoryItem }

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

  const nodesToInsertCount = getNodesToInsertCount({ parentNode, nodeDef })
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
