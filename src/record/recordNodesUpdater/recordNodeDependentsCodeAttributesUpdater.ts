import { Node, Nodes } from '../../node'
import { NodeDefs } from '../../nodeDef'
import { Surveys } from '../../survey'
import { Dates } from '../../utils'
import { Records } from '../records'
import { RecordNodeDependentsUpdateParams } from './recordNodeDependentsUpdateParams'
import { RecordUpdateResult } from './recordUpdateResult'

export const updateDependentCodeAttributes = (params: RecordNodeDependentsUpdateParams) => {
  const { survey, record, node, sideEffect = false } = params

  const updateResult = new RecordUpdateResult({ record })

  // 1. get dependent code attributes

  const dependentCodeAttributes = Records.getDependentCodeAttributes(node)(record)

  // 2. clear dependent code attributes' values

  for (const dependentCodeAttribute of dependentCodeAttributes) {
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
  }

  return updateResult
}
