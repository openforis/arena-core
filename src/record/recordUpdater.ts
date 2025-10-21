import { SystemError } from '../error'
import { NodesMap } from '../node'
import { Survey, SurveyDependencyType, Surveys } from '../survey'
import { Dates, Objects } from '../utils'
import { Validations } from '../validation/validations'
import { NodePointers } from './nodePointers'
import { Record } from './record'
import { RecordNodesUpdater, RecordUpdateResult } from './recordNodesUpdater'
import { NodeCreateParams, NodesUpdateParams } from './recordNodesUpdater/recordNodesCreator'
import { Records } from './records'
import { RecordValidator } from './recordValidator'

const validationDependencyTypes = [
  SurveyDependencyType.validations,
  SurveyDependencyType.minCount,
  SurveyDependencyType.maxCount,
]

const _getDependentValidationNodes = (params: { survey: Survey; record: Record; nodes: NodesMap }): NodesMap => {
  const { survey, record, nodes } = params
  return Object.values(nodes).reduce((acc: NodesMap, node) => {
    validationDependencyTypes.forEach((dependencyType) => {
      const nodePointers = Records.getDependentNodePointers({ survey, record, node, dependencyType })
      const nodes = NodePointers.getNodesFromNodePointers({ record, nodePointers })
      for (const node of nodes) {
        acc[node.iId] = node
      }
    })
    return acc
  }, {})
}

const _onRecordNodesCreateOrUpdate = async (
  params: NodesUpdateParams & { nodes: NodesMap }
): Promise<RecordUpdateResult> => {
  const { user, survey, record, dateModified = Dates.nowFormattedForStorage() } = params

  const { nodes: updatedNodes, record: updatedRecord } = await RecordNodesUpdater.updateNodesDependents(params)

  const dependentValidationNodes = _getDependentValidationNodes({ survey, record: updatedRecord, nodes: updatedNodes })

  const nodesToValidate = { ...updatedNodes, ...dependentValidationNodes }

  const validationUpdatedNodes = await RecordValidator.validateNodes({
    user,
    survey,
    record: updatedRecord,
    nodes: nodesToValidate,
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
  const { record: updatedRecord, nodes: createdNodes } = await RecordNodesUpdater.createDescendants(params)

  return _onRecordNodesCreateOrUpdate({ ...params, record: updatedRecord, nodes: createdNodes })
}

const _createNodeAndDescendants = async (params: NodeCreateParams): Promise<RecordUpdateResult> => {
  const { record: updatedRecord, nodes: createdNodes } = await RecordNodesUpdater.createNodeAndDescendants(params)

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
    attributeIId: number
    value: any
  }
): Promise<RecordUpdateResult> => {
  const { attributeIId, record, value, dateModified = Dates.nowFormattedForStorage(), sideEffect = false } = params
  const attribute = Records.getNodeByInternalId(attributeIId)(record)
  if (!attribute) throw new SystemError('record.nodeNotFound')

  let attributeUpdated = sideEffect ? attribute : { ...attribute }
  attributeUpdated.value = value
  attributeUpdated.dateModified = dateModified
  // reset defaultValueApplied flag
  attributeUpdated = Objects.dissocPath({ obj: attributeUpdated, path: ['meta', 'defaultValueApplied'], sideEffect })

  const nodesUpdated = { [attributeIId]: attributeUpdated }

  const _record = Records.addNode(attributeUpdated, { sideEffect })(record)

  return _onRecordNodesCreateOrUpdate({ ...params, record: _record, nodes: nodesUpdated })
}

const deleteNodes = async (
  params: NodesUpdateParams & {
    nodeInternalIds: number[]
  }
): Promise<RecordUpdateResult> => {
  const { nodeInternalIds, record: _record, sideEffect = false } = params

  const updateResult = Records.deleteNodes(nodeInternalIds, { sideEffect })(_record)
  const { record, nodesDeleted } = updateResult

  const result = await _onRecordNodesCreateOrUpdate({ ...params, record, nodes: nodesDeleted })
  result.nodesDeleted = nodesDeleted
  return result
}

const deleteNode = async (params: NodesUpdateParams & { nodeInternalId: number }): Promise<RecordUpdateResult> => {
  const { nodeInternalId } = params
  return deleteNodes({ ...params, nodeInternalIds: [nodeInternalId] })
}

export const RecordUpdater = {
  createDescendants,
  createNodeAndDescendants,
  createRootEntity,
  updateAttributeValue,
  deleteNode,
  deleteNodes,
}
