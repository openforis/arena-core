import { User } from '../../auth'
import { SystemError } from '../../error'
import { Node, Nodes, NodeValues } from '../../node'
import { NodeDefCode, NodeDefEntity, NodeDefs, NodeDefType } from '../../nodeDef'
import { Survey, Surveys } from '../../survey'
import { Objects } from '../../utils'
import { getAncestor, getChild, getChildren, getParentCodeAttribute } from '../_records/recordGetters'
import { Record } from '../record'
import { ExpressionEvaluationContext } from './expressionEvaluationContext'
import { createEnumeratedEntityNodes } from './recordNodesCreator'
import { deleteNodes } from './recordNodesDeleter'
import { RecordUpdateResult } from './recordUpdateResult'

const getEnumeratingCategoryItems = (params: {
  survey: Survey
  enumeratorDef: NodeDefCode
  record: Record
  parentNode: Node
}) => {
  const { survey, enumeratorDef, record, parentNode } = params
  let parentItemUuid
  if (NodeDefs.getParentCodeDefUuid(enumeratorDef)) {
    const parentCodeAttribute = getParentCodeAttribute({ parentNode, nodeDef: enumeratorDef })(record)
    parentItemUuid = parentCodeAttribute ? NodeValues.getItemUuid(parentCodeAttribute) : null
    if (!parentItemUuid) return []
  }
  return Surveys.getEnumeratingCategoryItems({ survey, enumerator: enumeratorDef, parentItemUuid })
}

const shouldExistingEntitiesBeDeleted = (params: {
  survey: Survey
  entityDef: NodeDefEntity
  existingEntities: Node[]
  parentNode: Node
  updateResult: RecordUpdateResult
}) => {
  const { survey, entityDef, existingEntities, parentNode, updateResult } = params
  const enumeratorDef = Surveys.getNodeDefEnumerator({ survey, entityDef })!
  const existingEnumeratingItemUuids = existingEntities
    .map((existingEntity) => {
      const existingEnumerator = getChild(existingEntity, enumeratorDef.uuid)(updateResult.record)
      return NodeValues.getItemUuid(existingEnumerator)
    })
    .sort()

  const enumeratingCategoryItems = getEnumeratingCategoryItems({
    survey,
    enumeratorDef,
    record: updateResult.record,
    parentNode,
  })
  const newEnumeratingItemUuids = enumeratingCategoryItems.map((item) => item.uuid).sort()

  return !Objects.isEqual(newEnumeratingItemUuids, existingEnumeratingItemUuids)
}

export const createOrDeleteEnumeratedEntities = (
  params: ExpressionEvaluationContext & {
    parentNode: Node
    entityDef: NodeDefEntity
    updateResult: RecordUpdateResult
  }
) => {
  const { user, survey, parentNode, entityDef, updateResult, sideEffect, deleteNotApplicableEnumeratedEntities } =
    params
  const existingEntities = getChildren(parentNode, entityDef.uuid)(updateResult.record)
  const existingEntitiesCount = existingEntities.length
  const applicable = Nodes.isChildApplicable(parentNode, entityDef.uuid)

  const deleteExistingEntities = () => {
    if (deleteNotApplicableEnumeratedEntities) {
      const nodesDeleteUpdatedResult = deleteNodes(
        existingEntities.map((node) => node.uuid),
        { sideEffect }
      )(updateResult.record)
      updateResult.merge(nodesDeleteUpdatedResult)
    } else {
      throw new SystemError('record.cannotDeleteNotApplicableEnumeratedEntities', {
        nodeDefName: NodeDefs.getName(entityDef),
      })
    }
  }

  if (applicable) {
    if (
      existingEntitiesCount > 0 &&
      shouldExistingEntitiesBeDeleted({ survey, entityDef, existingEntities, parentNode, updateResult })
    ) {
      deleteExistingEntities()
    }
    createEnumeratedEntityNodes({
      user,
      survey,
      entityDef,
      parentNode,
      updateResult,
      sideEffect,
    })
  } else if (!applicable && existingEntitiesCount > 0) {
    deleteExistingEntities()
  }
}

export const updateDependentEnumeratedEntities = (params: {
  user: User
  survey: Survey
  record: Record
  node: Node
  sideEffect?: boolean
}) => {
  const { survey, record, node } = params

  const updateResult = new RecordUpdateResult({ record })

  // 1. get dependent enumerated entities
  const { nodeDefUuid } = node
  const nodeDef = Surveys.getNodeDefByUuid({ survey, uuid: nodeDefUuid })
  if (nodeDef.type !== NodeDefType.code) return updateResult
  const codeDef = nodeDef as NodeDefCode

  const dependentEnumeratedEntityDefs = Surveys.getDependentEnumeratedEntityDefs({ survey, nodeDef: codeDef })
  if (dependentEnumeratedEntityDefs.length === 0) return updateResult

  const ancestorMultipleEntityDef = Surveys.getNodeDefAncestorMultipleEntity({ survey, nodeDef })!
  const ancestorMultipleEntity = getAncestor({ record, node, ancestorDefUuid: ancestorMultipleEntityDef.uuid })!

  // 2. update enumerated entities
  dependentEnumeratedEntityDefs.forEach((entityDef) => {
    createOrDeleteEnumeratedEntities({ ...params, entityDef, parentNode: ancestorMultipleEntity, updateResult })
  })
  return updateResult
}
