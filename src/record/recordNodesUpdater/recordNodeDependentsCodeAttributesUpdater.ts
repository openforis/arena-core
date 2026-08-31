import { Node, NodeValues, Nodes } from '../../node'
import { NodeDefCode, NodeDefs } from '../../nodeDef'
import { Surveys } from '../../survey'
import { Dates } from '../../utils'
import { Records } from '../records'
import type { ArenaRecord } from '../record'
import { RecordNodeDependentsUpdateParams } from './recordNodeDependentsUpdateParams'
import { RecordUpdateResult } from './recordUpdateResult'

// A dependent code attribute's stored item is still valid as long as its category item's parent is the
// (possibly unchanged) item currently selected on the parent code attribute node - so this single check
// covers both "did the parent's value change" and "is the dependent's value still valid": if the parent's
// item didn't change, the dependent's item still has the same parent and is left alone.
//
// The dependent's item may belong to a "big" category whose items aren't loaded into the survey's
// in-memory ref data index (e.g. an externally-referenced category) - Surveys.getCategoryItemByUuid only
// ever looks there, so it falls back to the async categoryItemProvider (same pattern as attribute value
// validation) before concluding the item doesn't exist.
const isDependentCodeAttributeValueStillValid = async (
  params: Pick<RecordNodeDependentsUpdateParams, 'survey' | 'categoryItemProvider'> & {
    parentItemUuid?: string
    dependentCodeAttribute: Node
    dependentCodeAttributeDef: NodeDefCode
    record: ArenaRecord
  }
): Promise<boolean> => {
  const { survey, parentItemUuid, dependentCodeAttribute, dependentCodeAttributeDef, record, categoryItemProvider } =
    params
  if (!parentItemUuid) return false

  const dependentItemUuid = NodeValues.getItemUuid(dependentCodeAttribute)
  if (!dependentItemUuid) return false

  let dependentItem = Surveys.getCategoryItemByUuid({ survey, itemUuid: dependentItemUuid })
  if (!dependentItem && categoryItemProvider) {
    const categoryUuid = NodeDefs.getCategoryUuid(dependentCodeAttributeDef)
    if (categoryUuid) {
      const draft = !!record.preview
      dependentItem = await categoryItemProvider.getItemByUuid({
        survey,
        categoryUuid,
        itemUuid: dependentItemUuid,
        draft,
      })
    }
  }
  return dependentItem?.parentUuid === parentItemUuid
}

export const updateDependentCodeAttributes = async (params: RecordNodeDependentsUpdateParams) => {
  const { survey, record, node, categoryItemProvider, sideEffect = false } = params

  const updateResult = new RecordUpdateResult({ record })

  const recordUpdateOptions = { sideEffect }

  // 1. get dependent code attributes
  const dependentCodeAttributes = Records.getDependentCodeAttributes(node)(record)
  if (dependentCodeAttributes.length === 0) return updateResult

  const parentItemUuid = NodeValues.getItemUuid(node)

  // 2. clear dependent code attributes' values that are no longer valid children of the parent's current item
  for (const dependentCodeAttribute of dependentCodeAttributes) {
    const dependentCodeAttributeDef = Surveys.getNodeDefByUuid({
      survey,
      uuid: dependentCodeAttribute.nodeDefUuid,
    }) as NodeDefCode
    if (NodeDefs.isReadOnly(dependentCodeAttributeDef) || !Nodes.hasUserInputValue(dependentCodeAttribute)) continue

    const stillValid = await isDependentCodeAttributeValueStillValid({
      survey,
      parentItemUuid,
      dependentCodeAttribute,
      dependentCodeAttributeDef,
      record,
      categoryItemProvider,
    })
    if (stillValid) continue

    const nodeUpdated: Node = {
      ...dependentCodeAttribute,
      value: null,
      updated: true,
      dateModified: Dates.nowFormattedForStorage(),
    }
    updateResult.addNode(nodeUpdated, recordUpdateOptions)
    updateResult.addClearedDefUuid(nodeUpdated.nodeDefUuid)
  }

  return updateResult
}
