import { ArenaDictionary } from '../common'
import { SystemError, SystemErrorKeys } from '../error'
import { ArenaRecordNode, ArenaRecordNodePointer, ArenaRecordNodesMap } from '../node'
import { ArenaNodeDef, NodeDefs } from '../nodeDef'
import { ArenaSurvey, SurveyDependencyType, Surveys } from '../survey'
import { Dates, Objects } from '../utils'
import { Validations } from '../validation/validations'
import { RecordNodePointers } from './nodePointers'
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

/**
 * If the record is being updated with an app different from the one that updated it last (see Records.isAppInfoChanged),
 * stores the app info in the record (info.modifiedWith) and returns the nodes whose expressions use the app info functions,
 * so they will be evaluated again.
 */
const _updateAppInfo = (
  params: ArenaRecordNodesUpdateParams
): { record: ArenaRecord; appInfoDependentNodes: ArenaRecordNodesMap } => {
  const { survey, record, appInfo, sideEffect = false } = params
  if (!appInfo || !Records.isAppInfoChanged(appInfo)(record)) {
    return { record, appInfoDependentNodes: {} }
  }
  const recordUpdated = sideEffect ? record : { ...record }
  recordUpdated.info = { ...recordUpdated.info, modifiedWith: appInfo }

  const appInfoDependentNodes: ArenaRecordNodesMap = {}
  for (const nodeDef of Surveys.getAppInfoDependents({ survey })) {
    for (const node of Records.getNodesByDefUuid(nodeDef.uuid)(recordUpdated)) {
      appInfoDependentNodes[node.uuid] = node
    }
  }
  return { record: recordUpdated, appInfoDependentNodes }
}

const _onRecordNodesCreateOrUpdate = async (
  paramsIn: ArenaRecordNodesUpdateParams & {
    nodes: ArenaDictionary<ArenaRecordNode>
    additionalNodesToValidate?: ArenaRecordNodesMap
  }
): Promise<RecordUpdateResult> => {
  const { record: recordWithAppInfo, appInfoDependentNodes } = _updateAppInfo(paramsIn)
  const params = {
    ...paramsIn,
    // the same date modified is used for all the nodes modified in this update
    dateModified: paramsIn.dateModified ?? Dates.nowFormattedForStorage(),
    record: recordWithAppInfo,
  }

  const {
    user,
    survey,
    categoryItemProvider,
    taxonProvider,
    areaOfInterestProvider,
    additionalNodesToValidate,
    dateModified,
  } = params

  const updateResult = await RecordNodesUpdater.updateNodesDependents({
    ...params,
    nodesToEvaluate: appInfoDependentNodes,
  })
  const { record: updatedRecord, dateModifiedOnlyNodeUuids } = updateResult
  // nodes updated only in their date modified (ancestors of the modified nodes) are not validated again
  const updatedNodes: ArenaRecordNodesMap = {}
  for (const [nodeUuid, node] of Object.entries(updateResult.nodes)) {
    if (!dateModifiedOnlyNodeUuids.has(nodeUuid)) {
      updatedNodes[nodeUuid] = node
    }
  }

  const dependentValidationNodePointers = getDependentValidationNodePointers({
    survey,
    record: updatedRecord,
    nodes: updatedNodes,
  })

  const dependentValidationNodes = RecordNodePointers.getNodesMapFromNodePointers({
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

/**
 * Returns the params with the date modified set (now, if not specified): the same date modified is used
 * for all the nodes modified in a record update.
 */
const withDateModified = <P extends { dateModified?: string }>(params: P): P =>
  params.dateModified ? params : { ...params, dateModified: Dates.nowFormattedForStorage() }

const createDescendants = async (paramsIn: ArenaRecordNodeCreateParams): Promise<RecordUpdateResult> => {
  const params = withDateModified(paramsIn)
  const { record: updatedRecord, nodes: createdNodes } = await RecordNodesUpdater.addDescendants(params)

  return _onRecordNodesCreateOrUpdate({ ...params, record: updatedRecord, nodes: createdNodes })
}

const createNodeAndDescendants = async (paramsIn: ArenaRecordNodeCreateParams): Promise<RecordUpdateResult> => {
  const params = withDateModified(paramsIn)
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
    // its shape depends on the attribute type (see ArenaRecordNodeValue)
    value: unknown
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

  return _onRecordNodesCreateOrUpdate({ ...params, dateModified, record: _record, nodes: nodesUpdated })
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
    ...withDateModified(params),
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

/**
 * Evaluates again the expressions using the app info functions (appId, appPlatform, appVersion)
 * if the record is being edited with an app different from the one that updated it last
 * (different app id, platform or version, see Records.isAppInfoChanged); does nothing otherwise.
 * To be called when the record is opened for editing (the same check is done in every record update).
 */
const updateAppInfoDependents = async (params: ArenaRecordNodesUpdateParams): Promise<RecordUpdateResult> => {
  const { record, appInfo } = params
  if (!Records.isAppInfoChanged(appInfo)(record)) {
    return new RecordUpdateResult({ record })
  }
  return _onRecordNodesCreateOrUpdate({ ...withDateModified(params), nodes: {} })
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
  updateAppInfoDependents,
}
