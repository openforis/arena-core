import * as R from 'ramda'

import { NodeDef, NodeDefType, NodeDefProps, NodeDefs } from '../../nodeDef'

import * as Survey from '@core/survey/survey'

import * as Validation from '@core/validation/validation'
import * as ObjectUtils from '@core/objectUtils'
import { Record } from '../record'
import { Records } from '../records'
import * as Node from '../node'

const _isEntityDuplicate = (params: {
  survey: Survey
  record: Record
  entity: NodeDef<NodeDefType.entity, NodeDefProps>
}) => {
  const { survey, entity, record } = params
  // 1. get sibling entities
  const nodeParent = Records.getParent({ record, node: entity })
  const siblingEntities = R.pipe(
    Record.getNodeChildrenByDefUuid(nodeParent, Node.getNodeDefUuid(entity)),
    R.reject(ObjectUtils.isEqual(entity))
  )(record)

  // 2. get key values
  const keyValues = Record.getEntityKeyValues(survey, entity)(record)

  return R.isEmpty(siblingEntities) || R.isEmpty(keyValues)
    ? false
    : R.any(
        (siblingEntity) => R.equals(keyValues, Record.getEntityKeyValues(survey, siblingEntity)(record)),
        siblingEntities
      )
}

const validateAttributeKey =
  (params: { survey: Survey; record: Record; nodeDef: NodeDef<NodeDefType, NodeDefProps> }) =>
  (_propName: string, node: Node) => {
    const { survey, nodeDef, record } = params
    const nodeDefParent = Survey.getNodeDefParent(nodeDef)(survey)
    if (!NodeDefs.isRoot(nodeDefParent) && NodeDefs.isKey(nodeDef)) {
      const entity = Records.getParent({ record, node })
      if (entity && _isEntityDuplicate({ survey, record, entity })) {
        return { key: Validation.messageKeys.record.entityKeyDuplicate }
      }
    }

    return null
  }

export const AttributeKeyValidator = {
  validateAttributeKey,
}
