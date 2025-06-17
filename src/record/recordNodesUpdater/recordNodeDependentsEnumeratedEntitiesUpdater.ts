import { Node, Nodes, NodeValues } from '../../node'
import { NodeDefCode, NodeDefEntity, NodeDefType } from '../../nodeDef'
import { CategoryItemProvider } from '../../nodeDefExpressionEvaluator/categoryItemProvider'
import { Survey, Surveys } from '../../survey'
import { Objects } from '../../utils'
import { getAncestor, getChild, getChildren } from '../_records/recordGetters'
import { getEnumeratingCategoryItems } from '../_records/recordUtils'
import { RecordExpressionEvaluationContext } from './recordExpressionEvaluationContext'
import { RecordNodeDependentsUpdateParams } from './recordNodeDependentsUpdateParams'
import { createEnumeratedEntityNodes } from './recordNodesCreator'
import { deleteNodes } from './recordNodesDeleter'
import { RecordUpdateResult } from './recordUpdateResult'

const uuidsCompare = (uuidA: string, uuidB: string): number => uuidA.localeCompare(uuidB)

const shouldExistingEntitiesBeDeleted = async (params: {
  survey: Survey
  entityDef: NodeDefEntity
  existingEntities: Node[]
  parentNode: Node
  updateResult: RecordUpdateResult
  categoryItemProvider?: CategoryItemProvider
}) => {
  const { survey, entityDef, existingEntities, parentNode, updateResult, categoryItemProvider } = params
  const enumeratorDef = Surveys.getNodeDefEnumerator({ survey, entityDef })!
  const existingEnumeratingItemUuids = existingEntities
    .map((existingEntity) => {
      const existingEnumerator = getChild(existingEntity, enumeratorDef.uuid)(updateResult.record)
      return NodeValues.getItemUuid(existingEnumerator)!
    })
    .sort(uuidsCompare)

  const enumeratingCategoryItems = await getEnumeratingCategoryItems({
    survey,
    enumeratorDef,
    parentNode,
    categoryItemProvider,
  })(updateResult.record)
  const newEnumeratingItemUuids = enumeratingCategoryItems.map((item) => item.uuid).sort(uuidsCompare)

  return !Objects.isEqual(newEnumeratingItemUuids, existingEnumeratingItemUuids)
}

export const createOrDeleteEnumeratedEntities = async (
  params: RecordExpressionEvaluationContext & {
    parentNode: Node
    entityDef: NodeDefEntity
    updateResult: RecordUpdateResult
  }
) => {
  const { survey, parentNode, entityDef, categoryItemProvider, updateResult, sideEffect } = params
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
      (await shouldExistingEntitiesBeDeleted({
        survey,
        entityDef,
        existingEntities,
        parentNode,
        updateResult,
        categoryItemProvider,
      }))
    ) {
      deleteExistingEntities()
    }
    await createEnumeratedEntityNodes({ ...params, nodeDef: entityDef, parentNode })
  } else if (!applicable && existingEntitiesCount > 0) {
    deleteExistingEntities()
  }
}

export const updateDependentEnumeratedEntities = async (
  params: RecordNodeDependentsUpdateParams
): Promise<RecordUpdateResult> => {
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
  for (const entityDef of dependentEnumeratedEntityDefs) {
    await createOrDeleteEnumeratedEntities({ ...params, entityDef, parentNode: ancestorMultipleEntity, updateResult })
  }
  return updateResult
}
