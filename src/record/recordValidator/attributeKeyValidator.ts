import { Record } from '../record'
import { Records } from '../records'
import { NodeDef, NodeDefs, NodeDefProps, NodeDefType } from '../../nodeDef'
import { Node, Nodes, NodeValues } from '../../node'
import { ValidationResult, ValidationResultFactory, ValidationSeverity } from '../../validation'
import { Survey, Surveys } from '../../survey'

import { Objects } from '../../utils'

const _isEntityDuplicate = (params: { survey: Survey; record: Record; entity: Node }): boolean => {
  const { survey, entity, record } = params
  // 1. get sibling entities
  const nodeParent = Records.getParent(entity)(record)
  if (!nodeParent) return false

  const siblingEntities = Records.getChildren(
    nodeParent,
    entity.nodeDefUuid
  )(record).filter((node) => !Nodes.areEqual(entity, node))

  // 2. get key values
  const entityDef = Surveys.getNodeDefByUuid({ survey, uuid: entity.nodeDefUuid })
  const keyDefs = Surveys.getNodeDefKeys({ survey, nodeDef: entityDef })

  if (Objects.isEmpty(siblingEntities) || Objects.isEmpty(keyDefs)) {
    return false
  }
  const keyValuesByDefUuid = Records.getEntityKeyValuesByDefUuid({ survey, record, entity, keyDefs })
  return (
    !Objects.isEmpty(keyValuesByDefUuid) &&
    siblingEntities.some((sibilingEntity) => {
      const siblingKeyValuesByDefUuid = Records.getEntityKeyValuesByDefUuid({
        survey,
        record,
        entity: sibilingEntity,
        keyDefs,
      })
      return keyDefs.every((keyDef) => {
        const keyValue = keyValuesByDefUuid[keyDef.uuid]
        const siblingKeyValue = siblingKeyValuesByDefUuid[keyDef.uuid]
        return NodeValues.isValueEqual({
          survey,
          nodeDef: keyDef,
          value: keyValue,
          valueSearch: siblingKeyValue,
        })
      })
    })
  )
}

const isNodeDefToBeValidated = (params: { survey: Survey; nodeDef: NodeDef<NodeDefType, NodeDefProps> }): boolean => {
  const { survey, nodeDef } = params
  if (!NodeDefs.isKey(nodeDef)) return false

  const nodeDefParent = Surveys.getNodeDefParent({ survey, nodeDef })
  // root entity key attributes will be validated by another validator
  return !!nodeDefParent && !NodeDefs.isRoot(nodeDefParent)
}

const validateAttributeKey =
  (params: { survey: Survey; record: Record; nodeDef: NodeDef<NodeDefType, NodeDefProps> }) =>
  async (_propName: string, node: Node): Promise<ValidationResult> => {
    const { survey, nodeDef, record } = params

    if (isNodeDefToBeValidated({ survey, nodeDef })) {
      const entity = Records.getParent(node)(record)
      if (entity && _isEntityDuplicate({ survey, record, entity })) {
        return ValidationResultFactory.createInstance({
          valid: false,
          severity: ValidationSeverity.error,
          key: 'record.entity.keyDuplicate',
        })
      }
    }

    return ValidationResultFactory.createInstance()
  }

export const AttributeKeyValidator = {
  validateAttributeKey,
}
