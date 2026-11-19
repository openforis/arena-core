import { ArenaRecord } from '../record'
import { Records } from '../records'
import { ArenaNodeDef, NodeDefs, ArenaNodeDefProps, NodeDefType } from '../../nodeDef'
import { ArenaRecordNode, RecordNodes, RecordNodeValues } from '../../node'
import { getValueEqualityKey } from '../../node/nodeValues'
import { ArenaValidationResult, ValidationResultFactory, ValidationSeverity } from '../../validation'
import { ArenaSurvey, Surveys } from '../../survey'

import { ArenaDictionary } from '../../common'
import { Objects } from '../../utils'

/**
 * Sibling entities (same parent and entity def) indexed by the equality key of their key values:
 * entities with the same equality key are duplicates; entities whose equality key cannot be built (see getValueEqualityKey)
 * are compared with every sibling.
 */
type SiblingEntitiesKeysIndex = {
  entitiesByEqualityKey: Map<string, ArenaRecordNode[]>
  entitiesWithoutEqualityKey: ArenaRecordNode[]
}

/**
 * Cache of entity key values (and key defs by entity def) used during a single validation run (the record doesn't change):
 * without it, validating the keys of S sibling entities would compute the key values of every sibling S times
 * and compare them S times with the key values of every sibling.
 */
export type EntityKeysCache = {
  keyDefsByEntityDefUuid: Map<string, ArenaNodeDef<NodeDefType, ArenaNodeDefProps>[]>
  keyValuesByEntityUuid: Map<string, ArenaDictionary<any>>
  equalityKeyByEntityUuid: Map<string, string | undefined>
  siblingEntitiesKeysIndexByParentAndDefUuid: Map<string, SiblingEntitiesKeysIndex>
}

export const createEntityKeysCache = (): EntityKeysCache => ({
  keyDefsByEntityDefUuid: new Map(),
  keyValuesByEntityUuid: new Map(),
  equalityKeyByEntityUuid: new Map(),
  siblingEntitiesKeysIndexByParentAndDefUuid: new Map(),
})

const _getKeyDefs = (params: {
  survey: ArenaSurvey
  entityDef: ArenaNodeDef<NodeDefType, ArenaNodeDefProps>
  cache?: EntityKeysCache
}): ArenaNodeDef<NodeDefType, ArenaNodeDefProps>[] => {
  const { survey, entityDef, cache } = params
  let keyDefs = cache?.keyDefsByEntityDefUuid.get(entityDef.uuid)
  if (!keyDefs) {
    keyDefs = Surveys.getNodeDefKeys({ survey, nodeDef: entityDef })
    cache?.keyDefsByEntityDefUuid.set(entityDef.uuid, keyDefs)
  }
  return keyDefs
}

const _getKeyValuesByDefUuid = (params: {
  survey: ArenaSurvey
  record: ArenaRecord
  entity: ArenaRecordNode
  keyDefs: ArenaNodeDef<NodeDefType, ArenaNodeDefProps>[]
  cache?: EntityKeysCache
}): ArenaDictionary<any> => {
  const { survey, record, entity, keyDefs, cache } = params
  let keyValues = cache?.keyValuesByEntityUuid.get(entity.uuid)
  if (!keyValues) {
    keyValues = Records.getEntityKeyValuesByDefUuid(survey, entity, undefined, keyDefs)(record)
    cache?.keyValuesByEntityUuid.set(entity.uuid, keyValues)
  }
  return keyValues
}

const _getEqualityKey = (params: {
  survey: ArenaSurvey
  entity: ArenaRecordNode
  keyDefs: ArenaNodeDef<NodeDefType, ArenaNodeDefProps>[]
  keyValuesByDefUuid: ArenaDictionary<any>
  cache: EntityKeysCache
}): string | undefined => {
  const { survey, entity, keyDefs, keyValuesByDefUuid, cache } = params
  if (cache.equalityKeyByEntityUuid.has(entity.uuid)) return cache.equalityKeyByEntityUuid.get(entity.uuid)

  const keyParts: string[] = []
  for (const keyDef of keyDefs) {
    const keyPart = getValueEqualityKey({ survey, nodeDef: keyDef, value: keyValuesByDefUuid[keyDef.uuid] })
    if (keyPart === undefined) {
      keyParts.length = 0
      break
    }
    keyParts.push(keyPart)
  }
  const equalityKey = keyParts.length > 0 ? JSON.stringify(keyParts) : undefined
  cache.equalityKeyByEntityUuid.set(entity.uuid, equalityKey)
  return equalityKey
}

const _areKeyValuesEqual = (params: {
  survey: ArenaSurvey
  keyDefs: ArenaNodeDef<NodeDefType, ArenaNodeDefProps>[]
  keyValuesByDefUuid: ArenaDictionary<any>
  siblingKeyValuesByDefUuid: ArenaDictionary<any>
}): boolean => {
  const { survey, keyDefs, keyValuesByDefUuid, siblingKeyValuesByDefUuid } = params
  return keyDefs.every((keyDef) =>
    RecordNodeValues.isValueEqual({
      survey,
      nodeDef: keyDef,
      value: keyValuesByDefUuid[keyDef.uuid],
      valueSearch: siblingKeyValuesByDefUuid[keyDef.uuid],
    })
  )
}

const _getSiblingEntitiesKeysIndex = (params: {
  survey: ArenaSurvey
  record: ArenaRecord
  nodeParent: ArenaRecordNode
  entityDefUuid: string
  keyDefs: ArenaNodeDef<NodeDefType, ArenaNodeDefProps>[]
  cache: EntityKeysCache
}): SiblingEntitiesKeysIndex => {
  const { survey, record, nodeParent, entityDefUuid, keyDefs, cache } = params
  const indexKey = `${nodeParent.uuid}_${entityDefUuid}`
  let index = cache.siblingEntitiesKeysIndexByParentAndDefUuid.get(indexKey)
  if (!index) {
    index = { entitiesByEqualityKey: new Map(), entitiesWithoutEqualityKey: [] }
    for (const siblingEntity of Records.getChildren(nodeParent, entityDefUuid)(record)) {
      const keyValuesByDefUuid = _getKeyValuesByDefUuid({ survey, record, entity: siblingEntity, keyDefs, cache })
      const equalityKey = _getEqualityKey({ survey, entity: siblingEntity, keyDefs, keyValuesByDefUuid, cache })
      if (equalityKey === undefined) {
        index.entitiesWithoutEqualityKey.push(siblingEntity)
      } else {
        const entitiesWithSameKey = index.entitiesByEqualityKey.get(equalityKey)
        if (entitiesWithSameKey) {
          entitiesWithSameKey.push(siblingEntity)
        } else {
          index.entitiesByEqualityKey.set(equalityKey, [siblingEntity])
        }
      }
    }
    cache.siblingEntitiesKeysIndexByParentAndDefUuid.set(indexKey, index)
  }
  return index
}

const _isEntityDuplicate = (params: {
  survey: ArenaSurvey
  record: ArenaRecord
  entity: ArenaRecordNode
  entityKeysCache?: EntityKeysCache
}): boolean => {
  const { survey, entity, record, entityKeysCache: cache } = params
  const nodeParent = Records.getParent(entity)(record)
  if (!nodeParent) return false

  const entityDef = Surveys.getNodeDefByUuid({ survey, uuid: entity.nodeDefUuid })
  const keyDefs = _getKeyDefs({ survey, entityDef, cache })
  if (Objects.isEmpty(keyDefs)) return false

  const keyValuesByDefUuid = _getKeyValuesByDefUuid({ survey, record, entity, keyDefs, cache })
  // entities with all key values empty are never duplicates (they are reported as missing values)
  if (Object.values(keyValuesByDefUuid).every(Objects.isEmpty)) return false

  const isDuplicateOf = (siblingEntity: ArenaRecordNode): boolean =>
    !RecordNodes.areEqual(entity, siblingEntity) &&
    _areKeyValuesEqual({
      survey,
      keyDefs,
      keyValuesByDefUuid,
      siblingKeyValuesByDefUuid: _getKeyValuesByDefUuid({ survey, record, entity: siblingEntity, keyDefs, cache }),
    })

  const equalityKey = cache ? _getEqualityKey({ survey, entity, keyDefs, keyValuesByDefUuid, cache }) : undefined
  if (!cache || equalityKey === undefined) {
    // compare the key values with the ones of every sibling entity
    return Records.getChildren(nodeParent, entity.nodeDefUuid)(record).some(isDuplicateOf)
  }
  // look up the sibling entities with the same key values in the index (built once for all the siblings)
  const index = _getSiblingEntitiesKeysIndex({
    survey,
    record,
    nodeParent,
    entityDefUuid: entity.nodeDefUuid,
    keyDefs,
    cache,
  })
  return (
    !!index.entitiesByEqualityKey
      .get(equalityKey)
      ?.some((siblingEntity) => !RecordNodes.areEqual(entity, siblingEntity)) ||
    index.entitiesWithoutEqualityKey.some(isDuplicateOf)
  )
}

const isNodeDefToBeValidated = (params: {
  survey: ArenaSurvey
  nodeDef: ArenaNodeDef<NodeDefType, ArenaNodeDefProps>
}): boolean => {
  const { survey, nodeDef } = params
  if (!NodeDefs.isKey(nodeDef)) return false

  const nodeDefParent = Surveys.getNodeDefParent({ survey, nodeDef })
  // root entity key attributes will be validated by another validator
  return !!nodeDefParent && !NodeDefs.isRoot(nodeDefParent)
}

const validateAttributeKey =
  (params: {
    survey: ArenaSurvey
    record: ArenaRecord
    nodeDef: ArenaNodeDef<NodeDefType, ArenaNodeDefProps>
    entityKeysCache?: EntityKeysCache
  }) =>
  (_propName: string, node: ArenaRecordNode): Promise<ArenaValidationResult> => {
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
