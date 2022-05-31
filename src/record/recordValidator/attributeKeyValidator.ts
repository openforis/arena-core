import { Record } from '../record'
import { Records } from '../records'
import { NodeDef, NodeDefs, NodeDefProps, NodeDefType } from '../../nodeDef'
import { Node, Nodes } from '../../node'
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
  const keyValues = Records.getEntityKeyValues({ survey, entity, record })

  return Objects.isEmpty(siblingEntities) || Objects.isEmpty(keyValues)
    ? false
    : siblingEntities.some((sibilingEntity) =>
        Objects.isEqual(keyValues, Records.getEntityKeyValues({ survey, record, entity: sibilingEntity }))
      )
}

const isNodeDefToBeValidated = (params: { survey: Survey; nodeDef: NodeDef<NodeDefType, NodeDefProps> }): boolean => {
  const { survey, nodeDef } = params
  if (!NodeDefs.isKey(nodeDef)) return false

  const nodeDefParent = Surveys.getNodeDefParent({ survey, nodeDef })
  if (!nodeDefParent || NodeDefs.isRoot(nodeDefParent)) {
    return false // root entity key attributes will be validated by another validator
  }
  return true
}

const validateAttributeKey =
  (params: { survey: Survey; record: Record; nodeDef: NodeDef<NodeDefType, NodeDefProps> }) =>
  (_propName: string, node: Node): ValidationResult => {
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
