import { ArenaRecordNode, RecordNodes, RecordNodeValues } from '../../node'
import { ArenaNodeDefCode, ArenaNodeDefEntity, NodeDefType } from '../../nodeDef'
import { ArenaCategoryItemProvider } from '../../nodeDefExpressionEvaluator/categoryItemProvider'
import { ArenaSurvey, Surveys } from '../../survey'
import { Objects } from '../../utils'
import { getAncestor, getChild, getChildren } from '../_records/recordGetters'
import { getEnumeratingCategoryItems } from '../_records/recordUtils'
import { getEnumeratingItemsAllowedCodes } from './recordEnumeratingItemsExpressionEvaluator'
import { ArenaRecordExpressionEvaluationContext } from './recordExpressionEvaluationContext'
import { RecordNodeDependentsUpdateParams } from './recordNodeDependentsUpdateParams'
import { createEnumeratedEntityNodes } from './recordNodesCreator'
import { removeNodes } from './recordNodesDeleter'
import { RecordUpdateResult } from './recordUpdateResult'

const uuidsCompare = (uuidA: string, uuidB: string): number => uuidA.localeCompare(uuidB)

const shouldExistingEntitiesBeDeleted = async (params: {
  survey: ArenaSurvey
  entityDef: ArenaNodeDefEntity
  existingEntities: ArenaRecordNode[]
  parentNode: ArenaRecordNode
  updateResult: RecordUpdateResult
  categoryItemProvider?: ArenaCategoryItemProvider
  user: ArenaRecordExpressionEvaluationContext['user']
}) => {
  const { survey, entityDef, existingEntities, parentNode, updateResult, categoryItemProvider, user } = params
  const enumeratorDef = Surveys.getNodeDefEnumerator({ survey, entityDef })!
  const existingEnumeratingItemUuids = existingEntities
    .map((existingEntity) => {
      const existingEnumerator = getChild(existingEntity, enumeratorDef.uuid)(updateResult.record)
      // an entity without enumerator item makes the lists differ, so the entities are recreated
      return (existingEnumerator ? RecordNodeValues.getItemUuid(existingEnumerator) : undefined) ?? ''
    })
    .sort(uuidsCompare)

  const allowedCodes = await getEnumeratingItemsAllowedCodes({
    survey,
    user,
    record: updateResult.record,
    entityDef,
    parentNode,
  })

  const enumeratingCategoryItems = await getEnumeratingCategoryItems({
    survey,
    enumeratorDef,
    parentNode,
    categoryItemProvider,
    allowedCodes,
  })(updateResult.record)
  const newEnumeratingItemUuids = enumeratingCategoryItems.map((item) => item.uuid).sort(uuidsCompare)

  return !Objects.isEqual(newEnumeratingItemUuids, existingEnumeratingItemUuids)
}

export const createOrDeleteEnumeratedEntities = async (
  params: ArenaRecordExpressionEvaluationContext & {
    parentNode: ArenaRecordNode
    entityDef: ArenaNodeDefEntity
    updateResult: RecordUpdateResult
  }
) => {
  const { survey, parentNode, entityDef, categoryItemProvider, updateResult, sideEffect } = params
  const recordUpdateOptions = { sideEffect }
  const existingEntities = getChildren(parentNode, entityDef.uuid)(updateResult.record)
  const existingEntitiesCount = existingEntities.length
  const hasExistingEntities = existingEntitiesCount > 0
  const applicable = RecordNodes.isChildApplicable(parentNode, entityDef.uuid)

  const deleteExistingEntities = () => {
    const existingEntityUuids = existingEntities.map((node) => node.uuid)
    const nodesDeleteUpdatedResult = removeNodes(existingEntityUuids, recordUpdateOptions)(updateResult.record)
    updateResult.merge(nodesDeleteUpdatedResult)
  }

  if (applicable) {
    if (hasExistingEntities) {
      const existingEntitiesToBeDeleted = await shouldExistingEntitiesBeDeleted({
        survey,
        entityDef,
        existingEntities,
        parentNode,
        updateResult,
        categoryItemProvider,
        user: params.user,
      })
      if (!existingEntitiesToBeDeleted) {
        // existing entities already match the enumerating items: nothing to do (do not create them again)
        return
      }
      deleteExistingEntities()
    }
    await createEnumeratedEntityNodes({ ...params, nodeDef: entityDef, parentNode })
  } else if (hasExistingEntities) {
    deleteExistingEntities()
  }
}

export const updateDependentEnumeratedEntities = async (
  params: RecordNodeDependentsUpdateParams
): Promise<RecordUpdateResult> => {
  const { survey, record, node } = params

  const updateResult = new RecordUpdateResult({ record })

  // the ancestor of a deleted node is no longer in the record: its enumerated entities are deleted with it
  if (node.deleted) return updateResult

  // 1. get dependent enumerated entities
  const { nodeDefUuid } = node
  const nodeDef = Surveys.getNodeDefByUuid({ survey, uuid: nodeDefUuid })
  if (nodeDef.type !== NodeDefType.code) return updateResult
  const codeDef = nodeDef as ArenaNodeDefCode

  const dependentEnumeratedEntityDefs = Surveys.getDependentEnumeratedEntityDefs({ survey, nodeDef: codeDef })
  if (dependentEnumeratedEntityDefs.length === 0) return updateResult

  const ancestorMultipleEntityDef = Surveys.getNodeDefAncestorMultipleEntity({ survey, nodeDef })!
  const ancestorMultipleEntity = getAncestor(node, ancestorMultipleEntityDef.uuid)(record)!

  // 2. update enumerated entities
  for (const entityDef of dependentEnumeratedEntityDefs) {
    // sequential: each iteration updates the record
    await createOrDeleteEnumeratedEntities({ ...params, entityDef, parentNode: ancestorMultipleEntity, updateResult }) // NOSONAR
  }
  return updateResult
}
