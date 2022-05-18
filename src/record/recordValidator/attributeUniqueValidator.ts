import { Record } from '../record'
import { Records } from '../records'
import { NodeDef, NodeDefs, NodeDefProps, NodeDefType } from '../../nodeDef'
import { Node, Nodes } from '../../node'
import { ValidationResult, ValidationResultFactory } from '../../validation'
import { Survey, Surveys } from '../../survey'

import { Objects } from '../../utils'

const _isAttributeDuplicate = (params: {
  record: Record
  attribute: Node
  nodeDef: NodeDef<NodeDefType, NodeDefProps>
}) => {
  const { attribute, record, nodeDef } = params
  const nodeSiblings = Records.getNodeSiblings({ record, node: attribute, nodeDef })

  return nodeSiblings.some(
    (sibling) => !Nodes.areEqual(attribute, sibling) && Objects.isEqual(sibling.value, attribute.value)
  )
}

export const validateAttributeUnique =
  (params: { survey: Survey; record: Record; nodeDef: NodeDef<NodeDefType, NodeDefProps> }) =>
  (_propName: string, node: Node): ValidationResult => {
    const { survey, record, nodeDef } = params
    const nodeDefParent = Surveys.getNodeDefParent({ survey, nodeDef })
    const nodeDefValidations = NodeDefs.getValidations(nodeDef)

    // uniqueness at record level evaluated elsewhere
    if (!nodeDefValidations?.unique || NodeDefs.isRoot(nodeDefParent)) {
      return ValidationResultFactory.createInstance()
    }
    if (_isAttributeDuplicate({ record, attribute: node, nodeDef })) {
      return ValidationResultFactory.createInstance({
        valid: false,
        key: 'record.attribute.uniqueDuplicate',
      })
    }

    return ValidationResultFactory.createInstance()
  }

export const AttributeUniqueValidator = {
  validateAttributeUnique,
}
