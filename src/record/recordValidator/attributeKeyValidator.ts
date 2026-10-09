import { Record } from '../record'
import { Records } from '../records'
import { NodeDef, NodeDefs, NodeDefProps, NodeDefType } from '../../nodeDef'
import { Node, Nodes, NodeValues } from '../../node'
import { ValidationResult, ValidationResultFactory, ValidationSeverity } from '../../validation'
import { Survey, Surveys } from '../../survey'

import { Dictionary } from '../../common'
import { Objects } from '../../utils'

/**
 * Cache of entity key values (and key defs by entity def) used during a single validation run (the record doesn't change):
 * without it, validating the keys of S sibling entities would compute the key values of every sibling S times.
 */
export type EntityKeysCache = {
  keyDefsByEntityDefUuid: Map<string, NodeDef<NodeDefType, NodeDefProps>[]>
  keyValuesByEntityUuid: Map<string, Dictionary<any>>
}

export const createEntityKeysCache = (): EntityKeysCache => ({
  keyDefsByEntityDefUuid: new Map(),
  keyValuesByEntityUuid: new Map(),
})

const _getKeyDefs = (params: {
  survey: Survey
  entityDef: NodeDef<NodeDefType, NodeDefProps>
  cache?: EntityKeysCache
}): NodeDef<NodeDefType, NodeDefProps>[] => {
  const { survey, entityDef, cache } = params
  let keyDefs = cache?.keyDefsByEntityDefUuid.get(entityDef.uuid)
  if (!keyDefs) {
    keyDefs = Surveys.getNodeDefKeys({ survey, nodeDef: entityDef })
    cache?.keyDefsByEntityDefUuid.set(entityDef.uuid, keyDefs)
  }
  return keyDefs
}

const _getKeyValuesByDefUuid = (params: {
  survey: Survey
  record: Record
  entity: Node
  keyDefs: NodeDef<NodeDefType, NodeDefProps>[]
  cache?: EntityKeysCache
}): Dictionary<any> => {
  const { survey, record, entity, keyDefs, cache } = params
  let keyValues = cache?.keyValuesByEntityUuid.get(entity.uuid)
  if (!keyValues) {
    keyValues = Records.getEntityKeyValuesByDefUuid({ survey, record, entity, keyDefs })
    cache?.keyValuesByEntityUuid.set(entity.uuid, keyValues)
  }
  return keyValues
}

const _isEntityDuplicate = (params: {
  survey: Survey
  record: Record
  entity: Node
  entityKeysCache?: EntityKeysCache
}): boolean => {
  const { survey, entity, record, entityKeysCache: cache } = params
  // 1. get sibling entities
  const nodeParent = Records.getParent(entity)(record)
  if (!nodeParent) return false

  const siblingEntities = Records.getChildren(
    nodeParent,
    entity.nodeDefUuid
  )(record).filter((node) => !Nodes.areEqual(entity, node))

  // 2. get key values
  const entityDef = Surveys.getNodeDefByUuid({ survey, uuid: entity.nodeDefUuid })
  const keyDefs = _getKeyDefs({ survey, entityDef, cache })

  if (Objects.isEmpty(siblingEntities) || Objects.isEmpty(keyDefs)) {
    return false
  }
  const keyValuesByDefUuid = _getKeyValuesByDefUuid({ survey, record, entity, keyDefs, cache })
  return (
    !Objects.isEmpty(keyValuesByDefUuid) &&
    siblingEntities.some((sibilingEntity) => {
      const siblingKeyValuesByDefUuid = _getKeyValuesByDefUuid({
        survey,
        record,
        entity: sibilingEntity,
        keyDefs,
        cache,
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
  (params: {
    survey: Survey
    record: Record
    nodeDef: NodeDef<NodeDefType, NodeDefProps>
    entityKeysCache?: EntityKeysCache
  }) =>
  (_propName: string, node: Node): Promise<ValidationResult> => {
    const { survey, nodeDef, record, entityKeysCache } = params

    if (isNodeDefToBeValidated({ survey, nodeDef })) {
      const entity = Records.getParent(node)(record)
      if (entity && _isEntityDuplicate({ survey, record, entity, entityKeysCache })) {
        return Promise.resolve(
          ValidationResultFactory.createInstance({
            valid: false,
            severity: ValidationSeverity.error,
            key: 'record.entity.keyDuplicate',
          })
        )
      }
    }

    return Promise.resolve(ValidationResultFactory.createInstance())
  }

export const AttributeKeyValidator = {
  validateAttributeKey,
}
