import { Node, Nodes, NodeValues } from '../../node'
import { NodeDefCode, NodeDefEntity, NodeDefType } from '../../nodeDef'
import { Survey, Surveys } from '../../survey'
import { Objects } from '../../utils'
import { getAncestor, getChild, getChildren } from '../_records/recordGetters'
import { getEnumeratingCategoryItems } from '../_records/recordUtils'
import { ExpressionEvaluationContext } from './expressionEvaluationContext'
import { RecordNodeDependentsUpdateParams } from './recordNodeDependentsUpdateParams'
import { createEnumeratedEntityNodes } from './recordNodesCreator'
import { deleteNodes } from './recordNodesDeleter'
import { RecordUpdateResult } from './recordUpdateResult'

const uuidsCompare = (uuidA: string, uuidB: string): number => uuidA.localeCompare(uuidB)

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
      return NodeValues.getItemUuid(existingEnumerator)!
    })
    .sort(uuidsCompare)

  const enumeratingCategoryItems = getEnumeratingCategoryItems({ survey, enumeratorDef, parentNode })(
    updateResult.record
  )
  const newEnumeratingItemUuids = enumeratingCategoryItems.map((item) => item.uuid).sort(uuidsCompare)

  return !Objects.isEqual(newEnumeratingItemUuids, existingEnumeratingItemUuids)
}

export const createOrDeleteEnumeratedEntities = (
  params: ExpressionEvaluationContext & {
    parentNode: Node
    entityDef: NodeDefEntity
    updateResult: RecordUpdateResult
  }
) => {
  const { user, survey, parentNode, entityDef, updateResult, sideEffect } = params
  const existingEntities = getChildren(parentNode, entityDef.uuid)(updateResult.record)
  const existingEntitiesCount = existingEntities.length
  const applicable = Nodes.isChildApplicable(parentNode, entityDef.uuid)

  const deleteExistingEntities = () => {
    const existingEntityUuids = existingEntities.map((node) => node.uuid)
    const nodesDeleteUpdatedResult = deleteNodes(existingEntityUuids, { sideEffect })(updateResult.record)
    updateResult.merge(nodesDeleteUpdatedResult)
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

export const updateDependentEnumeratedEntities = (params: RecordNodeDependentsUpdateParams) => {
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
