/*import * as R from 'ramda'

import { Record } from '../record'
import { Records } from '../records'
import { NodeDef, NodeDefType, NodeDefProps, NodeDefs } from '../../nodeDef'

import { Survey } from '../../survey'
import { Surveys } from '../../surveys'

import * as NodeDefValidations from '@core/survey/nodeDefValidations'
import { Validation, ValidationFactory, ValidationResult, ValidationResultFactory, Validator } from '../../validation'

import { Node } from '../node'

const _isAttributeDuplicate = (params: {
  record: Record
  attribute: Node
  nodeDef: NodeDef<NodeDefType, NodeDefProps>
}) => {
  const { attribute, record, nodeDef } = params
  const nodeSiblings = Records.getNodeSiblings({ record, node: attribute, nodeDef })

  return nodeSiblings.some(
    (sibling) => !Node.isEqual(attribute)(sibling) && R.equals(Node.getValue(sibling), Node.getValue(attribute))
  )
}

export const validateAttributeUnique =
  (params: { survey: Survey; record: Record; nodeDef: NodeDef<NodeDefType, NodeDefProps> }) =>
  (_propName: string, node: Node) => {
    const { survey, record, nodeDef } = params
    const nodeDefParent = Surveys.getNodeDefParent(nodeDef)(survey)
    const nodeDefValidations = NodeDefs.getValidations(nodeDef)

    // uniqueness at record level evaluated elsewhere
    if (!NodeDefValidations.isUnique(nodeDefValidations) || NodeDefs.isRoot(nodeDefParent)) {
      return null
    }
    if (_isAttributeDuplicate({ record, attribute: node, nodeDef })) {
      return { key: 'record.uniqueAttributeDuplicate '}
    }

    return null
  }

export const AttributeUniqueValidator = {
  validateAttributeUnique,
}
*/
