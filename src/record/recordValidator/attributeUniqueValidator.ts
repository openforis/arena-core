import { Node } from '../../node'
import { NodeDef, NodeDefProps, NodeDefs, NodeDefType } from '../../nodeDef'
import { Survey, Surveys } from '../../survey'
import { ValidationResult, ValidationResultFactory, ValidationSeverity } from '../../validation'
import { Record } from '../record'
import { Records } from '../records'

import { Objects } from '../../utils'

const _isAttributeDuplicate = (params: {
  record: Record
  attribute: Node
  nodeDef: NodeDef<NodeDefType, NodeDefProps>
}): boolean => {
  const { attribute, record, nodeDef } = params
  const nodeSiblings = Records.getAttributeSiblings({ record, node: attribute, nodeDef })
  return nodeSiblings.some((sibling) => Objects.isEqual(sibling.value, attribute.value))
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
  async (_propName: string, node: Node): Promise<ValidationResult> => {
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
