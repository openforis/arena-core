import { Node, NodeValues, Nodes } from '../../node'
import { NodeDefs } from '../../nodeDef'
import { Surveys } from '../../survey'
import { Dates } from '../../utils'
import { Records } from '../records'
import { RecordNodeDependentsUpdateParams } from './recordNodeDependentsUpdateParams'
import { RecordUpdateResult } from './recordUpdateResult'

// A dependent code attribute's stored item is still valid as long as its category item's parent is the
// (possibly unchanged) item currently selected on the parent code attribute node - so this single check
// covers both "did the parent's value change" and "is the dependent's value still valid": if the parent's
// item didn't change, the dependent's item still has the same parent and is left alone.
const isDependentCodeAttributeValueStillValid = (params: {
  survey: RecordNodeDependentsUpdateParams['survey']
  parentItemUuid?: string
  dependentCodeAttribute: Node
}): boolean => {
  const { survey, parentItemUuid, dependentCodeAttribute } = params
  if (!parentItemUuid) return false

  const dependentItemUuid = NodeValues.getItemUuid(dependentCodeAttribute)
  if (!dependentItemUuid) return false

  const dependentItem = Surveys.getCategoryItemByUuid({ survey, itemUuid: dependentItemUuid })
  return dependentItem?.parentUuid === parentItemUuid
}

export const updateDependentCodeAttributes = (params: RecordNodeDependentsUpdateParams) => {
  const { survey, record, node, sideEffect = false } = params

  const updateResult = new RecordUpdateResult({ record })

  const recordUpdateOptions = { sideEffect }

  // 1. get dependent code attributes
  const dependentCodeAttributes = Records.getDependentCodeAttributes(node)(record)
  if (dependentCodeAttributes.length === 0) return updateResult

  const parentItemUuid = NodeValues.getItemUuid(node)

  // 2. clear dependent code attributes' values that are no longer valid children of the parent's current item
  for (const dependentCodeAttribute of dependentCodeAttributes) {
    const dependentCodeAttributeDef = Surveys.getNodeDefByUuid({ survey, uuid: dependentCodeAttribute.nodeDefUuid })
    if (NodeDefs.isReadOnly(dependentCodeAttributeDef) || !Nodes.hasUserInputValue(dependentCodeAttribute)) continue

    if (isDependentCodeAttributeValueStillValid({ survey, parentItemUuid, dependentCodeAttribute })) continue

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
