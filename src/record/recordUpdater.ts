import { SystemError } from '../error'
import { Node } from '../node'
import { NodeDef } from '../nodeDef'
import { Survey, Surveys } from '../survey'
import { Dates, Objects } from '../utils'
import { Validations } from '../validation/validations'
import { Record } from './record'
import { RecordNodesUpdater, RecordUpdateResult } from './recordNodesUpdater'
import { Records } from './records'
import { RecordValidator } from './recordValidator'

const _onRecordNodesCreateOrUpdate = async (params: {
  survey: Survey
  record: Record
  nodes: { [x: string]: Node }
  sideEffect?: boolean
}): Promise<RecordUpdateResult> => {
  const { survey, record, nodes, sideEffect = false } = params

  const { nodes: updatedNodes, record: updatedRecord } = RecordNodesUpdater.updateNodesDependents({
    survey,
    record,
    nodes,
    sideEffect,
  })

  const validationUpdatedNodes = await RecordValidator.validateNodes({
    survey,
    record: updatedRecord,
    nodes: updatedNodes,
  })

  const validation = Validations.mergeValidations(validationUpdatedNodes)(Validations.getValidation(record))
  updatedRecord.validation = validation

  return new RecordUpdateResult({
    record: updatedRecord,
    nodes: updatedNodes,
    validation,
  })
}

const createDescendants = async (params: {
  survey: Survey
  record: Record
  parentNode: Node
  nodeDef: NodeDef<any>
  createMultipleEntities?: boolean
  sideEffect?: boolean
}): Promise<RecordUpdateResult> => {
  const { survey, record, parentNode, nodeDef, createMultipleEntities = false, sideEffect = false } = params

  const { record: updatedRecord, nodes: createdNodes } = RecordNodesUpdater.createDescendants({
    survey,
    record,
    parentNode,
    nodeDef,
    createMultipleEntities,
    sideEffect,
  })
  return _onRecordNodesCreateOrUpdate({ survey, record: updatedRecord, nodes: createdNodes, sideEffect })
}

const _createNodeAndDescendants = async (params: {
  survey: Survey
  record: Record
  parentNode?: Node
  nodeDef: NodeDef<any>
  createMultipleEntities?: boolean
  sideEffect?: boolean
}): Promise<RecordUpdateResult> => {
  const { survey, record, parentNode, nodeDef, createMultipleEntities = false, sideEffect = false } = params

  const { record: updatedRecord, nodes: createdNodes } = RecordNodesUpdater.createNodeAndDescendants({
    survey,
    record,
    parentNode,
    nodeDef,
    createMultipleEntities,
    sideEffect,
  })
  return _onRecordNodesCreateOrUpdate({ survey, record: updatedRecord, nodes: createdNodes, sideEffect })
}

const createNodeAndDescendants = async (params: {
  survey: Survey
  record: Record
  parentNode: Node
  nodeDef: NodeDef<any>
  createMultipleEntities?: boolean
  sideEffect?: boolean
}): Promise<RecordUpdateResult> => {
  const { survey, record, parentNode, nodeDef, createMultipleEntities, sideEffect = false } = params
  return _createNodeAndDescendants({ survey, record, parentNode, nodeDef, createMultipleEntities, sideEffect })
}

const createRootEntity = async (params: {
  survey: Survey
  record: Record
  createMultipleEntities?: boolean
  sideEffect?: boolean
}): Promise<RecordUpdateResult> => {
  const { survey, record, createMultipleEntities = true, sideEffect = false } = params

  return _createNodeAndDescendants({
    survey,
    record,
    nodeDef: Surveys.getNodeDefRoot({ survey }),
    createMultipleEntities,
    sideEffect,
  })
}

const updateAttributeValue = async (params: {
  survey: Survey
  record: Record
  attributeUuid: string
  value: any
  dateModified?: string
  sideEffect?: boolean
}): Promise<RecordUpdateResult> => {
  const {
    attributeUuid,
    record,
    survey,
    value,
    dateModified = Dates.nowFormattedForExpression(),
    sideEffect = false,
  } = params
  const attribute = Records.getNodeByUuid(attributeUuid)(record)
  if (!attribute) throw new SystemError('record.nodeNotFound')

  let attributeUpdated = sideEffect ? attribute : { ...attribute }
  attributeUpdated.value = value
  attributeUpdated.dateModified = dateModified
  // reset defaultValueApplied flag
  attributeUpdated = Objects.dissocPath({ obj: attributeUpdated, path: ['meta', 'defaultValueApplied'], sideEffect })

  const nodesUpdated = { [attributeUuid]: attributeUpdated }

  const _record = Records.addNode(attributeUpdated, { sideEffect })(record)

  return _onRecordNodesCreateOrUpdate({ survey, record: _record, nodes: nodesUpdated, sideEffect })
}

const deleteNodes = async (params: {
  survey: Survey
  record: Record
  nodeUuids: string[]
  sideEffect?: boolean
}): Promise<RecordUpdateResult> => {
  const { nodeUuids, record: _record, survey, sideEffect = false } = params

  const updateResult = Records.deleteNodes(nodeUuids, { sideEffect })(_record)
  const { record, nodesDeleted } = updateResult

  const result = await _onRecordNodesCreateOrUpdate({ survey, record, nodes: nodesDeleted, sideEffect })
  result.nodesDeleted = nodesDeleted
  return result
}

const deleteNode = async (params: {
  survey: Survey
  record: Record
  nodeUuid: string
  sideEffect?: boolean
}): Promise<RecordUpdateResult> => {
  const { nodeUuid, record, survey, sideEffect = false } = params
  return deleteNodes({ survey, record, nodeUuids: [nodeUuid], sideEffect })
}

export const RecordUpdater = {
  createDescendants,
  createNodeAndDescendants,
  createRootEntity,
  updateAttributeValue,
  deleteNode,
  deleteNodes,
}
