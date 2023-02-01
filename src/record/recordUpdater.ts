import { Node } from '../node'
import { NodeDef } from '../nodeDef'
import { Survey, Surveys } from '../survey'
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

const updateNode = async (params: {
  survey: Survey
  record: Record
  node: Node
  sideEffect?: boolean
}): Promise<RecordUpdateResult> => {
  const { node, record: _record, survey, sideEffect = false } = params

  const nodesUpdated = { [node.uuid]: node }

  const record = Records.addNode(node, { sideEffect })(_record)

  return _onRecordNodesCreateOrUpdate({ survey, record, nodes: nodesUpdated, sideEffect })
}

export const RecordUpdater = {
  createNodeAndDescendants,
  createRootEntity,
  updateNode,
}
