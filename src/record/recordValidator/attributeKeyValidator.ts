import * as R from 'ramda'

import { NodeDef, NodeDefType, NodeDefProps, NodeDefs } from '../../nodeDef'

import { Survey, Surveys } from '../../survey'

import {
  Validation,
  ValidationResult,
  ValidationFactory,
  ValidationResult,
  ValidationResultFactory,
  Validator,
} from '../../validation'

import { Record } from '../record'
import { Records } from '../records'
import * as Node from '../node'

import { Numbers, Dates, Objects } from '../../utils'

const _isEntityDuplicate = (params: {
  survey: Survey
  record: Record
  entity: NodeDef<NodeDefType.entity, NodeDefProps>
}) => {
  const { survey, entity, record } = params
  // 1. get sibling entities
  const nodeParent = Records.getParent({ record, node: entity })
  const siblingEntities = R.pipe(
    Records.getNodeChildrenByDefUuid(nodeParent, Node.getNodeDefUuid(entity)),
    R.reject(Objects.isEqual(entity))
  )(record)

  // 2. get key values
  const keyValues = Record.getEntityKeyValues(survey, entity)(record)

  return R.isEmpty(siblingEntities) || R.isEmpty(keyValues)
    ? false
    : R.any(
        (siblingEntity) => R.equals(keyValues, Records.getEntityKeyValues(survey, siblingEntity)(record)),
        siblingEntities
      )
}

const validateAttributeKey =
  (params: { survey: Survey; record: Record; nodeDef: NodeDef<NodeDefType, NodeDefProps> }) =>
  (_propName: string, node: Node) => {
    const { survey, nodeDef, record } = params
    const nodeDefParent = Surveys.getNodeDefParent({ survey, nodeDef })
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
