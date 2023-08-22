import { Record } from '../record'
import { Survey, Surveys } from '../../survey'
import { Node, Nodes } from '../../node'
import { RecordUpdateResult } from './recordUpdateResult'
import { Records } from '../records'
import { NodeDefs } from '../../nodeDef'
import { Dates } from '../../utils'

export const updateDependentCodeAttributes = (params: {
  survey: Survey
  record: Record
  node: Node
  sideEffect?: boolean
}) => {
  const { survey, record, node, sideEffect = false } = params

  const updateResult = new RecordUpdateResult({ record })

  // 1. get dependent code attributes

  const dependentCodeAttributes = Records.getDependentCodeAttributes(node)(record)

  // 2. clear dependent code attributes' values

  dependentCodeAttributes.forEach((dependentCodeAttribute) => {
    const dependentCodeAttributeDef = Surveys.getNodeDefByUuid({ survey, uuid: dependentCodeAttribute.nodeDefUuid })
    if (
      !NodeDefs.isReadOnly(dependentCodeAttributeDef) &&
      !Nodes.isDefaultValueApplied(dependentCodeAttribute) &&
      !Nodes.isValueBlank(dependentCodeAttribute)
    ) {
      const nodeUpdated: Node = {
        ...dependentCodeAttribute,
        value: null,
        updated: true,
        dateModified: Dates.nowFormattedForStorage(),
      }
      updateResult.addNode(nodeUpdated, { sideEffect })
    }
  })

  return updateResult
}
