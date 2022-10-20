import { Node } from '../node'
import { Survey } from '../survey'
import { Validations } from '../validation/validations'
import { Record } from './record'
import { RecordNodesUpdater, RecordUpdateResult } from './recordNodesUpdater'
import { Records } from './records'
import { RecordValidator } from './recordValidator'

export const updateNode = async (params: {
  node: Node
  record: Record
  survey: Survey
}): Promise<RecordUpdateResult> => {
  const { node, record: _record, survey } = params

  const nodesUpdated = { [node.uuid]: node }

  const record = Records.addNode(node)(_record)

  const { nodes: updatedNodes, record: updatedRecord } = RecordNodesUpdater.updateNodesDependents({
    survey,
    record,
    nodes: nodesUpdated,
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

export const RecordUpdater = {
  updateNode,
}
