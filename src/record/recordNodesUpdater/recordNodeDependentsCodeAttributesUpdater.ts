import { Record } from '../record'
import { Survey } from '../../survey'
import { Node, Nodes } from '../../node'
import { RecordUpdateResult } from './recordUpdateResult'
import { Records } from '../records'

export const updateDependentCodeAttributes = (params: { survey: Survey; record: Record; node: Node }) => {
  const { record, node } = params

  const updateResult = new RecordUpdateResult({ record })

  // 1. get dependent code attributes

  const dependentCodeAttributes = Records.getDependentCodeAttributes(node)(record)

  // 2. clear dependent code attributes' values

  dependentCodeAttributes.forEach((dependentCodeAttribute) => {
    if (!Nodes.isValueBlank(dependentCodeAttribute)) {
      const nodeUpdated: Node = { ...dependentCodeAttribute, value: null, updated: true }
      updateResult.addNode(nodeUpdated)
    }
  })

  return updateResult
}
