import { Record } from '../record'
import { Records } from '../records'
import { NodeDef, NodeDefs, NodeDefProps, NodeDefType } from '../../nodeDef'
import { Node, Nodes } from '../../node'
import { ValidationResult, ValidationResultFactory, ValidationSeverity } from '../../validation'
import { Survey, Surveys } from '../../survey'

import { Objects } from '../../utils'

const _isAttributeDuplicate = (params: {
  record: Record
  attribute: Node
  nodeDef: NodeDef<NodeDefType, NodeDefProps>
}): boolean => {
  const { attribute, record, nodeDef } = params
  const nodeSiblings = Records.getNodeSiblings({ record, node: attribute, nodeDef })

  return nodeSiblings.some(
    (sibling) => !Nodes.areEqual(attribute, sibling) && Objects.isEqual(sibling.value, attribute.value)
  )
}

const isNodeDefToBeValidated = (params: { survey: Survey; nodeDef: NodeDef<NodeDefType, NodeDefProps> }): boolean => {
  const { survey, nodeDef } = params
  const nodeDefValidations = NodeDefs.getValidations(nodeDef)
  if (!nodeDefValidations?.unique) return false

  const nodeDefParent = Surveys.getNodeDefParent({ survey, nodeDef })
  if (!nodeDefParent || NodeDefs.isRoot(nodeDefParent)) {
    // uniqueness at record level evaluated elsewhere
    return false
  }
  return true
}

export const validateAttributeUnique =
  (params: { survey: Survey; record: Record; nodeDef: NodeDef<NodeDefType, NodeDefProps> }) =>
  (_propName: string, node: Node): ValidationResult => {
    const { survey, record, nodeDef } = params

    if (isNodeDefToBeValidated({ survey, nodeDef }) && _isAttributeDuplicate({ record, attribute: node, nodeDef })) {
      return ValidationResultFactory.createInstance({
        valid: false,
        severity: ValidationSeverity.error,
        key: 'record.attribute.uniqueDuplicate',
      })
    }

    return ValidationResultFactory.createInstance()
  }

export const AttributeUniqueValidator = {
  validateAttributeUnique,
}
