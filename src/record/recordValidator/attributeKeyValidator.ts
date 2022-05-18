import { Record } from '../record'
import { Records } from '../records'
import { NodeDef, NodeDefs, NodeDefProps, NodeDefType } from '../../nodeDef'
import { Node, Nodes } from '../../node'
import { ValidationResult, ValidationResultFactory } from '../../validation'
import { Survey, Surveys } from '../../survey'

import { Objects } from '../../utils'

const _isEntityDuplicate = (params: { survey: Survey; record: Record; entity: Node }) => {
  const { survey, entity, record } = params
  // 1. get sibling entities
  const nodeParent = Records.getParent({ record, node: entity })
  const siblingEntities = Records.getChildren({
    record,
    parentNode: nodeParent,
    childDefUuid: entity.nodeDefUuid,
  }).filter((node) => !Nodes.areEqual(entity, node))

  // 2. get key values
  const keyValues = Records.getEntityKeyValues({ survey, entity, record })

  return Objects.isEmpty(siblingEntities) || Objects.isEmpty(keyValues)
    ? false
    : siblingEntities.some((sibilingEntity) =>
        Objects.isEqual(keyValues, Records.getEntityKeyValues({ survey, record, entity: sibilingEntity }))
      )
}

const validateAttributeKey =
  (params: { survey: Survey; record: Record; nodeDef: NodeDef<NodeDefType, NodeDefProps> }) =>
  (_propName: string, node: Node): ValidationResult => {
    const { survey, nodeDef, record } = params
    const nodeDefParent = Surveys.getNodeDefParent({ survey, nodeDef })
    if (!NodeDefs.isRoot(nodeDefParent) && NodeDefs.isKey(nodeDef)) {
      const entity = Records.getParent({ record, node })
      if (entity && _isEntityDuplicate({ survey, record, entity })) {
        return ValidationResultFactory.createInstance({
          valid: false,
          key: 'record.entity.keyDuplicate',
        })
      }
    }

    return ValidationResultFactory.createInstance()
  }

export const AttributeKeyValidator = {
  validateAttributeKey,
}
