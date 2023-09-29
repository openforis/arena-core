import { SystemError } from '../error'
import { Node } from '../node'
import { Surveys } from '../survey'
import { Dates, Objects } from '../utils'
import { Validations } from '../validation/validations'
import { RecordNodesUpdater, RecordUpdateResult } from './recordNodesUpdater'
import { NodeCreateParams, NodesUpdateParams } from './recordNodesUpdater/recordNodesCreator'
import { Records } from './records'
import { RecordValidator } from './recordValidator'

const _onRecordNodesCreateOrUpdate = async (
  params: NodesUpdateParams & { nodes: { [x: string]: Node } }
): Promise<RecordUpdateResult> => {
  const {
    survey,
    record,
    nodes,
    timezoneOffset,
    dateModified = Dates.nowFormattedForStorage(),
    sideEffect = false,
  } = params

  const { nodes: updatedNodes, record: updatedRecord } = RecordNodesUpdater.updateNodesDependents({
    survey,
    record,
    nodes,
    timezoneOffset,
    sideEffect,
  })

  const validationUpdatedNodes = await RecordValidator.validateNodes({
    survey,
    record: updatedRecord,
    nodes: updatedNodes,
  })

  const validation = Validations.mergeValidations(validationUpdatedNodes)(Validations.getValidation(record))
  updatedRecord.validation = validation
  updatedRecord.dateModified = dateModified

  return new RecordUpdateResult({
    record: updatedRecord,
    nodes: updatedNodes,
    validation,
  })
}

const createDescendants = async (params: NodeCreateParams): Promise<RecordUpdateResult> => {
  const { record: updatedRecord, nodes: createdNodes } = RecordNodesUpdater.createDescendants(params)

  return _onRecordNodesCreateOrUpdate({ ...params, record: updatedRecord, nodes: createdNodes })
}

const _createNodeAndDescendants = async (params: NodeCreateParams): Promise<RecordUpdateResult> => {
  const { record: updatedRecord, nodes: createdNodes } = RecordNodesUpdater.createNodeAndDescendants(params)

  return _onRecordNodesCreateOrUpdate({ ...params, record: updatedRecord, nodes: createdNodes })
}

const createNodeAndDescendants = async (params: NodeCreateParams): Promise<RecordUpdateResult> =>
  _createNodeAndDescendants(params)

const createRootEntity = async (
  params: NodesUpdateParams & {
    createMultipleEntities?: boolean
  }
): Promise<RecordUpdateResult> => {
  const { survey, createMultipleEntities = true } = params

  return _createNodeAndDescendants({ ...params, nodeDef: Surveys.getNodeDefRoot({ survey }), createMultipleEntities })
}

const updateAttributeValue = async (
  params: NodesUpdateParams & {
    attributeUuid: string
    value: any
  }
): Promise<RecordUpdateResult> => {
  const { attributeUuid, record, value, dateModified = Dates.nowFormattedForStorage(), sideEffect = false } = params
  const attribute = Records.getNodeByUuid(attributeUuid)(record)
  if (!attribute) throw new SystemError('record.nodeNotFound')

  let attributeUpdated = sideEffect ? attribute : { ...attribute }
  attributeUpdated.value = value
  attributeUpdated.dateModified = dateModified
  // reset defaultValueApplied flag
  attributeUpdated = Objects.dissocPath({ obj: attributeUpdated, path: ['meta', 'defaultValueApplied'], sideEffect })

  const nodesUpdated = { [attributeUuid]: attributeUpdated }

  const _record = Records.addNode(attributeUpdated, { sideEffect })(record)

  return _onRecordNodesCreateOrUpdate({ ...params, record: _record, nodes: nodesUpdated })
}

const deleteNodes = async (
  params: NodesUpdateParams & {
    nodeUuids: string[]
  }
): Promise<RecordUpdateResult> => {
  const { nodeUuids, record: _record, sideEffect = false } = params

  const updateResult = Records.deleteNodes(nodeUuids, { sideEffect })(_record)
  const { record, nodesDeleted } = updateResult

  const result = await _onRecordNodesCreateOrUpdate({ ...params, record, nodes: nodesDeleted })
  result.nodesDeleted = nodesDeleted
  return result
}

const deleteNode = async (params: NodesUpdateParams & { nodeUuid: string }): Promise<RecordUpdateResult> => {
  const { nodeUuid } = params
  return deleteNodes({ ...params, nodeUuids: [nodeUuid] })
}

export const RecordUpdater = {
  createDescendants,
  createNodeAndDescendants,
  createRootEntity,
  updateAttributeValue,
  deleteNode,
  deleteNodes,
}
