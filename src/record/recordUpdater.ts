import { ArenaDictionary } from '../common'
import { SystemError, SystemErrorKeys } from '../error'
import { ArenaRecordNode, ArenaRecordNodePointer, ArenaRecordNodesMap } from '../node'
import { ArenaNodeDef, NodeDefs } from '../nodeDef'
import { ArenaSurvey, SurveyDependencyType, Surveys } from '../survey'
import { Dates, Objects } from '../utils'
import { Validations } from '../validation/validations'
import { NodePointers } from './nodePointers'
import { ArenaRecord } from './record'
import { RecordNodesUpdater, RecordUpdateResult } from './recordNodesUpdater'
import { ArenaRecordNodeCreateParams, ArenaRecordNodesUpdateParams } from './recordNodesUpdater/recordNodesCreator'
import { Records } from './records'
import { RecordValidator } from './recordValidator'

const validationDependencyTypes = [
  SurveyDependencyType.validations,
  SurveyDependencyType.required,
  SurveyDependencyType.minCount,
  SurveyDependencyType.maxCount,
]

const getDependentValidationNodePointers = (params: {
  survey: ArenaSurvey
  record: ArenaRecord
  nodes: ArenaRecordNodesMap
}): ArenaRecordNodePointer[] => {
  const { survey, record, nodes } = params
  const uniquePointersByKey = new Map<string, ArenaRecordNodePointer>()
  for (const node of Object.values(nodes)) {
    for (const dependencyType of validationDependencyTypes) {
      const nodePointers = Records.getDependentNodePointers(survey, node, dependencyType)(record)
      for (const pointer of nodePointers) {
        const nodeCtxUuid = pointer.nodeCtx.uuid
        const nodeDefUuid = pointer.nodeDef.uuid
        const key = `${nodeCtxUuid ?? ''}:${nodeDefUuid ?? ''}`
        if (!uniquePointersByKey.has(key)) {
          uniquePointersByKey.set(key, pointer)
        }
      }
    }
  }
  return Array.from(uniquePointersByKey.values())
}

const _onRecordNodesCreateOrUpdate = async (
  params: ArenaRecordNodesUpdateParams & {
    nodes: ArenaDictionary<ArenaRecordNode>
    additionalNodesToValidate?: ArenaRecordNodesMap
  }
): Promise<RecordUpdateResult> => {
  const {
    user,
    survey,
    categoryItemProvider,
    taxonProvider,
    areaOfInterestProvider,
    additionalNodesToValidate,
    dateModified = Dates.nowFormattedForStorage(),
  } = params

  const updateResult = await RecordNodesUpdater.updateNodesDependents(params)
  const { nodes: updatedNodes, record: updatedRecord } = updateResult

  const dependentValidationNodePointers = getDependentValidationNodePointers({
    survey,
    record: updatedRecord,
    nodes: updatedNodes,
  })

  const dependentValidationNodes = NodePointers.getNodesMapFromNodePointers({
    record: updatedRecord,
    nodePointers: dependentValidationNodePointers,
  })

  const nodesToValidate = { ...updatedNodes, ...dependentValidationNodes, ...additionalNodesToValidate }

  const validationUpdatedNodes = await RecordValidator.validateNodes({
    user,
    survey,
    categoryItemProvider,
    taxonProvider,
    areaOfInterestProvider,
    record: updatedRecord,
    nodes: nodesToValidate,
  })

  const validation = Validations.mergeValidations(validationUpdatedNodes)(Validations.getValidation(updatedRecord))
  updatedRecord.validation = validation
  updatedRecord.dateModified = dateModified

  updateResult.validation = validation

  return updateResult
}

const createDescendants = async (params: ArenaRecordNodeCreateParams): Promise<RecordUpdateResult> => {
  const { record: updatedRecord, nodes: createdNodes } = await RecordNodesUpdater.addDescendants(params)

  return _onRecordNodesCreateOrUpdate({ ...params, record: updatedRecord, nodes: createdNodes })
}

const createNodeAndDescendants = async (params: ArenaRecordNodeCreateParams): Promise<RecordUpdateResult> => {
  const { record: updatedRecord, nodes: createdNodes } = await RecordNodesUpdater.addNodeAndDescendants(params)

  return _onRecordNodesCreateOrUpdate({ ...params, record: updatedRecord, nodes: createdNodes })
}

const createRootEntity = async (
  params: ArenaRecordNodesUpdateParams & {
    createMultipleEntities?: boolean
  }
): Promise<RecordUpdateResult> => {
  const { survey, createMultipleEntities = true } = params

  return createNodeAndDescendants({ ...params, nodeDef: Surveys.getNodeDefRoot({ survey }), createMultipleEntities })
}

const updateAttributeValue = async (
  params: ArenaRecordNodesUpdateParams & {
    attributeUuid: string
    value: any
  }
): Promise<RecordUpdateResult> => {
  const { attributeUuid, record, value, dateModified = Dates.nowFormattedForStorage(), sideEffect = false } = params
  const attribute = Records.getNodeByUuid(attributeUuid)(record)
  if (!attribute) throw new SystemError(SystemErrorKeys.record.nodeNotFound, { uuid: attributeUuid })

  let attributeUpdated = sideEffect ? attribute : { ...attribute }
  attributeUpdated.value = value
  attributeUpdated.dateModified = dateModified
  // reset defaultValueApplied flag
  attributeUpdated = Objects.dissocPath({ obj: attributeUpdated, path: ['meta', 'defaultValueApplied'], sideEffect })

  const nodesUpdated = { [attributeUuid]: attributeUpdated }

  const _record = Records.addNode(attributeUpdated, { sideEffect })(record)

  return _onRecordNodesCreateOrUpdate({ ...params, record: _record, nodes: nodesUpdated })
}

/**
 * Returns the key and unique attributes of the siblings of the specified entities:
 * they could have been duplicates of the ones being deleted, so they must be validated again.
 */
const getEntityKeyOrUniqueAttributes = (params: {
  survey: ArenaSurvey
  record: ArenaRecord
  entity: ArenaRecordNode
  uniqueAttributeDefs: ArenaNodeDef<any>[]
}): ArenaRecordNode[] => {
  const { survey, record, entity, uniqueAttributeDefs } = params
  return [
    ...Records.getEntityKeyNodes(survey, entity)(record),
    ...uniqueAttributeDefs.flatMap((uniqueDef) => Records.getChildren(entity, uniqueDef.uuid)(record)),
  ].filter(Boolean)
}

const getSiblingKeyOrUniqueAttributes = (params: {
  survey: ArenaSurvey
  record: ArenaRecord
  nodeUuids: string[]
}): ArenaRecordNodesMap => {
  const { survey, record, nodeUuids } = params
  const nodeUuidsSet = new Set(nodeUuids)
  const result: ArenaRecordNodesMap = {}
  for (const nodeUuid of nodeUuids) {
    const node = Records.getNodeByUuid(nodeUuid)(record)
    const parentNode = node ? Records.getParent(node)(record) : undefined
    const nodeDef = node ? Surveys.getNodeDefByUuid({ survey, uuid: node.nodeDefUuid }) : undefined
    if (!parentNode || !nodeDef || !NodeDefs.isEntity(nodeDef)) continue

    const uniqueAttributeDefs = Surveys.getNodeDefChildren({ survey, nodeDef }).filter(
      (childDef) => NodeDefs.getValidations(childDef)?.unique
    )
    const siblings = Records.getChildren(parentNode, nodeDef.uuid)(record).filter((s) => !nodeUuidsSet.has(s.uuid))
    for (const sibling of siblings) {
      for (const attribute of getEntityKeyOrUniqueAttributes({
        survey,
        record,
        entity: sibling,
        uniqueAttributeDefs,
      })) {
        result[attribute.uuid] = attribute
      }
    }
  }
  return result
}

const deleteNodes = async (
  params: ArenaRecordNodesUpdateParams & {
    nodeUuids: string[]
  }
): Promise<RecordUpdateResult> => {
  const { survey, nodeUuids, record: _record, sideEffect = false } = params

  // found before removing the nodes: the deleted nodes are no longer reachable from their siblings afterwards
  const siblingKeyOrUniqueAttributes = getSiblingKeyOrUniqueAttributes({ survey, record: _record, nodeUuids })

  const updateResult = Records.removeNodes(nodeUuids, { sideEffect })(_record)
  const { record, nodesDeleted } = updateResult

  const result = await _onRecordNodesCreateOrUpdate({
    ...params,
    record,
    nodes: nodesDeleted,
    additionalNodesToValidate: siblingKeyOrUniqueAttributes,
  })
  result.nodesDeleted = nodesDeleted
  return result
}

const deleteNode = async (params: ArenaRecordNodesUpdateParams & { nodeUuid: string }): Promise<RecordUpdateResult> => {
  const { nodeUuid } = params
  return deleteNodes({ ...params, nodeUuids: [nodeUuid] })
}

export const RecordUpdater = {
  /** Creates the descendants of a node and updates dependents (applicability, default values, calculations...) and validation */
  createDescendants,
  /** Creates a node and its descendants and updates dependents (applicability, default values, calculations...) and validation */
  createNodeAndDescendants,
  createRootEntity,
  updateAttributeValue,
  /** Deletes the node and its descendants and updates dependents (applicability, default values, calculations...) and validation */
  deleteNode,
  /** Deletes the nodes and their descendants and updates dependents (applicability, default values, calculations...) and validation */
  deleteNodes,
}
