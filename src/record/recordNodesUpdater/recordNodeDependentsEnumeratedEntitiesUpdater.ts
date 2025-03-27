import { User } from '../../auth'
import { Node } from '../../node'
import { NodeDefCode, NodeDefs, NodeDefType } from '../../nodeDef'
import { Survey, Surveys } from '../../survey'
import { Record } from '../record'
import { Records } from '../records'
import { createOrDeleteEnumeratedEntities } from './recordNodeDependentsApplicableUpdater'
import { RecordUpdateResult } from './recordUpdateResult'

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

  const categoryUuid = NodeDefs.getCategoryUuid(codeDef)
  if (!categoryUuid) return updateResult

  const category = Surveys.getCategoryByUuid({ survey, categoryUuid })
  const levelsCount = category?.levels?.length || 0
  if (levelsCount <= 1) return updateResult

  const dependentCodeDefs = Surveys.getDependentCodeAttributeDefs({ survey, nodeDef: codeDef })
  dependentCodeDefs.forEach((dependentCodeDef) => {
    if (NodeDefs.isKey(dependentCodeDef)) {
      const entityDef = Surveys.getNodeDefAncestorMultipleEntity({ survey, nodeDef: dependentCodeDef })
      if (entityDef && NodeDefs.isEnumerate(entityDef)) {
        // 2. update enumerated entity
        const parentDef = Surveys.getNodeDefAncestorMultipleEntity({ survey, nodeDef })!
        const parentNode = Records.getAncestor({ record, node, ancestorDefUuid: parentDef.uuid })!
        createOrDeleteEnumeratedEntities({ ...params, entityDef, parentNode, updateResult })
      }
    }
  })
  return updateResult
}
